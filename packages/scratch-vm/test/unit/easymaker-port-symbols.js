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
