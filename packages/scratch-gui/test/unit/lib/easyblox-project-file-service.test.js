import createEasyBloxProjectFileService from '../../../src/lib/easyblox-project-file-service';

const createWritableHandle = (
    name = 'Meu Projeto.sb3'
) => {
    const writable = {
        write: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue()
    };

    const handle = {
        name,
        createWritable: jest.fn().mockResolvedValue(writable)
    };

    return {
        handle,
        writable
    };
};

const createService = ({
    showSaveFilePicker,
    saveProjectSb3 = jest.fn(),
    getProjectFilename = jest.fn(() => 'Meu Projeto.sb3'),
    downloadBlob = jest.fn(),
    onFileAssociated = jest.fn()
} = {}) => ({
    service: createEasyBloxProjectFileService({
        showSaveFilePicker,
        saveProjectSb3,
        getProjectFilename,
        downloadBlob,
        onFileAssociated
    }),
    saveProjectSb3,
    getProjectFilename,
    downloadBlob,
    onFileAssociated
});

describe('EasyBlox project file service', () => {
    test('Save without a handle performs Save As and then reuses the selected handle', async () => {
        const blob = new Blob(['project'], {
            type: 'application/x.scratch.sb3'
        });
        const {handle, writable} = createWritableHandle();
        const showSaveFilePicker = jest.fn().mockResolvedValue(handle);

        const {
            service,
            saveProjectSb3,
            getProjectFilename,
            downloadBlob
        } = createService({
            showSaveFilePicker,
            saveProjectSb3: jest.fn().mockResolvedValue(blob)
        });

        await expect(service.save()).resolves.toBe('saved');

        expect(getProjectFilename).toHaveBeenCalledTimes(1);
        expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(showSaveFilePicker).toHaveBeenCalledWith(expect.objectContaining({
            suggestedName: 'Meu Projeto.sb3',
            types: expect.arrayContaining([
                expect.objectContaining({
                    accept: {
                        'application/x.scratch.sb3': ['.sb3']
                    }
                })
            ])
        }));

        // The native picker must be opened from the user-triggered flow
        // before asynchronous SB3 generation begins.
        expect(showSaveFilePicker.mock.invocationCallOrder[0])
            .toBeLessThan(saveProjectSb3.mock.invocationCallOrder[0]);

        expect(saveProjectSb3).toHaveBeenCalledTimes(1);
        expect(handle.createWritable).toHaveBeenCalledTimes(1);
        expect(writable.write).toHaveBeenCalledWith(blob);
        expect(writable.close).toHaveBeenCalledTimes(1);
        expect(downloadBlob).not.toHaveBeenCalled();

        await expect(service.save()).resolves.toBe('saved');

        expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(saveProjectSb3).toHaveBeenCalledTimes(2);
        expect(handle.createWritable).toHaveBeenCalledTimes(2);
        expect(writable.write).toHaveBeenCalledTimes(2);
        expect(writable.close).toHaveBeenCalledTimes(2);
        expect(downloadBlob).not.toHaveBeenCalled();
    });

    test('Save As selects a new handle and subsequent Save uses the new handle', async () => {
        const blob = new Blob(['project']);
        const first = createWritableHandle();
        const second = createWritableHandle();

        const showSaveFilePicker = jest.fn()
            .mockResolvedValueOnce(first.handle)
            .mockResolvedValueOnce(second.handle);

        const {service} = createService({
            showSaveFilePicker,
            saveProjectSb3: jest.fn().mockResolvedValue(blob)
        });

        await expect(service.save()).resolves.toBe('saved');
        await expect(service.saveAs()).resolves.toBe('saved');
        await expect(service.save()).resolves.toBe('saved');

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);

        expect(first.handle.createWritable).toHaveBeenCalledTimes(1);
        expect(first.writable.write).toHaveBeenCalledTimes(1);
        expect(first.writable.close).toHaveBeenCalledTimes(1);

        expect(second.handle.createWritable).toHaveBeenCalledTimes(2);
        expect(second.writable.write).toHaveBeenCalledTimes(2);
        expect(second.writable.close).toHaveBeenCalledTimes(2);
    });

    test('reports the selected filename after associating a local project file', async () => {
        const blob =
            new Blob([
                'project'
            ]);

        const {
            handle
        } =
            createWritableHandle(
                'TesteQR-final3.sb3'
            );

        const onFileAssociated =
            jest.fn();

        const {
            service
        } =
            createService({
                showSaveFilePicker:
                    jest.fn()
                        .mockResolvedValue(
                            handle
                        ),
                saveProjectSb3:
                    jest.fn()
                        .mockResolvedValue(
                            blob
                        ),
                onFileAssociated
            });

        await service.saveAs();

        expect(
            onFileAssociated
        ).toHaveBeenCalledTimes(
            1
        );

        expect(
            onFileAssociated
        ).toHaveBeenCalledWith(
            'TesteQR-final3.sb3'
        );
    });

    test('falls back to downloading a copy when File System Access API is unavailable', async () => {
        const blob = new Blob(['project']);
        const {
            service,
            saveProjectSb3,
            downloadBlob
        } = createService({
            saveProjectSb3: jest.fn().mockResolvedValue(blob)
        });

        await expect(service.save()).resolves.toBe('downloaded');
        await expect(service.save()).resolves.toBe('downloaded');

        expect(saveProjectSb3).toHaveBeenCalledTimes(2);
        expect(downloadBlob).toHaveBeenCalledTimes(2);
        expect(downloadBlob).toHaveBeenNthCalledWith(
            1,
            'Meu Projeto.sb3',
            blob
        );
        expect(downloadBlob).toHaveBeenNthCalledWith(
            2,
            'Meu Projeto.sb3',
            blob
        );
    });

    test('reports cancellation from Save As without generating a project', async () => {
        const abortError = new DOMException(
            'The user aborted the request.',
            'AbortError'
        );
        const showSaveFilePicker = jest.fn().mockRejectedValue(abortError);

        const {
            service,
            saveProjectSb3,
            downloadBlob
        } = createService({
            showSaveFilePicker
        });

        await expect(service.save()).resolves.toBe('cancelled');

        expect(saveProjectSb3).not.toHaveBeenCalled();
        expect(downloadBlob).not.toHaveBeenCalled();
    });

    test('clears the associated handle when project ownership changes', async () => {
        const blob = new Blob(['project']);
        const first = createWritableHandle();
        const second = createWritableHandle();

        const showSaveFilePicker = jest.fn()
            .mockResolvedValueOnce(first.handle)
            .mockResolvedValueOnce(second.handle);

        const {service} = createService({
            showSaveFilePicker,
            saveProjectSb3: jest.fn().mockResolvedValue(blob)
        });

        await service.save();

        service.clearFileHandle();

        await service.save();

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);

        expect(first.handle.createWritable).toHaveBeenCalledTimes(1);
        expect(second.handle.createWritable).toHaveBeenCalledTimes(1);
    });

        test('cancelled Save As preserves the previously associated file', async () => {
        const blob = new Blob(['project']);
        const original = createWritableHandle('Original.sb3');

        const abortError = new DOMException(
            'The user aborted the request.',
            'AbortError'
        );

        const showSaveFilePicker = jest.fn()
            .mockResolvedValueOnce(original.handle)
            .mockRejectedValueOnce(abortError);

        const {service, onFileAssociated} = createService({
            showSaveFilePicker,
            saveProjectSb3: jest.fn().mockResolvedValue(blob)
        });

        await expect(service.save()).resolves.toBe('saved');

        await expect(service.saveAs()).resolves.toBe('cancelled');

        await expect(service.save()).resolves.toBe('saved');

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(original.handle.createWritable).toHaveBeenCalledTimes(2);
        expect(original.writable.write).toHaveBeenCalledTimes(2);
        expect(onFileAssociated).toHaveBeenCalledTimes(1);
        expect(onFileAssociated).toHaveBeenCalledWith('Original.sb3');
    });

    test('propagates write failures without associating the selected file', async () => {
        const failure = new Error('Disk write failed');
        const blob = new Blob(['project']);
        const {handle, writable} = createWritableHandle();

        writable.write.mockRejectedValue(failure);
        writable.abort = jest.fn().mockResolvedValue();

        const onFileAssociated = jest.fn();
        const showSaveFilePicker = jest.fn().mockResolvedValue(handle);

        const {service} = createService({
            showSaveFilePicker,
            saveProjectSb3: jest.fn().mockResolvedValue(blob),
            onFileAssociated
        });

        await expect(service.save()).rejects.toBe(failure);

        expect(writable.abort).toHaveBeenCalledTimes(1);
        expect(onFileAssociated).not.toHaveBeenCalled();

        await expect(service.save()).rejects.toBe(failure);

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
    });

    test('propagates non-AbortError failures', async () => {
        const failure = new Error('Save picker failed');
        const showSaveFilePicker = jest.fn().mockRejectedValue(failure);

        const {service} = createService({
            showSaveFilePicker
        });

        await expect(service.save()).rejects.toBe(failure);
    });

    test('concurrent Save requests share one pending operation', async () => {
        const blob = new Blob(['project']);
        const {handle, writable} = createWritableHandle();

        const showSaveFilePicker = jest.fn().mockResolvedValue(handle);
        const saveProjectSb3 = jest.fn().mockResolvedValue(blob);

        const {service} = createService({
            showSaveFilePicker,
            saveProjectSb3
        });

        const firstSave = service.save();
        const secondSave = service.save();

        await expect(
            Promise.all([firstSave, secondSave])
        ).resolves.toEqual(['saved', 'saved']);

        expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(saveProjectSb3).toHaveBeenCalledTimes(1);
        expect(handle.createWritable).toHaveBeenCalledTimes(1);
        expect(writable.write).toHaveBeenCalledTimes(1);
        expect(writable.close).toHaveBeenCalledTimes(1);
    });

    test('cancelled concurrent Save permits a subsequent Save', async () => {
        const abortError = new DOMException(
            'The user aborted the request.',
            'AbortError'
        );

        const blob = new Blob(['project']);
        const {handle, writable} = createWritableHandle();

        const showSaveFilePicker = jest.fn()
            .mockRejectedValueOnce(abortError)
            .mockResolvedValueOnce(handle);

        const saveProjectSb3 = jest.fn().mockResolvedValue(blob);

        const {service, onFileAssociated} = createService({
            showSaveFilePicker,
            saveProjectSb3
        });

        const firstSave = service.save();
        const duplicateSave = service.save();

        expect(duplicateSave).toBe(firstSave);
        expect(showSaveFilePicker).toHaveBeenCalledTimes(1);

        await expect(
            Promise.all([firstSave, duplicateSave])
        ).resolves.toEqual(['cancelled', 'cancelled']);

        expect(saveProjectSb3).not.toHaveBeenCalled();
        expect(handle.createWritable).not.toHaveBeenCalled();
        expect(onFileAssociated).not.toHaveBeenCalled();

        // Cancellation must release the pending operation.
        await expect(service.save()).resolves.toBe('saved');

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(saveProjectSb3).toHaveBeenCalledTimes(1);
        expect(handle.createWritable).toHaveBeenCalledTimes(1);
        expect(writable.write).toHaveBeenCalledWith(blob);
        expect(writable.close).toHaveBeenCalledTimes(1);
        expect(onFileAssociated).toHaveBeenCalledTimes(1);
    });

    test('failed concurrent Save permits a subsequent Save', async () => {
        const failure = new Error('Disk write failed');
        const blob = new Blob(['project']);
        const {handle, writable} = createWritableHandle();

        writable.write.mockRejectedValueOnce(failure);
        writable.abort = jest.fn().mockResolvedValue();

        const showSaveFilePicker = jest.fn()
            .mockResolvedValue(handle);

        const saveProjectSb3 = jest.fn()
            .mockResolvedValue(blob);

        const {service, onFileAssociated} = createService({
            showSaveFilePicker,
            saveProjectSb3
        });

        const firstSave = service.save();
        const duplicateSave = service.save();

        expect(duplicateSave).toBe(firstSave);

        await expect(firstSave).rejects.toBe(failure);
        await expect(duplicateSave).rejects.toBe(failure);

        expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(saveProjectSb3).toHaveBeenCalledTimes(1);
        expect(writable.abort).toHaveBeenCalledTimes(1);
        expect(writable.close).not.toHaveBeenCalled();
        expect(onFileAssociated).not.toHaveBeenCalled();

        // A failed operation must release the pending save.
        await expect(service.save()).resolves.toBe('saved');

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(saveProjectSb3).toHaveBeenCalledTimes(2);
        expect(handle.createWritable).toHaveBeenCalledTimes(2);
        expect(writable.write).toHaveBeenCalledTimes(2);
        expect(writable.close).toHaveBeenCalledTimes(1);
        expect(writable.abort).toHaveBeenCalledTimes(1);
        expect(onFileAssociated).toHaveBeenCalledTimes(1);
    });

    test('different Save operations reject conflicts and recover', async () => {
        const blob = new Blob(['project']);
        const {handle, writable} = createWritableHandle();

        let resolveFirstPicker;
        let resolveSecondPicker;

        const showSaveFilePicker = jest.fn()
            .mockImplementationOnce(() => new Promise(resolve => {
                resolveFirstPicker = resolve;
            }))
            .mockImplementationOnce(() => new Promise(resolve => {
                resolveSecondPicker = resolve;
            }));

        const saveProjectSb3 = jest.fn()
            .mockResolvedValue(blob);

        const {service} = createService({
            showSaveFilePicker,
            saveProjectSb3
        });

        // Save is pending while the file picker remains open.
        const pendingSave = service.save();

        await expect(service.saveAs()).rejects.toThrow(
            'Another EasyBlox save operation is in progress'
        );

        expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(saveProjectSb3).not.toHaveBeenCalled();

        // Completing Save must release the pending operation.
        resolveFirstPicker(handle);

        await expect(pendingSave).resolves.toBe('saved');

        expect(saveProjectSb3).toHaveBeenCalledTimes(1);
        expect(writable.close).toHaveBeenCalledTimes(1);

        // Save As now starts a different operation.
        const pendingSaveAs = service.saveAs();

        await expect(service.save()).rejects.toThrow(
            'Another EasyBlox save operation is in progress'
        );

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(saveProjectSb3).toHaveBeenCalledTimes(1);

        // Completing Save As must preserve normal saving behavior.
        resolveSecondPicker(handle);

        await expect(pendingSaveAs).resolves.toBe('saved');

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(saveProjectSb3).toHaveBeenCalledTimes(2);
        expect(handle.createWritable).toHaveBeenCalledTimes(2);
        expect(writable.write).toHaveBeenCalledTimes(2);
        expect(writable.close).toHaveBeenCalledTimes(2);
    });

    test('project switch during Save prevents stale file association', async () => {
        const blob = new Blob(['project']);
        const first = createWritableHandle('Projeto A.sb3');
        const second = createWritableHandle('Projeto B.sb3');

        let releaseFirstClose;
        let notifyFirstCloseStarted;

        const firstCloseStarted = new Promise(resolve => {
            notifyFirstCloseStarted = resolve;
        });

        first.writable.close.mockImplementation(() => {
            notifyFirstCloseStarted();

            return new Promise(resolve => {
                releaseFirstClose = resolve;
            });
        });

        const showSaveFilePicker = jest.fn()
            .mockResolvedValueOnce(first.handle)
            .mockResolvedValueOnce(second.handle);

        const saveProjectSb3 = jest.fn()
            .mockResolvedValue(blob);

        const {service, onFileAssociated} = createService({
            showSaveFilePicker,
            saveProjectSb3
        });

        // Begin saving Project A.
        const firstSave = service.save();

        // Wait until the first file reaches its pending close.
        await firstCloseStarted;

        expect(first.writable.write).toHaveBeenCalledWith(blob);
        expect(first.writable.close).toHaveBeenCalledTimes(1);

        // Simulate loading Project B while Project A is saving.
        service.clearFileHandle();

        // Complete the original file operation.
        releaseFirstClose();

        await expect(firstSave).resolves.toBe('cancelled');

        // Project A must not be associated with Project B.
        expect(onFileAssociated).not.toHaveBeenCalled();

        // Saving Project B must request its own file association.
        await expect(service.save()).resolves.toBe('saved');

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);

        expect(first.handle.createWritable).toHaveBeenCalledTimes(1);
        expect(second.handle.createWritable).toHaveBeenCalledTimes(1);

        expect(first.writable.write).toHaveBeenCalledTimes(1);
        expect(second.writable.write).toHaveBeenCalledTimes(1);

        expect(onFileAssociated).toHaveBeenCalledTimes(1);
        expect(onFileAssociated).toHaveBeenCalledWith('Projeto B.sb3');
    });

    test('new project Save survives completion of an older pending Save', async () => {
        const firstBlob = new Blob(['Projeto A']);
        const secondBlob = new Blob(['Projeto B']);

        const first = createWritableHandle('Projeto A.sb3');
        const second = createWritableHandle('Projeto B.sb3');

        let releaseFirstClose;
        let notifyFirstCloseStarted;

        const firstCloseStarted = new Promise(resolve => {
            notifyFirstCloseStarted = resolve;
        });

        first.writable.close.mockImplementation(() => {
            notifyFirstCloseStarted();

            return new Promise(resolve => {
                releaseFirstClose = resolve;
            });
        });

        let releaseSecondClose;
        let notifySecondCloseStarted;

        const secondCloseStarted = new Promise(resolve => {
            notifySecondCloseStarted = resolve;
        });

        second.writable.close.mockImplementationOnce(() => {
            notifySecondCloseStarted();

            return new Promise(resolve => {
                releaseSecondClose = resolve;
            });
        });

        const showSaveFilePicker = jest.fn()
            .mockResolvedValueOnce(first.handle)
            .mockResolvedValueOnce(second.handle);

        const saveProjectSb3 = jest.fn()
            .mockResolvedValueOnce(firstBlob)
            .mockResolvedValue(secondBlob);

        const {service, onFileAssociated} = createService({
            showSaveFilePicker,
            saveProjectSb3
        });

        // Project A begins saving.
        const firstSave = service.save();

        await firstCloseStarted;

        expect(first.writable.write).toHaveBeenCalledWith(firstBlob);

        // Project B loads before Project A finishes.
        service.clearFileHandle();

        // Project B must begin its own independent Save.
        const secondSave = service.save();

        await secondCloseStarted;

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(second.writable.write).toHaveBeenCalledWith(secondBlob);

        // Project A finishes while Project B is still saving.
        releaseFirstClose();

        await expect(firstSave).resolves.toBe('cancelled');

        // The old completion must not associate Project A.
        expect(onFileAssociated).not.toHaveBeenCalled();

        // The old completion must not clear Project B's pending Save.
        const duplicateSecondSave = service.save();

        expect(duplicateSecondSave).toBe(secondSave);
        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);

        // Project B finishes successfully.
        releaseSecondClose();

        await expect(secondSave).resolves.toBe('saved');

        expect(onFileAssociated).toHaveBeenCalledTimes(1);
        expect(onFileAssociated).toHaveBeenCalledWith('Projeto B.sb3');

        expect(first.handle.createWritable).toHaveBeenCalledTimes(1);
        expect(second.handle.createWritable).toHaveBeenCalledTimes(1);

        // A subsequent Save must reuse Project B's handle.
        await expect(service.save()).resolves.toBe('saved');

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(first.handle.createWritable).toHaveBeenCalledTimes(1);
        expect(second.handle.createWritable).toHaveBeenCalledTimes(2);

        expect(second.writable.write).toHaveBeenNthCalledWith(
            2,
            secondBlob
        );
    });

    test('project switch while Save picker is open rejects stale selection', async () => {
        const first = createWritableHandle('Projeto A.sb3');
        const second = createWritableHandle('Projeto B.sb3');

        const secondBlob = new Blob(['Projeto B']);

        let resolveFirstPicker;

        const showSaveFilePicker = jest.fn()
            .mockImplementationOnce(() => new Promise(resolve => {
                resolveFirstPicker = resolve;
            }))
            .mockResolvedValueOnce(second.handle);

        const saveProjectSb3 = jest.fn()
            .mockResolvedValue(secondBlob);

        const {service, onFileAssociated} = createService({
            showSaveFilePicker,
            saveProjectSb3
        });

        // Begin saving Project A. Its picker remains open.
        const firstSave = service.save();

        expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(saveProjectSb3).not.toHaveBeenCalled();

        // Project B replaces Project A.
        service.clearFileHandle();

        // The picker started by Project A returns a stale handle.
        resolveFirstPicker(first.handle);

        await expect(firstSave).resolves.toBe('cancelled');

        // A stale selection must not generate or write a project.
        expect(saveProjectSb3).not.toHaveBeenCalled();
        expect(first.handle.createWritable).not.toHaveBeenCalled();
        expect(onFileAssociated).not.toHaveBeenCalled();

        // Project B must select and save its own file.
        await expect(service.save()).resolves.toBe('saved');

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);
        expect(saveProjectSb3).toHaveBeenCalledTimes(1);

        expect(first.handle.createWritable).not.toHaveBeenCalled();
        expect(second.handle.createWritable).toHaveBeenCalledTimes(1);

        expect(second.writable.write).toHaveBeenCalledWith(secondBlob);
        expect(second.writable.close).toHaveBeenCalledTimes(1);

        expect(onFileAssociated).toHaveBeenCalledTimes(1);
        expect(onFileAssociated).toHaveBeenCalledWith('Projeto B.sb3');
    });

    test('Save confirms the revision captured at serialization', async () => {
        const blob = new Blob(['project']);
        const {handle, writable} = createWritableHandle();

        let revision = 1;
        let releaseClose;
        let notifyCloseStarted;

        const closeStarted = new Promise(resolve => {
            notifyCloseStarted = resolve;
        });

        writable.close.mockImplementationOnce(() => {
            notifyCloseStarted();

            return new Promise(resolve => {
                releaseClose = resolve;
            });
        });

        const showSaveFilePicker = jest.fn()
            .mockImplementation(() => {
                revision = 2;
                return Promise.resolve(handle);
            });

        const getProjectRevision = jest.fn(() => revision);
        const onSaveConfirmed = jest.fn();

        const saveProjectSb3 = jest.fn()
            .mockResolvedValue(blob);

        const service = createEasyBloxProjectFileService({
            showSaveFilePicker,
            saveProjectSb3,
            getProjectFilename: () => 'Projeto.sb3',
            downloadBlob: jest.fn(),
            getProjectRevision,
            onSaveConfirmed
        });

        const pendingSave = service.save();

        await closeStarted;

        // The project changes while the write is pending.
        revision = 3;

        const confirmationsBeforeClose =
            onSaveConfirmed.mock.calls.length;

        releaseClose();

        await expect(pendingSave).resolves.toBe('saved');

        expect(getProjectRevision).toHaveBeenCalledTimes(1);
        expect(getProjectRevision).toHaveReturnedWith(2);

        expect(
            getProjectRevision.mock.invocationCallOrder[0]
        ).toBeLessThan(
            saveProjectSb3.mock.invocationCallOrder[0]
        );

        expect(confirmationsBeforeClose).toBe(0);

        expect(onSaveConfirmed).toHaveBeenCalledTimes(1);
        expect(onSaveConfirmed).toHaveBeenCalledWith(2);

        // The saved revision is older than the current project.
        expect(revision).toBe(3);
    });

    test('cancelled and downloaded saves never confirm a revision', async () => {
        const abortError = new DOMException(
            'The user aborted the request.',
            'AbortError'
        );

        const cancelledRevision = jest.fn(() => 10);
        const cancelledConfirmation = jest.fn();
        const cancelledSerialization = jest.fn();

        const cancelledService = createEasyBloxProjectFileService({
            showSaveFilePicker: jest.fn().mockRejectedValue(abortError),
            saveProjectSb3: cancelledSerialization,
            getProjectFilename: () => 'Projeto.sb3',
            downloadBlob: jest.fn(),
            getProjectRevision: cancelledRevision,
            onSaveConfirmed: cancelledConfirmation
        });

        await expect(cancelledService.save()).resolves.toBe('cancelled');

        expect(cancelledSerialization).not.toHaveBeenCalled();
        expect(cancelledRevision).not.toHaveBeenCalled();
        expect(cancelledConfirmation).not.toHaveBeenCalled();

        // A fallback download is not a confirmed local file save.
        const blob = new Blob(['project']);

        const downloadedRevision = jest.fn(() => 11);
        const downloadedConfirmation = jest.fn();
        const downloadBlob = jest.fn();

        const downloadedService = createEasyBloxProjectFileService({
            showSaveFilePicker: null,
            saveProjectSb3: jest.fn().mockResolvedValue(blob),
            getProjectFilename: () => 'Projeto.sb3',
            downloadBlob,
            getProjectRevision: downloadedRevision,
            onSaveConfirmed: downloadedConfirmation
        });

        await expect(downloadedService.save()).resolves.toBe('downloaded');

        expect(downloadBlob).toHaveBeenCalledTimes(1);
        expect(downloadBlob).toHaveBeenCalledWith('Projeto.sb3', blob);
        expect(downloadedRevision).not.toHaveBeenCalled();
        expect(downloadedConfirmation).not.toHaveBeenCalled();
    });

    test('failed disk write never confirms a serialized revision', async () => {
        const failure = new Error('Disk write failed');
        const blob = new Blob(['project']);

        const {handle, writable} = createWritableHandle();

        writable.write.mockRejectedValueOnce(failure);
        writable.abort = jest.fn().mockResolvedValue();

        const showSaveFilePicker = jest.fn()
            .mockResolvedValue(handle);

        const saveProjectSb3 = jest.fn()
            .mockResolvedValue(blob);

        const getProjectRevision = jest.fn(() => 25);
        const onSaveConfirmed = jest.fn();
        const onFileAssociated = jest.fn();

        const service = createEasyBloxProjectFileService({
            showSaveFilePicker,
            saveProjectSb3,
            getProjectFilename: () => 'Projeto.sb3',
            downloadBlob: jest.fn(),
            getProjectRevision,
            onSaveConfirmed,
            onFileAssociated
        });

        await expect(service.save()).rejects.toBe(failure);

        // Serialization occurred, but the disk write failed.
        expect(getProjectRevision).toHaveBeenCalledTimes(1);
        expect(getProjectRevision).toHaveReturnedWith(25);

        expect(saveProjectSb3).toHaveBeenCalledTimes(1);
        expect(writable.write).toHaveBeenCalledWith(blob);

        // Failed writes must be aborted without confirming the save.
        expect(writable.abort).toHaveBeenCalledTimes(1);
        expect(writable.close).not.toHaveBeenCalled();

        expect(onSaveConfirmed).not.toHaveBeenCalled();
        expect(onFileAssociated).not.toHaveBeenCalled();
    });

    test('project switch during write never confirms stale revision', async () => {
        const blob = new Blob(['Projeto A']);
        const {handle, writable} = createWritableHandle('Projeto A.sb3');

        let releaseClose;
        let notifyCloseStarted;

        const closeStarted = new Promise(resolve => {
            notifyCloseStarted = resolve;
        });

        writable.close.mockImplementationOnce(() => {
            notifyCloseStarted();

            return new Promise(resolve => {
                releaseClose = resolve;
            });
        });

        const getProjectRevision = jest.fn(() => 42);
        const onSaveConfirmed = jest.fn();
        const onFileAssociated = jest.fn();

        const saveProjectSb3 = jest.fn().mockResolvedValue(blob);
        const showSaveFilePicker = jest.fn().mockResolvedValue(handle);

        const service = createEasyBloxProjectFileService({
            showSaveFilePicker,
            saveProjectSb3,
            getProjectFilename: () => 'Projeto A.sb3',
            downloadBlob: jest.fn(),
            getProjectRevision,
            onSaveConfirmed,
            onFileAssociated
        });

        // Begin saving Project A.
        const pendingSave = service.save();

        // Wait until the physical write is pending completion.
        await closeStarted;

        expect(getProjectRevision).toHaveBeenCalledTimes(1);
        expect(getProjectRevision).toHaveReturnedWith(42);

        expect(writable.write).toHaveBeenCalledWith(blob);
        expect(onSaveConfirmed).not.toHaveBeenCalled();

        // Project B replaces Project A before the write completes.
        service.clearFileHandle();

        // Complete the old physical write.
        releaseClose();

        await expect(pendingSave).resolves.toBe('cancelled');

        // The old project must not confirm a revision or file association.
        expect(onSaveConfirmed).not.toHaveBeenCalled();
        expect(onFileAssociated).not.toHaveBeenCalled();

        expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(saveProjectSb3).toHaveBeenCalledTimes(1);
        expect(writable.close).toHaveBeenCalledTimes(1);
    });
});
