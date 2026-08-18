const test = require('tap').test;
const BlockType =
    require('../../src/extension-support/block-type');

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

test('Displays expose matrix and LCD blocks and menus', t => {
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

    t.equal(
    info.blocks[0].blockType,
    BlockType.LABEL,
    'matrix section starts with a flyout label'
);

t.equal(
    info.blocks[0].text,
    'Matriz de LED 8x8'
);

t.equal(
    info.blocks[5],
    '---',
    'matrix and LCD sections are separated'
);

t.equal(
    info.blocks[6].blockType,
    BlockType.LABEL,
    'LCD section starts with a flyout label'
);

t.equal(
    info.blocks[6].text,
    'Display LCD'
);

const executableBlocks =
    info.blocks.filter(block =>
        block &&
        typeof block === 'object' &&
        block.opcode
    );

t.same(
    executableBlocks.map(block => block.opcode),
    [
        'configureMatrix',
        'matrixWrite',
        'matrixClear',
        'matrixBrightness',
        'lcdInit',
        'lcdWrite',
        'lcdClear',
        'lcdMode'
    ]
);

const configureBlock =
    executableBlocks.find(
        block => block.opcode === 'configureMatrix'
    );

const writeBlock =
    executableBlocks.find(
        block => block.opcode === 'matrixWrite'
    );

const clearBlock =
    executableBlocks.find(
        block => block.opcode === 'matrixClear'
    );

const brightnessBlock =
    executableBlocks.find(
        block => block.opcode === 'matrixBrightness'
    );

    t.equal(
        configureBlock.text,
        'configurar matriz 8×8 DIN [DIN] CS [CS] CLK [CLK]'
    );

    t.equal(
        configureBlock.arguments.DIN.defaultValue,
        18,
        'EasyMaker DIN defaults to A4'
    );

    t.equal(
        configureBlock.arguments.CS.defaultValue,
        19,
        'EasyMaker CS defaults to A5'
    );

    t.equal(
        configureBlock.arguments.CLK.defaultValue,
        13,
        'EasyMaker CLK defaults to D13'
    );

    t.equal(
        writeBlock.text,
        'mostrar na matriz [MATRIX]'
    );

    t.equal(
        writeBlock.arguments.MATRIX.defaultValue,
        '0066FFFF7E3C1800',
        'matrix defaults to the approved heart pattern'
    );

    t.equal(
        clearBlock.text,
        'limpar matriz'
    );

    t.equal(
        brightnessBlock.text,
        'definir brilho da matriz para [BRIGHTNESS] %'
    );

    t.equal(
        brightnessBlock.arguments.BRIGHTNESS.defaultValue,
        100
    );

    t.same(
        info.menus.matrixPins.items.map(item => item.value),
        [
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
            '16',
            '17',
            '18',
            '19'
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

test('Displays configure matrix pins locally', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    const result = extension.configureMatrix({
        DIN: '2',
        CS: '4',
        CLK: '12'
    });

    t.equal(result, null);

    t.equal(
        extension._matrixDinPin,
        2
    );

    t.equal(
        extension._matrixCsPin,
        4
    );

    t.equal(
        extension._matrixClkPin,
        12
    );

    t.end();
});

test('Displays reject invalid matrix pin configurations', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    extension.configureMatrix({
        DIN: '2',
        CS: '4',
        CLK: '12'
    });

    extension.configureMatrix({
        DIN: '1',
        CS: '4',
        CLK: '12'
    });

    t.same(
        [
            extension._matrixDinPin,
            extension._matrixCsPin,
            extension._matrixClkPin
        ],
        [2, 4, 12],
        'rejects D1'
    );

    extension.configureMatrix({
        DIN: '2',
        CS: '20',
        CLK: '12'
    });

    t.same(
        [
            extension._matrixDinPin,
            extension._matrixCsPin,
            extension._matrixClkPin
        ],
        [2, 4, 12],
        'rejects pins above A5'
    );

    extension.configureMatrix({
        DIN: '2.5',
        CS: '4',
        CLK: '12'
    });

    t.same(
        [
            extension._matrixDinPin,
            extension._matrixCsPin,
            extension._matrixClkPin
        ],
        [2, 4, 12],
        'rejects non-integer pins'
    );

    extension.configureMatrix({
        DIN: '2',
        CS: '2',
        CLK: '12'
    });

    t.same(
        [
            extension._matrixDinPin,
            extension._matrixCsPin,
            extension._matrixClkPin
        ],
        [2, 4, 12],
        'rejects repeated pins'
    );

    t.end();
});

test('Displays propagate asynchronous matrix commands from the shared peripheral', async t => {
    const calls = [];

    const peripheral = {
        matrixWrite: (dinPin, csPin, clkPin, rows) => {
            calls.push([
                'write',
                dinPin,
                csPin,
                clkPin,
                rows
            ]);

            return Promise.resolve(calls.length);
        },

        matrixBrightness: (
            dinPin,
            csPin,
            clkPin,
            brightness
        ) => {
            calls.push([
                'brightness',
                dinPin,
                csPin,
                clkPin,
                brightness
            ]);

            return Promise.resolve(calls.length);
        }
    };

    const runtime = {
        getPeripheralExtension: () => peripheral
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    extension.configureMatrix({
        DIN: '2',
        CS: '4',
        CLK: '12'
    });

    t.equal(
        await extension.matrixWrite({
            MATRIX: 'FF000000000000FF'
        }),
        1
    );

    t.equal(
        await extension.matrixClear(),
        2
    );

    t.equal(
        await extension.matrixBrightness({
            BRIGHTNESS: 50
        }),
        3
    );

    t.same(
        calls,
        [
            [
                'write',
                2,
                4,
                12,
                [
                    0xFF,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0xFF
                ]
            ],
            [
                'write',
                2,
                4,
                12,
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            ],
            [
                'brightness',
                2,
                4,
                12,
                50
            ]
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
