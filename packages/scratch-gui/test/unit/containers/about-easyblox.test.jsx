import React from 'react';
import ReactModal from 'react-modal';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';
import {createStore, combineReducers} from 'redux';
import {act, cleanup, fireEvent, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutEasyBlox from '../../../src/containers/about-easyblox.jsx';
import modals, {openAboutModal} from '../../../src/reducers/modals';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

const appInfo = {productName: 'EasyBlox', version: '1.2.3', platform: 'win32', isPackaged: true};

describe('AboutEasyBlox metadata lifecycle', () => {
    let appElement;
    let store;
    beforeEach(() => {
        store = createStore(combineReducers({scratchGui: combineReducers({modals})}));
        store.dispatch(openAboutModal());
        appElement = document.createElement('div');
        document.body.appendChild(appElement);
        ReactModal.setAppElement(appElement);
    });
    afterEach(() => {
        cleanup();
        delete window.easybloxDesktop;
        jest.useRealTimers();
        appElement.remove();
    });
    const renderAbout = function () {
        return renderWithIntl(<Provider store={store}><AboutEasyBlox /></Provider>, {locale: 'pt-br'});
    };

    test('queries once, displays real metadata and queries again on a new opening', async () => {
        const getAppInfo = jest.fn().mockResolvedValue(appInfo);
        window.easybloxDesktop = {getAppInfo};
        const view = renderAbout();
        expect(await screen.findByText('Versão 1.2.3')).toBeVisible();
        view.rerender(<IntlProvider locale="pt-br"><Provider store={store}><AboutEasyBlox /></Provider></IntlProvider>);
        expect(getAppInfo).toHaveBeenCalledTimes(1);
        expect(getAppInfo).toHaveBeenCalledWith();
        view.unmount();
        renderAbout();
        await waitFor(() => expect(getAppInfo).toHaveBeenCalledTimes(2));
    });
    test('remains usable in a browser without the bridge', async () => {
        renderAbout();
        expect(await screen.findByText('Versão do Desktop indisponível neste navegador.')).toBeVisible();
        fireEvent.click(screen.getByRole('button', {name: 'Fechar'}));
        expect(store.getState().scratchGui.modals.aboutModal).toBe(false);
    });
    const checkFailure = async function (kind) {
        window.easybloxDesktop = {getAppInfo: jest.fn().mockImplementation(() => (kind === 'invalid' ?
            Promise.resolve({...appInfo, extra: true}) : Promise.reject(new Error('private path'))))};
        renderAbout();
        expect(await screen.findByText('Não foi possível consultar a versão do Desktop.')).toBeVisible();
        expect(screen.queryByText('private path')).not.toBeInTheDocument();
    };
    test.each(['invalid', 'rejected'])('handles %s metadata without internal details', checkFailure);
    test('times out and ignores a response delivered after timeout', async () => {
        jest.useFakeTimers();
        let resolve;
        const captureResolve = function (callback) {
            resolve = callback;
        };
        window.easybloxDesktop = {getAppInfo: () => new Promise(captureResolve)};
        renderAbout();
        await act(async () => {
            await Promise.resolve();
        });
        await act(async () => {
            jest.advanceTimersByTime(5000);
            await Promise.resolve();
        });
        expect(screen.getByRole('status')).toHaveTextContent('Não foi possível consultar a versão do Desktop.');
        await act(async () => {
            resolve(appInfo);
            await Promise.resolve();
        });
        expect(screen.queryByText('Versão 1.2.3')).not.toBeInTheDocument();
        expect(jest.getTimerCount()).toBe(0);
    });
    const checkLateResponse = async function (outcome) {
        jest.useFakeTimers();
        let finish;
        const getAppInfo = jest.fn(() => new Promise((resolve, reject) => {
            finish = outcome === 'resolve' ? resolve : reject;
        }));
        window.easybloxDesktop = {getAppInfo};
        const view = renderAbout();
        await act(async () => {
            await Promise.resolve();
        });
        view.unmount();
        expect(jest.getTimerCount()).toBe(0);
        await act(async () => {
            finish(outcome === 'resolve' ? appInfo : new Error('late'));
            await Promise.resolve();
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(getAppInfo).toHaveBeenCalledTimes(1);
    };
    test.each(['resolve', 'reject'])('cancels on unmount and ignores late %s', checkLateResponse);
    test('closing cancels the request even before the parent unmounts the container', async () => {
        jest.useFakeTimers();
        window.easybloxDesktop = {getAppInfo: jest.fn(() => new Promise(() => {}))};
        renderAbout();
        fireEvent.click(screen.getByRole('button', {name: 'Fechar'}));
        await act(async () => {
            await Promise.resolve();
        });
        expect(store.getState().scratchGui.modals.aboutModal).toBe(false);
        expect(window.easybloxDesktop.getAppInfo).not.toHaveBeenCalled();
        await act(async () => {
            jest.advanceTimersByTime(20);
            await Promise.resolve();
        });
        expect(jest.getTimerCount()).toBe(0);
    });
});
