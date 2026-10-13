import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {
    closeAlert,
    filterPopupAlerts
} from '../reducers/alerts';

import AlertsComponent from '../components/alerts/alerts.jsx';

const Alerts = ({
    alertsList,
    className,
    onCloseAlert
}) => (
    <AlertsComponent
        // only display standard and extension alerts here
        alertsList={filterPopupAlerts(alertsList.map((alert, sourceIndex) => ({...alert, sourceIndex})))}
        className={className}
        onCloseAlert={onCloseAlert}
    />
);

Alerts.propTypes = {
    alertsList: PropTypes.arrayOf(PropTypes.object),
    className: PropTypes.string,
    onCloseAlert: PropTypes.func
};

const mapStateToProps = state => ({
    alertsList: state.scratchGui.alerts.alertsList
});

const mapDispatchToProps = dispatch => ({
    onCloseAlert: (index, instanceId) => dispatch(closeAlert(index, instanceId))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Alerts);
