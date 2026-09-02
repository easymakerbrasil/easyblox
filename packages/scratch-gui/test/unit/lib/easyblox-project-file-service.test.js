import createEasyBloxProjectFileService from '../../../src/lib/easyblox-project-file-service';

const createWritableHandle = () => {
    const writable = {
        write: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue()
    };

    const handle = {
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
    downloadBlob = jest.fn()
} = {}) => ({
    service: createEasyBloxProjectFileService({
        showSaveFilePicker,
        saveProjectSb3,
        getProjectFilename,
        downloadBlob
    }),
    saveProjectSb3,
    getProjectFilename,
    downloadBlob
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

        await service.save();

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

        await service.save();

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

        await service.save();
        await service.saveAs();
        await service.save();

        expect(showSaveFilePicker).toHaveBeenCalledTimes(2);

        expect(first.handle.createWritable).toHaveBeenCalledTimes(1);
        expect(first.writable.write).toHaveBeenCalledTimes(1);
        expect(first.writable.close).toHaveBeenCalledTimes(1);

        expect(second.handle.createWritable).toHaveBeenCalledTimes(2);
        expect(second.writable.write).toHaveBeenCalledTimes(2);
        expect(second.writable.close).toHaveBeenCalledTimes(2);
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

        await service.save();
        await service.save();

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

    test('silently ignores AbortError from Save As', async () => {
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

        await expect(service.save()).resolves.toBeUndefined();

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

    test('propagates non-AbortError failures', async () => {
        const failure = new Error('Save picker failed');
        const showSaveFilePicker = jest.fn().mockRejectedValue(failure);

        const {service} = createService({
            showSaveFilePicker
        });

        await expect(service.save()).rejects.toBe(failure);
    });
});
