import React from 'react';
import {screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import ReactModal from 'react-modal';
import WebGlModal from '../../../src/containers/webgl-modal.jsx';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

let appElement;
beforeEach(() => {
    appElement = document.createElement('div');
    document.body.appendChild(appElement);
    ReactModal.setAppElement(appElement);
});

afterEach(() => {
    delete window.easybloxDesktop;
    appElement.remove();
});

test.each([{}, {bridge: {}}, {bridge: {getAppInfo: 'invalid'}}])(
    'keeps Web diagnostic links without a Desktop bridge', ({bridge}) => {
        window.easybloxDesktop = bridge;
        renderWithIntl(<WebGlModal />);
        expect(screen.getAllByRole('link')).toHaveLength(2);
        expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', 'https://get.webgl.org/');
        expect(screen.getAllByRole('link')[1]).toHaveAttribute('href', '//scratch.mit.edu/3faq');
    });

test('keeps the diagnostic text but removes external controls with the actual Desktop bridge', () => {
    const getAppInfo = jest.fn();
    window.easybloxDesktop = {getAppInfo};
    renderWithIntl(<WebGlModal />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText('does not support WebGL')).toBeVisible();
    expect(screen.getByText('FAQ')).toBeVisible();
    expect(screen.getByRole('button', {name: 'Back'})).toBeVisible();
    expect(getAppInfo).not.toHaveBeenCalled();
});
