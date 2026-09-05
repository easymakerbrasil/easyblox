import reducer, {
    controllerDesktopInitialState,
    closeController,
    isControllerOpen,
    openController,
    toggleController
} from '../../../src/reducers/controller-desktop';

describe(
    'controller desktop reducer',
    () => {
        test('starts with the Controller closed', () => {
            expect(
                reducer(
                    undefined,
                    {
                        type:
                            '@@INIT'
                    }
                )
            ).toEqual({
                isOpen:
                    false
            });

            expect(
                controllerDesktopInitialState
            ).toEqual({
                isOpen:
                    false
            });
        });

        test('opens the Controller', () => {
            expect(
                reducer(
                    {
                        isOpen:
                            false
                    },
                    openController()
                )
            ).toEqual({
                isOpen:
                    true
            });
        });

        test('closes the Controller', () => {
            expect(
                reducer(
                    {
                        isOpen:
                            true
                    },
                    closeController()
                )
            ).toEqual({
                isOpen:
                    false
            });
        });

        test('toggles the Controller window state', () => {
            const opened =
                reducer(
                    {
                        isOpen:
                            false
                    },
                    toggleController()
                );

            expect(opened)
                .toEqual({
                    isOpen:
                        true
                });

            expect(
                reducer(
                    opened,
                    toggleController()
                )
            ).toEqual({
                isOpen:
                    false
            });
        });

        test('reads Controller visibility from the GUI state safely', () => {
            expect(
                isControllerOpen({
                    scratchGui: {
                        controllerDesktop: {
                            isOpen:
                                true
                        }
                    }
                })
            ).toBe(true);

            expect(
                isControllerOpen({
                    scratchGui: {}
                })
            ).toBe(false);
        });
    }
);
