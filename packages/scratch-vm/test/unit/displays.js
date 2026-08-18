const test = require('tap').test;

const Scratch3DisplaysBlocks =
    require('../../src/extensions/scratch3_displays');

test('Displays reuse the registered Arduino UNO peripheral', t => {
    const peripheral = {};

    const runtime = {
        getPeripheralExtension: extensionId => {
            t.equal(
                extensionId,
                'arduinoUno',
                'displays request the Arduino UNO peripheral'
            );

            return peripheral;
        }
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    t.equal(
        extension._peripheral,
        peripheral,
        'displays reuse the registered Arduino UNO peripheral instance'
    );

    t.end();
});

test('Displays expose LCD blocks and menus', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3DisplaysBlocks(runtime);
    const info = extension.getInfo();

    t.equal(info.id, 'displays');
    t.equal(info.name, 'Displays');

    t.equal(info.color1, '#E53935');
    t.equal(info.color2, '#C62828');
    t.equal(info.color3, '#8E0000');

    t.same(
        info.blocks.map(block => block.opcode),
        [
            'lcdInit',
            'lcdWrite',
            'lcdClear',
            'lcdMode'
        ]
    );

    t.same(
        info.menus.lcdRows.items.map(item => item.value),
        ['1', '2']
    );

    t.same(
        info.menus.lcdColumns.items.map(item => item.value),
        [
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '12',
            '13',
            '14',
            '15',
            '16'
        ]
    );

    t.same(
        info.menus.lcdModes.items.map(item => item.value),
        [
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9'
        ]
    );

    t.end();
});

test('Displays delegate LCD commands to the shared peripheral', t => {
    const calls = [];

    const peripheral = {
        lcdInit: () => {
            calls.push(['init']);
            return 1;
        },

        lcdWrite: (text, row, column) => {
            calls.push([
                'write',
                text,
                row,
                column
            ]);
            return 2;
        },

        lcdClear: () => {
            calls.push(['clear']);
            return 3;
        },

        lcdMode: mode => {
            calls.push([
                'mode',
                mode
            ]);
            return 4;
        }
    };

    const runtime = {
        getPeripheralExtension: () => peripheral
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    t.equal(
        extension.lcdInit(),
        1
    );

    t.equal(
        extension.lcdWrite({
            TEXT: 'EasyBlox',
            ROW: 1,
            COLUMN: 1
        }),
        2
    );

    t.equal(
        extension.lcdClear(),
        3
    );

    t.equal(
        extension.lcdMode({
            MODE: '0'
        }),
        4
    );

    t.same(
        calls,
        [
            ['init'],
            ['write', 'EasyBlox', 0, 0],
            ['clear'],
            ['mode', 0]
        ]
    );

    t.end();
});

test('Displays normalize LCD row and column coordinates', t => {
    const calls = [];

    const peripheral = {
        lcdWrite: (text, row, column) => {
            calls.push([
                text,
                row,
                column
            ]);

            return calls.length;
        }
    };

    const runtime = {
        getPeripheralExtension: () => peripheral
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    extension.lcdWrite({
        TEXT: 'A',
        ROW: -10,
        COLUMN: -10
    });

    extension.lcdWrite({
        TEXT: 'B',
        ROW: 99,
        COLUMN: 99
    });

    extension.lcdWrite({
        TEXT: 'C',
        ROW: 1.6,
        COLUMN: 8.6
    });

    t.same(
        calls,
        [
            ['A', 0, 0],
            ['B', 1, 15],
            ['C', 1, 8]
        ]
    );

    t.end();
});

test('Displays delegate all LCD modes as numeric values', t => {
    const receivedModes = [];

    const peripheral = {
        lcdMode: mode => {
            receivedModes.push(mode);
            return mode;
        }
    };

    const runtime = {
        getPeripheralExtension: () => peripheral
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    for (let mode = 0; mode <= 9; mode++) {
        extension.lcdMode({
            MODE: String(mode)
        });
    }

    t.same(
        receivedModes,
        [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
        ]
    );

    t.end();
});
