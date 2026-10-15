const {test} = require('tap');
const getProductProfile = require('../../src/board-profiles/get-product-profile');
const JrProfile = require('../../src/board-profiles/easyduino-jr-product-profile');
const EasyMakerProfile = require('../../src/board-profiles/easymaker-product-profile');

test('Product profile resolution returns the original physical contracts without mutation', t => {
    const before = [JSON.stringify(JrProfile), JSON.stringify(EasyMakerProfile)];
    t.equal(getProductProfile('easyduino-jr'), JrProfile);
    t.equal(getProductProfile('easymaker'), EasyMakerProfile);
    for (const boardId of ['arduino-uno', 'easyduino-proto', 'unknown', 'toString', null]) {
        t.equal(getProductProfile(boardId), null, `${boardId} retains generic behavior`);
    }
    t.equal(getProductProfile(), null);
    t.same([JSON.stringify(JrProfile), JSON.stringify(EasyMakerProfile)], before);
    t.same(getProductProfile('easyduino-jr').capabilities, []);
    t.ok(Object.isFrozen(getProductProfile('easyduino-jr')));
    t.ok(Object.isFrozen(getProductProfile('easymaker')));
    t.end();
});
