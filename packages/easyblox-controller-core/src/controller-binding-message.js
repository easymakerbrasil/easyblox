const {
    CONTROLLER_BINDING_VALUE_TYPES
} = require('./controller-binding-contract');

const {
    getControllerBindingReferenceContract,
    validateControllerBindingValue
} = require('./controller-binding');

const CONTROLLER_BINDING_MESSAGE_KINDS = Object.freeze({
    STATE:
        'state',
    STREAM:
        'stream'
});

const getMessageKind =
    contract =>
        contract.valueType ===
            CONTROLLER_BINDING_VALUE_TYPES.TEXT ?
            CONTROLLER_BINDING_MESSAGE_KINDS.STREAM :
            CONTROLLER_BINDING_MESSAGE_KINDS.STATE;

const createControllerBindingMessage =
    (
        model,
        bindingReference,
        value
    ) => {
        const contract =
            getControllerBindingReferenceContract(
                model,
                bindingReference
            );

        const validatedValue =
            validateControllerBindingValue(
                model,
                bindingReference,
                value
            );

        return Object.freeze({
            kind:
                getMessageKind(
                    contract
                ),
            componentId:
                bindingReference.componentId,
            port:
                bindingReference.port,
            direction:
                contract.direction,
            value:
                validatedValue
        });
    };

module.exports = {
    CONTROLLER_BINDING_MESSAGE_KINDS,
    createControllerBindingMessage
};
