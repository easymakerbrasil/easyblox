import React from 'react';
import {
    fireEvent,
    render,
    screen,
    waitFor
} from '@testing-library/react';
import '@testing-library/jest-dom';

import {
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
} from '@easymaker/easyconect-core';

import {
    EasyConectDesktopWindowContainer
} from '../../../src/containers/easyconect-desktop-window.jsx';

class FakeMotorsServoSession {
    constructor () {
        this.motorCalls = [];
        this.servoCalls = [];
    }

    getMotorValue () {
        return 0;
    }

    getServoAngle () {
        return 0;
    }

    setMotorValue (
        signalId,
        value
    ) {
        this.motorCalls.push({
            signalId,
            value
        });

        return Promise.resolve(
            true
        );
    }

    setServoAngle (
        signalId,
        angle
    ) {
        this.servoCalls.push({
            signalId,
            angle
        });

        return Promise.resolve(
            true
        );
    }
}

class FakeSession {
    constructor (
        status =
            'connected'
    ) {
        this.state = {
            status,
            devices: [],
            connectedDeviceName:
                status ===
                    'connected' ?
                    'EasyMaker-39' :
                    null,
            errorCode:
                null
        };

        this.motorsServoSession =
            new FakeMotorsServoSession();

        this.connect =
            jest.fn();

        this.disconnect =
            jest.fn();

        this.selectDevice =
            jest.fn();

        this.onStateChange =
            jest.fn(
                () =>
                    () => {}
            );

        this.getControlsSession =
            jest.fn(
                () => null
            );

        this.getGamepadSession =
            jest.fn(
                () => null
            );

        this.getOutputsSession =
            jest.fn(
                () => null
            );

        this.getTerminalSession =
            jest.fn(
                () => null
            );

        this.getMotorsServoSession =
            jest.fn(
                () =>
                    this.motorsServoSession
            );
    }

    getState () {
        return {
            ...this.state,
            devices:
                [...this.state.devices]
        };
    }
}

const openMotorsServo =
    () => {
        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name:
                        'Abrir Motores e Servos'
                }
            )
        );
    };

describe(
    'EasyConect Desktop Motors Servo container bridge',
    () => {
        test('forwards the active Motors Servo session while Bluetooth is connected', async () => {
            const session =
                new FakeSession(
                    'connected'
                );

            render(
                <EasyConectDesktopWindowContainer
                    isOpen
                    onRequestClose={
                        jest.fn()
                    }
                    session={
                        session
                    }
                />
            );

            expect(
                session
                    .getMotorsServoSession
            ).toHaveBeenCalledTimes(
                1
            );

            openMotorsServo();

            fireEvent.change(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                ),
                {
                    target: {
                        value:
                            '-60'
                    }
                }
            );

            fireEvent.change(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Servo 1'
                    }
                ),
                {
                    target: {
                        value:
                            '120'
                    }
                }
            );

            await waitFor(
                () => {
                    expect(
                        session
                            .motorsServoSession
                            .motorCalls
                    ).toEqual([
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -60
                        }
                    ]);

                    expect(
                        session
                            .motorsServoSession
                            .servoCalls
                    ).toEqual([
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .SERVO_1,
                            angle:
                                120
                        }
                    ]);
                }
            );
        });

        test('does not expose the Motors Servo session while Bluetooth is disconnected', () => {
            const session =
                new FakeSession(
                    'disconnected'
                );

            render(
                <EasyConectDesktopWindowContainer
                    isOpen
                    onRequestClose={
                        jest.fn()
                    }
                    session={
                        session
                    }
                />
            );

            expect(
                session
                    .getMotorsServoSession
            ).not.toHaveBeenCalled();

            openMotorsServo();

            expect(
                screen.getByText(
                    'Conecte o Bluetooth para usar Motores e Servos.'
                )
            ).toBeInTheDocument();

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                )
            ).toBeDisabled();
        });
    }
);
