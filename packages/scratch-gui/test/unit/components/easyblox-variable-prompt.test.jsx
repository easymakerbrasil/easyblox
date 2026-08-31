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
import {render, screen} from '@testing-library/react';

import PromptComponent from '../../../src/components/prompt/prompt.jsx';

describe('EasyBlox variable prompt component', () => {
    test('offers exactly Number and Text as variable types in v1', () => {
        const {container} = render(
            <IntlProvider locale="en">
                <PromptComponent
                    canAddCloudVariable={false}
                    cloudSelected={false}
                    defaultValue=""
                    easybloxValueType="DECIMAL"
                    globalSelected
                    isStage={false}
                    label="Nome da variável"
                    showCloudOption={false}
                    showEasyBloxVariableTypeOptions
                    showListMessage={false}
                    showVariableOptions={false}
                    title="Criar uma variável"
                    onCancel={jest.fn()}
                    onChange={jest.fn()}
                    onEasyBloxVariableTypeChange={jest.fn()}
                    onFocus={jest.fn()}
                    onKeyPress={jest.fn()}
                    onOk={jest.fn()}
                    onScopeOptionSelection={jest.fn()}
                />
            </IntlProvider>
        );

        expect(
            screen.getByText('Tipo de dados:')
        ).not.toBeNull();

        const typeInputs = Array.from(
            container.querySelectorAll(
                'input[name="easybloxVariableType"]'
            )
        );

        expect(
            typeInputs.map(input => input.value)
        ).toEqual([
            'DECIMAL',
            'TEXT'
        ]);

        expect(
            container.querySelector(
                'input[value="INTEGER"]'
            )
        ).toBeNull();

        expect(
            container.querySelector(
                'input[value="BOOLEAN"]'
            )
        ).toBeNull();
    });

    test('hides EasyBlox type options when they are not requested', () => {
        const {container} = render(
            <IntlProvider locale="en">
                <PromptComponent
                    canAddCloudVariable={false}
                    cloudSelected={false}
                    defaultValue=""
                    easybloxValueType="DECIMAL"
                    globalSelected
                    isStage={false}
                    label="Nome"
                    showCloudOption={false}
                    showEasyBloxVariableTypeOptions={false}
                    showListMessage={false}
                    showVariableOptions={false}
                    title="Prompt"
                    onCancel={jest.fn()}
                    onChange={jest.fn()}
                    onEasyBloxVariableTypeChange={jest.fn()}
                    onFocus={jest.fn()}
                    onKeyPress={jest.fn()}
                    onOk={jest.fn()}
                    onScopeOptionSelection={jest.fn()}
                />
            </IntlProvider>
        );

        expect(
            container.querySelectorAll(
                'input[name="easybloxVariableType"]'
            )
        ).toHaveLength(0);
    });
});
