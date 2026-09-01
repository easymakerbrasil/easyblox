const HardwareServiceError =
    require('./hardware-service-error');
const runProcess =
    require('./process-runner');

const normalizeUsbId = value => {
    if (typeof value === 'number') {
        return value
            .toString(16)
            .padStart(4, '0')
            .toUpperCase();
    }

    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value
        .trim()
        .replace(/^0x/i, '')
        .toUpperCase();

    if (!/^[0-9A-F]{1,4}$/.test(normalized)) {
        return null;
    }

    return normalized.padStart(4, '0');
};

class PortDiscovery {
    constructor (options = {}) {
        this._processRunner =
            options.processRunner ||
            runProcess;
    }

    async list (cliPath) {
        let result;

        try {
            result =
                await this._processRunner(
                    cliPath,
                    [
                        'board',
                        'list',
                        '--format',
                        'json'
                    ]
                );
        } catch (error) {
            throw new HardwareServiceError(
                'PORT_DISCOVERY_FAILED',
                'Serial port discovery failed',
                {
                    cause: error,
                    technicalDetails: {
                        stdout:
                            typeof error.stdout ===
                            'string' ?
                                error.stdout :
                                '',
                        stderr:
                            typeof error.stderr ===
                            'string' ?
                                error.stderr :
                                ''
                    }
                }
            );
        }

        let parsed;

        try {
            parsed = JSON.parse(
                result.stdout
            );
        } catch (error) {
            throw new HardwareServiceError(
                'PORT_DISCOVERY_FAILED',
                'Serial port discovery failed',
                {
                    cause: error,
                    technicalDetails: {
                        stdout:
                            result.stdout || '',
                        stderr:
                            result.stderr || ''
                    }
                }
            );
        }

        const detectedPorts =
            Array.isArray(
                parsed.detected_ports
            ) ?
                parsed.detected_ports :
                [];

        return detectedPorts
            .map(entry => entry && entry.port)
            .filter(port =>
                port &&
                typeof port.address ===
                    'string'
            )
            .map(port => ({
                address: port.address,
                label:
                    port.label ||
                    port.address,
                protocol:
                    port.protocol ||
                    null,
                properties:
                    port.properties &&
                    typeof port.properties ===
                        'object' ?
                        {...port.properties} :
                        {}
            }));
    }

    async resolve ({
        cliPath,
        hint
    }) {
        if (!hint || typeof hint !== 'object') {
            throw new HardwareServiceError(
                'PORT_HINT_REQUIRED',
                'A serial port must be selected'
            );
        }

        const ports =
            await this.list(cliPath);

        if (
            typeof hint.address ===
                'string' &&
            hint.address.trim().length > 0
        ) {
            const expected =
                hint.address
                    .trim()
                    .toUpperCase();

            const match =
                ports.find(port =>
                    port.address
                        .toUpperCase() ===
                    expected
                );

            if (!match) {
                throw new HardwareServiceError(
                    'PORT_NOT_FOUND',
                    'The selected serial port was not found'
                );
            }

            return match;
        }

        const vendorId =
            normalizeUsbId(
                hint.usbVendorId
            );

        const productId =
            normalizeUsbId(
                hint.usbProductId
            );

        if (!vendorId || !productId) {
            throw new HardwareServiceError(
                'PORT_HINT_REQUIRED',
                'A serial port must be selected'
            );
        }

        const matches =
            ports.filter(port => {
                const properties =
                    port.properties || {};

                return (
                    normalizeUsbId(
                        properties.vid
                    ) === vendorId &&
                    normalizeUsbId(
                        properties.pid
                    ) === productId
                );
            });

        if (matches.length === 0) {
            throw new HardwareServiceError(
                'PORT_NOT_FOUND',
                'The selected serial port was not found'
            );
        }

        if (matches.length > 1) {
            throw new HardwareServiceError(
                'PORT_AMBIGUOUS',
                'More than one matching serial port was found'
            );
        }

        return matches[0];
    }
}

module.exports = PortDiscovery;
module.exports.normalizeUsbId =
    normalizeUsbId;
