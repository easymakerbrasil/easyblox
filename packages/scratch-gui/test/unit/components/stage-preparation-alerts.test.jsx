import React from 'react';
import '@testing-library/jest-dom';
import {act, fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import Alerts from '../../../src/containers/alerts.jsx';
import alertsReducer, {showStandardAlert, showExtensionAlert} from '../../../src/reducers/alerts';
import {manualUpdateProject} from '../../../src/reducers/project-state';
import {
    showStagePreparationAlert,
    clearStagePreparationAlerts
} from '../../../src/lib/easyblox-stage-preparation-alerts';

const mockDownload = jest.fn();
jest.mock('../../../src/containers/sb3-downloader.jsx', () => (
    ({children}) => children(null, mockDownload)
));
jest.mock('../../../src/components/spinner/spinner.jsx', () => (
    function SpinnerMock () {
        return <span data-testid="progress-spinner" />;
    }
));

const setup = function () {
    const actions = [];
    const store = createStore((state, action) => {
        actions.push(action);
        return {scratchGui: {alerts: alertsReducer(state?.scratchGui.alerts, action)}};
    });
    const view = renderWithIntl(<Provider store={store}><Alerts /></Provider>);
    return {store, actions, ...view};
};

describe('Central Stage preparation Alerts', () => {
    test('announces and replaces progress, persists errors, and closes the correct popup by keyboard', async () => {
        const {store, getByRole, getByTestId, queryByTestId} = setup();
        act(() => {
            store.dispatch(showStandardAlert('saving'));
            showStagePreparationAlert(store.dispatch, {
                state: 'restoring-stage', message: 'Preparando a placa para o Modo Palco...', scopeId: 'gui-1'
            });
        });
        expect(getByRole('status')).toHaveTextContent('Preparando a placa');
        expect(getByTestId('progress-spinner')).toBeInTheDocument();
        act(() => showStagePreparationAlert(store.dispatch, {
            state: 'reconnecting-stage', message: 'Restaurando a comunicação com a placa...', scopeId: 'gui-1'
        }));
        expect(getByRole('status')).toHaveTextContent('Restaurando a comunicação');
        act(() => showStagePreparationAlert(store.dispatch, {
            state: 'error', message: 'A placa não foi encontrada.', scopeId: 'gui-1'
        }));
        expect(getByRole('alert')).toHaveTextContent('A placa não foi encontrada.');
        expect(queryByTestId('progress-spinner')).toBeNull();
        const close = getByRole('button', {name: 'Fechar aviso'});
        close.focus();
        await userEvent.setup().keyboard('{Enter}');
        expect(store.getState().scratchGui.alerts.alertsList.map(({alertId}) => alertId)).toEqual(['saving']);
    });

    test('registered fallback works, Space closes, and rendering does not capture focus', async () => {
        const {store, getByRole} = setup();
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();
        act(() => store.dispatch(showStandardAlert('stagePreparationError')));
        expect(document.activeElement).toBe(input);
        expect(getByRole('alert')).toHaveTextContent('Não foi possível preparar a placa para o Modo Palco.');
        getByRole('button', {name: 'Fechar aviso'}).focus();
        await userEvent.setup().keyboard(' ');
        expect(store.getState().scratchGui.alerts.alertsList).toHaveLength(0);
        input.remove();
    });

    test('success expires at five seconds; progress and errors have no timeout; cleanup is scoped', () => {
        jest.useFakeTimers();
        const {store, getByRole, queryByRole} = setup();
        act(() => showStagePreparationAlert(store.dispatch, {state: 'stage-ready', scopeId: 'gui-1'}));
        expect(getByRole('status')).toHaveTextContent('Placa pronta no Modo Palco.');
        act(() => jest.advanceTimersByTime(4999));
        expect(getByRole('status')).toBeInTheDocument();
        act(() => jest.advanceTimersByTime(1));
        expect(queryByRole('status')).toBeNull();
        act(() => {
            showStagePreparationAlert(store.dispatch, {state: 'restoring-stage', scopeId: 'gui-1'});
            jest.advanceTimersByTime(30000);
        });
        expect(getByRole('status')).toBeInTheDocument();
        act(() => {
            showStagePreparationAlert(store.dispatch, {state: 'error', scopeId: 'gui-1'});
            showStagePreparationAlert(store.dispatch, {state: 'error', scopeId: 'gui-2'});
            jest.advanceTimersByTime(30000);
            clearStagePreparationAlerts(store.dispatch, 'gui-1');
        });
        expect(getByRole('alert')).toBeInTheDocument();
        expect(store.getState().scratchGui.alerts.alertsList[0].scopeId).toBe('gui-2');
        jest.useRealTimers();
    });

    test('save actions, download and extension reconnect remain available with INLINE filtered out', () => {
        const {store, actions, getByRole, getByText} = setup();
        act(() => {
            store.dispatch(showStandardAlert('saving'));
            store.dispatch(showStandardAlert('savingError'));
            store.dispatch(showExtensionAlert({extensionId: 'arduinoUno'}));
        });
        fireEvent.click(getByRole('button', {name: 'Try Again'}));
        expect(actions).toContainEqual(manualUpdateProject());
        fireEvent.click(getByRole('button', {name: 'Download'}));
        expect(mockDownload).toHaveBeenCalledTimes(1);
        expect(getByText(/lost connection/)).toBeInTheDocument();
        fireEvent.click(getByRole('button', {name: 'Reconnect'}));
        expect(actions.some(({extensionId}) => extensionId === 'arduinoUno')).toBe(true);
        expect(store.getState().scratchGui.alerts.alertsList.map(({alertId}) => alertId)).toEqual(['savingError']);
    });
});
