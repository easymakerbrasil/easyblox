// TODO: add tests of extension alerts

/* eslint-env jest */
import {AlertTypes, AlertLevels} from '../../../src/lib/alerts/index.jsx';
import alertsReducer, {
    alertsInitialState,
    closeAlert,
    closeAlertWithId,
    filterInlineAlerts,
    filterPopupAlerts,
    showAlertWithTimeout,
    showStandardAlert
} from '../../../src/reducers/alerts';

describe('Stage preparation alert identities', () => {
    test('replaces its family while preserving INLINE and unrelated alerts', () => {
        let state = alertsReducer(alertsInitialState, showStandardAlert('saving'));
        state = alertsReducer(state, showStandardAlert('stagePreparationError', {
            scopeId: 'gui-1', message: 'Mensagem pública'
        }));
        expect(state.alertsList[1].message).toBe('Mensagem pública');
        state = alertsReducer(state, showStandardAlert('stagePreparationProgress', {
            scopeId: 'gui-1', message: 'Preparando'
        }));
        state = alertsReducer(state, showStandardAlert('stagePreparationProgress', {
            scopeId: 'gui-1', message: 'Reconectando'
        }));
        expect(state.alertsList.map(({alertId}) => alertId)).toEqual(['saving', 'stagePreparationProgress']);
        expect(state.alertsList[1].message).toBe('Reconectando');
        expect(filterInlineAlerts(state.alertsList)).toHaveLength(1);
    });

    test('closes exactly the instance even with a stale index', () => {
        const first = showStandardAlert('stagePreparationError', {scopeId: 'gui-1'});
        const second = showStandardAlert('stagePreparationError', {scopeId: 'gui-2'});
        let state = alertsReducer(alertsInitialState, first);
        state = alertsReducer(state, second);
        state = alertsReducer(state, closeAlert(0, second.instanceId));
        expect(state.alertsList).toHaveLength(1);
        expect(state.alertsList[0].scopeId).toBe('gui-1');
        expect(alertsReducer(state, closeAlert(0, second.instanceId))).toBe(state);
    });

    test('an old success timeout cannot remove a newer success or error', () => {
        jest.useFakeTimers();
        let state = alertsReducer(alertsInitialState, {type: 'init'});
        const dispatch = function (action) {
            state = alertsReducer(state, action);
        };
        showAlertWithTimeout(dispatch, 'stagePreparationSuccess', {scopeId: 'gui-1', message: 'Primeiro'});
        jest.advanceTimersByTime(1000);
        showAlertWithTimeout(dispatch, 'stagePreparationSuccess', {scopeId: 'gui-1', message: 'Segundo'});
        jest.advanceTimersByTime(4000);
        expect(state.alertsList[0].message).toBe('Segundo');
        dispatch(showStandardAlert('stagePreparationError', {scopeId: 'gui-1', message: 'Erro'}));
        jest.advanceTimersByTime(10000);
        expect(state.alertsList[0].message).toBe('Erro');
        jest.useRealTimers();
    });

    test('runtime messages cannot overwrite existing save content', () => {
        const state = alertsReducer(alertsInitialState, showStandardAlert('saving', {message: 'Dados técnicos'}));
        expect(state.alertsList[0].message).toBeUndefined();
        expect(state.alertsList[0].content).toBeDefined();
    });
});

test('initialState', () => {
    let defaultState;
    /* alertsReducer(state, action) */
    expect(alertsReducer(defaultState, {type: 'anything'})).toBeDefined();
    expect(alertsReducer(defaultState, {type: 'anything'}).visible).toBe(true);
    expect(alertsReducer(defaultState, {type: 'anything'}).alertsList).toEqual([]);
});

test('create one standard alert', () => {
    let defaultState;
    const action = showStandardAlert('creating');
    const resultState = alertsReducer(defaultState, action);
    expect(resultState.alertsList.length).toBe(1);
    expect(resultState.alertsList[0].alertId).toBe('creating');
    expect(resultState.alertsList[0].alertType).toBe(AlertTypes.STANDARD);
    expect(resultState.alertsList[0].level).toBe(AlertLevels.SUCCESS);
});

test('add several standard alerts', () => {
    const initialState = {
        visible: true,
        alertsList: [
            {
                alertId: 'saving',
                alertType: AlertTypes.INLINE,
                level: AlertLevels.SUCCESS,
                content: null,
                iconURL: '/no_image_here.jpg'
            }
        ]
    };
    const action = showStandardAlert('creating');
    let resultState = alertsReducer(initialState, action);
    resultState = alertsReducer(resultState, action);
    resultState = alertsReducer(resultState, action);
    expect(resultState.alertsList.length).toBe(1);
    expect(resultState.alertsList[0].alertType).toBe(AlertTypes.STANDARD);
    expect(resultState.alertsList[0].iconURL).not.toBe('/no_image_here.jpg');
    expect(resultState.alertsList[0].alertId).toBe('creating');
});

test('create one inline alert message', () => {
    let defaultState;
    const action = showStandardAlert('saving');
    const resultState = alertsReducer(defaultState, action);
    expect(resultState.alertsList.length).toBe(1);
    expect(resultState.alertsList[0].alertId).toBe('saving');
    expect(resultState.alertsList[0].alertType).toBe(AlertTypes.INLINE);
    expect(resultState.alertsList[0].level).toBe(AlertLevels.INFO);
});

test('can close alerts by index', () => {
    const initialState = {
        visible: true,
        alertsList: [
            {
                alertId: 'saving',
                alertType: AlertTypes.INLINE,
                level: AlertLevels.SUCCESS,
                content: null,
                iconURL: '/no_image_here.jpg'
            }
        ]
    };
    const closeAction = closeAlert(0);
    let resultState = alertsReducer(initialState, closeAction);
    expect(resultState.alertsList.length).toBe(0);
    const createAction = showStandardAlert('creating');
    resultState = alertsReducer(resultState, createAction);
    expect(resultState.alertsList.length).toBe(1);
    resultState = alertsReducer(initialState, closeAction);
    expect(resultState.alertsList.length).toBe(0);
    resultState = alertsReducer(resultState, createAction);
});

test('can close a single alert by id', () => {
    const initialState = {
        visible: true,
        alertsList: [
            {alertId: 'saving'},
            {alertId: 'creating'},
            {alertId: 'saving'},
            {alertId: 'saving'}
        ]
    };
    const closeAction = closeAlertWithId('saving');
    let resultState = alertsReducer(initialState, closeAction);
    expect(resultState.alertsList.map(a => a.alertId)).toEqual([
        'creating', 'saving', 'saving'
    ]);
    resultState = alertsReducer(resultState, closeAction);
    expect(resultState.alertsList.map(a => a.alertId)).toEqual([
        'creating', 'saving'
    ]);
    resultState = alertsReducer(resultState, closeAction);
    expect(resultState.alertsList.map(a => a.alertId)).toEqual([
        'creating'
    ]);
    resultState = alertsReducer(resultState, closeAction);
    expect(resultState.alertsList.map(a => a.alertId)).toEqual([
        'creating'
    ]);
});

test('related alerts can clear each other', () => {
    const initialState = {
        visible: true,
        alertsList: [
            {
                alertId: 'saving',
                alertType: AlertTypes.INLINE,
                level: AlertLevels.SUCCESS,
                content: null,
                iconURL: '/no_image_here.jpg'
            },
            {
                alertId: 'creating',
                alertType: AlertTypes.STANDARD,
                level: AlertLevels.SUCCESS,
                content: null,
                iconURL: '/no_image_here.jpg'
            }
        ]
    };
    const action = showStandardAlert('saveSuccess');
    const resultState = alertsReducer(initialState, action);
    expect(resultState.alertsList.length).toBe(2);
    expect(resultState.alertsList[0].alertId).toBe('creating');
    expect(resultState.alertsList[1].alertId).toBe('saveSuccess');
});

test('several related alerts can be cleared at once', () => {
    const initialState = {
        visible: true,
        alertsList: []
    };
    const createAction = showStandardAlert('creating');
    let resultState = alertsReducer(initialState, createAction);
    resultState = alertsReducer(resultState, createAction);
    resultState = alertsReducer(resultState, createAction);
    const createSuccessAction = showStandardAlert('createSuccess');
    resultState = alertsReducer(resultState, createSuccessAction);
    expect(resultState.alertsList.length).toBe(1);
    expect(resultState.alertsList[0].alertId).toBe('createSuccess');
});

test('filterInlineAlerts only returns inline type alerts', () => {
    const alerts = [
        {
            alertId: 'extension',
            alertType: AlertTypes.EXTENSION
        },
        {
            alertId: 'inline',
            alertType: AlertTypes.INLINE
        },
        {
            alertId: 'standard',
            alertType: AlertTypes.STANDARD
        },
        {
            alertId: 'non-existent type',
            alertType: 'wirly-burly'
        }
    ];

    const filtered = filterInlineAlerts(alerts);
    expect(filtered.length).toEqual(1);
    expect(filtered[0].alertId).toEqual('inline');
});

test('filterPopupAlerts returns standard and extension type alerts', () => {
    const alerts = [
        {
            alertId: 'extension',
            alertType: AlertTypes.EXTENSION
        },
        {
            alertId: 'inline',
            alertType: AlertTypes.INLINE
        },
        {
            alertId: 'standard',
            alertType: AlertTypes.STANDARD
        },
        {
            alertId: 'non-existent type',
            alertType: 'wirly-burly'
        }
    ];

    const filtered = filterPopupAlerts(alerts);
    expect(filtered.length).toEqual(2);
    expect(filtered[0].alertId).toEqual('extension');
    expect(filtered[1].alertId).toEqual('standard');
});
