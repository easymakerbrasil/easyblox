const test = require('tap').test;

const Variable = require('../../src/engine/variable');

test('Variable exposes optional EasyBlox Upload metadata', t => {
    const scalar = new Variable(
        'score-id',
        'pontuação',
        Variable.SCALAR_TYPE,
        false
    );

    t.equal(
        scalar.easybloxValueType,
        null,
        'scalar starts without an explicit EasyBlox value type'
    );

    t.equal(
        scalar.easybloxListCapacity,
        null,
        'scalar has no list capacity'
    );

    const list = new Variable(
        'samples-id',
        'amostras',
        Variable.LIST_TYPE,
        false
    );

    t.equal(
        list.easybloxValueType,
        null,
        'list starts without an explicit EasyBlox item type'
    );

    t.equal(
        list.easybloxListCapacity,
        null,
        'list starts without an explicit EasyBlox capacity'
    );

    t.end();
});

test('Variable keeps EasyBlox Upload metadata independently from Scratch type', t => {
    const scalar = new Variable(
        'rate-id',
        'taxa',
        Variable.SCALAR_TYPE,
        false
    );

    scalar.easybloxValueType = 'DECIMAL';

    t.equal(scalar.type, Variable.SCALAR_TYPE);
    t.equal(scalar.easybloxValueType, 'DECIMAL');
    t.equal(scalar.easybloxListCapacity, null);

    const list = new Variable(
        'names-id',
        'nomes',
        Variable.LIST_TYPE,
        false
    );

    list.easybloxValueType = 'TEXT';
    list.easybloxListCapacity = 10;

    t.equal(list.type, Variable.LIST_TYPE);
    t.equal(list.easybloxValueType, 'TEXT');
    t.equal(list.easybloxListCapacity, 10);

    t.end();
});
