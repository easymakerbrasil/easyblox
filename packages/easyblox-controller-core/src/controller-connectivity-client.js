const {
    EBCP_CONTRACT,
    EasyBloxConnectivityRuntime,
    EasyBloxConnectivitySession
} = require('@easymaker/easyblox-connectivity-core');

const {
    CONTROLLER_BINDING_DIRECTIONS,
    CONTROLLER_BINDING_VALUE_TYPES
} = require('./controller-binding-contract');

const {
    getControllerBindingReferenceContract
} = require('./controller-binding');

const {
    createControllerBindingMessage
} = require('./controller-binding-message');

const {
    getControllerBindingWireChannel
} = require('./controller-binding-wire');

const {
    ControllerBindingWireCodec
} = require('./controller-binding-wire-codec');

const CONTROLLER_CHANNEL = '1';

const TEXT =
    EBCP_CONTRACT.messageTypes.TEXT;

const NUMBER =
    EBCP_CONTRACT.messageTypes.NUMBER;

class ControllerConnectivityClient {
    constructor ({
        write,
        model = null
    }) {
        if (
            typeof write !==
                'function'
        ) {
            throw new Error(
                'Controller connectivity write must be a function'
            );
        }

        this._runtime =
            new EasyBloxConnectivityRuntime();

        this._session =
            new EasyBloxConnectivitySession({
                runtime:
                    this._runtime,
                write
            });

        this._bindingModel =
            model;

        this._bindingCodec =
            model ?
                new ControllerBindingWireCodec(
                    model
                ) :
                null;
    }

    startSession () {
        return this._session
            .start();
    }

    probe () {
        return this._session
            .probe();
    }

    sendText (text) {
        return this._session.send(
            TEXT,
            CONTROLLER_CHANNEL,
            text
        );
    }

    sendNumber (number) {
        return this._session.send(
            NUMBER,
            CONTROLLER_CHANNEL,
            number
        );
    }

    waitText () {
        return this._runtime
            .waitFor(
                TEXT,
                CONTROLLER_CHANNEL
            )
            .then(
                message =>
                    message.payload
            );
    }

    waitNumber () {
        return this._runtime
            .waitFor(
                NUMBER,
                CONTROLLER_CHANNEL
            )
            .then(
                message =>
                    message.payload
            );
    }

    sendBinding (
        bindingReference,
        value
    ) {
        this._assertBindingSupport();

        const contract =
            getControllerBindingReferenceContract(
                this._bindingModel,
                bindingReference
            );

        if (
            contract.direction ===
                CONTROLLER_BINDING_DIRECTIONS.OUTPUT
        ) {
            throw new Error(
                'Controller connectivity client cannot send an output binding'
            );
        }

        const canonicalMessage =
            createControllerBindingMessage(
                this._bindingModel,
                bindingReference,
                value
            );

        const wireMessage =
            this._bindingCodec.encode(
                canonicalMessage
            );

        return this._session.send(
            wireMessage.type,
            wireMessage.channel,
            wireMessage.payload
        );
    }

    waitBinding (
        bindingReference
    ) {
        this._assertBindingSupport();

        const contract =
            getControllerBindingReferenceContract(
                this._bindingModel,
                bindingReference
            );

        if (
            contract.direction ===
                CONTROLLER_BINDING_DIRECTIONS.INPUT
        ) {
            throw new Error(
                'Controller connectivity client cannot wait for an input binding'
            );
        }

        const type =
            contract.valueType ===
                CONTROLLER_BINDING_VALUE_TYPES.TEXT ?
                TEXT :
                NUMBER;

        const channel =
            getControllerBindingWireChannel(
                this._bindingModel,
                bindingReference
            );

        return this._runtime
            .waitFor(
                type,
                channel
            )
            .then(
                message =>
                    this._bindingCodec.decode({
                        type:
                            message.type,
                        channel:
                            message.channel,
                        payload:
                            message.payload
                    })
            );
    }

    receive (chunk) {
        this._session.push(
            chunk
        );
    }

    _assertBindingSupport () {
        if (
            !this._bindingModel ||
            !this._bindingCodec
        ) {
            throw new Error(
                'Controller connectivity binding operations require a Controller model'
            );
        }
    }
}

module.exports = {
    ControllerConnectivityClient
};
