import reducer, {
    activateExtension,
    activeExtensionsInitialState,
    deactivateExtension,
    isExtensionActive
} from '../../../src/reducers/active-extensions';

describe('active extensions reducer', () => {
    test('tracks activate remove and reactivate lifecycle', () => {
        let state =
            reducer(
                void 0,
                {}
            );

        expect(state).toEqual(
            activeExtensionsInitialState
        );

        expect(
            isExtensionActive(
                {
                    scratchGui: {
                        activeExtensions:
                            state
                    }
                },
                'easybloxBt'
            )
        ).toBe(false);

        state =
            reducer(
                state,
                activateExtension(
                    'easybloxBt'
                )
            );

        expect(state).toEqual([
            'easybloxBt'
        ]);

        state =
            reducer(
                state,
                deactivateExtension(
                    'easybloxBt'
                )
            );

        expect(state).toEqual([]);

        state =
            reducer(
                state,
                activateExtension(
                    'easybloxBt'
                )
            );

        expect(state).toEqual([
            'easybloxBt'
        ]);
    });

    test('does not duplicate an already active extension', () => {
        const state =
            reducer(
                ['easybloxBt'],
                activateExtension(
                    'easybloxBt'
                )
            );

        expect(state).toEqual([
            'easybloxBt'
        ]);
    });
});
