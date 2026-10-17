import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import VM from '@scratch/scratch-vm';
import AudioEngine from 'scratch-audio';
import {bindAudioEngineInput} from './audio/audio-engine-input';
import {closeSoundRecorder} from '../reducers/modals';

import {setProjectUnchanged} from '../reducers/project-changed';
import {
    LoadingStates,
    getIsLoadingWithId,
    onLoadedProject,
    projectError
} from '../reducers/project-state';

/*
 * Higher Order Component to manage events emitted by the VM
 * @param {React.Component} WrappedComponent component to manage VM events for
 * @returns {React.Component} connected component with vm events bound to redux
 */
const vmManagerHOC = function (WrappedComponent) {
    class VMManager extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'loadProject',
                'handleRuntimeDisposed'
            ]);
        }
        componentDidMount () {
            if (!this.props.vm.initialized) {
                this.audioEngine = new AudioEngine();
                this.props.vm.attachAudioEngine(this.audioEngine);
                this.props.vm.setCompatibilityMode(true);
                this.props.vm.initialized = true;
                this.props.vm.setLocale(this.props.locale, this.props.messages);
            }
            this._releaseMicrophoneInput = bindAudioEngineInput(
                this.audioEngine || this.props.vm.runtime.audioEngine, this.props.vm.runtime
            );
            this.props.vm.runtime.on('RUNTIME_DISPOSED', this.handleRuntimeDisposed);
            if (!this.props.isPlayerOnly && !this.props.isStarted) {
                this.props.vm.start();
            }
        }
        componentDidUpdate (prevProps) {
            // if project is in loading state, AND fonts are loaded,
            // and they weren't both that way until now... load project!
            if (this.props.isLoadingWithId && this.props.fontsLoaded &&
                (!prevProps.isLoadingWithId || !prevProps.fontsLoaded)) {
                this.loadProject();
            }
            // Start the VM if entering editor mode with an unstarted vm
            if (!this.props.isPlayerOnly && !this.props.isStarted) {
                this.props.vm.start();
            }
        }
        componentWillUnmount () {
            this.projectLoadResetToken = (this.projectLoadResetToken || 0) + 1;
            this.props.vm.runtime.removeListener('RUNTIME_DISPOSED', this.handleRuntimeDisposed);
            this._releaseMicrophoneInput();
        }
        handleRuntimeDisposed () {
            this.props.onCloseSoundRecorder();
        }
        loadProject () {
            const loadToken = (this.projectLoadResetToken || 0) + 1;
            this.projectLoadResetToken = loadToken;

            return this.props.vm.loadProject(this.props.projectData)
                .then(() => {
                    const vm = this.props.vm;
                    let changedAfterLoad = false;
                    let replacedAfterLoad = false;

                    const onProjectChanged = () => {
                        changedAfterLoad = true;
                    };

                    const onProjectLoaded = () => {
                        replacedAfterLoad = true;
                    };

                    vm.on('PROJECT_CHANGED', onProjectChanged);
                    vm.on('PROJECT_LOADED', onProjectLoaded);

                    this.props.onLoadedProject(this.props.loadingState, this.props.canSave);

                    // Preserve the deferred reset for asynchronous skin loading.
                    // Never clear changes made after loading or for another project.
                    setTimeout(() => {
                        vm.removeListener('PROJECT_CHANGED', onProjectChanged);
                        vm.removeListener('PROJECT_LOADED', onProjectLoaded);

                        if (
                            this.projectLoadResetToken === loadToken &&
                            !changedAfterLoad &&
                            !replacedAfterLoad
                        ) {
                            this.props.onSetProjectUnchanged();
                        }
                    });

                    // If the vm is not running, call draw on the renderer manually
                    // This draws the state of the loaded project with no blocks running
                    // which closely matches the 2.0 behavior, except for monitors–
                    // 2.0 runs monitors and shows updates (e.g. timer monitor)
                    // before the VM starts running other hat blocks.
                    if (!this.props.isStarted) {
                        // Wrap in a setTimeout because skin loading in
                        // the renderer can be async.
                        setTimeout(() => this.props.vm.renderer.draw());
                    }
                })
                .catch(e => {
                    this.props.onError(e);
                });
        }
        render () {
            const {
                 
                fontsLoaded,
                loadingState,
                locale,
                messages,
                isStarted,
                onError: onErrorProp,
                onLoadedProject: onLoadedProjectProp,
                onCloseSoundRecorder: _onCloseSoundRecorder,
                onSetProjectUnchanged,
                projectData,
                 
                isLoadingWithId: isLoadingWithIdProp,
                vm,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    isLoading={isLoadingWithIdProp}
                    vm={vm}
                    {...componentProps}
                />
            );
        }
    }

    VMManager.propTypes = {
        canSave: PropTypes.bool,
        cloudHost: PropTypes.string,
        fontsLoaded: PropTypes.bool,
        isLoadingWithId: PropTypes.bool,
        isPlayerOnly: PropTypes.bool,
        isStarted: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        locale: PropTypes.string,
        messages: PropTypes.objectOf(PropTypes.string),
        onError: PropTypes.func,
        onLoadedProject: PropTypes.func,
        onCloseSoundRecorder: PropTypes.func,
        onSetProjectUnchanged: PropTypes.func,
        projectData: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        username: PropTypes.string,
        vm: PropTypes.instanceOf(VM).isRequired
    };

    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            fontsLoaded: state.scratchGui.fontsLoaded,
            isLoadingWithId: getIsLoadingWithId(loadingState),
            locale: state.locales.locale,
            messages: state.locales.messages,
            projectData: state.scratchGui.projectState.projectData,
            projectId: state.scratchGui.projectState.projectId,
            loadingState: loadingState,
            isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
            isStarted: state.scratchGui.vmStatus.started
        };
    };

    const mapDispatchToProps = dispatch => ({
        onCloseSoundRecorder: () => dispatch(closeSoundRecorder()),
        onError: error => dispatch(projectError(error)),
        onLoadedProject: (loadingState, canSave) =>
            dispatch(onLoadedProject(loadingState, canSave, true)),
        onSetProjectUnchanged: () => dispatch(setProjectUnchanged())
    });

    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );

    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(VMManager);
};

export default vmManagerHOC;
