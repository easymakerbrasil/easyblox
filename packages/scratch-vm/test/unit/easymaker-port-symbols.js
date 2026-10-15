const test = require('tap').test;

const EasyMakerPortSymbols =
    require('../../src/board-profiles/easymaker-port-symbols');

const EXPECTED_SYMBOL_IDS = [
    'square',
    'circle',
    'semicircle',
    'triangle',
    'pentagon',
    'asterisk',
    'equals',
    'exclamation',
    'question',
    'chevrons',
    'star'
];

test('EasyMaker dropdown presentation is isolated across all symbol consumers', t => {
    const extensions = {
        actuators: require('../../src/extensions/scratch3_actuators'),
        sensors: require('../../src/extensions/scratch3_sensors'),
        displays: require('../../src/extensions/scratch3_displays'),
        arduinoUno: require('../../src/extensions/scratch3_arduino_uno')
    };
    const menus = {
        actuators: ['easyMakerDigitalPorts', 'easyMakerLedPorts',
            'easyMakerBuzzerPorts', 'easyMakerTrafficLightPorts'],
        sensors: ['easyMakerDigitalSensorPorts', 'easyMakerAnalogSensorPorts',
            'easyMakerUltrasonicPorts', 'easyMakerDhtPorts'],
        displays: ['easyMakerTm1637Ports'],
        arduinoUno: ['easyMakerBuzzerPorts']
    };
    const Runtime = require('../../src/engine/runtime');
    const runtime = new Runtime();
    runtime.registerPeripheralExtension('arduinoUno', {});
    t.teardown(() => runtime.dispose());
    for (const [name, Extension] of Object.entries(extensions)) {
        runtime.setEasyBloxSelectedBoardId('arduino-uno');
        const extension = new Extension(runtime);
        const original = extension.getInfo();
        for (const boardId of ['easymaker', 'easyduino-jr', 'arduino-uno', 'easyduino-proto',
            'easymaker-connection', 'easyduino-connection', 'easymaker']) {
            runtime.setEasyBloxSelectedBoardId(boardId);
            const info = extension.getInfo();
            const size = boardId === 'easymaker' ? 24 : 32;
            for (const menu of menus[name]) {
                t.same(info.menus[menu], {
                    ...original.menus[menu],
                    items: original.menus[menu].items.map(item => ({
                        ...item,
                        text: {...item.text, width: size, height: size}
                    }))
                }, `${boardId}/${name}/${menu}: only presentation dimensions change`);
            }
            for (const block of info.blocks) {
                for (const argument of Object.values(block.arguments || {})) {
                    if (argument.type === 'image') {
                        t.same([argument.width, argument.height], [32, 32],
                            `${boardId}/${name}/${block.opcode}: fixed image remains canonical`);
                    }
                }
            }
        }
    }
    t.end();
});

test('EasyMaker port symbol registry exposes the canonical PCB symbols', t => {
    t.same(
        Object.keys(EasyMakerPortSymbols),
        EXPECTED_SYMBOL_IDS
    );

    EXPECTED_SYMBOL_IDS.forEach(symbolId => {
        const symbol =
            EasyMakerPortSymbols[symbolId];

        t.equal(
            symbol.id,
            symbolId,
            `${symbolId} keeps its canonical symbol ID`
        );

        t.match(
            symbol.dataURI,
            /^data:image\/svg\+xml,/,
            `${symbolId} uses an SVG data URI`
        );

        t.equal(
            symbol.width,
            32,
            `${symbolId} uses the canonical visual width`
        );

        t.equal(
            symbol.height,
            32,
            `${symbolId} uses the canonical visual height`
        );

        const decodedSvg =
            decodeURIComponent(
                symbol.dataURI.split(',')[1]
            );

        t.match(
            decodedSvg,
            /#fff/,
            `${symbolId} is rendered in white`
        );
    });

    t.end();
});
