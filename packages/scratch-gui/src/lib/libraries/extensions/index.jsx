import React from 'react';
import {FormattedMessage} from 'react-intl';

import musicIconURL from './music/music.png';
import musicInsetIconURL from './music/music-small.svg';

import penIconURL from './pen/pen.png';
import penInsetIconURL from './pen/pen-small.svg';

import videoSensingIconURL from './videoSensing/video-sensing.png';
import videoSensingInsetIconURL from './videoSensing/video-sensing-small.svg';

import text2speechIconURL from './text2speech/text2speech.png';
import text2speechInsetIconURL from './text2speech/text2speech-small.svg';

import translateIconURL from './translate/translate.png';
import translateInsetIconURL from './translate/translate-small.png';

import makeymakeyIconURL from './makeymakey/makeymakey.png';
import makeymakeyInsetIconURL from './makeymakey/makeymakey-small.svg';

import arduinoUnoIconURL from './arduinoUno/arduino-uno.svg';
import easybloxBtIconURL from './easybloxBt/easyblox-bt.svg';
import microbitIconURL from './microbit/microbit.png';
import microbitInsetIconURL from './microbit/microbit-small.svg';
import microbitConnectionIconURL from './microbit/microbit-illustration.svg';
import microbitConnectionSmallIconURL from './microbit/microbit-small.svg';

import ev3IconURL from './ev3/ev3.png';
import ev3InsetIconURL from './ev3/ev3-small.svg';
import ev3ConnectionIconURL from './ev3/ev3-hub-illustration.svg';
import ev3ConnectionSmallIconURL from './ev3/ev3-small.svg';

import wedo2IconURL from './wedo2/wedo.png'; // TODO: Rename file names to match variable/prop names?
import wedo2InsetIconURL from './wedo2/wedo-small.svg';
import wedo2ConnectionIconURL from './wedo2/wedo-illustration.svg';
import wedo2ConnectionSmallIconURL from './wedo2/wedo-small.svg';
import wedo2ConnectionTipIconURL from './wedo2/wedo-button-illustration.svg';

import boostIconURL from './boost/boost.png';
import boostInsetIconURL from './boost/boost-small.svg';
import boostConnectionIconURL from './boost/boost-illustration.svg';
import boostConnectionSmallIconURL from './boost/boost-small.svg';
import boostConnectionTipIconURL from './boost/boost-button-illustration.svg';

import gdxforIconURL from './gdxfor/gdxfor.png';
import gdxforInsetIconURL from './gdxfor/gdxfor-small.svg';
import gdxforConnectionIconURL from './gdxfor/gdxfor-illustration.svg';
import gdxforConnectionSmallIconURL from './gdxfor/gdxfor-small.svg';

import faceSensingIconURL from './faceSensing/faceSensing.png';
import faceSensingInsetIconURL from './faceSensing/faceSensing-small.svg';


const extensionLibraryContent = [
    {
        name: (
            <FormattedMessage
                defaultMessage="Music"
                description="Name for the 'Music' extension"
                id="gui.extension.music.name"
            />
        ),
        extensionId: 'music',
        iconURL: musicIconURL,
        insetIconURL: musicInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Play instruments and drums."
                description="Description for the 'Music' extension"
                id="gui.extension.music.description"
            />
        ),
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Pen"
                description="Name for the 'Pen' extension"
                id="gui.extension.pen.name"
            />
        ),
        extensionId: 'pen',
        iconURL: penIconURL,
        insetIconURL: penInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Draw with your sprites."
                description="Description for the 'Pen' extension"
                id="gui.extension.pen.description"
            />
        ),
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Video Sensing"
                description="Name for the 'Video Sensing' extension"
                id="gui.extension.videosensing.name"
            />
        ),
        extensionId: 'videoSensing',
        iconURL: videoSensingIconURL,
        insetIconURL: videoSensingInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Sense motion with the camera."
                description="Description for the 'Video Sensing' extension"
                id="gui.extension.videosensing.description"
            />
        ),
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Face Sensing"
                description="Name for the 'Face Sensing' extension"
                id="gui.extension.faceSensing.name"
            />
        ),
        extensionId: 'faceSensing',
        iconURL: faceSensingIconURL,
        insetIconURL: faceSensingInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Sense faces with the camera."
                description="Description for the 'Face Sensing' extension"
                id="gui.extension.faceSensing.description"
            />
        ),
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Text to Speech"
                description="Name for the Text to Speech extension"
                id="gui.extension.text2speech.name"
            />
        ),
        extensionId: 'text2speech',
        collaborator: 'Amazon Web Services',
        iconURL: text2speechIconURL,
        insetIconURL: text2speechInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Make your projects talk."
                description="Description for the Text to speech extension"
                id="gui.extension.text2speech.description"
            />
        ),
        featured: true,
        internetConnectionRequired: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Translate"
                description="Name for the Translate extension"
                id="gui.extension.translate.name"
            />
        ),
        extensionId: 'translate',
        collaborator: 'Google',
        iconURL: translateIconURL,
        insetIconURL: translateInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Translate text into many languages."
                description="Description for the Translate extension"
                id="gui.extension.translate.description"
            />
        ),
        featured: true,
        internetConnectionRequired: true
    },
    {
        name: 'Makey Makey',
        extensionId: 'makeymakey',
        collaborator: 'JoyLabz',
        iconURL: makeymakeyIconURL,
        insetIconURL: makeymakeyInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Make anything into a key."
                description="Description for the 'Makey Makey' extension"
                id="gui.extension.makeymakey.description"
            />
        ),
        featured: true
    },
    {
        name: 'Arduino UNO',
        extensionId: 'arduinoUno',
        iconURL: arduinoUnoIconURL,
        insetIconURL: arduinoUnoIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Programe placas Arduino UNO e a família EasyMaker."
                description="Description for the Arduino UNO extension"
                id="gui.extension.arduinoUno.description"
            />
        ),
        featured: true,
        disabled: false,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionTransport: 'serial',
        connectionIconURL: arduinoUnoIconURL,
        connectionSmallIconURL: arduinoUnoIconURL,
        prescanMessage: (
            <FormattedMessage
                defaultMessage="Conecte sua placa Arduino UNO ao computador pelo cabo USB e pressione o botão abaixo."
                description="Prompt before selecting an Arduino UNO serial port"
                id="gui.extension.arduinoUno.prescanMessage"
            />
        ),
        scanBeginMessage: (
            <FormattedMessage
                defaultMessage="Selecione a porta serial da sua placa Arduino UNO."
                description="Information shown while selecting an Arduino UNO serial port"
                id="gui.extension.arduinoUno.scanBeginMessage"
            />
        )
    },
    {
        name: 'EasyBlox BT',
        extensionId: 'easybloxBt',
        iconURL: easybloxBtIconURL,
        insetIconURL: easybloxBtIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Comunique seus projetos por Bluetooth usando HC-05 ou HC-06."
                description="Description for the EasyBlox BT extension"
                id="gui.extension.easybloxBt.description"
            />
        ),
        featured: true,
        disabled: false
    },
    {
        name: 'micro:bit',
        extensionId: 'microbit',
        collaborator: 'micro:bit',
        iconURL: microbitIconURL,
        insetIconURL: microbitInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Connect your projects with the world."
                description="Description for the 'micro:bit' extension"
                id="gui.extension.microbit.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: microbitConnectionIconURL,
        connectionSmallIconURL: microbitConnectionSmallIconURL,
        prescanMessage: (
            <FormattedMessage
                defaultMessage="Turn on your micro:bit, then press the button below to start searching for your device."
                description="Prompt before searching for a micro:bit"
                id="gui.extension.microbit.prescanMessage"
            />
        ),
        scanBeginMessage: (
            <FormattedMessage
                defaultMessage="Keep your micro:bit on and nearby."
                description="Information shown while searching for a micro:bit, before one is found"
                id="gui.extension.microbit.scanBeginMessage"
            />
        ),
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their micro:bit."
                id="gui.extension.microbit.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/microbit'
    },
    {
        name: 'Go Direct Force & Acceleration',
        extensionId: 'gdxfor',
        collaborator: 'Vernier',
        iconURL: gdxforIconURL,
        insetIconURL: gdxforInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Sense push, pull, motion, and spin."
                description="Description for the Vernier Go Direct Force and Acceleration sensor extension"
                id="gui.extension.gdxfor.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: gdxforConnectionIconURL,
        connectionSmallIconURL: gdxforConnectionSmallIconURL,
        prescanMessage: (
            <FormattedMessage
                defaultMessage="Turn on your Go Direct, then press the button below to start searching for your device."
                description="Prompt before searching for a Vernier Go Direct device"
                id="gui.extension.gdxfor.prescanMessage"
            />
        ),
        scanBeginMessage: (
            <FormattedMessage
                defaultMessage="Keep your Vernier Go Direct on and nearby."
                description="Information shown while searching for a Vernier Go Direct, before one is found"
                id="gui.extension.gdxfor.scanBeginMessage"
            />
        ),
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their force and acceleration sensor."
                id="gui.extension.gdxfor.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/vernier'
    },
    {
        name: 'LEGO MINDSTORMS EV3',
        extensionId: 'ev3',
        collaborator: 'LEGO',
        iconURL: ev3IconURL,
        insetIconURL: ev3InsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Build interactive robots and more."
                description="Description for the 'LEGO MINDSTORMS EV3' extension"
                id="gui.extension.ev3.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: ev3ConnectionIconURL,
        connectionSmallIconURL: ev3ConnectionSmallIconURL,
        prescanMessage: (
            <FormattedMessage
                defaultMessage="Turn on your LEGO EV3, then press the button below to start searching for your device."
                description="Prompt before searching for a LEGO EV3"
                id="gui.extension.ev3.prescanMessage"
            />
        ),
        scanBeginMessage: (
            <FormattedMessage
                defaultMessage="Keep your LEGO EV3 on and nearby."
                description="Information shown while searching for a LEGO EV3, before one is found"
                id="gui.extension.ev3.scanBeginMessage"
            />
        ),
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting. Make sure the pin on your EV3 is set to 1234."
                description="Message to help people connect to their EV3. Must note the PIN should be 1234."
                id="gui.extension.ev3.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/ev3'
    },
    {
        name: 'LEGO BOOST',
        extensionId: 'boost',
        collaborator: 'LEGO',
        iconURL: boostIconURL,
        insetIconURL: boostInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Bring robotic creations to life."
                description="Description for the 'LEGO BOOST' extension"
                id="gui.extension.boost.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: true,
        connectionIconURL: boostConnectionIconURL,
        connectionSmallIconURL: boostConnectionSmallIconURL,
        connectionTipIconURL: boostConnectionTipIconURL,
        prescanMessage: (
            <FormattedMessage
                // eslint-disable-next-line @stylistic/max-len
                defaultMessage="Press the button on your LEGO BOOST, then press the button below to start searching for your device."
                description="Prompt before searching for a LEGO BOOST"
                id="gui.extension.boost.prescanMessage"
            />
        ),
        scanBeginMessage: (
            <FormattedMessage
                defaultMessage="Keep your LEGO BOOST awake and nearby."
                description="Information shown while searching for a LEGO BOOST, before one is found"
                id="gui.extension.boost.scanBeginMessage"
            />
        ),
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their BOOST."
                id="gui.extension.boost.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/boost'
    },
    {
        name: 'LEGO Education WeDo 2.0',
        extensionId: 'wedo2',
        collaborator: 'LEGO',
        iconURL: wedo2IconURL,
        insetIconURL: wedo2InsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Build with motors and sensors."
                description="Description for the 'LEGO WeDo 2.0' extension"
                id="gui.extension.wedo2.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: true,
        connectionIconURL: wedo2ConnectionIconURL,
        connectionSmallIconURL: wedo2ConnectionSmallIconURL,
        connectionTipIconURL: wedo2ConnectionTipIconURL,
        prescanMessage: (
            <FormattedMessage
                // eslint-disable-next-line @stylistic/max-len
                defaultMessage="Press the button on your LEGO WeDo 2.0, then press the button below to start searching for your device."
                description="Prompt before searching for a LEGO WeDo 2.0"
                id="gui.extension.wedo2.prescanMessage"
            />
        ),
        scanBeginMessage: (
            <FormattedMessage
                defaultMessage="Keep your LEGO WeDo 2.0 awake and nearby."
                description="Information shown while searching for a LEGO WeDo 2.0, before one is found"
                id="gui.extension.wedo2.scanBeginMessage"
            />
        ),
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their WeDo."
                id="gui.extension.wedo2.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/wedo'
    }
];

const BOARD_METADATA = {
    arduinoUno: {
        boardId: 'arduino-uno',
        kind: 'board',
        supportedModes: [
            'stage',
            'upload'
        ],
        visible: true
    },
    microbit: {
        boardId: 'microbit',
        kind: 'board',
        supportedModes: [
            'stage'
        ],
        visible: true
    },
    ev3: {
        kind: 'board',
        visible: false
    },
    boost: {
        kind: 'board',
        visible: false
    },
    wedo2: {
        kind: 'board',
        visible: false
    }
};

const classifiedLibraryContent = extensionLibraryContent.map(item => ({
    kind: 'extension',
    visible: true,
    ...item,
    ...(BOARD_METADATA[item.extensionId] || {})
}));

export const getVisibleExtensions = () =>
    classifiedLibraryContent.filter(item =>
        item.kind === 'extension' && item.visible
    );

export const getVisibleBoards = () =>
    classifiedLibraryContent.filter(item =>
        item.kind === 'board' && item.visible
    );

export const getBoardById = boardId =>
    getVisibleBoards().find(item => item.boardId === boardId) || null;

export const filterBlocksXMLForActiveBoard = (blocksXML, activeBoardId) => {
    const activeBoard = activeBoardId ?
        getBoardById(activeBoardId) :
        null;

    const activeBoardExtensionId = activeBoard ?
        activeBoard.extensionId :
        null;

    return blocksXML.filter(category => {
        const catalogItem = classifiedLibraryContent.find(
            item => item.extensionId === category.id
        );

        if (!catalogItem || catalogItem.kind !== 'board') {
            return true;
        }

        return category.id === activeBoardExtensionId;
    });
};

export const filterBlocksXMLForProjectContext = (
    blocksXML,
    activeBoardId,
    activeExtensionIds = [],
    activeBoardCompanionIds = [],
    allBoardCompanionIds = []
) => {
    const activeBoard = activeBoardId ?
        getBoardById(activeBoardId) :
        null;

    const activeBoardExtensionId = activeBoard ?
        activeBoard.extensionId :
        null;

    return blocksXML.filter(category => {
        const catalogItem = classifiedLibraryContent.find(
            item => item.extensionId === category.id
        );

        if (catalogItem && catalogItem.kind === 'board') {
            return category.id === activeBoardExtensionId;
        }

        if (allBoardCompanionIds.includes(category.id)) {
            return activeBoardCompanionIds.includes(category.id);
        }

        if (catalogItem && catalogItem.kind === 'extension') {
            return activeExtensionIds.includes(category.id);
        }

        return true;
    });
};

export default classifiedLibraryContent;
