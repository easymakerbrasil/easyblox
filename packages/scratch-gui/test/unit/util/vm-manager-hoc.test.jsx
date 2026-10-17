/* global WebAudioTestAPI */
import 'web-audio-test-api';
WebAudioTestAPI.setState({
    'AudioContext#resume': 'enabled'
});

import React from 'react';
import configureStore from 'redux-mock-store';
import {render, act} from '@testing-library/react';
import VM from '@scratch/scratch-vm';
import AudioEngine from 'scratch-audio';
import getUserMedia from 'get-user-media-promise';
import {closeSoundRecorder} from '../../../src/reducers/modals';
import {createAudioContext, createStream, flush, deferred} from '../../helpers/microphone';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import RecordingStep from '../../../src/containers/recording-step.jsx';
import SharedAudioContext from '../../../src/lib/audio/shared-audio-context';
import {LoadingState} from '../../../src/reducers/project-state';

import vmManagerHOC from '../../../src/lib/vm-manager-hoc.jsx';
jest.mock('get-user-media-promise', () => jest.fn());
jest.mock('../../../src/lib/audio/shared-audio-context', () => jest.fn());

describe('VMManagerHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;
    const markInitialized = () => {
        vm.runtime.attachAudioEngine(new AudioEngine());
        vm.initialized = true;
    };

    beforeEach(() => {
        store = mockStore({
            scratchGui: {
                projectState: {},
                mode: {},
                vmStatus: {}
            },
            locales: {
                locale: '',
                messages: {}
            }
        });
        vm = new VM();
        vm.runtime.renderer = {draw: jest.fn()};
        getUserMedia.mockReset();
        vm.attachAudioEngine = jest.fn();
        vm.setCompatibilityMode = jest.fn();
        vm.setLocale = jest.fn();
        vm.start = jest.fn();
    });
    test('when it mounts in player mode, the vm is initialized but not started', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmManagerHOC(Component);
        render(
            <WrappedComponent
                isPlayerOnly
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.attachAudioEngine.mock.calls.length).toBe(1);
        expect(vm.setCompatibilityMode.mock.calls.length).toBe(1);
        expect(vm.setLocale.mock.calls.length).toBe(1);
        expect(vm.initialized).toBe(true);

        // But vm should not be started automatically
        expect(vm.start).not.toHaveBeenCalled();
    });
    test('when it mounts in editor mode, the vm is initialized and started', () => {
        const Component = () => (<div />);
        const WrappedComponent = vmManagerHOC(Component);
        render(
            <WrappedComponent
                isPlayerOnly={false}
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.attachAudioEngine.mock.calls.length).toBe(1);
        expect(vm.setCompatibilityMode.mock.calls.length).toBe(1);
        expect(vm.setLocale.mock.calls.length).toBe(1);
        expect(vm.initialized).toBe(true);

        expect(vm.start).toHaveBeenCalled();
    });
    test('if it mounts with an initialized vm, it does not reinitialize the vm but will start it', () => {
        const Component = () => <div />;
        const WrappedComponent = vmManagerHOC(Component);
        markInitialized();
        render(
            <WrappedComponent
                isPlayerOnly={false}
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.attachAudioEngine.mock.calls.length).toBe(0);
        expect(vm.setCompatibilityMode.mock.calls.length).toBe(0);
        expect(vm.setLocale.mock.calls.length).toBe(0);
        expect(vm.initialized).toBe(true);

        expect(vm.start).toHaveBeenCalled();
    });

    test('if it mounts without starting the VM, it can be started by switching to editor mode', () => {
        const Component = () => <div />;
        const WrappedComponent = vmManagerHOC(Component);
        markInitialized();
        const {rerender} = render(
            <WrappedComponent
                isPlayerOnly
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.start).not.toHaveBeenCalled();
        rerender(
            <WrappedComponent
                isPlayerOnly={false}
                isStarted={false}
                store={store}
                vm={vm}
            />
        );
        expect(vm.start).toHaveBeenCalled();
    });
    test('if it mounts with an initialized and started VM, it does not start again', () => {
        const Component = () => <div />;
        const WrappedComponent = vmManagerHOC(Component);
        markInitialized();
        const {rerender} = render(
            <WrappedComponent
                isPlayerOnly
                isStarted
                store={store}
                vm={vm}
            />
        );
        expect(vm.start).not.toHaveBeenCalled();
        rerender(
            <WrappedComponent
                isPlayerOnly={false}
                isStarted
                store={store}
                vm={vm}
            />
        );
        expect(vm.start).not.toHaveBeenCalled();
    });
    test('if the isLoadingWithId prop becomes true, it loads project data into the vm', () => {
        vm.loadProject = jest.fn(() => Promise.resolve());
        const mockedOnLoadedProject = jest.fn();
        const Component = () => <div />;
        const WrappedComponent = vmManagerHOC(Component);
        const {rerender} = render(
            <WrappedComponent
                fontsLoaded
                isLoadingWithId={false}
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
            />
        );
        rerender(
            <WrappedComponent
                fontsLoaded
                isLoadingWithId
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
                canSave
                loadingState={LoadingState.LOADING_VM_WITH_ID}
                projectData="100"
            />
        );
        expect(vm.loadProject).toHaveBeenLastCalledWith('100');
        // delay needed since vm.loadProject is async, and we have to wait for it :/
        setTimeout(() => (
            expect(mockedOnLoadedProject).toHaveBeenLastCalledWith(LoadingState.LOADING_VM_WITH_ID, true)
        ), 1);
    });
    test('if the fontsLoaded prop becomes true, it loads project data into the vm', () => {
        vm.loadProject = jest.fn(() => Promise.resolve());
        const mockedOnLoadedProject = jest.fn();
        const Component = () => <div />;
        const WrappedComponent = vmManagerHOC(Component);
        const {rerender} = render(
            <WrappedComponent
                isLoadingWithId
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
            />
        );
        rerender(
            <WrappedComponent
                isLoadingWithId
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
                canSave={false}
                fontsLoaded
                loadingState={LoadingState.LOADING_VM_WITH_ID}
                projectData="100"
            />
        );
        expect(vm.loadProject).toHaveBeenLastCalledWith('100');
        // delay needed since vm.loadProject is async, and we have to wait for it :/
        setTimeout(() => (
            expect(mockedOnLoadedProject).toHaveBeenLastCalledWith(LoadingState.LOADING_VM_WITH_ID, false)
        ), 1);
    });
    test('if the fontsLoaded prop is false, project data is never loaded', () => {
        vm.loadProject = jest.fn(() => Promise.resolve());
        const mockedOnLoadedProject = jest.fn();
        const Component = () => <div />;
        const WrappedComponent = vmManagerHOC(Component);
        const {rerender} = render(
            <WrappedComponent
                isLoadingWithId
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
            />
        );
        rerender(
            <WrappedComponent
                isLoadingWithId
                store={store}
                vm={vm}
                onLoadedProject={mockedOnLoadedProject}
                loadingState={LoadingState.LOADING_VM_WITH_ID}
                projectData="100"
            />
        );
        expect(vm.loadProject).toHaveBeenCalledTimes(0);
        // delay needed since vm.loadProject is async
        setTimeout(() => expect(mockedOnLoadedProject).toHaveBeenCalledTimes(0), 1);
    });

    test('project disposal closes the recorder and unmount/remount releases only input resources', async () => {
        const context = createAudioContext();
        const engine = new AudioEngine(context);
        vm.runtime.attachAudioEngine(engine);
        vm.initialized = true;
        const originalListeners = vm.runtime.listenerCount('RUNTIME_DISPOSED');
        const current = createStream();
        getUserMedia.mockResolvedValue(current.stream);
        const Component = () => <div />;
        const Wrapped = vmManagerHOC(Component);
        const mounted = render(<Wrapped
            isPlayerOnly
            store={store}
            vm={vm}
        />);
        expect(vm.runtime.listenerCount('RUNTIME_DISPOSED')).toBe(originalListeners + 2);
        expect(getUserMedia).not.toHaveBeenCalled();
        engine.getLoudness();
        await flush();
        vm.runtime.dispose();
        expect(store.getActions()).toContainEqual(closeSoundRecorder());
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        const next = createStream();
        getUserMedia.mockResolvedValue(next.stream);
        engine.getLoudness();
        await flush();
        mounted.unmount();
        expect(next.track.stop).toHaveBeenCalledTimes(1);
        expect(vm.runtime.listenerCount('RUNTIME_DISPOSED')).toBe(originalListeners);
        expect(engine.inputNode.disconnect).not.toHaveBeenCalled();
        const remount = render(<Wrapped
            isPlayerOnly
            store={store}
            vm={vm}
        />);
        expect(vm.runtime.audioEngine).toBe(engine);
        expect(vm.runtime.listenerCount('RUNTIME_DISPOSED')).toBe(originalListeners + 2);
        remount.unmount();
    });

    test.each([{pending: false}, {pending: true}])(
        'project disposal unmounts the real recording step (pending: $pending)', async ({pending}) => {
            const context = createAudioContext();
            SharedAudioContext.mockImplementation(() => context);
            vm.runtime.attachAudioEngine(new AudioEngine(context));
            vm.initialized = true;
            const current = createStream();
            const request = deferred();
            getUserMedia.mockReturnValue(pending ? request.promise : Promise.resolve(current.stream));
            const Content = ({recorderVisible}) => (recorderVisible ? (
                <RecordingStep
                    recording={false}
                    onRecord={jest.fn()}
                    onStopRecording={jest.fn()}
                />
            ) : null);
            const Wrapped = vmManagerHOC(Content);
            const Host = () => {
                const [visible, setVisible] = React.useState(true);
                const closeRecorder = React.useCallback(() => setVisible(false), []);
                return (<Wrapped
                    isPlayerOnly
                    recorderVisible={visible}
                    onCloseSoundRecorder={closeRecorder}
                    store={store}
                    vm={vm}
                />);
            };
            const mounted = renderWithIntl(<Host />);
            await act(async () => {
                await flush();
            });
            expect(getUserMedia).toHaveBeenCalledTimes(1);
            act(() => vm.runtime.dispose());
            if (pending) request.resolve(current.stream);
            await act(async () => {
                await flush();
            });
            expect(current.track.stop).toHaveBeenCalledTimes(1);
            mounted.unmount();
            expect(current.track.stop).toHaveBeenCalledTimes(1);
        });
});
