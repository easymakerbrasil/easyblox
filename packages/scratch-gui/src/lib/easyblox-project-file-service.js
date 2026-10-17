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
    downloadBlob,
    onFileAssociated = () => {},
    getProjectRevision = () => null,
    onSaveConfirmed = () => {}
}) => {
    let fileHandle = null;
    let pendingOperation = null;
    let projectGeneration = 0;

    const runSaveOperation = (kind, operation) => {
        if (pendingOperation) {
            if (pendingOperation.kind === kind) {
                return pendingOperation.promise;
            }

            return Promise.reject(
                new Error('Another EasyBlox save operation is in progress')
            );
        }

        let result;

        try {
            result = operation();
        } catch (error) {
            return Promise.reject(error);
        }

        const promise = Promise.resolve(result);

        pendingOperation = {
            kind,
            promise
        };

        const clearPending = () => {
            if (
                pendingOperation &&
                pendingOperation.promise === promise
            ) {
                pendingOperation = null;
            }
        };

        promise.then(clearPending, clearPending);

        return promise;
    };

    const downloadProjectCopy = async () => {
        const content = await saveProjectSb3();
        downloadBlob(getProjectFilename(), content);
        return 'downloaded';
    };

    const saveAsInternal = async () => {
        const operationGeneration = projectGeneration;

        if (typeof showSaveFilePicker !== 'function') {
            return downloadProjectCopy();
        }

        let selectedHandle;

        try {
            selectedHandle = await showSaveFilePicker(
                createSavePickerOptions(getProjectFilename())
            );
        } catch (error) {
            if (isAbortError(error)) {
                return 'cancelled';
            }
            throw error;
        }

        if (operationGeneration !== projectGeneration) {
            return 'cancelled';
        }

        const serializedRevision = getProjectRevision();
        const content = await saveProjectSb3();

        if (operationGeneration !== projectGeneration) {
            return 'cancelled';
        }

        await writeProjectToHandle(selectedHandle, content);

        if (operationGeneration !== projectGeneration) {
            return 'cancelled';
        }

        fileHandle = selectedHandle;

        if (
            selectedHandle &&
            typeof selectedHandle.name ===
                'string' &&
            selectedHandle.name.length > 0
        ) {
            onFileAssociated(
                selectedHandle.name
            );
        }

        onSaveConfirmed(serializedRevision);

        return 'saved';
    };

    const saveInternal = async () => {
        const operationGeneration = projectGeneration;
        const associatedHandle = fileHandle;

        if (!associatedHandle) {
            return saveAsInternal();
        }

        const serializedRevision = getProjectRevision();
        const content = await saveProjectSb3();

        if (operationGeneration !== projectGeneration) {
            return 'cancelled';
        }

        await writeProjectToHandle(associatedHandle, content);

        if (operationGeneration !== projectGeneration) {
            return 'cancelled';
        }

        onSaveConfirmed(serializedRevision);

        return 'saved';
    };

    const save = () => runSaveOperation(
        'save',
        saveInternal
    );

    const saveAs = () => runSaveOperation(
        'saveAs',
        saveAsInternal
    );

    const clearFileHandle = () => {
        projectGeneration += 1;
        fileHandle = null;
        pendingOperation = null;
    };

    return {
        clearFileHandle,
        save,
        saveAs
    };
};

export default createEasyBloxProjectFileService;
