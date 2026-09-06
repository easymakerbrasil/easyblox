const {Buffer} = require('buffer');

const {
    EBCP_CONTROL_TYPES,
    encodeFrame,
    EasyBloxConnectivityParser
} = require('./easyblox-connectivity-protocol');

/**
 * Neutral EBCP session layer.
 *
 * Owns stream parsing and EBCP control-frame behavior while keeping
 * application message storage and waiter semantics in the connectivity
 * runtime.
 */
class EasyBloxConnectivitySession {
    /**
     * @param {object} options Session dependencies.
     * @param {object} options.runtime Connectivity application runtime.
     * @param {function(Uint8Array): void} options.write Transport byte writer.
     */
    constructor ({runtime, write}) {
        this._runtime = runtime;
        this._write = write;
        this._parser = new EasyBloxConnectivityParser();
        this._nextOutgoingSequence = 1;
        this._sessionReadyResolver = null;
        this._probeResolver = null;
        this._probePromise = null;
    }

    /**
     * Initiate an EBCP session handshake.
     * Resolves when the peer replies with HELLO_ACK.
     * @returns {Promise<void>} resolves when the session is established
     */
    start () {
        const ready = new Promise(resolve => {
            this._sessionReadyResolver = resolve;
        });

        this._writeControl(
            EBCP_CONTROL_TYPES.HELLO
        );

        return ready;
    }

    /**
     * Probe peer liveness without establishing a new application session.
     * Resolves when the peer replies with PONG.
     * Concurrent probes reuse the pending probe.
     * @returns {Promise<void>} resolves when the peer proves liveness
     */
    probe () {
        if (this._probePromise) {
            return this._probePromise;
        }

        this._probePromise =
            new Promise(resolve => {
                this._probeResolver =
                    resolve;
            });

        this._writeControl(
            EBCP_CONTROL_TYPES.PING
        );

        return this._probePromise;
    }

    /**
     * Send one EBCP application message.
     * Application sequence zero remains reserved for control frames.
     * @param {number} type EBCP application message type.
     * @param {string} channel Application channel.
     * @param {string|number} payload Application payload.
     * @returns {number} Sequence allocated to the outgoing message.
     */
    send (type, channel, payload) {
        const sequence =
            this._nextOutgoingSequence;

        const frame =
            encodeFrame({
                type,
                sequence,
                channel,
                payload
            });

        this._write(frame);

        this._nextOutgoingSequence =
            sequence === 0xFF ?
                1 :
                sequence + 1;

        return sequence;
    }

    /**
     * Push one transport chunk into the EBCP stream.
     * Complete frames are dispatched in their original stream order.
     * @param {Uint8Array} chunk Transport bytes.
     * @returns {void}
     */
    push (chunk) {
        const bytes = Buffer.isBuffer(chunk) ?
            chunk :
            Buffer.from(chunk);

        const frames = this._parser.push(bytes);

        for (const frame of frames) {
            this._handleFrame(frame);
        }
    }

    /**
     * Handle one decoded EBCP frame.
     * ACK control frames remain inside the session layer. HELLO and
     * HELLO_ACK establish application session boundaries. Application
     * messages are always ACKed after being offered to the runtime,
     * including duplicate retransmissions.
     * @param {object} frame Decoded EBCP frame.
     * @returns {void}
     */
    _handleFrame (frame) {
        if (frame.type === EBCP_CONTROL_TYPES.ACK) {
            return;
        }

        if (
            frame.type ===
                EBCP_CONTROL_TYPES.PING
        ) {
            this._writeControl(
                EBCP_CONTROL_TYPES.PONG
            );

            return;
        }

        if (
            frame.type ===
                EBCP_CONTROL_TYPES.PONG
        ) {
            if (this._probeResolver) {
                const resolve =
                    this._probeResolver;

                this._probeResolver =
                    null;
                this._probePromise =
                    null;

                resolve();
            }

            return;
        }

        if (frame.type === EBCP_CONTROL_TYPES.HELLO) {
            this._runtime.receive(frame);

            this._writeControl(
                EBCP_CONTROL_TYPES.HELLO_ACK
            );

            return;
        }

        if (frame.type === EBCP_CONTROL_TYPES.HELLO_ACK) {
            this._runtime.receive(frame);

            if (this._sessionReadyResolver) {
                const resolve = this._sessionReadyResolver;
                this._sessionReadyResolver = null;
                resolve();
            }

            return;
        }

        this._runtime.receive(frame);
        this._writeAck(frame.sequence);
    }

    /**
     * Write an ACK for one received application sequence.
     * @param {number} sequence Application sequence being acknowledged.
     * @returns {void}
     */
    _writeAck (sequence) {
        this._write(encodeFrame({
            type: EBCP_CONTROL_TYPES.ACK,
            sequence: 0,
            channel: '',
            payload: Buffer.from([
                sequence
            ])
        }));
    }

    /**
     * Write a zero-payload EBCP control frame.
     * @param {number} type EBCP control type.
     * @returns {void}
     */
    _writeControl (type) {
        this._write(encodeFrame({
            type,
            sequence: 0,
            channel: '',
            payload: Buffer.alloc(0)
        }));
    }
}

module.exports = {
    EasyBloxConnectivitySession
};
