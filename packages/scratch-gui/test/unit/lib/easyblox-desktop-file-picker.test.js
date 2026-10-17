import {Blob as NodeBlob} from 'buffer';
import {waitFor} from '@testing-library/react';
import createPicker from '../../../src/lib/easyblox-desktop-file-picker';
import createService from '../../../src/lib/easyblox-project-file-service';

describe('Desktop file picker and project file service', () => {
    let desktop;
    let service;
    let confirmed;
    let revision;
    let serialize;

    beforeEach(() => {
        desktop = {
            chooseProjectFile: jest.fn().mockResolvedValue({token: 'opaque', name: 'Projeto.sb3'}),
            writeProjectFile: jest.fn().mockResolvedValue({status: 'saved'})
        };
        revision = 1;
        confirmed = jest.fn();
        serialize = jest.fn().mockResolvedValue(new NodeBlob(['PK\x03\x04project']));
        service = createService({
            showSaveFilePicker: createPicker(desktop),
            saveProjectSb3: serialize,
            getProjectFilename: () => 'Projeto.sb3',
            getProjectRevision: () => revision,
            onSaveConfirmed: confirmed
        });
    });

    test('converts the VM Blob to bytes and confirms only after the native write', async () => {
        let finish;
        desktop.writeProjectFile.mockReturnValue(new Promise(resolve => {
            finish = resolve;
        }));
        const pending = service.save();
        await waitFor(() => expect(desktop.writeProjectFile).toHaveBeenCalled());
        expect(confirmed).not.toHaveBeenCalled();
        expect(desktop.writeProjectFile).toHaveBeenCalledWith('opaque', expect.any(Uint8Array));
        expect(Array.from(desktop.writeProjectFile.mock.calls[0][1]).slice(0, 4)).toEqual([80, 75, 3, 4]);
        finish({status: 'saved'});
        await expect(pending).resolves.toBe('saved');
        expect(confirmed).toHaveBeenCalledWith(1);
        await service.save();
        expect(desktop.chooseProjectFile).toHaveBeenCalledTimes(1);
        await service.saveAs();
        expect(desktop.chooseProjectFile).toHaveBeenCalledTimes(2);
    });

    test('picker cancellation preserves the revision and permits retry', async () => {
        desktop.chooseProjectFile.mockResolvedValueOnce({cancelled: true});
        await expect(service.save()).resolves.toBe('cancelled');
        expect(serialize).not.toHaveBeenCalled();
        expect(confirmed).not.toHaveBeenCalled();
        await expect(service.save()).resolves.toBe('saved');
    });

    test('native disk failure never confirms or associates the file and permits retry', async () => {
        desktop.writeProjectFile.mockRejectedValueOnce(new Error('EACCES'));
        await expect(service.save()).rejects.toThrow('EACCES');
        expect(confirmed).not.toHaveBeenCalled();
        await expect(service.save()).resolves.toBe('saved');
        expect(desktop.chooseProjectFile).toHaveBeenCalledTimes(2);
    });

    test('records the serialized revision when edits arrive during disk write', async () => {
        desktop.writeProjectFile.mockImplementation(() => {
            revision = 2;
            return Promise.resolve({status: 'saved'});
        });
        await service.save();
        expect(confirmed).toHaveBeenCalledWith(1);
    });

    test('a project replacement during disk write cannot confirm the old project', async () => {
        desktop.writeProjectFile.mockImplementation(() => {
            service.clearFileHandle();
            return Promise.resolve({status: 'saved'});
        });
        await expect(service.save()).resolves.toBe('cancelled');
        expect(confirmed).not.toHaveBeenCalled();
    });

    test('an unconfirmed IPC response is a save failure', async () => {
        desktop.writeProjectFile.mockResolvedValue({status: 'rejected'});
        await expect(service.save()).rejects.toThrow('DESKTOP_SAVE_NOT_CONFIRMED');
        expect(confirmed).not.toHaveBeenCalled();
    });
});
