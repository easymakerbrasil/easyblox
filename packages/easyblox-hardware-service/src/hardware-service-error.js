class HardwareServiceError extends Error {
    constructor (code, message, options = {}) {
        super(message);

        this.name = 'HardwareServiceError';
        this.code = code;
        this.technicalDetails =
            options.technicalDetails || null;

        if (options.cause) {
            this.cause = options.cause;
        }
    }
}

module.exports = HardwareServiceError;
