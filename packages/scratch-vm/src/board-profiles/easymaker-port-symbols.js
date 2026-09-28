/**
 * Visual symbols matching the EasyMaker PCB port language.
 *
 * These assets are presentation-only. Stable hardware semantics remain
 * represented by physical port IDs in the EasyMaker product profile.
 */

const svgDataUri = svg =>
    `data:image/svg+xml,${encodeURIComponent(svg)}`;

const createSvg = body => [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
    body,
    '</svg>'
].join('');

const createSymbol = (id, body) => Object.freeze({
    id,
    dataURI: svgDataUri(createSvg(body)),
    width: 32,
    height: 32
});

const EasyMakerPortSymbols = Object.freeze({
    square: createSymbol(
        'square',
        '<rect fill="#fff" x="4" y="4" width="24" height="24"/>'
    ),

    circle: createSymbol(
        'circle',
        '<circle fill="#fff" cx="16" cy="16" r="12"/>'
    ),

    semicircle: createSymbol(
        'semicircle',
        '<path fill="#fff" d="M10 4A12 12 0 0 1 10 28Z"/>'
    ),

    triangle: createSymbol(
        'triangle',
        '<polygon fill="#fff" points="16,3 29,28 3,28"/>'
    ),

    pentagon: createSymbol(
        'pentagon',
        '<polygon fill="#fff" points="16,2 30,12 25,30 7,30 2,12"/>'
    ),

    asterisk: createSymbol(
        'asterisk',
        [
            '<g stroke="#fff" stroke-width="5" stroke-linecap="round">',
            '<line x1="16" y1="3" x2="16" y2="29"/>',
            '<line x1="5" y1="9" x2="27" y2="23"/>',
            '<line x1="27" y1="9" x2="5" y2="23"/>',
            '</g>'
        ].join('')
    ),

    equals: createSymbol(
        'equals',
        [
            '<rect fill="#fff" x="4" y="9" width="24" height="5" rx="2"/>',
            '<rect fill="#fff" x="4" y="18" width="24" height="5" rx="2"/>'
        ].join('')
    ),

    exclamation: createSymbol(
        'exclamation',
        [
            '<rect fill="#fff" x="13" y="3" width="6" height="19" rx="3"/>',
            '<circle fill="#fff" cx="16" cy="27" r="3"/>'
        ].join('')
    ),

    question: createSymbol(
        'question',
        [
            '<path d="M9 10C9 4 23 3 23 11',
            'C23 17 16 16 16 21"',
            ' fill="none" stroke="#fff" stroke-width="5"',
            ' stroke-linecap="round" stroke-linejoin="round"/>',
            '<circle fill="#fff" cx="16" cy="28" r="2.5"/>'
        ].join('')
    ),

    chevrons: createSymbol(
        'chevrons',
        [
            '<polyline points="12,6 4,16 12,26"',
            ' fill="none" stroke="#fff" stroke-width="5"',
            ' stroke-linecap="round" stroke-linejoin="round"/>',
            '<polyline points="20,6 28,16 20,26"',
            ' fill="none" stroke="#fff" stroke-width="5"',
            ' stroke-linecap="round" stroke-linejoin="round"/>'
        ].join('')
    ),

    star: createSymbol(
        'star',
        [
            '<polygon fill="#fff" points="',
            '16,2 19.5,11.2 29,11.5 21.5,17.5 24.2,27 ',
            '16,21.5 7.8,27 10.5,17.5 3,11.5 12.5,11.2',
            '"/>'
        ].join('')
    )
});

module.exports = EasyMakerPortSymbols;
