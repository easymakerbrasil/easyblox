import {STAGE_PREPARATION_ALERT_IDS} from './alerts/index.jsx';
import {closeAlertsWithId, showAlertWithTimeout, showStandardAlert} from '../reducers/alerts';

export const clearStagePreparationAlerts = function (dispatch, scopeId) {
    for (const alertId of Object.values(STAGE_PREPARATION_ALERT_IDS)) {
        dispatch(closeAlertsWithId(alertId, scopeId));
    }
};

export const showStagePreparationAlert = function (dispatch, status) {
    const data = {message: status.message, scopeId: status.scopeId};
    switch (status.state) {
    case 'stage-ready':
        return showAlertWithTimeout(dispatch, STAGE_PREPARATION_ALERT_IDS.success, data);
    case 'error':
        dispatch(showStandardAlert(STAGE_PREPARATION_ALERT_IDS.error, data));
        break;
    case 'restoring-stage':
    case 'reconnecting-stage':
        dispatch(showStandardAlert(STAGE_PREPARATION_ALERT_IDS.progress, data));
        break;
    default:
        break;
    }
    return null;
};
