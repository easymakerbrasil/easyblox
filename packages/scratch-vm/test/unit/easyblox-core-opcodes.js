const tap =
    require('tap');

const Runtime =
    require('../../src/engine/runtime');

const test =
    tap.test;

test(
    'EasyBlox runtime exposes its registered core opcodes',
    t => {
        const runtime =
            new Runtime();

        const opcodes =
            runtime.getCoreOpcodeIds();

        t.ok(
            Array.isArray(
                opcodes
            ),
            'core opcodes are returned as an array'
        );

        t.ok(
            opcodes.includes(
                'motion_movesteps'
            ),
            'Motion opcode is exposed'
        );

        t.ok(
            opcodes.includes(
                'control_wait'
            ),
            'Control opcode is exposed'
        );

        t.ok(
            opcodes.includes(
                'event_whenflagclicked'
            ),
            'Event hat is exposed'
        );

        t.equal(
            new Set(
                opcodes
            ).size,
            opcodes.length,
            'core opcodes are unique'
        );

        t.same(
            opcodes,
            [
                ...opcodes
            ].sort(),
            'core opcodes are deterministic'
        );

        runtime.quit();

        t.end();
    }
);
