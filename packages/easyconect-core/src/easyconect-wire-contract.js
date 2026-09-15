const {
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_CONTROLS_SIGNAL_IDS
} = require('./easyconect-contract');

const EASYCONECT_SIGNAL_WIRE_CHANNELS =
    Object.freeze({
        [EASYCONECT_GAMEPAD_SIGNAL_IDS.DPAD_UP]:
            'gp.du',
        [EASYCONECT_GAMEPAD_SIGNAL_IDS.DPAD_DOWN]:
            'gp.dd',
        [EASYCONECT_GAMEPAD_SIGNAL_IDS.DPAD_LEFT]:
            'gp.dl',
        [EASYCONECT_GAMEPAD_SIGNAL_IDS.DPAD_RIGHT]:
            'gp.dr',
        [EASYCONECT_GAMEPAD_SIGNAL_IDS.ACTION_TOP]:
            'gp.at',
        [EASYCONECT_GAMEPAD_SIGNAL_IDS.ACTION_LEFT]:
            'gp.al',
        [EASYCONECT_GAMEPAD_SIGNAL_IDS.ACTION_BOTTOM]:
            'gp.ab',
        [EASYCONECT_GAMEPAD_SIGNAL_IDS.ACTION_RIGHT]:
            'gp.ar',
        [EASYCONECT_CONTROLS_SIGNAL_IDS.JOYSTICK_X]:
            'ct.jx',
        [EASYCONECT_CONTROLS_SIGNAL_IDS.JOYSTICK_Y]:
            'ct.jy',
        [EASYCONECT_CONTROLS_SIGNAL_IDS.SLIDER]:
            'ct.sl',
        [EASYCONECT_CONTROLS_SIGNAL_IDS.BUTTON]:
            'ct.bt',
        [EASYCONECT_CONTROLS_SIGNAL_IDS.SWITCH]:
            'ct.sw'
    });

const EASYCONECT_WIRE_CHANNEL_SIGNAL_IDS =
    Object.freeze(
        Object.fromEntries(
            Object.entries(
                EASYCONECT_SIGNAL_WIRE_CHANNELS
            ).map(
                ([signalId, channel]) => [
                    channel,
                    signalId
                ]
            )
        )
    );

/**
 * Get the canonical EBCP wire channel for one EasyConect signal.
 * @param {string} signalId EasyConect signal ID.
 * @returns {?string} canonical wire channel, or null when unknown.
 */
const getEasyConectWireChannel = signalId => {
    if (
        !Object.prototype.hasOwnProperty.call(
            EASYCONECT_SIGNAL_WIRE_CHANNELS,
            signalId
        )
    ) {
        return null;
    }

    return EASYCONECT_SIGNAL_WIRE_CHANNELS[
        signalId
    ];
};

/**
 * Resolve one canonical EasyConect signal from its EBCP wire channel.
 * @param {string} channel EBCP wire channel.
 * @returns {?string} canonical signal ID, or null when unknown.
 */
const getEasyConectSignalIdForWireChannel =
    channel => {
        if (
            !Object.prototype.hasOwnProperty.call(
                EASYCONECT_WIRE_CHANNEL_SIGNAL_IDS,
                channel
            )
        ) {
            return null;
        }

        return EASYCONECT_WIRE_CHANNEL_SIGNAL_IDS[
            channel
        ];
    };

module.exports = {
    EASYCONECT_SIGNAL_WIRE_CHANNELS,
    getEasyConectWireChannel,
    getEasyConectSignalIdForWireChannel
};
