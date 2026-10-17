import React from 'react';
import ReactModal from 'react-modal';
import {cleanup, fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import {Provider} from 'react-redux';
import {combineReducers, createStore} from 'redux';
import GUI from '../../../src/components/gui/gui.jsx';
import SettingsMenu from '../../../src/components/menu-bar/settings-menu.jsx';
import {MenuRefProvider} from '../../../src/contexts/menu-ref-context.jsx';
import modals from '../../../src/reducers/modals';
import settings from '../../../src/reducers/settings';
import locales from '../../../src/reducers/locales';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

/**
 * Mock de componente React sem conteúdo.
 * @returns {null} Nenhum elemento renderizado.
 */
// eslint-disable-next-line func-style
function mockEmptyComponent () {
    return null;
}

jest.mock('@scratch/scratch-render', () => ({isSupported: () => true}));
jest.mock('react-responsive', () => ({
    __esModule: true,
    default: function MediaQuery ({children}) {
        return children(true);
    }
}));
jest.mock('../../../src/containers/blocks.jsx', () => mockEmptyComponent);
jest.mock('../../../src/containers/costume-tab.jsx', () => mockEmptyComponent);
jest.mock('../../../src/containers/connection-modal.jsx', () => mockEmptyComponent);
jest.mock('../../../src/containers/sound-tab.jsx', () => mockEmptyComponent);
jest.mock('../../../src/containers/target-pane.jsx', () => mockEmptyComponent);
jest.mock('../../../src/containers/stage-wrapper.jsx', () => mockEmptyComponent);
jest.mock('../../../src/containers/drag-layer.jsx', () => mockEmptyComponent);
jest.mock('../../../src/containers/watermark.jsx', () => mockEmptyComponent);
jest.mock('../../../src/containers/easyconect-desktop-window.jsx', () => mockEmptyComponent);
jest.mock('../../../src/components/menu-bar/menu-bar.jsx', () => mockEmptyComponent);
jest.mock('../../../src/components/debug-modal/debug-modal.jsx', () => mockEmptyComponent);

describe('GUI camera and microphone modal', () => {
    let appElement;
    beforeEach(() => {
        appElement = document.createElement('div');
        document.body.appendChild(appElement);
        ReactModal.setAppElement(appElement);
    });
    afterEach(() => {
        cleanup();
        appElement.remove();
    });
    // eslint-disable-next-line @stylistic/arrow-parens
    test.each(['Close', 'Escape'])('opens from Settings and closes the temporary modal with %s', (method) => {
        const store = createStore(combineReducers({
            locales,
            scratchGui: combineReducers({
                settings,
                modals,
                timeTravel: () => ({year: 2026}),
                stageSize: () => ({stageSize: 'large'}),
                mode: () => ({isFullScreen: false})
            })
        }));
        renderWithIntl(<Provider store={store}>
            <MenuRefProvider><SettingsMenu depth={1} /></MenuRefProvider>
            <GUI
                menuBarHidden
                onRequestCloseDebugModal={jest.fn()}
                vm={{setProgramContext: jest.fn(), refreshWorkspace: jest.fn()}}
            />
        </Provider>, {locale: 'pt-br'});
        const gear = screen.getByRole('button', {name: 'Settings menu'});
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        gear.focus();
        fireEvent.click(gear);
        fireEvent.click(screen.getByText('Câmera e microfone…'));
        const modal = screen.getByRole('dialog', {name: 'Câmera e microfone'});
        expect(modal).toBeVisible();
        expect(screen.getByRole('combobox', {name: 'Câmera'})).toBeVisible();
        expect(screen.getByRole('combobox', {name: 'Microfone'})).toBeVisible();
        expect(screen.getByRole('button', {name: 'Atualizar lista'})).toBeVisible();
        expect(screen.getByRole('button', {name: 'Concluído'})).toBeVisible();
        expect(gear).toHaveAttribute('aria-expanded', 'false');
        if (method === 'Escape') {
            fireEvent.keyDown(modal, {key: 'Escape', keyCode: 27});
        } else {
            fireEvent.click(screen.getByRole('button', {name: 'Close'}));
        }
        expect(store.getState().scratchGui.modals.mediaInputModal).toBe(false);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(gear).toHaveFocus();
        fireEvent.click(gear);
        fireEvent.click(screen.getByText('Câmera e microfone…'));
        expect(screen.getByRole('dialog', {name: 'Câmera e microfone'})).toBeVisible();
    });
});
