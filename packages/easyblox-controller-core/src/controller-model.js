const CONTROLLER_COMPONENT_TYPES = Object.freeze({
    GAMEPAD: 'gamepad',
    JOYSTICK: 'joystick',
    SLIDER: 'slider',
    BUTTON: 'button',
    TOGGLE: 'toggle',
    INDICATOR: 'indicator',
    SERIAL: 'serial'
});

const SUPPORTED_COMPONENT_TYPES = new Set(
    Object.values(CONTROLLER_COMPONENT_TYPES)
);

class ControllerModel {
    constructor () {
        this._components = [];
    }

    getComponents () {
        return this._components.map(component => ({...component}));
    }

    getComponentById (id) {
        const component = this._components.find(
            existingComponent => existingComponent.id === id
        );

        return component ? {...component} : null;
    }

    removeComponent (id) {
        const componentIndex = this._components.findIndex(
            existingComponent => existingComponent.id === id
        );

        if (componentIndex === -1) {
            return false;
        }

        this._components.splice(componentIndex, 1);
        return true;
    }

    addComponent (component) {
        if (
            component === null ||
            typeof component !== 'object' ||
            Array.isArray(component)
        ) {
            throw new Error('Component must be an object');
        }

        if (
            typeof component.id !== 'string' ||
            component.id.trim().length === 0
        ) {
            throw new Error('Component id must be a non-empty string');
        }

        if (!SUPPORTED_COMPONENT_TYPES.has(component.type)) {
            throw new Error(`Unsupported component type: ${component.type}`);
        }

        if (this._components.some(existingComponent =>
            existingComponent.id === component.id
        )) {
            throw new Error(`Duplicate component id: ${component.id}`);
        }

        this._components.push({...component});
    }
}

module.exports = {
    ControllerModel,
    CONTROLLER_COMPONENT_TYPES
};
