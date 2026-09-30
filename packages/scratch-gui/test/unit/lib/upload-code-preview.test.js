import {
    generateArduinoUnoUploadPreview,
    generateArduinoUnoUploadRawFiles,
    subscribeToArduinoUnoUploadPreview
} from '../../../src/lib/upload-code-preview';

describe('generateArduinoUnoUploadRawFiles', () => {
    test('returns the exact Arduino build bundle as inspectable files', () => {
        const vm = {
            generateArduinoUnoUploadBuildBundle:
                jest.fn().mockReturnValue({
                    code: 'void setup() {}',
                    supportFiles: [
                        {
                            name: 'EasyBloxRuntime.h',
                            content: '#pragma once\n'
                        },
                        {
                            name: 'EasyBloxRuntime.cpp',
                            content: 'void helper() {}\n'
                        }
                    ]
                })
        };

        const result =
            generateArduinoUnoUploadRawFiles(
                vm,
                'easymaker-test'
            );

        expect(
            vm.generateArduinoUnoUploadBuildBundle
        ).toHaveBeenCalledWith(
            'easymaker-test'
        );

        expect(result).toEqual([
            {
                name: 'EasyBloxUpload.ino',
                content: 'void setup() {}'
            },
            {
                name: 'EasyBloxRuntime.h',
                content: '#pragma once\n'
            },
            {
                name: 'EasyBloxRuntime.cpp',
                content: 'void helper() {}\n'
            }
        ]);
    });
});

describe('generateArduinoUnoUploadPreview', () => {
    test('returns generated Arduino UNO C++ from the VM', () => {
        const vm = {
            generateArduinoUnoUploadCode: jest.fn()
                .mockReturnValue('void setup() {}')
        };

        const result = generateArduinoUnoUploadPreview(
            vm,
            'easymaker-test'
        );

        expect(
            vm.generateArduinoUnoUploadCode
        ).toHaveBeenCalledTimes(1);

        expect(
            vm.generateArduinoUnoUploadCode
        ).toHaveBeenCalledWith(
            'easymaker-test'
        );

        expect(result).toEqual({
            code: 'void setup() {}',
            error: null
        });
    });

    test.each([
        [
            'Repeat count must be Número inteiro',
            'Há algo para corrigir no bloco "repita": a quantidade de repetições precisa ser um número inteiro. ' +
                'Use um valor inteiro ou converta o valor para "número inteiro".'
        ],
        [
            'Wait duration must be numeric',
            'Há algo para corrigir no bloco "espere": o tempo precisa ser um número.'
        ],
        [
            'WaitUntil condition must be Boolean',
            'Há algo para corrigir no bloco "espere até": use uma condição que resulte em verdadeiro ou falso.'
        ],
        [
            'RepeatUntil condition must be Boolean',
            'Há algo para corrigir no bloco "repita até": use uma condição que resulte em verdadeiro ou falso.'
        ],
        [
            'If condition must be Boolean',
            'Há algo para corrigir no bloco "se": use uma condição que resulte em verdadeiro ou falso.'
        ],
        [
            'IfElse condition must be Boolean',
            'Há algo para corrigir no bloco "se/senão": use uma condição que resulte em verdadeiro ou falso.'
        ],
        [
            'Map operands must be numeric',
            'Há algo para corrigir no bloco "mapear": todos os valores usados nele precisam ser números.'
        ],
        [
            'Round operand must be numeric',
            'Há algo para corrigir no bloco "arredondar": ele precisa receber um número.'
        ],
        [
            'Number conversion operand must be numeric',
            'Há algo para corrigir no bloco "converter": ele precisa receber um número antes de fazer a conversão.'
        ]
    ])(
        'returns a pedagogical Upload message for %s',
        (
            technicalMessage,
            pedagogicalMessage
        ) => {
            const vm = {
                generateArduinoUnoUploadCode:
                    jest.fn(() => {
                        throw new Error(
                            technicalMessage
                        );
                    })
            };

            const result =
                generateArduinoUnoUploadPreview(
                    vm
                );

            expect(result).toEqual({
                code: '',
                error:
                    pedagogicalMessage
            });

            expect(result.error)
                .not.toContain(
                    technicalMessage
                );
        }
    );

    test('hides unknown technical Upload errors behind a pedagogical fallback', () => {
        const vm = {
            generateArduinoUnoUploadCode:
                jest.fn(() => {
                    throw new Error(
                        'Unexpected internal validation failure'
                    );
                })
        };

        const result =
            generateArduinoUnoUploadPreview(
                vm
            );

        expect(result).toEqual({
            code: '',
            error:
                'Há algo para corrigir no programa antes de carregar. ' +
                'Revise os blocos usados e tente novamente.'
        });

        expect(result.error)
            .not.toContain(
                'Unexpected internal validation failure'
            );
    });

    test.each([
        [
            'Add operands must be numeric',
            'Há algo para corrigir em uma operação matemática: ' +
                'os valores usados nela precisam ser números.'
        ],
        [
            'And operands must be boolean',
            'Há algo para corrigir em uma operação de condição: ' +
                'use condições que resultem em verdadeiro ou falso.'
        ],
        [
            'Variable counter expects INTEGER but received DECIMAL',
            'Há tipos de valores incompatíveis no programa. ' +
                'Revise o bloco que recebe esse valor e faça a conversão necessária.'
        ],
        [
            'Unsupported numeric conversion target type: TEXT',
            'Há algo para corrigir no bloco "converter": ' +
                'selecione "número inteiro" ou "decimal".'
        ]
    ])(
        'translates dynamic Upload validation message %s',
        (
            technicalMessage,
            pedagogicalMessage
        ) => {
            const vm = {
                generateArduinoUnoUploadCode:
                    jest.fn(() => {
                        throw new Error(
                            technicalMessage
                        );
                    })
            };

            expect(
                generateArduinoUnoUploadPreview(
                    vm
                )
            ).toEqual({
                code: '',
                error:
                    pedagogicalMessage
            });
        }
    );

    test.each([
        [
            'Display GPIO pins cannot be shared',
            'Há um conflito entre os displays: ' +
                'eles estão usando a mesma conexão da placa. ' +
                'Escolha outra porta para um dos displays.'
        ],
        [
            'Display GPIO and I2C cannot use the same pin',
            'Há um conflito entre os displays: ' +
                'eles estão usando a mesma conexão da placa. ' +
                'Escolha outra porta para um dos displays.'
        ],
        [
            'RGB LED and Traffic Light cannot use the same physical connector',
            'Há um conflito entre o LED RGB e o semáforo: ' +
                'os dois estão usando a mesma porta física. ' +
                'Escolha outra porta para um deles.'
        ],
        [
            'Servo and Tone cannot use the same pin',
            'Há um conflito entre o servo e o buzzer: ' +
                'os dois recursos estão usando a mesma conexão da placa. ' +
                'Escolha outra porta para um dos componentes que puder ser movido.'
        ],
        [
            'Ultrasonic and Servo cannot use the same pin',
            'Há um conflito entre o sensor ultrassônico e o servo: ' +
                'os dois recursos estão usando a mesma conexão da placa. ' +
                'Escolha outra porta para um dos componentes que puder ser movido.'
        ],
        [
            'DHT and Joystick CLICK cannot use the same pin',
            'Há um conflito entre o sensor DHT e o botão do joystick: ' +
                'os dois recursos estão usando a mesma conexão da placa. ' +
                'Escolha outra porta para um dos componentes que puder ser movido.'
        ],
        [
            'Tone cannot be used with Motor PWM on the selected pin',
            'Há um conflito entre o buzzer e o controle de velocidade do motor ' +
                'nessa combinação de portas. ' +
                'Escolha outra porta compatível para um dos componentes que puder ser movido.'
        ],
        [
            'Display resource conflict on pin 18',
            'Um display está usando uma conexão da placa que já está ocupada por outro recurso. ' +
                'Escolha outra porta para o componente que puder ser movido.'
        ],
        [
            'Connectivity resource conflict on pin 3',
            'Há um conflito entre o EasyBlox BT e outro componente: ' +
                'os dois estão usando a mesma conexão da placa. ' +
                'Escolha outra porta para o outro componente ou remova um dos recursos.'
        ]
    ])(
        'translates EasyMaker hardware conflict %s',
        (
            technicalMessage,
            pedagogicalMessage
        ) => {
            const vm = {
                generateArduinoUnoUploadCode:
                    jest.fn(() => {
                        throw new Error(
                            technicalMessage
                        );
                    })
            };

            const result =
                generateArduinoUnoUploadPreview(
                    vm,
                    'easymaker'
                );

            expect(result).toEqual({
                code: '',
                error:
                    pedagogicalMessage
            });

            expect(result.error)
                .not.toContain(
                    technicalMessage
                );
        }
    );

    test.each([
        [
            'Display GPIO pins cannot be shared',
            'Há um conflito entre os displays: ' +
                'eles estão usando o mesmo pino. ' +
                'Escolha outros pinos para que os displays não compartilhem a mesma conexão.'
        ],
        [
            'Display GPIO and I2C cannot use the same pin',
            'Há um conflito entre os displays: ' +
                'eles estão usando o mesmo pino. ' +
                'Escolha outros pinos para que os displays não compartilhem a mesma conexão.'
        ],
        [
            'Servo and Tone cannot use the same pin',
            'Há um conflito entre o servo e o buzzer: ' +
                'os dois recursos estão usando o mesmo pino. ' +
                'Escolha outro pino para um deles.'
        ],
        [
            'Servo cannot be used with PWM on the selected pin',
            'Há um conflito entre o servo e uma saída com intensidade ' +
                'nessa combinação de pinos. ' +
                'Escolha outro pino compatível para um deles.'
        ],
        [
            'Display resource conflict on pin 18',
            'Um display está usando o pino A4, que já está ocupado por outro recurso. ' +
                'Escolha outro pino ou remova o recurso em conflito.'
        ],
        [
            'Connectivity resource conflict on pin 3',
            'O EasyBlox BT está usando o pino D3, que já está ocupado por outro recurso. ' +
                'Escolha outro pino para o componente em conflito.'
        ]
    ])(
        'translates Arduino UNO hardware conflict %s',
        (
            technicalMessage,
            pedagogicalMessage
        ) => {
            const vm = {
                generateArduinoUnoUploadCode:
                    jest.fn(() => {
                        throw new Error(
                            technicalMessage
                        );
                    })
            };

            expect(
                generateArduinoUnoUploadPreview(
                    vm,
                    'arduino-uno'
                )
            ).toEqual({
                code: '',
                error:
                    pedagogicalMessage
            });
        }
    );

    test('updates the preview immediately and when the project changes', () => {
        const listeners = {};
        const vm = {
            generateArduinoUnoUploadCode: jest.fn()
                .mockReturnValueOnce('void setup() {}')
                .mockReturnValueOnce('void setup() { digitalWrite(13, HIGH); }'),
            on: jest.fn((event, handler) => {
                listeners[event] = handler;
            }),
            removeListener: jest.fn()
        };
        const onPreview = jest.fn();

        const unsubscribe = subscribeToArduinoUnoUploadPreview(
            vm,
            onPreview
        );

        expect(onPreview).toHaveBeenCalledWith({
            code: 'void setup() {}',
            error: null
        });

        expect(vm.on).toHaveBeenCalledWith(
            'PROJECT_CHANGED',
            expect.any(Function)
        );

        listeners.PROJECT_CHANGED();

        expect(onPreview).toHaveBeenLastCalledWith({
            code: 'void setup() { digitalWrite(13, HIGH); }',
            error: null
        });

        unsubscribe();
    });

    test('removes the project change listener when preview subscription ends', () => {
        const vm = {
            generateArduinoUnoUploadCode: jest.fn()
                .mockReturnValue('void setup() {}'),
            on: jest.fn(),
            removeListener: jest.fn()
        };

        const unsubscribe = subscribeToArduinoUnoUploadPreview(
            vm,
            jest.fn()
        );

        const projectChangedHandler = vm.on.mock.calls.find(
            call => call[0] === 'PROJECT_CHANGED'
        )[1];

        unsubscribe();

        expect(vm.removeListener).toHaveBeenCalledWith(
            'PROJECT_CHANGED',
            projectChangedHandler
        );
    });
});
