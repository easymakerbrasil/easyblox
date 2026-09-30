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

const DEFAULT_PEDAGOGICAL_ERROR_MESSAGE =
    'Há algo para corrigir no programa antes de carregar. Revise os blocos usados e tente novamente.';

const getTechnicalErrorMessage = error => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

const getErrorMessage = error => {
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
            error: getErrorMessage(error)
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
