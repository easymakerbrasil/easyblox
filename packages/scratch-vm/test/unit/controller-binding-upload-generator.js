const tap = require('tap');

const ArduinoUnoGenerator =
    require('../../src/upload/arduino-uno-generator');

const UploadTypeValidator =
    require('../../src/upload/upload-type-validator');

const VirtualMachine =
    require('../../src/virtual-machine');

const createButtonIr =
    () => ({
        globals: {
            variables: [],
            lists: []
        },
        procedures: [],
        controllerBindings: [
            {
                componentId:
                    'action-button',
                port:
                    'pressed',
                channel:
                    'C1.7F144E06'
            }
        ],
        setup: [],
        loop: [
            {
                type:
                    'If',
                condition: {
                    type:
                        'ControllerBindingBooleanExpression',
                    componentId:
                        'action-button',
                    port:
                        'pressed'
                },
                body: [
                    {
                        type:
                            'DigitalWrite',
                        pin:
                            12,
                        value:
                            true
                    }
                ]
            }
        ]
    });

tap.test(
    'Controller Binding Boolean expression is a valid Upload Boolean value',
    t => {
        const ir =
            createButtonIr();

        const validator =
            new UploadTypeValidator();

        t.doesNotThrow(
            () =>
                validator.validate(
                    ir
                ),
            'Button binding can be used directly as an If condition'
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO generator maps Button binding to its private runtime index',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch =
            generator.generate(
                createButtonIr()
            );

        t.match(
            sketch,
            /#include "EasyBlox\.h"/,
            'Controller Binding automatically requires the EasyBlox runtime'
        );

        t.match(
            sketch,
            /void\s+setup\s*\(\s*\)\s*\{[\s\S]*?EasyBloxBT\.begin\s*\(\s*\)\s*;/,
            'Controller Binding starts Bluetooth without a student init block'
        );

        t.match(
            sketch,
            /if\s*\(\s*easybloxControllerBindingBoolean\s*\(\s*0\s*\)\s*\)\s*\{/,
            'Button reporter reads binding index zero'
        );

        t.notMatch(
            sketch,
            /C1\.7F144E06/,
            'wire channel remains outside the pedagogical sketch'
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO generator preserves manifest order as private binding indexes',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const ir =
            createButtonIr();

        ir.controllerBindings.unshift({
            componentId:
                'other-button',
            port:
                'pressed',
            channel:
                'C1.11223344'
        });

        const sketch =
            generator.generate(
                ir
            );

        t.match(
            sketch,
            /easybloxControllerBindingBoolean\s*\(\s*1\s*\)/,
            'action-button moves to index one when another manifest entry precedes it'
        );

        t.same(
            generator.getControllerBindingChannels(
                ir
            ),
            [
                'C1.11223344',
                'C1.7F144E06'
            ],
            'support-file channel order matches generated runtime indexes'
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO generator rejects unknown Controller Binding references',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const ir =
            createButtonIr();

        ir.loop[0].condition.componentId =
            'missing-button';

        t.throws(
            () =>
                generator.generate(
                    ir
                ),
            /unknown controller binding/i,
            'program cannot silently read a component absent from the build manifest'
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO generator rejects duplicate Controller Binding manifest identities',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const ir =
            createButtonIr();

        ir.controllerBindings.push({
            componentId:
                'action-button',
            port:
                'pressed',
            channel:
                'C1.AABBCCDD'
        });

        t.throws(
            () =>
                generator.generate(
                    ir
                ),
            /duplicate controller binding/i,
            'one componentId plus port identity maps to only one runtime index'
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO build bundle forwards Controller Binding channels into EasyBloxConfig',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm._getValidatedArduinoUnoUploadIr =
            () =>
                createButtonIr();

        const bundle =
            vm.generateArduinoUnoUploadBuildBundle();

        t.match(
            bundle.code,
            /easybloxControllerBindingBoolean\s*\(\s*0\s*\)/,
            'bundle sketch reads the Button binding'
        );

        const config =
            bundle.supportFiles.find(
                file =>
                    file.name ===
                    'EasyBloxConfig.h'
            );

        t.ok(
            config,
            'bundle contains the EasyBlox runtime config'
        );

        t.match(
            config.content,
            /#define\s+EASYBLOX_CONTROLLER_BINDING_COUNT\s+1/,
            'bundle allocates exactly one binding state slot'
        );

        t.match(
            config.content,
            /"C1\.7F144E06"/,
            'bundle forwards the Button wire channel'
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Controller Binding manifest can be supplied to the VM independently from Scratch blocks',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm.setArduinoUnoControllerBindingManifest([
            {
                componentId:
                    'action-button',
                port:
                    'pressed',
                channel:
                    'C1.7F144E06'
            }
        ]);

        t.same(
            vm._easybloxArduinoUnoControllerBindingManifest,
            [
                {
                    componentId:
                        'action-button',
                    port:
                        'pressed',
                    channel:
                        'C1.7F144E06'
                }
            ],
            'VM keeps the internal build manifest'
        );

        t.end();
    }
);
