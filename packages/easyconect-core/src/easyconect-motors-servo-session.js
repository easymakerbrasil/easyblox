const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
} = require('./easyconect-contract');

const {
    validateEasyConectSignalValue
} = require('./easyconect-registry');

const {
    getEasyConectWireChannel
} = require('./easyconect-wire-contract');

const NUMBER =
    EBCP_CONTRACT
        .messageTypes
        .NUMBER;

const MOTOR_SIGNAL_IDS =
    new Set([
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .MOTOR_1,
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .MOTOR_2
    ]);

const SERVO_SIGNAL_IDS =
    new Set([
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_1,
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_2,
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_3,
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_4
    ]);

class EasyConectMotorsServoSession {
    constructor ({
        connection
    } = {}) {
        if (
            !connection ||
            typeof connection !==
                'object'
        ) {
            throw new Error(
                'EasyConect Motors Servo connection is required'
            );
        }

        if (
            typeof connection.send !==
                'function'
        ) {
            throw new Error(
                'EasyConect Motors Servo connection send must be a function'
            );
        }

        this._connection =
            connection;

        this._values = {
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_1]:
                0,
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_2]:
                0,
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_1]:
                0,
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_2]:
                0,
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_3]:
                0,
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_4]:
                0
        };
    }

    getMotorValue (signalId) {
        this._assertMotorSignalId(
            signalId
        );

        return this._values[
            signalId
        ];
    }

    getServoAngle (signalId) {
        this._assertServoSignalId(
            signalId
        );

        return this._values[
            signalId
        ];
    }

    async setMotorValue (
        signalId,
        value
    ) {
        this._assertMotorSignalId(
            signalId
        );

        return this._setNumberValue(
            signalId,
            value
        );
    }

    async setServoAngle (
        signalId,
        angle
    ) {
        this._assertServoSignalId(
            signalId
        );

        return this._setNumberValue(
            signalId,
            angle
        );
    }

    async _setNumberValue (
        signalId,
        value
    ) {
        validateEasyConectSignalValue(
            signalId,
            value
        );

        if (
            this._values[
                signalId
            ] ===
            value
        ) {
            return false;
        }

        await this._connection.send(
            NUMBER,
            getEasyConectWireChannel(
                signalId
            ),
            value
        );

        this._values[
            signalId
        ] = value;

        return true;
    }

    _assertMotorSignalId (
        signalId
    ) {
        if (
            !MOTOR_SIGNAL_IDS.has(
                signalId
            )
        ) {
            throw new Error(
                `Unsupported EasyConect motor signal: ${signalId}`
            );
        }
    }

    _assertServoSignalId (
        signalId
    ) {
        if (
            !SERVO_SIGNAL_IDS.has(
                signalId
            )
        ) {
            throw new Error(
                `Unsupported EasyConect Servo signal: ${signalId}`
            );
        }
    }
}

module.exports = {
    EasyConectMotorsServoSession
};
