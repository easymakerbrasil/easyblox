const getErrorMessage = error => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

export const generateArduinoUnoUploadPreview = vm => {
    try {
        return {
            code: vm.generateArduinoUnoUploadCode(),
            error: null
        };
    } catch (error) {
        return {
            code: '',
            error: getErrorMessage(error)
        };
    }
};

export const subscribeToArduinoUnoUploadPreview = (
    vm,
    onPreview
) => {
    const updatePreview = () => {
        onPreview(
            generateArduinoUnoUploadPreview(vm)
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
