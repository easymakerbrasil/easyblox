import reducer, {
    closeEasyConect,
    easyConectDesktopInitialState,
    isEasyConectConnected,
    isEasyConectOpen,
    openEasyConect,
    setEasyConectConnected,
    toggleEasyConect
} from '../../../src/reducers/easyconect-desktop';

describe(
    'EasyConect Desktop reducer',
    () => {
        test('starts closed and disconnected', () => {
            expect(
                easyConectDesktopInitialState
            ).toEqual({
                isOpen:
                    false,
                isConnected:
                    false
            });
        });

        test('opens and closes the EasyConect window', () => {
            const opened =
                reducer(
                    easyConectDesktopInitialState,
                    openEasyConect()
                );

            expect(
                opened
            ).toEqual({
                isOpen:
                    true,
                isConnected:
                    false
            });

            expect(
                reducer(
                    opened,
                    closeEasyConect()
                )
            ).toEqual({
                isOpen:
                    false,
                isConnected:
                    false
            });
        });

        test('toggles the EasyConect window state', () => {
            const opened =
                reducer(
                    easyConectDesktopInitialState,
                    toggleEasyConect()
                );

            expect(
                opened.isOpen
            ).toBe(
                true
            );

            expect(
                reducer(
                    opened,
                    toggleEasyConect()
                ).isOpen
            ).toBe(
                false
            );
        });

        test('tracks Bluetooth connection independently from window visibility', () => {
            let state =
                reducer(
                    easyConectDesktopInitialState,
                    openEasyConect()
                );

            state =
                reducer(
                    state,
                    setEasyConectConnected(
                        true
                    )
                );

            state =
                reducer(
                    state,
                    closeEasyConect()
                );

            expect(
                state
            ).toEqual({
                isOpen:
                    false,
                isConnected:
                    true
            });

            state =
                reducer(
                    state,
                    setEasyConectConnected(
                        false
                    )
                );

            expect(
                state
            ).toEqual({
                isOpen:
                    false,
                isConnected:
                    false
            });
        });

        test('normalizes connection state to Boolean', () => {
            expect(
                reducer(
                    easyConectDesktopInitialState,
                    setEasyConectConnected(
                        'connected'
                    )
                ).isConnected
            ).toBe(
                true
            );

            expect(
                reducer(
                    easyConectDesktopInitialState,
                    setEasyConectConnected(
                        0
                    )
                ).isConnected
            ).toBe(
                false
            );
        });

        test('exposes safe independent window and connection selectors', () => {
            const state = {
                scratchGui: {
                    easyConectDesktop: {
                        isOpen:
                            true,
                        isConnected:
                            true
                    }
                }
            };

            expect(
                isEasyConectOpen(
                    state
                )
            ).toBe(
                true
            );

            expect(
                isEasyConectConnected(
                    state
                )
            ).toBe(
                true
            );

            expect(
                isEasyConectOpen({
                    scratchGui: {}
                })
            ).toBe(
                false
            );

            expect(
                isEasyConectConnected({
                    scratchGui: {}
                })
            ).toBe(
                false
            );

            expect(
                isEasyConectOpen(
                    null
                )
            ).toBe(
                false
            );

            expect(
                isEasyConectConnected(
                    null
                )
            ).toBe(
                false
            );
        });

        test('ignores unrelated actions', () => {
            const state = {
                isOpen:
                    true,
                isConnected:
                    true
            };

            expect(
                reducer(
                    state,
                    {
                        type:
                            'unrelated/action'
                    }
                )
            ).toBe(
                state
            );
        });
    }
);
