/**
 * Visual symbols matching the EasyMaker PCB port language.
 *
 * These assets are presentation-only. Stable hardware semantics remain
 * represented by physical port IDs in the EasyMaker product profile.
 */

const svgDataUri = svg =>
    `data:image/svg+xml,${encodeURIComponent(svg)}`;

const pentagonSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
    '<polygon fill="#fff" points="16,2 30,12 25,30 7,30 2,12"/>',
    '</svg>'
].join('');

const EasyMakerPortSymbols = Object.freeze({
    pentagon: Object.freeze({
        id: 'pentagon',
        dataURI: svgDataUri(pentagonSvg),
        width: 32,
        height: 32
    })
});

module.exports = EasyMakerPortSymbols;
