import React from 'react';
import configureStore from 'redux-mock-store';
import {fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import MenuBarHOC from '../../../src/containers/menu-bar-hoc.jsx';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

describe('Menu Bar HOC', () => {
    const onContinue = jest.fn();
    const Component = ({requestNewProjectConfirmation, shouldSaveBeforeTransition}) => {
        const handleNew = React.useCallback(() => requestNewProjectConfirmation(onContinue),
            [requestNewProjectConfirmation]);
        return (
            <>
                <button onClick={handleNew}>Novo</button>
                <div data-testid="save-before-transition">{String(shouldSaveBeforeTransition())}</div>
            </>
        );
    };
    const WrappedComponent = MenuBarHOC(Component);
    const mount = function (props) {
        return renderWithIntl(
            <WrappedComponent
                store={configureStore()({scratchGui: {projectChanged: false}})}
                {...props}
            />
        );
    };

    beforeEach(() => onContinue.mockClear());

    test.each([
        [false, false],
        [false, true],
        [true, true]
    ])('continues directly when changed=%s and canCreateNew=%s', (projectChanged, canCreateNew) => {
        mount({projectChanged, canCreateNew});
        fireEvent.click(screen.getByText('Novo'));
        expect(onContinue).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('defers an edited project without canCreateNew until confirmation, exactly once', () => {
        mount({projectChanged: true, canCreateNew: false});
        fireEvent.click(screen.getByText('Novo'));
        fireEvent.click(screen.getByText('Novo'));
        expect(screen.getAllByRole('dialog')).toHaveLength(1);
        expect(onContinue).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {name: 'Criar novo projeto'}));
        expect(onContinue).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test.each(['Cancelar', 'Close'])('%s preserves the current project', label => {
        mount({projectChanged: true, canCreateNew: false});
        fireEvent.click(screen.getByText('Novo'));
        fireEvent.click(screen.getByRole('button', {name: label}));
        expect(onContinue).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('Escape cancels without creating a project', () => {
        mount({projectChanged: true, canCreateNew: false});
        fireEvent.click(screen.getByText('Novo'));
        fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape', keyCode: 27});
        expect(onContinue).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('does not replace the pending continuation', () => {
        const first = jest.fn();
        const second = jest.fn();
        const Probe = ({requestNewProjectConfirmation}) => {
            const handleFirst = React.useCallback(() => requestNewProjectConfirmation(first),
                [requestNewProjectConfirmation]);
            const handleSecond = React.useCallback(() => requestNewProjectConfirmation(second),
                [requestNewProjectConfirmation]);
            return (
                <>
                    <button onClick={handleFirst}>Primeiro</button>
                    <button onClick={handleSecond}>Segundo</button>
                </>
            );
        };
        const WrappedProbe = MenuBarHOC(Probe);
        renderWithIntl(
            <WrappedProbe
                projectChanged
                canCreateNew={false}
                store={configureStore()({scratchGui: {projectChanged: true}})}
            />
        );
        fireEvent.click(screen.getByText('Primeiro'));
        fireEvent.click(screen.getByText('Segundo'));
        fireEvent.click(screen.getByRole('button', {name: 'Criar novo projeto'}));
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).not.toHaveBeenCalled();
    });

    test.each([
        [true, true, 'true'],
        [true, false, 'false'],
        [false, true, 'false'],
        [false, false, 'false']
    ])('preserves save-before-transition for canSave=%s changed=%s', (canSave, projectChanged, expected) => {
        mount({canSave, projectChanged});
        expect(screen.getByTestId('save-before-transition')).toHaveTextContent(expected);
    });
});
