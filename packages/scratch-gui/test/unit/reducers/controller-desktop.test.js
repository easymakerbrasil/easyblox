import reducer, {
    closeController,
    controllerDesktopInitialState,
    isControllerConnected,
    isControllerOpen,
    openController,
    setControllerConnected
} from '../../../src/reducers/controller-desktop';

describe(
    'Controller Desktop reducer',
    () => {
        test('starts closed and disconnected', () => {
            expect(
                controllerDesktopInitialState
            ).toEqual({
                isOpen:
                    false,
                isConnected:
                    false
            });
        });

        test('closing the Controller window does not clear an active Bluetooth session', () => {
            let state =
                reducer(
                    undefined,
                    openController()
                );

            state =
                reducer(
                    state,
                    setControllerConnected(
                        true
                    )
                );

            state =
                reducer(
                    state,
                    closeController()
                );

            expect(
                state
            ).toEqual({
                isOpen:
                    false,
                isConnected:
                    true
            });
        });

        test('tracks Controller Bluetooth disconnection independently from window state', () => {
            let state =
                reducer(
                    undefined,
                    setControllerConnected(
                        true
                    )
                );

            state =
                reducer(
                    state,
                    setControllerConnected(
                        false
                    )
                );

            expect(
                state.isConnected
            ).toBe(
                false
            );
        });

        test('exposes independent window and Bluetooth selectors', () => {
            const state = {
                scratchGui: {
                    controllerDesktop: {
                        isOpen:
                            false,
                        isConnected:
                            true
                    }
                }
            };

            expect(
                isControllerOpen(
                    state
                )
            ).toBe(
                false
            );

            expect(
                isControllerConnected(
                    state
                )
            ).toBe(
                true
            );
        });
    }
);
