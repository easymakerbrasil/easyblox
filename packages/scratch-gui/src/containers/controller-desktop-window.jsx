import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import ControllerDesktopWindow
    from '../components/controller-desktop-window/controller-desktop-window.jsx';
import EasyBloxControllerDesktopSession
    from '../lib/easyblox-controller-desktop-session';

import {
    closeController,
    isControllerOpen
} from '../reducers/controller-desktop';

export const ControllerDesktopWindowContainer = ({
    isOpen,
    onRequestClose,
    session
}) => {
    const [
        controllerSession
    ] = React.useState(
        () =>
            session ||
            new EasyBloxControllerDesktopSession()
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
        key => {
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
            onStateChange:
                PropTypes.func.isRequired,
            selectDevice:
                PropTypes.func.isRequired
        })
};

ControllerDesktopWindowContainer.defaultProps = {
    isOpen:
        false,
    session:
        null
};

const mapStateToProps = state => ({
    isOpen:
        isControllerOpen(state)
});

const mapDispatchToProps = dispatch => ({
    onRequestClose:
        () => dispatch(
            closeController()
        )
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ControllerDesktopWindowContainer);
