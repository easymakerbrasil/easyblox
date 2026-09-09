import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import ControllerDesktopWindow
    from '../components/controller-desktop-window/controller-desktop-window.jsx';
import EasyBloxControllerDesktopSession
    from '../lib/easyblox-controller-desktop-session';
import EasyBloxControllerProjectBridge
    from '../lib/easyblox-controller-project-bridge';

import {
    closeController,
    isControllerOpen,
    setControllerConnected
} from '../reducers/controller-desktop';

export const ControllerDesktopWindowContainer = ({
    isOpen,
    onConnectionStateChange,
    onRequestClose,
    projectBridge,
    session,
    vm
}) => {
    const [
        controllerSession
    ] = React.useState(
        () =>
            session ||
            new EasyBloxControllerDesktopSession()
    );

    const [
        controllerProjectBridge
    ] = React.useState(
        () =>
            projectBridge ||
            (
                vm ?
                    new EasyBloxControllerProjectBridge({
                        vm
                    }) :
                    null
            )
    );

    const [
        connectionState,
        setConnectionState
    ] = React.useState(
        () =>
            controllerSession
                .getState()
    );

    React.useEffect(
        () =>
            controllerSession
                .onStateChange(
                    nextState => {
                        setConnectionState(
                            nextState
                        );
                    }
                ),
        [controllerSession]
    );

    React.useEffect(
        () => {
            if (
                !vm ||
                !controllerProjectBridge
            ) {
                return;
            }

            const handleProjectLoaded =
                () => {
                    controllerProjectBridge
                        .refreshFromVM();
                };

            vm.addListener(
                'PROJECT_LOADED',
                handleProjectLoaded
            );

            return () => {
                vm.removeListener(
                    'PROJECT_LOADED',
                    handleProjectLoaded
                );
            };
        },
        [
            controllerProjectBridge,
            vm
        ]
    );

    React.useEffect(
        () => {
            onConnectionStateChange(
                connectionState.status ===
                    'connected'
            );
        },
        [
            connectionState.status,
            onConnectionStateChange
        ]
    );

    const handleConnect =
        () => {
            controllerSession
                .connect();
        };

    const handleDisconnect =
        () => {
            controllerSession
                .disconnect();
        };

    const handleSelectDevice =
        function (key) {
            controllerSession
                .selectDevice(
                    key
                );
        };

    return (
        <ControllerDesktopWindow
            connectionState={connectionState}
            isOpen={isOpen}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRequestClose={onRequestClose}
            onSelectDevice={handleSelectDevice}
        />
    );
};

ControllerDesktopWindowContainer.propTypes = {
    isOpen:
        PropTypes.bool,
    onConnectionStateChange:
        PropTypes.func,
    onRequestClose:
        PropTypes.func.isRequired,
    projectBridge:
        PropTypes.shape({
            refreshFromVM:
                PropTypes.func.isRequired
        }),
    session:
        PropTypes.shape({
            connect:
                PropTypes.func.isRequired,
            disconnect:
                PropTypes.func.isRequired,
            getState:
                PropTypes.func.isRequired,
            onStateChange:
                PropTypes.func.isRequired,
            selectDevice:
                PropTypes.func.isRequired
        }),
    vm:
        PropTypes.shape({
            addListener:
                PropTypes.func.isRequired,
            getEasyBloxControllerComponents:
                PropTypes.func,
            removeListener:
                PropTypes.func.isRequired,
            setArduinoUnoControllerBindingManifest:
                PropTypes.func,
            setEasyBloxControllerComponents:
                PropTypes.func
        })
};

ControllerDesktopWindowContainer.defaultProps = {
    isOpen:
        false,
    onConnectionStateChange:
        () => {},
    projectBridge:
        null,
    session:
        null,
    vm:
        null
};

const mapStateToProps =
    function (state) {
        return {
            isOpen:
                isControllerOpen(state),
            vm:
                state.scratchGui.vm
        };
    };

const mapDispatchToProps =
    function (dispatch) {
        return {
            onConnectionStateChange:
                function (isConnected) {
                    return dispatch(
                        setControllerConnected(
                            isConnected
                        )
                    );
                },
            onRequestClose:
                () => dispatch(
                    closeController()
                )
        };
    };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ControllerDesktopWindowContainer);
