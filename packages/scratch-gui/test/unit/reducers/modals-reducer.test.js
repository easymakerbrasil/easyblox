import reducer, {
    modalsInitialState, openAboutModal, closeAboutModal, openConnectionModal,
    openMediaInputModal, closeMediaInputModal
} from '../../../src/reducers/modals';

describe('About modal state', () => {
    test('starts closed and preserves all other flags when opening and closing', () => {
        expect(reducer(void 0, {})).toEqual({...modalsInitialState, aboutModal: false});
        const original = reducer(void 0, openConnectionModal());
        const opened = reducer(original, openAboutModal());
        expect(opened).toEqual({...original, aboutModal: true});
        expect(reducer(opened, closeAboutModal())).toEqual(original);
        expect(reducer(opened, openAboutModal())).toEqual(opened);
    });
});

describe('Media input modal state', () => {
    test('starts closed and preserves other modals when opening and closing', () => {
        expect(reducer(void 0, {}).mediaInputModal).toBe(false);
        const original = reducer(void 0, openAboutModal());
        const opened = reducer(original, openMediaInputModal());
        expect(opened).toEqual({...original, mediaInputModal: true});
        expect(reducer(opened, closeMediaInputModal())).toEqual(original);
        expect(reducer(opened, openMediaInputModal())).toEqual(opened);
    });
});
