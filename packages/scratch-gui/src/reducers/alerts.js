import alertsData, {AlertTypes, AlertLevels} from '../lib/alerts/index.jsx';
import extensionData from '../lib/libraries/extensions/index.jsx';

const SHOW_ALERT = 'scratch-gui/alerts/SHOW_ALERT';
const SHOW_EXTENSION_ALERT = 'scratch-gui/alerts/SHOW_EXTENSION_ALERT';
const CLOSE_ALERT = 'scratch-gui/alerts/CLOSE_ALERT';
const CLOSE_ALERTS_WITH_ID = 'scratch-gui/alerts/CLOSE_ALERTS_WITH_ID';
const CLOSE_ALERT_WITH_ID = 'scratch-gui/alerts/CLOSE_ALERT_WITH_ID';
let nextAlertInstanceId = 0;

/**
 * Initial state of alerts reducer
 *
 * {bool} visible - whether the alerts are visible
 * {array} alertsList - list of alerts, each with properties:
 *  alertType (required): one of AlertTypes
 *  closeButton (optional): bool indicating that we should show close button
 *  content (optional): react element (a <FormattedMessage />)
 *  extentionId (optional): id string that identifies the extension
 *  iconURL (optional): string
 *  level (required): string, one of AlertLevels
 *  message (optional): string
 *  showReconnect (optional): bool
 */
const initialState = {
    visible: true,
    alertsList: []
};

const filterPopupAlerts = alertsList => (
    alertsList.filter(curAlert => (
        curAlert.alertType === AlertTypes.STANDARD ||
        curAlert.alertType === AlertTypes.EXTENSION
    ))
);

const filterInlineAlerts = alertsList => (
    alertsList.filter(curAlert => (
        curAlert.alertType === AlertTypes.INLINE
    ))
);

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SHOW_ALERT: { // intended to show standard and inline alerts, but not extensions
        const alertId = action.alertId;
        if (alertId) {
            const newAlert = {
                alertId: alertId,
                instanceId: action.instanceId,
                level: AlertLevels.WARN // default level
            };
            const alertData = alertsData.find(thisAlertData => thisAlertData.alertId === alertId);
            if (alertData) {
                const newList = state.alertsList.filter(curAlert => (
                    !alertData.clearList || alertData.clearList.indexOf(curAlert.alertId) === -1 ||
                    (alertData.allowRuntimeMessage && curAlert.scopeId !== action.data?.scopeId)
                ));
                if (alertData.allowRuntimeMessage && action.data) {
                    newAlert.message = action.data.message;
                    newAlert.scopeId = action.data.scopeId;
                }

                newAlert.announcementRole = alertData.announcementRole;
                newAlert.alertType = alertData.alertType || AlertTypes.STANDARD;
                newAlert.closeButton = alertData.closeButton;
                newAlert.content = alertData.content;
                newAlert.iconURL = alertData.iconURL;
                newAlert.iconSpinner = alertData.iconSpinner;
                newAlert.level = alertData.level;
                newAlert.showDownload = alertData.showDownload;
                newAlert.showSaveNow = alertData.showSaveNow;

                newList.push(newAlert);
                return Object.assign({}, state, {
                    alertsList: newList
                });
            }
        }
        return state; // if alert not found, show nothing
    }
    case SHOW_EXTENSION_ALERT: {
        const extensionId = action.data.extensionId;
        if (extensionId) {
            const extension = extensionData.find(ext => ext.extensionId === extensionId);
            if (extension) {
                const newList = state.alertsList.slice();
                const newAlert = {
                    alertType: AlertTypes.EXTENSION,
                    instanceId: action.instanceId,
                    closeButton: true,
                    extensionId: extensionId,
                    extensionName: extension.name,
                    iconURL: extension.connectionSmallIconURL,
                    level: AlertLevels.WARN,
                    showReconnect: true
                };
                newList.push(newAlert);

                return Object.assign({}, state, {
                    alertsList: newList
                });
            }
        }
        return state; // if alert not found, show nothing
    }
    case CLOSE_ALERT_WITH_ID:
    case CLOSE_ALERT: {
        let index = action.index;
        if (action.instanceId) {
            index = state.alertsList.findIndex(({instanceId}) => instanceId === action.instanceId);
        } else if (action.alertId) {
            index = state.alertsList.findIndex(a => a.alertId === action.alertId);
        }
        if (index === -1) return state;
        const newList = state.alertsList.slice();
        newList.splice(index, 1);
        return Object.assign({}, state, {
            alertsList: newList
        });
    }
    case CLOSE_ALERTS_WITH_ID: {
        return Object.assign({}, state, {
            alertsList: state.alertsList.filter(curAlert => (
                curAlert.alertId !== action.alertId ||
                (typeof action.scopeId !== 'undefined' && curAlert.scopeId !== action.scopeId)
            ))
        });
    }
    default:
        return state;
    }
};

/**
 * Action creator to close an alert with the given index.
 * @param {object} index - the index of the alert to close.
 * @param {string} [instanceId] - Stable identity, preferred over the index when supplied.
 * @returns {object} - an object to be passed to the reducer.
 */
const closeAlert = function (index, instanceId) {
    return {
        type: CLOSE_ALERT,
        index,
        instanceId
    };
};

/**
 * Action creator to close all alerts with a given ID.
 * @param {string} alertId - id string of the alert to close
 * @param {string} [scopeId] - Limit removal to alerts owned by this GUI instance.
 * @returns {object} - an object to be passed to the reducer.
 */
const closeAlertsWithId = function (alertId, scopeId) {
    return {
        type: CLOSE_ALERTS_WITH_ID,
        alertId,
        scopeId
    };
};

/**
 * Action creator to close a single alert with a given ID.
 * @param {string} alertId - id string of the alert to close
 * @param {string} [instanceId] - Close this specific instance rather than the first matching ID.
 * @returns {object} - an object to be passed to the reducer.
 */
const closeAlertWithId = function (alertId, instanceId) {
    return {
        type: CLOSE_ALERT_WITH_ID,
        alertId,
        instanceId
    };
};

/**
 * Action creator to show an alert with the given alertId.
 * @param {string} alertId - id string of the alert to show
 * @param {object} [data] - Runtime message and scope for alerts opting in to runtime content.
 * @returns {object} - an object to be passed to the reducer.
 */
const showStandardAlert = function (alertId, data) {
    return {
        type: SHOW_ALERT,
        alertId,
        instanceId: `alert-${++nextAlertInstanceId}`,
        data
    };
};

/**
 * Action creator to show an alert with the given input data.
 * @param {object} data - data for the alert
 * @param {string} data.message - message for the alert
 * @param {string} data.extensionId - extension ID for the alert
 * @returns {object} - an object to be passed to the reducer.
 */
const showExtensionAlert = function (data) {
    return {
        type: SHOW_EXTENSION_ALERT,
        instanceId: `alert-${++nextAlertInstanceId}`,
        data
    };
};

/**
 * Function to dispatch showing an alert, with optional
 * timeout to make it close/go away.
 * @param {object} dispatch - dispatch function
 * @param {string} alertId - the ID of the alert
 * @param {object} [data] - Runtime message and scope for alerts opting in to runtime content.
 * @returns {number|undefined} Timeout handle when the registered alert has a timeout.
 */
const showAlertWithTimeout = function (dispatch, alertId, data) {
    const alertData = alertsData.find(thisAlertData => thisAlertData.alertId === alertId);
    if (alertData) {
        const action = showStandardAlert(alertId, data);
        dispatch(action);
        if (alertData.maxDisplaySecs) {
            return setTimeout(() => {
                dispatch(closeAlertWithId(alertId, action.instanceId));
            }, alertData.maxDisplaySecs * 1000);
        }
    }
};

export {
    reducer as default,
    initialState as alertsInitialState,
    closeAlert,
    closeAlertWithId,
    closeAlertsWithId,
    filterInlineAlerts,
    filterPopupAlerts,
    showAlertWithTimeout,
    showExtensionAlert,
    showStandardAlert
};
