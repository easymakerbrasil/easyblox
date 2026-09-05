const {
    EBCP_CONTRACT
} = require('@easymaker/easyblox-connectivity-core');

const CONNECTIVITY_RESOURCES = Object.freeze({
    SOFTWARE_UART_D2_D3: 'SOFTWARE_UART_D2_D3'
});

const EASYBLOX_BT_CHANNEL = '1';

const BLUETOOTH_SERIAL_CONTRACT = Object.freeze({
    modules: Object.freeze([
        'HC-05',
        'HC-06'
    ]),
    rxPin: 2,
    txPin: 3,
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    resource: CONNECTIVITY_RESOURCES.SOFTWARE_UART_D2_D3
});

module.exports = {
    CONNECTIVITY_RESOURCES,
    EASYBLOX_BT_CHANNEL,
    BLUETOOTH_SERIAL_CONTRACT,
    EBCP_CONTRACT
};
