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
    test('classifies the Arduino UNO backing extension as a board category', () => {
        expect(getExtension('arduinoUno')).toMatchObject({
            extensionId: 'arduinoUno',
            kind: 'board',
            visible: true
        });
    });

    test('keeps the micro:bit backing extension hidden from the product surface', () => {
        expect(getExtension('microbit')).toMatchObject({
            extensionId: 'microbit',
            kind: 'board',
            visible: false
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

    test('keeps non-EasyMaker extensions hidden from the product surface', () => {
        expect(getExtension('gdxfor')).toMatchObject({
            extensionId: 'gdxfor',
            kind: 'extension',
            visible: false
        });

        expect(getExtension('makeymakey')).toMatchObject({
            extensionId: 'makeymakey',
            kind: 'extension',
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
    expect(extensionIds).not.toContain('gdxfor');
    expect(extensionIds).not.toContain('makeymakey');
    expect(extensionIds).not.toContain('ev3');
    expect(extensionIds).not.toContain('boost');
    expect(extensionIds).not.toContain('wedo2');
});

test('exposes EasyBlox product boards to the board selection flow', () => {
    const boardIds = getVisibleBoards()
        .map(item => item.boardId);

    expect(boardIds).toEqual([
        'arduino-uno',
        'easymaker',
        'easymaker-connection',
        'easyduino-proto',
        'easyduino-jr'
    ]);
});

test('marks launch-ready boards as available and future boards as coming soon', () => {
    expect(
        getBoardById(
            'arduino-uno'
        )
    ).toMatchObject({
        releaseState:
            'available'
    });

    expect(
        getBoardById(
            'easymaker'
        )
    ).toMatchObject({
        releaseState:
            'available'
    });

    expect(
        getBoardById(
            'easymaker-connection'
        )
    ).toMatchObject({
        releaseState:
            'coming-soon'
    });

    expect(
        getBoardById(
            'easyduino-proto'
        )
    ).toMatchObject({
        releaseState:
            'coming-soon'
    });

    expect(
        getBoardById(
            'easyduino-jr'
        )
    ).toMatchObject({
        releaseState:
            'coming-soon'
    });
});

test('resolves canonical board profiles regardless of surface visibility', () => {
    expect(getBoardById('arduino-uno')).toMatchObject({
        name: 'Arduino UNO',
        boardId: 'arduino-uno',
        targetBoardId: 'arduino-uno',
        extensionId: 'arduinoUno',
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

    expect(getBoardById('easymaker')).toMatchObject({
        name: 'EasyMaker',
        boardId: 'easymaker',
        targetBoardId: 'arduino-uno',
        extensionId: 'arduinoUno',
        capabilities: [
            'bluetoothSerial'
        ],
        visible: true
    });

    expect(getBoardById('easymaker-connection')).toMatchObject({
        name: 'EasyMaker Connection',
        boardId: 'easymaker-connection',
        targetBoardId: 'arduino-uno',
        extensionId: 'arduinoUno',
        capabilities: [
            'bluetoothSerial',
            'wifi'
        ],
        visible: true
    });

    expect(getBoardById('easyduino-proto')).toMatchObject({
        name: 'EasyDuino Proto',
        boardId: 'easyduino-proto',
        targetBoardId: 'arduino-uno',
        extensionId: 'arduinoUno',
        capabilities: [
            'bluetoothSerial'
        ],
        visible: true
    });

    expect(getBoardById('easyduino-jr')).toMatchObject({
        name: 'EasyDuino Jr',
        boardId: 'easyduino-jr',
        targetBoardId: 'arduino-uno',
        extensionId: 'arduinoUno',
        capabilities: [],
        visible: true
    });

    expect(getBoardById('microbit')).toMatchObject({
        name: 'micro:bit',
        boardId: 'microbit',
        extensionId: 'microbit',
        kind: 'board',
        capabilities: [],
        visible: false
    });
    expect(getBoardById('easymaker').iconURL).toBeTruthy();
    expect(getBoardById('easymaker-connection').iconURL).toBeTruthy();
    expect(getBoardById('easyduino-proto').iconURL).toBeTruthy();
    expect(getBoardById('easyduino-jr').iconURL).toBeTruthy();
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
        filterBlocksXMLForActiveBoard(blocksXML, 'easymaker')
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

    expect(
        filterBlocksXMLForProjectContext(
            blocksXML,
            'easymaker',
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
