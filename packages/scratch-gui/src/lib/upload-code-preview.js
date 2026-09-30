const PEDAGOGICAL_ERROR_MESSAGES = Object.freeze({
    'Repeat count must be Número inteiro':
        'Há algo para corrigir no bloco "repita": a quantidade de repetições precisa ser um número inteiro. ' +
        'Use um valor inteiro ou converta o valor para "número inteiro".',

    'Wait duration must be numeric':
        'Há algo para corrigir no bloco "espere": o tempo precisa ser um número.',

    'WaitUntil condition must be Boolean':
        'Há algo para corrigir no bloco "espere até": use uma condição que resulte em verdadeiro ou falso.',

    'RepeatUntil condition must be Boolean':
        'Há algo para corrigir no bloco "repita até": use uma condição que resulte em verdadeiro ou falso.',

    'If condition must be Boolean':
        'Há algo para corrigir no bloco "se": use uma condição que resulte em verdadeiro ou falso.',

    'IfElse condition must be Boolean':
        'Há algo para corrigir no bloco "se/senão": use uma condição que resulte em verdadeiro ou falso.',

    'Map operands must be numeric':
        'Há algo para corrigir no bloco "mapear": todos os valores usados nele precisam ser números.',

    'Not operand must be boolean':
        'Há algo para corrigir no bloco "não": ele precisa receber uma condição que resulte em verdadeiro ou falso.',

    'Round operand must be numeric':
        'Há algo para corrigir no bloco "arredondar": ele precisa receber um número.',

    'MathOp operand must be numeric':
        'Há algo para corrigir no bloco matemático: ele precisa receber um número.',

    'LetterOf index must be numeric':
        'Há algo para corrigir no bloco de letra: a posição informada precisa ser um número.',

    'Number conversion operand must be numeric':
        'Há algo para corrigir no bloco "converter": ele precisa receber um número antes de fazer a conversão.'
});

const HARDWARE_RESOURCE_LABELS =
    Object.freeze({
        'Motor': 'o motor',
        'Servo': 'o servo',
        'Tone': 'o buzzer',
        'Relay': 'o relé',
        'Ultrasonic':
            'o sensor ultrassônico',
        'DHT':
            'o sensor DHT',
        'Joystick CLICK':
            'o botão do joystick',
        'Joystick':
            'o joystick',
        'DigitalRead':
            'um sensor digital',
        'AnalogRead':
            'um sensor analógico',
        'DigitalWrite':
            'uma saída digital',
        'PWM':
            'uma saída com intensidade',
        'Motor PWM':
            'o controle de velocidade do motor'
    });

const getHardwareResourceLabel =
    resource =>
        HARDWARE_RESOURCE_LABELS[
            resource
        ] || null;

const getArduinoPinLabel =
    pin => {
        if (
            pin >= 14 &&
            pin <= 19
        ) {
            return `A${pin - 14}`;
        }

        return `D${pin}`;
    };

const getHardwareConflictMessage = (
    message,
    boardId
) => {
    const useEasyMakerSurface =
        boardId === 'easymaker';

    if (
        message ===
        'RGB LED and Traffic Light cannot use the same physical connector'
    ) {
        return (
            'Há um conflito entre o LED RGB e o semáforo: ' +
            'os dois estão usando a mesma porta física. ' +
            'Escolha outra porta para um deles.'
        );
    }

    const samePinMatch =
        message.match(
            /^(.+) and (.+) cannot use the same pin$/
        );

    if (samePinMatch) {
        const firstResource =
            getHardwareResourceLabel(
                samePinMatch[1]
            );

        const secondResource =
            getHardwareResourceLabel(
                samePinMatch[2]
            );

        if (
            firstResource &&
            secondResource
        ) {
            if (useEasyMakerSurface) {
                return (
                    `Há um conflito entre ${firstResource} e ${secondResource}: ` +
                    'os dois recursos estão usando a mesma conexão da placa. ' +
                    'Escolha outra porta para um dos componentes que puder ser movido.'
                );
            }

            return (
                `Há um conflito entre ${firstResource} e ${secondResource}: ` +
                'os dois recursos estão usando o mesmo pino. ' +
                'Escolha outro pino para um deles.'
            );
        }
    }

    const selectedPinMatch =
        message.match(
            /^(.+) cannot be used with (.+) on the selected pin$/
        );

    if (selectedPinMatch) {
        const firstResource =
            getHardwareResourceLabel(
                selectedPinMatch[1]
            );

        const secondResource =
            getHardwareResourceLabel(
                selectedPinMatch[2]
            );

        if (
            firstResource &&
            secondResource
        ) {
            if (useEasyMakerSurface) {
                return (
                    `Há um conflito entre ${firstResource} e ${secondResource} ` +
                    'nessa combinação de portas. ' +
                    'Escolha outra porta compatível para um dos componentes que puder ser movido.'
                );
            }

            return (
                `Há um conflito entre ${firstResource} e ${secondResource} ` +
                'nessa combinação de pinos. ' +
                'Escolha outro pino compatível para um deles.'
            );
        }
    }

    const displayConflictMatch =
        message.match(
            /^Display resource conflict on pin (\d+)$/
        );

    if (displayConflictMatch) {
        if (useEasyMakerSurface) {
            return (
                'Um display está usando uma conexão da placa que já está ocupada por outro recurso. ' +
                'Escolha outra porta para o componente que puder ser movido.'
            );
        }

        const pin =
            getArduinoPinLabel(
                Number(
                    displayConflictMatch[1]
                )
            );

        return (
            `Um display está usando o pino ${pin}, que já está ocupado por outro recurso. ` +
            'Escolha outro pino ou remova o recurso em conflito.'
        );
    }

    const connectivityConflictMatch =
        message.match(
            /^Connectivity resource conflict on pin (\d+)$/
        );

    if (connectivityConflictMatch) {
        if (useEasyMakerSurface) {
            return (
                'Há um conflito entre o EasyBlox BT e outro componente: ' +
                'os dois estão usando a mesma conexão da placa. ' +
                'Escolha outra porta para o outro componente ou remova um dos recursos.'
            );
        }

        const pin =
            getArduinoPinLabel(
                Number(
                    connectivityConflictMatch[1]
                )
            );

        return (
            `O EasyBlox BT está usando o pino ${pin}, que já está ocupado por outro recurso. ` +
            'Escolha outro pino para o componente em conflito.'
        );
    }

    return null;
};

const DEFAULT_PEDAGOGICAL_ERROR_MESSAGE =
    'Há algo para corrigir no programa antes de carregar. Revise os blocos usados e tente novamente.';

const getTechnicalErrorMessage = error => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

const getErrorMessage = (
    error,
    boardId = 'arduino-uno'
) => {
    const message =
        getTechnicalErrorMessage(error);

    if (
        Object.prototype.hasOwnProperty.call(
            PEDAGOGICAL_ERROR_MESSAGES,
            message
        )
    ) {
        return PEDAGOGICAL_ERROR_MESSAGES[
            message
        ];
    }

    const hardwareConflictMessage =
        getHardwareConflictMessage(
            message,
            boardId
        );

    if (hardwareConflictMessage) {
        return hardwareConflictMessage;
    }

    if (
        message.startsWith(
            'Unsupported numeric conversion target type:'
        )
    ) {
        return (
            'Há algo para corrigir no bloco "converter": ' +
            'selecione "número inteiro" ou "decimal".'
        );
    }

    if (
        / operands must be numeric$/.test(
            message
        )
    ) {
        return (
            'Há algo para corrigir em uma operação matemática: ' +
            'os valores usados nela precisam ser números.'
        );
    }

    if (
        / operands must be boolean$/.test(
            message
        )
    ) {
        return (
            'Há algo para corrigir em uma operação de condição: ' +
            'use condições que resultem em verdadeiro ou falso.'
        );
    }

    if (
        / expects (INTEGER|DECIMAL|TEXT|BOOLEAN) but received /.test(
            message
        )
    ) {
        return (
            'Há tipos de valores incompatíveis no programa. ' +
            'Revise o bloco que recebe esse valor e faça a conversão necessária.'
        );
    }

    return DEFAULT_PEDAGOGICAL_ERROR_MESSAGE;
};

export const generateArduinoUnoUploadPreview = (
    vm,
    boardId = 'arduino-uno'
) => {
    try {
        return {
            code: vm.generateArduinoUnoUploadCode(
                boardId
            ),
            error: null
        };
    } catch (error) {
        return {
            code: '',
            error:
                getErrorMessage(
                    error,
                    boardId
                )
        };
    }
};

export const generateArduinoUnoUploadRawFiles = (
    vm,
    boardId = 'arduino-uno'
) => {
    const buildBundle =
        vm.generateArduinoUnoUploadBuildBundle(
            boardId
        );

    const supportFiles =
        Array.isArray(
            buildBundle.supportFiles
        ) ?
            buildBundle.supportFiles :
            [];

    return [
        {
            name: 'EasyBloxUpload.ino',
            content: buildBundle.code
        },
        ...supportFiles.map(file => ({
            name: file.name,
            content: file.content
        }))
    ];
};

export const subscribeToArduinoUnoUploadPreview = (
    vm,
    onPreview,
    boardId = 'arduino-uno'
) => {
    const updatePreview = () => {
        onPreview(
            generateArduinoUnoUploadPreview(
                vm,
                boardId
            )
        );
    };

    updatePreview();

    vm.on('PROJECT_CHANGED', updatePreview);

    return () => {
        vm.removeListener(
            'PROJECT_CHANGED',
            updatePreview
        );
    };
};
