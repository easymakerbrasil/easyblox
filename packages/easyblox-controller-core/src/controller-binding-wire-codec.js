const {Buffer} = require('buffer');

const {
    EBCP_CONTRACT
} = require('@easymaker/easyblox-connectivity-core');

const {
    CONTROLLER_BINDING_VALUE_TYPES,
    getControllerBindingPortContract
} = require('./controller-binding-contract');

const {
    createControllerBindingMessage
} = require('./controller-binding-message');

const {
    ControllerBindingWireRegistry
} = require('./controller-binding-wire');

const TEXT =
    EBCP_CONTRACT.messageTypes.TEXT;

const NUMBER =
    EBCP_CONTRACT.messageTypes.NUMBER;

class ControllerBindingWireCodec {
    constructor (model) {
        this._model =
            model;

        this._registry =
            new ControllerBindingWireRegistry(
                model
            );
    }

    encode (message) {
        if (
            !message ||
            typeof message !==
                'object' ||
            Array.isArray(
                message
            )
        ) {
            throw new Error(
                'Controller binding wire message must be an object'
            );
        }

        const binding =
            this._registry.getBinding(
                this._registry.getChannel({
                    componentId:
                        message.componentId,
                    port:
                        message.port
                })
            );

        const component =
            this._model.getComponentById(
                binding.componentId
            );

        const contract =
            getControllerBindingPortContract(
                component.type,
                binding.port
            );

        const canonicalMessage =
            createControllerBindingMessage(
                this._model,
                binding,
                message.value
            );

        const channel =
            this._registry.getChannel(
                binding
            );

        switch (
        contract.valueType
        ) {
        case CONTROLLER_BINDING_VALUE_TYPES.NUMBER:
            return Object.freeze({
                type:
                    NUMBER,
                channel,
                payload:
                    canonicalMessage.value
            });

        case CONTROLLER_BINDING_VALUE_TYPES.BOOLEAN:
            return Object.freeze({
                type:
                    NUMBER,
                channel,
                payload:
                    canonicalMessage.value ?
                        1 :
                        0
            });

        case CONTROLLER_BINDING_VALUE_TYPES.TEXT:
            if (
                Buffer.byteLength(
                    canonicalMessage.value,
                    EBCP_CONTRACT.textEncoding
                ) >
                    EBCP_CONTRACT.maxPayloadBytes
            ) {
                throw new Error(
                    'Controller binding text exceeds the EBCP payload limit'
                );
            }

            return Object.freeze({
                type:
                    TEXT,
                channel,
                payload:
                    canonicalMessage.value
            });

        default:
            throw new Error(
                `Unsupported controller binding wire value type: ${contract.valueType}`
            );
        }
    }

    decode (wireMessage) {
        if (
            !wireMessage ||
            typeof wireMessage !==
                'object' ||
            Array.isArray(
                wireMessage
            )
        ) {
            throw new Error(
                'Controller binding wire message must be an object'
            );
        }

        const {
            type,
            channel,
            payload
        } = wireMessage;

        const binding =
            this._registry.getBinding(
                channel
            );

        const component =
            this._model.getComponentById(
                binding.componentId
            );

        const contract =
            getControllerBindingPortContract(
                component.type,
                binding.port
            );

        let value;

        switch (
        contract.valueType
        ) {
        case CONTROLLER_BINDING_VALUE_TYPES.NUMBER:
            if (
                type !==
                    NUMBER
            ) {
                throw new Error(
                    'Unexpected EBCP type for controller binding'
                );
            }

            value =
                payload;
            break;

        case CONTROLLER_BINDING_VALUE_TYPES.BOOLEAN:
            if (
                type !==
                    NUMBER
            ) {
                throw new Error(
                    'Unexpected EBCP type for controller binding'
                );
            }

            if (
                payload !==
                    0 &&
                payload !==
                    1
            ) {
                throw new Error(
                    'Invalid controller binding Boolean wire value'
                );
            }

            value =
                payload ===
                    1;
            break;

        case CONTROLLER_BINDING_VALUE_TYPES.TEXT:
            if (
                type !==
                    TEXT
            ) {
                throw new Error(
                    'Unexpected EBCP type for controller binding'
                );
            }

            if (
                typeof payload !==
                    'string' ||
                Buffer.byteLength(
                    payload,
                    EBCP_CONTRACT.textEncoding
                ) >
                    EBCP_CONTRACT.maxPayloadBytes
            ) {
                throw new Error(
                    'Invalid controller binding text wire value'
                );
            }

            value =
                payload;
            break;

        default:
            throw new Error(
                `Unsupported controller binding wire value type: ${contract.valueType}`
            );
        }

        return createControllerBindingMessage(
            this._model,
            binding,
            value
        );
    }
}

module.exports = {
    ControllerBindingWireCodec
};
