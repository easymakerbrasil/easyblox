const {
    EBCP_CONTROL_TYPES
} = require('./easyblox-connectivity-protocol');

const INBOX_CAPACITY = 4;
class EasyBloxConnectivityRuntime {
    constructor () {
        this._inbox = [];
        this._waiters = [];
        this._lastAcceptedSequence = null;
        this._sessionGeneration = 0;
    }

    /**
     * Current connectivity session generation.
     * @returns {number} monotonically increasing session generation
     */
    get sessionGeneration () {
        return this._sessionGeneration;
    }

    /**
     * Deliver an application message to the oldest compatible waiter,
     * or retain it until a compatible waiter is registered.
     * @param {object} message - decoded EBCP application message
     */
    receive (message) {
        if (
            message.type === EBCP_CONTROL_TYPES.HELLO ||
            message.type === EBCP_CONTROL_TYPES.HELLO_ACK
        ) {
            this._inbox = [];
            this._lastAcceptedSequence = null;
            this._sessionGeneration++;
            return;
        }
        if (
            this._lastAcceptedSequence !== null &&
            message.sequence === this._lastAcceptedSequence
        ) {
            return;
        }

        this._lastAcceptedSequence = message.sequence;
        const waiterIndex = this._waiters.findIndex(
            waiter =>
                waiter.type === message.type &&
                waiter.channel === message.channel
        );

        if (waiterIndex !== -1) {
            const [waiter] = this._waiters.splice(
                waiterIndex,
                1
            );

            waiter.resolve(message);
            return;
        }

        if (this._inbox.length >= INBOX_CAPACITY) {
            this._inbox.shift();
        }

        this._inbox.push(message);
    }

    /**
     * Wait for the oldest unconsumed message matching type and channel.
     * @param {number} type - EBCP application message type
     * @param {string} channel - EBCP channel
     * @returns {Promise<object>} matching decoded EBCP message
     */
    waitFor (type, channel) {
        const messageIndex = this._inbox.findIndex(
            message =>
                message.type === type &&
                message.channel === channel
        );

        if (messageIndex !== -1) {
            const [message] = this._inbox.splice(
                messageIndex,
                1
            );

            return Promise.resolve(message);
        }

        return new Promise(resolve => {
            this._waiters.push({
                type,
                channel,
                resolve
            });
        });
    }
}

module.exports = {
    EasyBloxConnectivityRuntime
};
