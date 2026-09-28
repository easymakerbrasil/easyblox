const getErrorMessage = error => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
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
