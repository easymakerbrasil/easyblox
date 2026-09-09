import {
    ControllerBindingWireRegistry,
    ControllerModel
} from '@easymaker/easyblox-controller-core';

class EasyBloxControllerProjectBridge {
    constructor ({vm}) {
        if (
            !vm ||
            typeof vm.getEasyBloxControllerComponents !== 'function' ||
            typeof vm.setEasyBloxControllerComponents !== 'function' ||
            typeof vm.setArduinoUnoControllerBindingManifest !== 'function'
        ) {
            throw new Error(
                'EasyBlox Controller project bridge requires a compatible VM'
            );
        }

        this._vm =
            vm;

        this._model =
            new ControllerModel();

        const persistedComponents =
            this._vm.getEasyBloxControllerComponents();

        this._replaceModelComponents(
            persistedComponents
        );

        this._publishBindingManifest();
    }

    getComponents () {
        return this._model.getComponents();
    }

    getModel () {
        return this._model;
    }

    refreshFromVM () {
        const persistedComponents =
            this._vm.getEasyBloxControllerComponents();

        this._replaceModelComponents(
            persistedComponents
        );

        this._publishBindingManifest();

        return this.getComponents();
    }

    addComponent (component) {
        this._model.addComponent(
            component
        );

        this._synchronizeProject();
    }

    setComponentLabel (componentId, label) {
        const changed =
            this._model.setComponentLabel(
                componentId,
                label
            );

        if (!changed) {
            return false;
        }

        this._synchronizeProject();

        return true;
    }

    removeComponent (componentId) {
        const changed =
            this._model.removeComponent(
                componentId
            );

        if (!changed) {
            return false;
        }

        this._synchronizeProject();

        return true;
    }

    _replaceModelComponents (components) {
        const validatedModel =
            new ControllerModel();

        for (const component of components) {
            validatedModel.addComponent(
                component
            );
        }

        for (
            const component of
            this._model.getComponents()
        ) {
            this._model.removeComponent(
                component.id
            );
        }

        for (
            const component of
            validatedModel.getComponents()
        ) {
            this._model.addComponent(
                component
            );
        }
    }

    _synchronizeProject () {
        const components =
            this._model.getComponents();

        const manifest =
            this._createBindingManifest();

        this._vm.setEasyBloxControllerComponents(
            components
        );

        this._vm.setArduinoUnoControllerBindingManifest(
            manifest
        );
    }

    _publishBindingManifest () {
        this._vm.setArduinoUnoControllerBindingManifest(
            this._createBindingManifest()
        );
    }

    _createBindingManifest () {
        const registry =
            new ControllerBindingWireRegistry(
                this._model
            );

        return registry.getEntries().map(({binding, channel}) => ({
            componentId:
                binding.componentId,
            port:
                binding.port,
            channel
        }));
    }
}

export default EasyBloxControllerProjectBridge;
