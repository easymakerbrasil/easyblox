jest.mock('../../../src/containers/modal.jsx', () => {
    const React = require('react');

    return {
        __esModule: true,
        default: props => React.createElement(
            'div',
            null,
            props.children
        )
    };
});

import React from 'react';
import {IntlProvider} from 'react-intl';
import {fireEvent, render, screen} from '@testing-library/react';

import CustomProcedures from '../../../src/components/custom-procedures/custom-procedures.jsx';

describe('CustomProcedures component', () => {
    test('offers separate EasyBlox input types', () => {
        const onAddInteger = jest.fn();
        const onAddDecimal = jest.fn();
        const onAddText = jest.fn();
        const onAddBoolean = jest.fn();

        render(
            <IntlProvider locale="en">
                <CustomProcedures
                    componentRef={jest.fn()}
                    onAddBoolean={onAddBoolean}
                    onAddDecimal={onAddDecimal}
                    onAddInteger={onAddInteger}
                    onAddLabel={jest.fn()}
                    onAddText={onAddText}
                    onCancel={jest.fn()}
                    onOk={jest.fn()}
                    onToggleWarp={jest.fn()}
                    warp={false}
                />
            </IntlProvider>
        );

        fireEvent.click(
            screen.getByText('Número inteiro')
        );
        fireEvent.click(
            screen.getByText('Número decimal')
        );
        fireEvent.click(
            screen.getByText('Texto')
        );
        fireEvent.click(
            screen.getByText('Verdadeiro/Falso')
        );

        expect(onAddInteger).toHaveBeenCalledTimes(1);
        expect(onAddDecimal).toHaveBeenCalledTimes(1);
        expect(onAddText).toHaveBeenCalledTimes(1);
        expect(onAddBoolean).toHaveBeenCalledTimes(1);
    });
});
