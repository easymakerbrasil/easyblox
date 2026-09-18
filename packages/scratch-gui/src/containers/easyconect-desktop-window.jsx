import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import EasyConectDesktopWindow
    from '../components/easyconect-desktop-window/easyconect-desktop-window.jsx';
import EasyConectDesktopSession
    from '../lib/easyconect-desktop-session';

import {
    closeEasyConect,
    isEasyConectOpen,
    setEasyConectConnected
} from '../reducers/easyconect-desktop';

const NOOP =
    () => {};

export const EasyConectDesktopWindowContainer = ({
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

    const terminalSession =
        connectionState.status ===
            'connected' ?
            easyConectSession
                .getTerminalSession() :
            null;

    return (
        <EasyConectDesktopWindow
            connectionState={connectionState}
            isOpen={isOpen}
            terminalSession={terminalSession}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRequestClose={onRequestClose}
            onSelectDevice={handleSelectDevice}
        />
    );
};

EasyConectDesktopWindowContainer.propTypes = {
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
