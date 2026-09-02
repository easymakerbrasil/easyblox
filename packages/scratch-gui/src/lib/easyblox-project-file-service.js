const SB3_MIME_TYPE = 'application/x.scratch.sb3';

const isAbortError = error => (
    error &&
    error.name === 'AbortError'
);

const createSavePickerOptions = suggestedName => ({
    suggestedName,
    types: [
        {
            description: 'Projeto EasyBlox',
            accept: {
                [SB3_MIME_TYPE]: ['.sb3']
            }
        }
    ]
});

const writeProjectToHandle = async (handle, content) => {
    const writable = await handle.createWritable();

    try {
        await writable.write(content);
        await writable.close();
    } catch (error) {
        if (typeof writable.abort === 'function') {
            await writable.abort();
        }
        throw error;
    }
};

const createEasyBloxProjectFileService = ({
    showSaveFilePicker,
    saveProjectSb3,
    getProjectFilename,
    downloadBlob
}) => {
    let fileHandle = null;

    const downloadProjectCopy = async () => {
        const content = await saveProjectSb3();
        downloadBlob(getProjectFilename(), content);
    };

    const saveAs = async () => {
        if (typeof showSaveFilePicker !== 'function') {
            await downloadProjectCopy();
            return;
        }

        let selectedHandle;

        try {
            selectedHandle = await showSaveFilePicker(
                createSavePickerOptions(getProjectFilename())
            );
        } catch (error) {
            if (isAbortError(error)) {
                return;
            }
            throw error;
        }

        const content = await saveProjectSb3();
        await writeProjectToHandle(selectedHandle, content);

        fileHandle = selectedHandle;
    };

    const save = async () => {
        if (!fileHandle) {
            await saveAs();
            return;
        }

        const content = await saveProjectSb3();
        await writeProjectToHandle(fileHandle, content);
    };

    const clearFileHandle = () => {
        fileHandle = null;
    };

    return {
        clearFileHandle,
        save,
        saveAs
    };
};

export default createEasyBloxProjectFileService;
