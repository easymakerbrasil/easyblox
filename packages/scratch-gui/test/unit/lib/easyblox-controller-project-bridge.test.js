import EasyBloxControllerProjectBridge
    from '../../../src/lib/easyblox-controller-project-bridge';

class FakeVM {
    constructor (components = []) {
        this.components =
            components.map(
                ({...component}) => ({
                    ...component
                })
            );

        this.componentWrites = [];
        this.manifestWrites = [];
    }

    getEasyBloxControllerComponents () {
        return this.components.map(
            ({...component}) => ({
                ...component
            })
        );
    }

    setEasyBloxControllerComponents (components) {
        this.components =
            components.map(
                ({...component}) => ({
                    ...component
                })
            );

        this.componentWrites.push(
            this.getEasyBloxControllerComponents()
        );
    }

    setArduinoUnoControllerBindingManifest (manifest) {
        this.manifestWrites.push(
            manifest.map(
                ({...binding}) => ({
                    ...binding
                })
            )
        );
    }
}

describe(
    'EasyBloxControllerProjectBridge',
    () => {
        test('rehydrates Controller components and publishes the canonical binding manifest', () => {
            const vm =
                new FakeVM([
                    {
                        id: 'action-button',
                        type: 'button',
                        label: 'Botão 1'
                    }
                ]);

            const bridge =
                new EasyBloxControllerProjectBridge({
                    vm
                });

            expect(
                bridge.getComponents()
            ).toEqual([
                {
                    id: 'action-button',
                    type: 'button',
                    label: 'Botão 1'
                }
            ]);

            expect(
                vm.componentWrites
            ).toEqual([]);

            expect(
                vm.manifestWrites
            ).toEqual([
                [
                    {
                        componentId:
                            'action-button',
                        port:
                            'pressed',
                        channel:
                            'C1.7F144E06'
                    }
                ]
            ]);
        });

        test('refreshes persisted Controller state without replacing the canonical model', () => {
            const vm =
                new FakeVM([
                    {
                        id: 'action-button',
                        type: 'button',
                        label: 'Botão 1'
                    }
                ]);

            const bridge =
                new EasyBloxControllerProjectBridge({
                    vm
                });

            const model =
                bridge.getModel();

            vm.components = [
                {
                    id: 'action-button',
                    type: 'button',
                    label: 'Ligar LED'
                }
            ];

            const refreshedComponents =
                bridge.refreshFromVM();

            expect(
                bridge.getModel()
            ).toBe(
                model
            );

            expect(
                refreshedComponents
            ).toEqual([
                {
                    id: 'action-button',
                    type: 'button',
                    label: 'Ligar LED'
                }
            ]);

            expect(
                bridge.getComponents()
            ).toEqual([
                {
                    id: 'action-button',
                    type: 'button',
                    label: 'Ligar LED'
                }
            ]);

            expect(
                vm.componentWrites
            ).toEqual([]);

            expect(
                vm.manifestWrites
            ).toEqual([
                [
                    {
                        componentId:
                            'action-button',
                        port:
                            'pressed',
                        channel:
                            'C1.7F144E06'
                    }
                ],
                [
                    {
                        componentId:
                            'action-button',
                        port:
                            'pressed',
                        channel:
                            'C1.7F144E06'
                    }
                ]
            ]);
        });

        test('keeps persisted components and binding manifest synchronized across model changes', () => {
            const vm =
                new FakeVM();

            const bridge =
                new EasyBloxControllerProjectBridge({
                    vm
                });

            expect(
                vm.manifestWrites
            ).toEqual([
                []
            ]);

            bridge.addComponent({
                id: 'action-button',
                type: 'button',
                label: 'Botão 1'
            });

            expect(
                vm.componentWrites
            ).toEqual([
                [
                    {
                        id: 'action-button',
                        type: 'button',
                        label: 'Botão 1'
                    }
                ]
            ]);

            expect(
                vm.manifestWrites[1]
            ).toEqual([
                {
                    componentId:
                        'action-button',
                    port:
                        'pressed',
                    channel:
                        'C1.7F144E06'
                }
            ]);

            expect(
                bridge.setComponentLabel(
                    'action-button',
                    'Ligar LED'
                )
            ).toBe(true);

            expect(
                vm.componentWrites[1]
            ).toEqual([
                {
                    id: 'action-button',
                    type: 'button',
                    label: 'Ligar LED'
                }
            ]);

            expect(
                vm.manifestWrites[2]
            ).toEqual([
                {
                    componentId:
                        'action-button',
                    port:
                        'pressed',
                    channel:
                        'C1.7F144E06'
                }
            ]);

            expect(
                bridge.removeComponent(
                    'action-button'
                )
            ).toBe(true);

            expect(
                vm.componentWrites[2]
            ).toEqual([]);

            expect(
                vm.manifestWrites[3]
            ).toEqual([]);
        });

        test('does not synchronize when a requested mutation changes nothing', () => {
            const vm =
                new FakeVM();

            const bridge =
                new EasyBloxControllerProjectBridge({
                    vm
                });

            expect(
                bridge.setComponentLabel(
                    'missing-component',
                    'Outro'
                )
            ).toBe(false);

            expect(
                bridge.removeComponent(
                    'missing-component'
                )
            ).toBe(false);

            expect(
                vm.componentWrites
            ).toEqual([]);

            expect(
                vm.manifestWrites
            ).toEqual([
                []
            ]);
        });
    }
);
