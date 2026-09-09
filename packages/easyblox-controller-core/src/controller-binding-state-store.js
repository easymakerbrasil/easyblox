const {
    CONTROLLER_BINDING_DIRECTIONS
} = require('./controller-binding-contract');

const {
    getControllerBindingReferenceContract
} = require('./controller-binding');

const {
    CONTROLLER_BINDING_MESSAGE_KINDS,
    createControllerBindingMessage
} = require('./controller-binding-message');

const SUPPORTED_DIRECTIONS =
    Object.freeze(
        Object.values(
            CONTROLLER_BINDING_DIRECTIONS
        )
    );

class ControllerBindingStateStore {
    constructor (model) {
        this._model =
            model;

        this._states =
            new Map();
    }

    setState (
        bindingReference,
        value
    ) {
        const message =
            createControllerBindingMessage(
                this._model,
                bindingReference,
                value
            );

        if (
            message.kind !==
                CONTROLLER_BINDING_MESSAGE_KINDS.STATE
        ) {
            throw new Error(
                'Controller binding state store accepts only state messages'
            );
        }

        let componentStates =
            this._states.get(
                message.componentId
            );

        if (!componentStates) {
            componentStates =
                new Map();

            this._states.set(
                message.componentId,
                componentStates
            );
        }

        componentStates.set(
            message.port,
            message
        );

        return message;
    }

    getState (
        bindingReference
    ) {
        getControllerBindingReferenceContract(
            this._model,
            bindingReference
        );

        const componentStates =
            this._states.get(
                bindingReference.componentId
            );

        if (!componentStates) {
            return null;
        }

        return (
            componentStates.get(
                bindingReference.port
            ) ||
            null
        );
    }

    createSnapshot (
        direction = null
    ) {
        if (
            direction !==
                null &&
            !SUPPORTED_DIRECTIONS.includes(
                direction
            )
        ) {
            throw new Error(
                `Unsupported controller binding direction: ${direction}`
            );
        }

        const snapshot =
            [];

        for (
            const componentStates of
                this._states.values()
        ) {
            for (
                const message of
                    componentStates.values()
            ) {
                if (
                    direction ===
                        null ||
                    message.direction ===
                        direction
                ) {
                    snapshot.push(
                        message
                    );
                }
            }
        }

        return Object.freeze(
            snapshot
        );
    }
}

module.exports = {
    ControllerBindingStateStore
};
