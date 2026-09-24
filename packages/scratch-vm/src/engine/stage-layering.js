class StageLayering {
    static get BACKGROUND_LAYER () {
        return 'background';
    }

    static get VIDEO_LAYER () {
        return 'video';
    }

    static get PEN_LAYER () {
        return 'pen';
    }

    static get SPRITE_LAYER () {
        return 'sprite';
    }

    static get EASYBLOX_QR_LAYER () {
        return 'easybloxQr';
    }

    static get EASYBLOX_QR_BOUNDARY_LAYER () {
        return 'easybloxQrBoundary';
    }

    // Order of layer groups relative to each other,
    static get LAYER_GROUPS () {
        return [
            StageLayering.BACKGROUND_LAYER,
            StageLayering.VIDEO_LAYER,
            StageLayering.PEN_LAYER,
            StageLayering.SPRITE_LAYER,
            StageLayering.EASYBLOX_QR_LAYER,
            StageLayering.EASYBLOX_QR_BOUNDARY_LAYER
        ];
    }
}

module.exports = StageLayering;
