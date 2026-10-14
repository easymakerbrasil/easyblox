import React from 'react';
import {screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorStep from '../../../src/components/connection-modal/error-step.jsx';
import UnavailableStep from '../../../src/components/connection-modal/unavailable-step.jsx';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

test.each([{Component: ErrorStep}, {Component: UnavailableStep}])(
    'omits unavailable help while keeping retry and diagnosis', ({Component}) => {
        renderWithIntl(<Component
            connectionIconURL="icon.svg"
            onScanning={jest.fn()}
        />);
        expect(screen.queryByRole('button', {name: 'Help'})).not.toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Try again'})).toBeVisible();
    });

test.each([{Component: ErrorStep}, {Component: UnavailableStep}])(
    'preserves Web help when its callback is available', ({Component}) => {
        renderWithIntl(<Component
            connectionIconURL="icon.svg"
            onHelp={jest.fn()}
            onScanning={jest.fn()}
        />);
        expect(screen.getByRole('button', {name: 'Help'})).toBeVisible();
    });
