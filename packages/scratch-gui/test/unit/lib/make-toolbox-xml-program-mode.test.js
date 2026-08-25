import makeToolboxXML from '../../../src/lib/make-toolbox-xml';
import {defaultColors} from '../../../src/lib/settings/color-mode';

describe('makeToolboxXML program mode', () => {
    test('preserves native Scratch categories in Stage mode', () => {
        const xml = makeToolboxXML(
            false,
            false,
            'target-id',
            [],
            '',
            '',
            '',
            defaultColors,
            'stage'
        );

        expect(xml).toContain('toolboxitemid="motion"');
        expect(xml).toContain('toolboxitemid="looks"');
        expect(xml).toContain('toolboxitemid="sound"');
        expect(xml).toContain('toolboxitemid="events"');
        expect(xml).toContain('toolboxitemid="control"');
        expect(xml).toContain('toolboxitemid="sensing"');
        expect(xml).toContain('toolboxitemid="operators"');
        expect(xml).toContain('toolboxitemid="variables"');
        expect(xml).toContain('toolboxitemid="myBlocks"');
    });

    test('uses the EasyBlox non-negative number shadow for control_wait', () => {
        const xml = makeToolboxXML(
            false,
            false,
            'target-id',
            [],
            '',
            '',
            '',
            defaultColors,
            'stage'
        );

        expect(xml).toContain(
            '<shadow type="easyblox_nonnegative_number">'
        );

        expect(xml).not.toContain(
            '<shadow type="math_positive_number">'
        );
    });

    test('uses numeric shadows for operator_lt operands', () => {
    const xml = makeToolboxXML(
        false,
        false,
        'target-id',
        [],
        '',
        '',
        '',
        defaultColors,
        'stage'
    );

    const operatorLtStart = xml.indexOf(
        '<block type="operator_lt">'
    );

    const operatorEqualsStart = xml.indexOf(
        '<block type="operator_equals">',
        operatorLtStart
    );

    const operatorLtXml = xml.slice(
        operatorLtStart,
        operatorEqualsStart
    );

    expect(operatorLtXml).toContain(
        '<shadow type="math_number">'
    );

    expect(operatorLtXml).not.toContain(
        '<shadow type="text">'
    );
});

    test('hides Stage-only native categories in Upload mode', () => {
        const xml = makeToolboxXML(
            false,
            false,
            'target-id',
            [],
            '',
            '',
            '',
            defaultColors,
            'upload'
        );

        expect(xml).not.toContain('toolboxitemid="motion"');
        expect(xml).not.toContain('toolboxitemid="looks"');
        expect(xml).not.toContain('toolboxitemid="sound"');
        expect(xml).not.toContain('toolboxitemid="event"');
        expect(xml).not.toContain('toolboxitemid="sensing"');

        expect(xml).toContain('toolboxitemid="control"');
        expect(xml).toContain('toolboxitemid="operators"');
        expect(xml).toContain('toolboxitemid="variables"');
        expect(xml).toContain('toolboxitemid="myBlocks"');

        expect(xml).not.toContain('type="control_stop"');
        expect(xml).not.toContain('type="control_start_as_clone"');
        expect(xml).not.toContain('type="control_create_clone_of"');
        expect(xml).not.toContain('type="control_delete_this_clone"');

        expect(xml).toContain('type="control_wait"');
        expect(xml).toContain('type="control_repeat"');
        expect(xml).toContain('type="control_forever"');
        expect(xml).toContain('type="control_if"');
        expect(xml).toContain('type="control_if_else"');
        expect(xml).toContain('type="control_wait_until"');
        expect(xml).toContain('type="control_repeat_until"');
    });
    test('does not reappend injected Stage-only core categories in Upload mode', () => {
        const categoriesXML = [
            {
                id: 'motion',
                xml: '<category data-test="injected-motion"></category>'
            },
            {
                id: 'looks',
                xml: '<category data-test="injected-looks"></category>'
            },
            {
                id: 'sound',
                xml: '<category data-test="injected-sound"></category>'
            },
            {
                id: 'event',
                xml: '<category data-test="injected-event"></category>'
            },
            {
                id: 'sensing',
                xml: '<category data-test="injected-sensing"></category>'
            }
        ];

        const xml = makeToolboxXML(
            false,
            false,
            'target-id',
            categoriesXML,
            '',
            '',
            '',
            defaultColors,
            'upload'
        );

        expect(xml).not.toContain('data-test="injected-motion"');
        expect(xml).not.toContain('data-test="injected-looks"');
        expect(xml).not.toContain('data-test="injected-sound"');
        expect(xml).not.toContain('data-test="injected-event"');
        expect(xml).not.toContain('data-test="injected-sensing"');
    });
});
