import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import EasyConectDesktopWindow
    from '../components/easyconect-desktop-window/easyconect-desktop-window.jsx';
import EasyConectDesktopSession
    from '../lib/easyconect-desktop-session';

import {
    isExtensionActive
} from '../reducers/active-extensions';
import {
    closeEasyConect,
    isEasyConectOpen,
    setEasyConectConnected
} from '../reducers/easyconect-desktop';

const EASYBLOX_BT_EXTENSION_ID =
    'easybloxBt';

const NOOP =
    () => {};

export const EasyConectDesktopWindowContainer = ({
    easyBloxBtActive = false,
    isOpen = false,
    onConnectionStateChange = NOOP,
    onRequestClose,
    session = null
}) => {
    const [
        easyConectSession
    ] = React.useState(
        () =>
            session ||
            new EasyConectDesktopSession()
    );

    const [
        connectionState,
        setConnectionState
    ] = React.useState(
        () =>
            easyConectSession
                .getState()
    );

    React.useEffect(
        () =>
            easyConectSession
                .onStateChange(
                    nextState => {
                        setConnectionState(
                            nextState
                        );
                    }
                ),
        [easyConectSession]
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

    const previousEasyBloxBtActiveRef =
        React.useRef(
            easyBloxBtActive
        );

    React.useEffect(
        () => {
            const wasEasyBloxBtActive =
                previousEasyBloxBtActiveRef.current;

            previousEasyBloxBtActiveRef.current =
                easyBloxBtActive;

            if (
                !wasEasyBloxBtActive ||
                easyBloxBtActive
            ) {
                return;
            }

            easyConectSession
                .disconnect();

            onRequestClose();
        },
        [
            easyBloxBtActive,
            easyConectSession,
            onRequestClose
        ]
    );

    const handleConnect =
        React.useCallback(
            () => {
                easyConectSession
                    .connect();
            },
            [easyConectSession]
        );

    const handleDisconnect =
        React.useCallback(
            () => {
                easyConectSession
                    .disconnect();
            },
            [easyConectSession]
        );

    const handleSelectDevice =
        React.useCallback(
            key => {
                easyConectSession
                    .selectDevice(
                        key
                    );
            },
            [easyConectSession]
        );

    const controlsSession =
        connectionState.status ===
            'connected' ?
            easyConectSession
                .getControlsSession() :
            null;

    const gamepadSession =
        connectionState.status ===
            'connected' ?
            easyConectSession
                .getGamepadSession() :
            null;

    const motorsServoSession =
        connectionState.status ===
            'connected' ?
            easyConectSession
                .getMotorsServoSession() :
            null;

    const terminalSession =
        connectionState.status ===
            'connected' ?
            easyConectSession
                .getTerminalSession() :
            null;

    const outputsSession =
        connectionState.status ===
            'connected' ?
            easyConectSession
                .getOutputsSession() :
            null;

    return (
        <EasyConectDesktopWindow
            connectionState={connectionState}
            controlsSession={controlsSession}
            gamepadSession={gamepadSession}
            isOpen={isOpen}
            motorsServoSession={motorsServoSession}
            outputsSession={outputsSession}
            terminalSession={terminalSession}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRequestClose={onRequestClose}
            onSelectDevice={handleSelectDevice}
        />
    );
};

EasyConectDesktopWindowContainer.propTypes = {
    easyBloxBtActive:
        PropTypes.bool,
    isOpen:
        PropTypes.bool,
    onConnectionStateChange:
        PropTypes.func,
    onRequestClose:
        PropTypes.func.isRequired,
    session:
        PropTypes.shape({
            connect:
                PropTypes.func.isRequired,
            disconnect:
                PropTypes.func.isRequired,
            getState:
                PropTypes.func.isRequired,
            getControlsSession:
                PropTypes.func.isRequired,
            getGamepadSession:
                PropTypes.func.isRequired,
            getMotorsServoSession:
                PropTypes.func.isRequired,
            getOutputsSession:
                PropTypes.func.isRequired,
            getTerminalSession:
                PropTypes.func.isRequired,
            onStateChange:
                PropTypes.func.isRequired,
            selectDevice:
                PropTypes.func.isRequired
        })
};

const mapStateToProps =
    function (state) {
        return {
            easyBloxBtActive:
                isExtensionActive(
                    state,
                    EASYBLOX_BT_EXTENSION_ID
                ),
            isOpen:
                isEasyConectOpen(state)
        };
    };

const mapDispatchToProps =
    function (dispatch) {
        return {
            onConnectionStateChange:
                function (isConnected) {
                    return dispatch(
                        setEasyConectConnected(
                            isConnected
                        )
                    );
                },
            onRequestClose:
                () => dispatch(
                    closeEasyConect()
                )
        };
    };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EasyConectDesktopWindowContainer);
