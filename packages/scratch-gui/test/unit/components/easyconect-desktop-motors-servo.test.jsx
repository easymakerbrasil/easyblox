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

import EasyConectDesktopWindow
    from '../../../src/components/easyconect-desktop-window/easyconect-desktop-window.jsx';

const connectedState = {
    status:
        'connected',
    devices: [],
    connectedDeviceName:
        'EasyMaker-39',
    errorCode:
        null
};

const disconnectedState = {
    status:
        'disconnected',
    devices: [],
    connectedDeviceName:
        null,
    errorCode:
        null
};

class FakeMotorsServoSession {
    constructor () {
        this.motorValues = {
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_1]:
                0,
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_2]:
                0
        };

        this.servoAngles = {
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

        this.motorCalls = [];
        this.servoCalls = [];
    }

    getMotorValue (signalId) {
        return this.motorValues[
            signalId
        ];
    }

    getServoAngle (signalId) {
        return this.servoAngles[
            signalId
        ];
    }

    setMotorValue (
        signalId,
        value
    ) {
        this.motorCalls.push({
            signalId,
            value
        });

        this.motorValues[
            signalId
        ] = value;

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

        this.servoAngles[
            signalId
        ] = angle;

        return Promise.resolve(
            true
        );
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
    'EasyConect Desktop Motors Servo',
    () => {
        test('shows two motor sliders and four Servo sliders with canonical ranges', () => {
            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    motorsServoSession={
                        new FakeMotorsServoSession()
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            const motor1 =
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                );

            const motor2 =
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 2'
                    }
                );

            expect(
                motor1
            ).toHaveAttribute(
                'min',
                '-100'
            );

            expect(
                motor1
            ).toHaveAttribute(
                'max',
                '100'
            );

            expect(
                motor2
            ).toHaveAttribute(
                'min',
                '-100'
            );

            expect(
                motor2
            ).toHaveAttribute(
                'max',
                '100'
            );

            for (
                const name of
                [
                    'Servo 1',
                    'Servo 2',
                    'Servo 3',
                    'Servo 4'
                ]
            ) {
                const servo =
                    screen.getByRole(
                        'slider',
                        {
                            name
                        }
                    );

                expect(
                    servo
                ).toHaveAttribute(
                    'min',
                    '0'
                );

                expect(
                    servo
                ).toHaveAttribute(
                    'max',
                    '180'
                );
            }

            expect(
                screen.getAllByRole(
                    'slider'
                )
            ).toHaveLength(
                6
            );
        });

        test('loads the current actuator values from the active session', () => {
            const session =
                new FakeMotorsServoSession();

            session.motorValues[
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
            ] = -35;

            session.motorValues[
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_2
            ] = 70;

            session.servoAngles[
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1
            ] = 45;

            session.servoAngles[
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_4
            ] = 180;

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    motorsServoSession={
                        session
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                ).value
            ).toBe(
                '-35'
            );

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 2'
                    }
                ).value
            ).toBe(
                '70'
            );

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Servo 1'
                    }
                ).value
            ).toBe(
                '45'
            );

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Servo 4'
                    }
                ).value
            ).toBe(
                '180'
            );
        });

        test('offers exact quick presets for motors without adding Servo presets', async () => {
            const session =
                new FakeMotorsServoSession();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    motorsServoSession={
                        session
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            const motor1 =
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                );

            const reverse =
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Ré'
                    }
                );

            const stopped =
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Parado'
                    }
                );

            const forward =
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Frente'
                    }
                );

            expect(
                reverse
            ).toHaveAttribute(
                'aria-pressed',
                'false'
            );

            expect(
                stopped
            ).toHaveAttribute(
                'aria-pressed',
                'true'
            );

            expect(
                forward
            ).toHaveAttribute(
                'aria-pressed',
                'false'
            );

            fireEvent.click(
                forward
            );

            expect(
                motor1.value
            ).toBe(
                '100'
            );

            expect(
                screen.getByText(
                    '100% · Frente'
                )
            ).toBeInTheDocument();

            expect(
                forward
            ).toHaveAttribute(
                'aria-pressed',
                'true'
            );

            await waitFor(
                () => {
                    expect(
                        session.motorCalls
                    ).toEqual([
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                25
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                50
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                75
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                100
                        }
                    ]);
                }
            );

            fireEvent.change(
                motor1,
                {
                    target: {
                        value:
                            '37'
                    }
                }
            );

            expect(
                motor1.value
            ).toBe(
                '37'
            );

            expect(
                reverse
            ).toHaveAttribute(
                'aria-pressed',
                'false'
            );

            expect(
                stopped
            ).toHaveAttribute(
                'aria-pressed',
                'false'
            );

            expect(
                forward
            ).toHaveAttribute(
                'aria-pressed',
                'false'
            );

            fireEvent.click(
                stopped
            );

            expect(
                motor1.value
            ).toBe(
                '0'
            );

            expect(
                motor1.parentElement
            ).toHaveTextContent(
                '0% · Parado'
            );

            expect(
                stopped
            ).toHaveAttribute(
                'aria-pressed',
                'true'
            );

            fireEvent.click(
                reverse
            );

            expect(
                motor1.value
            ).toBe(
                '-100'
            );

            expect(
                screen.getByText(
                    '-100% · Ré'
                )
            ).toBeInTheDocument();

            expect(
                reverse
            ).toHaveAttribute(
                'aria-pressed',
                'true'
            );

            await waitFor(
                () => {
                    expect(
                        session.motorCalls.slice(-5)
                    ).toEqual([
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                0
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -25
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -50
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -75
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -100
                        }
                    ]);
                }
            );

            expect(
                screen.queryByRole(
                    'button',
                    {
                        name:
                            'Servo 1: Frente'
                    }
                )
            ).not.toBeInTheDocument();
        });

        test('decelerates a running motor progressively when Parado is clicked', async () => {
            const session =
                new FakeMotorsServoSession();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    motorsServoSession={
                        session
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Frente'
                    }
                )
            );

            await waitFor(
                () => {
                    expect(
                        session.motorCalls
                            .slice(-4)
                    ).toEqual([
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                25
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                50
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                75
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                100
                        }
                    ]);
                }
            );

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Parado'
                    }
                )
            );

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                ).value
            ).toBe(
                '0'
            );

            await waitFor(
                () => {
                    expect(
                        session.motorCalls
                            .slice(-4)
                    ).toEqual([
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                75
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                50
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                25
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                0
                        }
                    ]);
                },
                {
                    timeout:
                        2000
                }
            );
        });

        test('decelerates through zero before reversing motor direction', async () => {
            const session =
                new FakeMotorsServoSession();

            session.motorValues[
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
            ] = 100;

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    motorsServoSession={
                        session
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Ré'
                    }
                )
            );

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                ).value
            ).toBe(
                '-100'
            );

            await waitFor(
                () => {
                    expect(
                        session.motorCalls
                    ).toEqual([
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                75
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                50
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                25
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                0
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -25
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -50
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -75
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -100
                        }
                    ]);
                },
                {
                    timeout:
                        2500
                }
            );
        });

        test('cancels an active motor preset ramp when the slider is adjusted manually', async () => {
            const session =
                new FakeMotorsServoSession();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    motorsServoSession={
                        session
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Frente'
                    }
                )
            );

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
                            '37'
                    }
                }
            );

            await Promise.resolve();
            await Promise.resolve();

            expect(
                session.motorCalls
            ).toEqual([
                {
                    signalId:
                        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                            .MOTOR_1,
                    value:
                        25
                },
                {
                    signalId:
                        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                            .MOTOR_1,
                    value:
                        37
                }
            ]);

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                ).value
            ).toBe(
                '37'
            );
        });

        test('disables motor quick presets while Bluetooth is disconnected', () => {
            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        disconnectedState
                    }
                    motorsServoSession={
                        null
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Ré'
                    }
                )
            ).toBeDisabled();

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Parado'
                    }
                )
            ).toBeDisabled();

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Motor 1: Frente'
                    }
                )
            ).toBeDisabled();
        });

        test('forwards motor and Servo changes only through the active session', async () => {
            const session =
                new FakeMotorsServoSession();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    motorsServoSession={
                        session
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
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
                            '-50'
                    }
                }
            );

            fireEvent.change(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 2'
                    }
                ),
                {
                    target: {
                        value:
                            '80'
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
                            '135'
                    }
                }
            );

            await waitFor(
                () => {
                    expect(
                        session.motorCalls
                    ).toEqual([
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1,
                            value:
                                -50
                        },
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_2,
                            value:
                                80
                        }
                    ]);

                    expect(
                        session.servoCalls
                    ).toEqual([
                        {
                            signalId:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .SERVO_1,
                            angle:
                                135
                        }
                    ]);
                }
            );
        });

        test('updates actuator feedback immediately while Bluetooth sends are pending', () => {
            const session =
                new FakeMotorsServoSession();

            session.setMotorValue =
                jest.fn(
                    () =>
                        new Promise(
                            () => {}
                        )
                );

            session.setServoAngle =
                jest.fn(
                    () =>
                        new Promise(
                            () => {}
                        )
                );

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    motorsServoSession={
                        session
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            const motor1 =
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                );

            const servo1 =
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Servo 1'
                    }
                );

            fireEvent.change(
                motor1,
                {
                    target: {
                        value:
                            '-50'
                    }
                }
            );

            fireEvent.change(
                servo1,
                {
                    target: {
                        value:
                            '135'
                    }
                }
            );

            expect(
                motor1.value
            ).toBe(
                '-50'
            );

            expect(
                screen.getByText(
                    '-50% · Ré'
                )
            ).toBeInTheDocument();

            expect(
                servo1.value
            ).toBe(
                '135'
            );

            expect(
                screen.getByText(
                    '135°'
                )
            ).toBeInTheDocument();

            expect(
                session.setMotorValue
            ).toHaveBeenCalledWith(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1,
                -50
            );

            expect(
                session.setServoAngle
            ).toHaveBeenCalledWith(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1,
                135
            );
        });

        test('rolls actuator feedback back when a Bluetooth send fails', async () => {
            const session =
                new FakeMotorsServoSession();

            session.motorValues[
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
            ] = 25;

            session.servoAngles[
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1
            ] = 60;

            session.setMotorValue =
                jest.fn(
                    () =>
                        Promise.reject(
                            new Error(
                                'motor send failed'
                            )
                        )
                );

            session.setServoAngle =
                jest.fn(
                    () =>
                        Promise.reject(
                            new Error(
                                'Servo send failed'
                            )
                        )
                );

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    motorsServoSession={
                        session
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            const motor1 =
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Motor 1'
                    }
                );

            const servo1 =
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Servo 1'
                    }
                );

            fireEvent.change(
                motor1,
                {
                    target: {
                        value:
                            '80'
                    }
                }
            );

            fireEvent.change(
                servo1,
                {
                    target: {
                        value:
                            '135'
                    }
                }
            );

            expect(
                motor1.value
            ).toBe(
                '80'
            );

            expect(
                servo1.value
            ).toBe(
                '135'
            );

            await waitFor(
                () => {
                    expect(
                        motor1.value
                    ).toBe(
                        '25'
                    );

                    expect(
                        servo1.value
                    ).toBe(
                        '60'
                    );
                }
            );
        });

        test('shows Motors Servo unavailable and disables all actuators while disconnected', () => {
            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        disconnectedState
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openMotorsServo();

            expect(
                screen.getByText(
                    'Conecte o Bluetooth para usar Motores e Servos.'
                )
            ).toBeInTheDocument();

            expect(
                screen.getAllByRole(
                    'slider'
                )
            ).toHaveLength(
                6
            );

            for (
                const slider of
                screen.getAllByRole(
                    'slider'
                )
            ) {
                expect(
                    slider
                ).toBeDisabled();
            }
        });
    }
);
