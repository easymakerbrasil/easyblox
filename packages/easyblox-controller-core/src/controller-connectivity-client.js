const {
    EBCP_CONTRACT,
    EasyBloxConnectivityRuntime,
    EasyBloxConnectivitySession
} = require('@easymaker/easyblox-connectivity-core');

const CONTROLLER_CHANNEL = '1';

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;
const NUMBER = EBCP_CONTRACT.messageTypes.NUMBER;

class ControllerConnectivityClient {
    constructor ({write}) {
        if (typeof write !== 'function') {
            throw new Error('Controller connectivity write must be a function');
        }

        this._runtime = new EasyBloxConnectivityRuntime();

        this._session = new EasyBloxConnectivitySession({
            runtime: this._runtime,
            write
        });
    }

    startSession () {
        return this._session.start();
    }

    sendText (text) {
        return this._session.send(
            TEXT,
            CONTROLLER_CHANNEL,
            text
        );
    }

    sendNumber (number) {
        return this._session.send(
            NUMBER,
            CONTROLLER_CHANNEL,
            number
        );
    }

    waitText () {
        return this._runtime
            .waitFor(TEXT, CONTROLLER_CHANNEL)
            .then(message => message.payload);
    }

    waitNumber () {
        return this._runtime
            .waitFor(NUMBER, CONTROLLER_CHANNEL)
            .then(message => message.payload);
    }

    receive (chunk) {
        this._session.push(chunk);
    }
}

module.exports = {
    ControllerConnectivityClient
};
