import 'web-audio-test-api';

import React from 'react';
import configureStore from 'redux-mock-store';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {LoadingState} from '../../../src/reducers/project-state';
import VM from '@scratch/scratch-vm';

import SBFileUploaderHOC from '../../../src/lib/sb-file-uploader-hoc.jsx';
import {IntlProvider} from 'react-intl';
import {act, fireEvent, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import prepareEasyBloxExternalProjectImport, {IMPORT_STATUSES}
    from '../../../src/lib/easyblox-external-project-import-service';

jest.mock('../../../src/lib/easyblox-external-project-import-service', () => ({
    __esModule: true,
    default: jest.fn(),
    IMPORT_STATUSES: {READY: 'ready'}
}));

describe('SBFileUploaderHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    // Wrap this in a function so it gets test specific states and can be reused.
    const getContainer = function () {
        const Component = () => <div />;
        return SBFileUploaderHOC(Component);
    };

    const unwrappedInstance = () => {
        const WrappedComponent = getContainer();
        // default starting state: looking at a project you created, not logged in
        const wrapper = renderWithIntl(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={jest.fn()}
                closeFileMenu={jest.fn()}
                requestProjectUpload={jest.fn()}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
                store={store}
            />
        );
        return wrapper;
    };

    beforeEach(() => {
        vm = new VM();
        store = mockStore({
            scratchGui: {
                projectState: {
                    loadingState: LoadingState.SHOWING_WITHOUT_ID
                },
                vm: {}
            },
            locales: {
                locale: 'en'
            }
        });
    });

    test('if isLoadingUpload becomes true, without fileToUpload set, will call cancelFileUpload', () => {
        const mockedCancelFileUpload = jest.fn();
        const WrappedComponent = getContainer();
        const {rerender} = renderWithIntl(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={mockedCancelFileUpload}
                closeFileMenu={jest.fn()}
                isLoadingUpload={false}
                requestProjectUpload={jest.fn()}
                store={store}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
            />
        );
        rerender(
            <IntlProvider
                locale="en"
                messages={{ }}
            >
                <WrappedComponent
                    projectChanged
                    canSave={false}
                    cancelFileUpload={mockedCancelFileUpload}
                    closeFileMenu={jest.fn()}
                    isLoadingUpload
                    requestProjectUpload={jest.fn()}
                    store={store}
                    userOwnsProject={false}
                    vm={vm}
                    onLoadingFinished={jest.fn()}
                    onLoadingStarted={jest.fn()}
                    onUpdateProjectTitle={jest.fn()}
                />
            </IntlProvider>
        );
        expect(mockedCancelFileUpload).toHaveBeenCalled();
    });

    describe('project replacement confirmation', () => {
        let reader;
        let requestProjectUpload;
        let loadProject;
        const file = new File(['project'], 'example.sb3');
        const converted = new ArrayBuffer(4);
        const Probe = ({onStartSelectingFileUpload, onStartSelectingExternalProjectImport}) => (
            <>
                <button onClick={onStartSelectingFileUpload}>Abrir</button>
                <button onClick={onStartSelectingExternalProjectImport}>Importar</button>
            </>
        );
        const Wrapped = SBFileUploaderHOC(Probe);
        const propsFor = (props = {}) => ({
            store,
            loadingState: LoadingState.SHOWING_WITHOUT_ID,
            isShowingWithoutId: true,
            isLoadingUpload: false,
            projectChanged: true,
            userOwnsProject: false,
            requestProjectUpload,
            vm: {loadProject},
            onLoadingStarted: jest.fn(),
            onLoadingFinished: jest.fn(),
            onSetProjectTitle: jest.fn(),
            ...props
        });
        const select = (operation = 'Abrir', files = [file]) => {
            fireEvent.click(screen.getByText(operation));
            const input = document.querySelector('input[type="file"]');
            fireEvent.change(input, {target: {files}});
            return input;
        };

        beforeEach(() => {
            reader = {readAsArrayBuffer: jest.fn(), result: new ArrayBuffer(8)};
            jest.spyOn(window, 'FileReader').mockImplementation(() => reader);
            jest.spyOn(window, 'confirm').mockReturnValue(true);
            requestProjectUpload = jest.fn();
            loadProject = jest.fn().mockResolvedValue();
            prepareEasyBloxExternalProjectImport.mockClear();
            prepareEasyBloxExternalProjectImport.mockResolvedValue({status: IMPORT_STATUSES.READY, sb3: converted});
        });
        afterEach(() => jest.restoreAllMocks());

        test.each([
            {userOwnsProject: true, projectChanged: false},
            {userOwnsProject: false, projectChanged: true, isShowingWithoutId: true}
        ])('opens without uploading, reading or loading when confirmation is required: %j', props => {
            renderWithIntl(<Wrapped {...propsFor(props)} />);
            select();
            expect(screen.getByRole('dialog', {name: 'Abrir outro projeto?'})).toBeInTheDocument();
            expect(requestProjectUpload).not.toHaveBeenCalled();
            expect(reader.readAsArrayBuffer).not.toHaveBeenCalled();
            expect(loadProject).not.toHaveBeenCalled();
        });

        test.each([
            {projectChanged: false},
            {projectChanged: true, isShowingWithoutId: false, loadingState: LoadingState.SHOWING_WITH_ID}
        ])('continues directly when confirmation is not required: %j', props => {
            renderWithIntl(<Wrapped {...propsFor(props)} />);
            select();
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(requestProjectUpload).toHaveBeenCalledTimes(1);
            expect(requestProjectUpload).toHaveBeenCalledWith(propsFor(props).loadingState);
        });

        test.each([
            ['Abrir', 'Abrir projeto', false],
            ['Importar', 'Importar projeto', true]
        ])('%s retains the selected file and mode through confirmation', async (operation, action, isImport) => {
            const props = propsFor();
            const {rerender} = renderWithIntl(<Wrapped {...props} />);
            const input = select(operation);
            fireEvent.click(screen.getByText(isImport ? 'Abrir' : 'Importar'));
            fireEvent.change(input, {target: {files: [new File(['other'], 'other.sb3')]}});
            expect(document.querySelector('input[type="file"]')).toBe(input);
            expect(screen.getAllByRole('dialog')).toHaveLength(1);
            const confirmButton = screen.getByRole('button', {name: action});
            fireEvent.click(confirmButton);
            fireEvent.click(confirmButton);
            expect(requestProjectUpload).toHaveBeenCalledTimes(1);
            expect(requestProjectUpload).toHaveBeenCalledWith(LoadingState.SHOWING_WITHOUT_ID);
            rerender(
                <IntlProvider locale="pt-br">
                    <Wrapped
                        {...props}
                        isLoadingUpload
                    />
                </IntlProvider>
            );
            expect(reader.readAsArrayBuffer).toHaveBeenCalledTimes(1);
            expect(reader.readAsArrayBuffer).toHaveBeenCalledWith(file);
            await act(() => reader.onload());
            await waitFor(() => expect(loadProject).toHaveBeenCalledTimes(1));
            expect(loadProject).toHaveBeenCalledWith(isImport ? converted : reader.result);
            if (isImport) {
                expect(prepareEasyBloxExternalProjectImport).toHaveBeenCalledWith(reader.result);
            } else {
                expect(prepareEasyBloxExternalProjectImport).not.toHaveBeenCalled();
            }
        });

        test.each(['Cancelar', 'Close', 'Escape'])('%s cleans up without replacing the project', label => {
            renderWithIntl(<Wrapped {...propsFor()} />);
            select();
            if (label === 'Escape') {
                fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape', keyCode: 27});
            } else {
                fireEvent.click(screen.getByRole('button', {name: label}));
            }
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(document.querySelector('input[type="file"]')).toBeNull();
            expect(requestProjectUpload).not.toHaveBeenCalled();
            expect(reader.readAsArrayBuffer).not.toHaveBeenCalled();
            expect(loadProject).not.toHaveBeenCalled();
        });

        test('an empty FileList neither confirms nor uploads', () => {
            renderWithIntl(<Wrapped {...propsFor({userOwnsProject: true})} />);
            select('Abrir', []);
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(requestProjectUpload).not.toHaveBeenCalled();
            expect(reader.readAsArrayBuffer).not.toHaveBeenCalled();
            expect(loadProject).not.toHaveBeenCalled();
            expect(window.confirm).not.toHaveBeenCalled();
        });
    });
});
