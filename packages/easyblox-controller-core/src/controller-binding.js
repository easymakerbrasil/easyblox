const {
    CONTROLLER_BINDING_VALUE_TYPES,
    getControllerBindingPortContract
} = require('./controller-binding-contract');

const assertControllerModel =
    model => {
        if (
            !model ||
            typeof model.getComponentById !==
                'function'
        ) {
            throw new Error(
                'Controller model must expose getComponentById'
            );
        }
    };

const assertComponentId =
    componentId => {
        if (
            typeof componentId !==
                'string' ||
            componentId.trim().length ===
                0
        ) {
            throw new Error(
                'Controller binding component id must be a non-empty string'
            );
        }
    };

const assertPort =
    port => {
        if (
            typeof port !==
                'string' ||
            port.trim().length ===
                0
        ) {
            throw new Error(
                'Controller binding port must be a non-empty string'
            );
        }
    };

const resolveBinding =
    (
        model,
        bindingReference
    ) => {
        assertControllerModel(
            model
        );

        if (
            !bindingReference ||
            typeof bindingReference !==
                'object' ||
            Array.isArray(
                bindingReference
            )
        ) {
            throw new Error(
                'Controller binding reference must be an object'
            );
        }

        const {
            componentId,
            port
        } = bindingReference;

        assertComponentId(
            componentId
        );

        assertPort(
            port
        );

        const component =
            model.getComponentById(
                componentId
            );

        if (!component) {
            throw new Error(
                `Unknown controller component id: ${componentId}`
            );
        }

        const portContract =
            getControllerBindingPortContract(
                component.type,
                port
            );

        return {
            component,
            portContract
        };
    };

const createControllerBindingReference =
    (
        model,
        componentId,
        port
    ) => {
        const bindingReference =
            {
                componentId,
                port
            };

        resolveBinding(
            model,
            bindingReference
        );

        return Object.freeze(
            bindingReference
        );
    };

const getControllerBindingReferenceContract =
    (
        model,
        bindingReference
    ) =>
        resolveBinding(
            model,
            bindingReference
        ).portContract;

const throwInvalidBindingValue =
    message => {
        throw new Error(
            `Invalid controller binding value: ${message}`
        );
    };

const validateNumberValue =
    (
        value,
        contract
    ) => {
        if (
            typeof value !==
                'number' ||
            !Number.isFinite(
                value
            )
        ) {
            throwInvalidBindingValue(
                'expected a finite number'
            );
        }

        if (
            contract.integer &&
            !Number.isInteger(
                value
            )
        ) {
            throwInvalidBindingValue(
                'expected an integer'
            );
        }

        if (
            typeof contract.minimum ===
                'number' &&
            value <
                contract.minimum
        ) {
            throwInvalidBindingValue(
                `expected a value greater than or equal to ${contract.minimum}`
            );
        }

        if (
            typeof contract.maximum ===
                'number' &&
            value >
                contract.maximum
        ) {
            throwInvalidBindingValue(
                `expected a value less than or equal to ${contract.maximum}`
            );
        }

        return value;
    };

const validateControllerBindingValue =
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

        switch (
        contract.valueType
        ) {
        case CONTROLLER_BINDING_VALUE_TYPES.NUMBER:
            return validateNumberValue(
                value,
                contract
            );

        case CONTROLLER_BINDING_VALUE_TYPES.BOOLEAN:
            if (
                typeof value !==
                    'boolean'
            ) {
                throwInvalidBindingValue(
                    'expected a Boolean'
                );
            }
            return value;

        case CONTROLLER_BINDING_VALUE_TYPES.TEXT:
            if (
                typeof value !==
                    'string'
            ) {
                throwInvalidBindingValue(
                    'expected text'
                );
            }
            return value;

        default:
            throw new Error(
                `Unsupported controller binding value type: ${contract.valueType}`
            );
        }
    };

module.exports = {
    createControllerBindingReference,
    getControllerBindingReferenceContract,
    validateControllerBindingValue
};
