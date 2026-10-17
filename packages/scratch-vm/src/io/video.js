const StageLayering = require('../engine/stage-layering');
const log = require('../util/log');

const LEGACY_CAMERA_CONSUMER = Symbol('legacyCamera');

/**
 * An immutable acquisition identity, available even while capture is pending.
 * @typedef {object} CameraLease
 * @property {number} id Unique acquisition ID within this Video IO.
 * @property {string|symbol} consumerId Consumer owning this acquisition.
 * @property {number} generation Capture context generation.
 * @property {Promise<CameraLease|null>} ready Lease on success, null on cancellation; rejects on failure.
 * Fulfilled readiness records acquisition success, not continuing lease validity after release or reset.
 */

class Video {
    constructor (runtime) {
        this.runtime = runtime;

        /**
         * @typedef VideoProvider
         * @property {Function} enableVideo - Requests camera access from the user, and upon success,
         * enables the video feed
         * @property {Function} disableVideo - Turns off the video feed
         * @property {Function} getFrame - Return frame data from the video feed in
         * specified dimensions, format, and mirroring.
         */
        this.provider = null;

        this._cameraConsumers = new Map();
        this._cameraOperation = null;
        this._cameraGeneration = 0;
        this._cameraLeaseId = 0;

        /**
         * Id representing a Scratch Renderer skin the video is rendered to for
         * previewing.
         * @type {number}
         */
        this._skinId = -1;

        /**
         * Id for a drawable using the video's skin that will render as a video
         * preview.
         * @type {Drawable}
         */
        this._drawable = -1;

        /**
         * Store the last state of the video transparency ghost effect
         * @type {number}
         */
        this._ghost = 0;

        /**
         * Store a flag that allows the preview to be forced transparent.
         * @type {number}
         */
        this._forceTransparentPreview = false;
    }

    static get FORMAT_IMAGE_DATA () {
        return 'image-data';
    }

    static get FORMAT_CANVAS () {
        return 'canvas';
    }

    /**
     * Dimensions the video stream is analyzed at after its rendered to the
     * sample canvas.
     * @type {Array.<number>}
     */
    static get DIMENSIONS () {
        return [480, 360];
    }

    /**
     * Order preview drawable is inserted at in the renderer.
     * @type {number}
     */
    static get ORDER () {
        return 1;
    }

    /**
     * Set a video provider for this device. A default implementation of
     * a video provider can be found in scratch-gui/src/lib/video/video-provider
     * @param {VideoProvider} provider - Video provider to use
     */
    setProvider (provider) {
        if (provider === this.provider) return;
        this.reset();
        this.provider = provider;
    }

    /**
     * Acquire shared capture for a consumer. Repeated acquisition is idempotent.
     * Release the returned identity to cancel a pending or completed acquisition.
     * @param {string|symbol} consumerId Consumer identity; symbols are reserved for legacy callers.
     * @returns {?CameraLease} Acquisition, or null when no provider is attached.
     */
    acquireCamera (consumerId) {
        const existing = this._cameraConsumers.get(consumerId);
        if (existing) return existing.lease;
        if (!this.provider) return null;

        let resolve;
        let reject;
        const ready = new Promise((resolveLease, rejectLease) => {
            resolve = resolveLease;
            reject = rejectLease;
        });
        const lease = Object.freeze({
            id: ++this._cameraLeaseId,
            consumerId,
            generation: this._cameraGeneration,
            ready
        });
        this._cameraConsumers.set(consumerId, {lease, resolve, reject});

        if (!this._cameraOperation) {
            const operation = {
                provider: this.provider,
                generation: this._cameraGeneration,
                ready: false
            };
            this._cameraOperation = operation;
            this._startCameraOperation(operation);
        } else if (this._cameraOperation.ready) {
            resolve(lease);
        }

        return lease;
    }

    /**
     * Check current ownership, including pending acquisition, without changing capture.
     * Readiness alone does not establish continued ownership after release or reset.
     * @param {?CameraLease} lease Acquisition identity to check.
     * @returns {boolean} Whether this exact lease still owns the current capture operation.
     */
    isCameraLeaseActive (lease) {
        if (!lease) return false;
        const entry = this._cameraConsumers.get(lease.consumerId);
        return Boolean(entry && entry.lease === lease && lease.generation === this._cameraGeneration &&
            this._cameraOperation && this._isCurrentCameraOperation(this._cameraOperation));
    }

    /**
     * Release only the acquisition represented by this exact identity.
     * @param {?CameraLease} lease Acquisition to release.
     * @returns {boolean} Whether a current acquisition was released.
     */
    releaseCamera (lease) {
        if (!lease) return false;
        const entry = this._cameraConsumers.get(lease.consumerId);
        if (!entry || entry.lease !== lease || lease.generation !== this._cameraGeneration) return false;

        this._cameraConsumers.delete(lease.consumerId);
        entry.resolve(null);
        if (this._cameraConsumers.size === 0) this.disableVideo();
        return true;
    }

    /**
     * Invalidate all acquisitions before replacing a project or provider.
     */
    reset () {
        this._cameraGeneration++;
        this.disableVideo();
    }

    /**
     * Check both context generation and operation identity before applying callbacks.
     * @param {{provider: VideoProvider, generation: number, ready: boolean}} operation Capture operation.
     * @returns {boolean} Whether this operation still owns the attached provider.
     * @private
     */
    _isCurrentCameraOperation (operation) {
        return this._cameraOperation === operation &&
            this._cameraGeneration === operation.generation &&
            this.provider === operation.provider;
    }

    /**
     * Start capture once and settle the current consumers without retaining obsolete leases.
     * @param {{provider: VideoProvider, generation: number, ready: boolean}} operation Capture operation.
     * @private
     */
    _startCameraOperation (operation) {
        const failAcquisition = error => {
            if (!this._isCurrentCameraOperation(operation)) return;
            this._cameraConsumers.forEach(entry => entry.reject(error));
            this.disableVideo();
        };
        // The executor calls synchronously while converting provider throws into rejections.
        const capture = new Promise(resolve => {
            resolve(operation.provider.enableVideo());
        });
        capture.then(result => {
            if (!this._isCurrentCameraOperation(operation)) return;
            if (result === null) {
                this.disableVideo();
                return;
            }

            try {
                this._setupPreview();
            } catch (error) {
                failAcquisition(error);
                return;
            }
            if (!this._isCurrentCameraOperation(operation)) return;
            operation.ready = true;
            this._cameraConsumers.forEach(entry => entry.resolve(entry.lease));
        }, failAcquisition).catch(error => {
            log.error('Video._startCameraOperation: camera cleanup failed', {
                generation: operation.generation,
                currentGeneration: this._cameraGeneration
            }, error);
        });
    }

    /**
     * Request video be enabled.  Sets up video, creates video skin and enables preview.
     *
     * ioDevices.video.requestVideo()
     * @returns {Promise<void|null>|null} Resolves after setup, null on cancellation or no provider; rejects on failure.
     */
    enableVideo () {
        const lease = this.acquireCamera(LEGACY_CAMERA_CONSUMER);
        if (!lease) return null;
        return lease.ready.then(acquired => (acquired ? void 0 : null));
    }

    /**
     * Disable video globally for legacy callers, cancelling every acquisition.
     * Identified consumers use releaseCamera for individual shutdown.
     * @returns {void}
     */
    disableVideo () {
        const provider = this.provider;
        this._cameraOperation = null;
        this._cameraConsumers.forEach(entry => entry.resolve(null));
        this._cameraConsumers.clear();
        try {
            this._disablePreview();
        } catch (error) {
            log.warn('Video.disableVideo: preview cleanup failed', {
                generation: this._cameraGeneration,
                hasProvider: Boolean(provider)
            }, error);
        } finally {
            if (provider) provider.disableVideo();
        }
        if (!provider) return null;
    }

    /**
     * Return frame data from the video feed in a specified dimensions, format, and mirroring.
     * @param {object} frameInfo A descriptor of the frame you would like to receive.
     * @param {Array.<number>} frameInfo.dimensions [width, height] array of numbers.  Defaults to [480,360]
     * @param {boolean} frameInfo.mirror If you specificly want a mirror/non-mirror frame, defaults to the global
     *                                   mirror state (ioDevices.video.mirror)
     * @param {string} frameInfo.format Requested video format, available formats are 'image-data' and 'canvas'.
     * @param {number} frameInfo.cacheTimeout Will reuse previous image data if the time since capture is less than
     *                                        the cacheTimeout.  Defaults to 16ms.
     * @returns {ArrayBuffer|Canvas|string|null} Frame data in requested format, null when errors.
     */
    getFrame ({
        dimensions = Video.DIMENSIONS,
        mirror = this.mirror,
        format = Video.FORMAT_IMAGE_DATA,
        cacheTimeout = this._frameCacheTimeout
    }) {
        if (this.provider) return this.provider.getFrame({dimensions, mirror, format, cacheTimeout});
        return null;
    }

    /**
     * Set the preview ghost effect
     * @param {number} ghost from 0 (visible) to 100 (invisible) - ghost effect
     */
    setPreviewGhost (ghost) {
        this._ghost = ghost;
        // Confirm that the default value has been changed to a valid id for the drawable
        if (this._drawable !== -1) {
            this.runtime.renderer.updateDrawableEffect(
                this._drawable,
                'ghost',
                this._forceTransparentPreview ? 100 : ghost
            );
        }
    }

    _disablePreview () {
        clearTimeout(this._renderPreviewTimeout);
        this._renderPreviewFrame = null;
        const {renderer} = this.runtime;
        if (renderer && this._skinId !== -1) {
            renderer.updateBitmapSkin(this._skinId, new ImageData(...Video.DIMENSIONS), 1);
            renderer.updateDrawableVisible(this._drawable, false);
        }
    }

    _setupPreview () {
        const {renderer} = this.runtime;
        if (!renderer) return;

        if (this._skinId === -1 && this._drawable === -1) {
            this._skinId = renderer.createBitmapSkin(new ImageData(...Video.DIMENSIONS), 1);
            this._drawable = renderer.createDrawable(StageLayering.VIDEO_LAYER);
            renderer.updateDrawableSkinId(this._drawable, this._skinId);
        }

        // if we haven't already created and started a preview frame render loop, do so
        if (!this._renderPreviewFrame) {
            renderer.updateDrawableEffect(this._drawable, 'ghost', this._forceTransparentPreview ? 100 : this._ghost);
            renderer.updateDrawableVisible(this._drawable, true);

            const operation = this._cameraOperation;
            const renderPreviewFrame = () => {
                if (this._renderPreviewFrame !== renderPreviewFrame ||
                    !this._isCurrentCameraOperation(operation)) return;
                clearTimeout(this._renderPreviewTimeout);

                this._renderPreviewTimeout = setTimeout(renderPreviewFrame, this.runtime.currentStepTime);

                const imageData = this.getFrame({
                    format: Video.FORMAT_IMAGE_DATA,
                    cacheTimeout: this.runtime.currentStepTime
                });

                if (!imageData) {
                    renderer.updateBitmapSkin(this._skinId, new ImageData(...Video.DIMENSIONS), 1);
                    return;
                }

                renderer.updateBitmapSkin(this._skinId, imageData, 1);
                this.runtime.requestRedraw();
            };

            this._renderPreviewFrame = renderPreviewFrame;
            renderPreviewFrame();
        }
    }

    get videoReady () {
        if (this.provider) return this.provider.videoReady;
        return false;
    }

    /**
     * Method implemented by all IO devices to allow external changes.
     * The only change available externally is hiding the preview, used e.g. to
     * prevent drawing the preview into project thumbnails.
     * @param {object} - data passed to this IO device.
     * @param -.forceTransparentPreview
     * @property {boolean} forceTransparentPreview - whether the preview should be forced transparent.
     */
    postData ({forceTransparentPreview}) {
        this._forceTransparentPreview = forceTransparentPreview;
        // Setting the ghost to the current value will pick up the forceTransparentPreview
        // flag and override the current ghost. The complexity is to prevent blocks
        // from overriding forceTransparentPreview
        this.setPreviewGhost(this._ghost);
    }
}


module.exports = Video;
