import React from 'react';
import ReactModal from 'react-modal';
import {useSelector, Provider} from 'react-redux';
import {combineReducers, createStore} from 'redux';
import {act, cleanup, fireEvent, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsMenu from '../../../src/components/menu-bar/settings-menu.jsx';
import AboutEasyBlox from '../../../src/containers/about-easyblox.jsx';
import {MenuRefProvider} from '../../../src/contexts/menu-ref-context.jsx';
import modals from '../../../src/reducers/modals';
import settings from '../../../src/reducers/settings';
import locales from '../../../src/reducers/locales';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

const AboutHost = () => {
    const selectAbout = function (state) {
        return state.scratchGui.modals.aboutModal;
    };
    const visible = useSelector(selectAbout);
    return visible ? <AboutEasyBlox /> : null;
};

describe('Settings About integration with real Redux and Modal', () => {
    let store;
    let appElement;
    beforeEach(() => {
        store = createStore(combineReducers({locales, scratchGui: combineReducers({settings, modals})}));
        appElement = document.createElement('div');
        document.body.appendChild(appElement);
        ReactModal.setAppElement(appElement);
    });
    afterEach(() => {
        cleanup();
        appElement.remove();
        delete window.easybloxDesktop;
    });
    const renderSettings = function () {
        return renderWithIntl(
            <Provider store={store}>
                <MenuRefProvider><SettingsMenu
                    canChangeLanguage
                    canChangeColorMode
                    canChangeTheme
                    depth={1}
                /></MenuRefProvider>
                <AboutHost />
            </Provider>, {locale: 'pt-br'}
        );
    };
    const checkOpen = async function (method) {
        const getAppInfo = jest.fn().mockResolvedValue({
            productName: 'EasyBlox', version: '9.8.7', platform: 'win32', isPackaged: true
        });
        window.easybloxDesktop = {getAppInfo};
        renderSettings();
        const gear = screen.getByRole('button', {name: 'Settings menu'});
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(getAppInfo).not.toHaveBeenCalled();
        fireEvent.click(gear);
        const action = screen.getByText('Sobre o EasyBlox');
        if (method === 'keyboard') {
            action.focus();
            fireEvent.keyDown(action, {key: 'Enter'});
        } else {
            fireEvent.click(action);
        }
        expect(gear).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
        expect(store.getState().scratchGui.modals.aboutModal).toBe(true);
        expect(await screen.findByText('Versão 9.8.7')).toBeVisible();
        fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape', keyCode: 27});
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(gear).toHaveFocus();
        fireEvent.click(gear);
        fireEvent.click(screen.getByText('Sobre o EasyBlox'));
        await waitFor(() => expect(getAppInfo).toHaveBeenCalledTimes(2));
    };
    test.each(['click', 'keyboard'])('opens through %s, closes dropdown and restores gear focus', checkOpen);
    test('closes nested menus without changing preferences, locale or cookies', async () => {
        renderSettings();
        const gear = screen.getByRole('button', {name: 'Settings menu'});
        fireEvent.click(gear);
        fireEvent.click(screen.getByLabelText('Language menu'));
        expect(screen.getByText('Português')).toBeVisible();
        fireEvent.click(screen.getByText('Português'));
        expect(store.getState().locales.locale).toBe('pt-br');
        fireEvent.click(screen.getByText('Color Mode'));
        fireEvent.click(screen.getByText('High Contrast'));
        expect(store.getState().scratchGui.settings.colorMode).toBe('high-contrast');
        const preferences = store.getState().scratchGui.settings;
        const cookies = document.cookie;
        fireEvent.click(screen.getByText('Sobre o EasyBlox'));
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
        await screen.findByText('Versão do Desktop indisponível neste navegador.');
        fireEvent.click(screen.getByRole('button', {name: 'Fechar'}));
        expect(store.getState().scratchGui.settings).toBe(preferences);
        expect(store.getState().locales.locale).toBe('pt-br');
        expect(document.cookie).toBe(cookies);
        expect(gear).toHaveFocus();
    });
    test('allows normal menu navigation to reach About', async () => {
        renderSettings();
        const gear = screen.getByRole('button', {name: 'Settings menu'});
        gear.focus();
        fireEvent.keyDown(gear, {key: 'Enter'});
        await act(async () => {
            await new Promise(requestAnimationFrame);
        });
        expect(screen.getByLabelText('Language menu')).toHaveFocus();
        fireEvent.keyDown(document.activeElement, {key: 'ArrowUp'});
        expect(screen.getByText('Sobre o EasyBlox')).toHaveFocus();
        fireEvent.keyDown(document.activeElement, {key: 'Enter'});
        expect(screen.getByRole('dialog', {name: 'Sobre o EasyBlox'})).toBeVisible();
    });
});
