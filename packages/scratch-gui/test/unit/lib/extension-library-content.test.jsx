import extensionLibraryContent, {
    filterBlocksXMLForActiveBoard,
    filterBlocksXMLForProjectContext,
    getBoardById,
    getVisibleBoards,
    getVisibleExtensions
} from '../../../src/lib/libraries/extensions/index.jsx';

const getExtension = extensionId =>
    extensionLibraryContent.find(item => item.extensionId === extensionId);

describe('EasyBlox extension library classification', () => {
    test('classifies Arduino UNO as a visible board', () => {
        expect(getExtension('arduinoUno')).toMatchObject({
            boardId: 'arduino-uno',
            kind: 'board',
            supportedModes: [
                'stage',
                'upload'
            ],
            capabilities: [
                'bluetoothSerial'
            ],
            visible: true
        });
    });

    test('classifies micro:bit as a visible board', () => {
        expect(getExtension('microbit')).toMatchObject({
            boardId: 'microbit',
            kind: 'board',
            supportedModes: [
                'stage'
            ],
            capabilities: [],
            visible: true
        });
    });

    test('keeps LEGO boards hidden', () => {
        expect(getExtension('ev3')).toMatchObject({
            kind: 'board',
            visible: false
        });

        expect(getExtension('boost')).toMatchObject({
            kind: 'board',
            visible: false
        });

        expect(getExtension('wedo2')).toMatchObject({
            kind: 'board',
            visible: false
        });
    });

    test('classifies actual extensions as visible extensions', () => {
        expect(getExtension('music')).toMatchObject({
            kind: 'extension',
            visible: true
        });

        expect(getExtension('pen')).toMatchObject({
            kind: 'extension',
            visible: true
        });
    });
});

test('exposes only visible extensions to the extension library', () => {
    const extensionIds = getVisibleExtensions()
        .map(item => item.extensionId);

    expect(extensionIds).toContain('music');
    expect(extensionIds).toContain('pen');

    expect(extensionIds).not.toContain('arduinoUno');
    expect(extensionIds).not.toContain('microbit');
    expect(extensionIds).not.toContain('ev3');
    expect(extensionIds).not.toContain('boost');
    expect(extensionIds).not.toContain('wedo2');
});

test('exposes only visible boards to the board selection flow', () => {
    const boardIds = getVisibleBoards()
        .map(item => item.extensionId);

    expect(boardIds).toEqual([
        'arduinoUno',
        'microbit'
    ]);
});

test('resolves a visible board by its board id', () => {
    expect(getBoardById('arduino-uno')).toMatchObject({
        boardId: 'arduino-uno',
        extensionId: 'arduinoUno',
        kind: 'board',
        visible: true
    });

    expect(getBoardById('microbit')).toMatchObject({
        boardId: 'microbit',
        extensionId: 'microbit',
        kind: 'board',
        visible: true
    });
});

test('does not expose hidden or unknown boards by board id', () => {
    expect(getBoardById('ev3')).toBeNull();
    expect(getBoardById('does-not-exist')).toBeNull();
});

test('filters board categories according to the active board', () => {
    const blocksXML = [
        {
            id: 'music',
            xml: '<category id="music"></category>'
        },
        {
            id: 'arduinoUno',
            xml: '<category id="arduinoUno"></category>'
        },
        {
            id: 'microbit',
            xml: '<category id="microbit"></category>'
        },
        {
            id: 'ev3',
            xml: '<category id="ev3"></category>'
        }
    ];

    expect(
        filterBlocksXMLForActiveBoard(blocksXML, 'arduino-uno')
            .map(category => category.id)
    ).toEqual([
        'music',
        'arduinoUno'
    ]);

    expect(
        filterBlocksXMLForActiveBoard(blocksXML, 'microbit')
            .map(category => category.id)
    ).toEqual([
        'music',
        'microbit'
    ]);
});

test('removes all board categories when no board is active', () => {
    const blocksXML = [
        {
            id: 'music',
            xml: '<category id="music"></category>'
        },
        {
            id: 'arduinoUno',
            xml: '<category id="arduinoUno"></category>'
        },
        {
            id: 'microbit',
            xml: '<category id="microbit"></category>'
        }
    ];

    expect(
        filterBlocksXMLForActiveBoard(blocksXML, null)
            .map(category => category.id)
    ).toEqual([
        'music'
    ]);
});

test('filters extension categories according to the active project context', () => {
    const blocksXML = [
        {
            id: 'music',
            xml: '<category id="music"></category>'
        },
        {
            id: 'translate',
            xml: '<category id="translate"></category>'
        },
        {
            id: 'arduinoUno',
            xml: '<category id="arduinoUno"></category>'
        },
        {
            id: 'actuators',
            xml: '<category id="actuators"></category>'
        },
        {
            id: 'sensors',
            xml: '<category id="sensors"></category>'
        },
        {
            id: 'displays',
            xml: '<category id="displays"></category>'
        },
        {
            id: 'microbit',
            xml: '<category id="microbit"></category>'
        }
    ];

    expect(
        filterBlocksXMLForProjectContext(
            blocksXML,
            'arduino-uno',
            ['translate'],
            ['actuators', 'sensors', 'displays']
        ).map(category => category.id)
    ).toEqual([
        'translate',
        'arduinoUno',
        'actuators',
        'sensors',
        'displays'
    ]);
});

test('removes board companions when no board is active', () => {
    const blocksXML = [
        {
            id: 'translate',
            xml: '<category id="translate"></category>'
        },
        {
            id: 'arduinoUno',
            xml: '<category id="arduinoUno"></category>'
        },
        {
            id: 'actuators',
            xml: '<category id="actuators"></category>'
        },
        {
            id: 'sensors',
            xml: '<category id="sensors"></category>'
        },
        {
            id: 'displays',
            xml: '<category id="displays"></category>'
        }
    ];

    expect(
        filterBlocksXMLForProjectContext(
            blocksXML,
            null,
            ['translate'],
            [],
            ['actuators', 'sensors', 'displays']
        ).map(category => category.id)
    ).toEqual([
        'translate'
    ]);
});

test('removes an extension category without affecting other active extensions', () => {
    const blocksXML = [
        {
            id: 'music',
            xml: '<category id="music"></category>'
        },
        {
            id: 'translate',
            xml: '<category id="translate"></category>'
        },
        {
            id: 'pen',
            xml: '<category id="pen"></category>'
        }
    ];

    expect(
        filterBlocksXMLForProjectContext(
            blocksXML,
            null,
            ['music', 'pen']
        ).map(category => category.id)
    ).toEqual([
        'music',
        'pen'
    ]);
});
