import reducer, {
    modalsInitialState, openAboutModal, closeAboutModal, openConnectionModal
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
