import {connect} from 'react-redux';

import ControllerDesktopWindow
    from '../components/controller-desktop-window/controller-desktop-window.jsx';

import {
    closeController,
    isControllerOpen
} from '../reducers/controller-desktop';

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
)(ControllerDesktopWindow);
