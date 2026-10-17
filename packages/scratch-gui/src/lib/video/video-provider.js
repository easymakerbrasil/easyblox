import {requestVideoStream, requestDisableVideo} from './camera.js';
import log from '../log.js';

/**
 * Video Manager for video extensions.
 */
class VideoProvider {
    constructor () {
        /**
         * Default value for mirrored frames.
         * @type boolean
         */
        this.mirror = true;

        /**
         * Cache frames for this many ms.
         * @type number
         */
        this._frameCacheTimeout = 16;

        /**
         * DOM Video element
         * @private
         */
        this._video = null;

        /**
         * Usermedia stream track
         * @private
         */
        this._track = null;

        /**
         * This provider's individual acquisition in camera.js.
         * @private
         * @type {?object}
         */
        this._cameraRequest = null;
        this._videoUrl = null;
        this._playing = false;

        /**
         * Identifies the current provider activation.
         * @private
         * @type {number}
         */
        this._activationId = 0;

        /**
         * Stores some canvas/frame data per resolution/mirror states
         */
        this._workspace = [];
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
     * Get the HTML video element containing the stream
     */
    get video () {
        return this._video;
    }

    /**
     * Request video be enabled.  Sets up video, creates video skin and enables preview.
     * @returns {Promise<VideoProvider|null>} Provider after play succeeds, null on cancellation; rejects on failure.
     */
    enableVideo () {
        this.enabled = true;
        return this._setupVideo();
    }

    /**
     * Disable video stream (turn video off)
     */
    disableVideo () {
        this.enabled = false;
        this._activationId += 1;
        this._teardown();
    }

    /**
     * Release this provider's camera acquisition.
     * Physical MediaStream tracks are managed exclusively by camera.js.
     * @private
     */
    _teardown () {
        const video = this._video;
        const acquisition = this._cameraRequest;
        const videoUrl = this._videoUrl;
        this._video = null;
        this._track = null;
        this._cameraRequest = null;
        this._videoUrl = null;
        this._playing = false;
        this._workspace = [];
        this._singleSetup = null;

        const cleanup = video ? [
            () => video.pause(),
            () => {
                if ('srcObject' in video) video.srcObject = null;
            },
            () => video.removeAttribute('src')
        ] : [];
        if (videoUrl) cleanup.push(() => window.URL.revokeObjectURL(videoUrl));
        try {
            cleanup.forEach(action => {
                try {
                    action();
                } catch (error) {
                    log.error('VideoProvider._teardown: element cleanup failed', {
                        activationId: this._activationId
                    }, error);
                }
            });
        } finally {
            if (acquisition) requestDisableVideo(acquisition);
        }
    }

    /**
     * Return frame data from the video feed in a specified dimensions, format, and mirroring.
     * @param {object} frameInfo A descriptor of the frame you would like to receive.
     * @param {Array.<number>} frameInfo.dimensions [width, height] array of numbers.  Defaults to [480,360]
     * @param {boolean} frameInfo.mirror If you specificly want a mirror/non-mirror frame, defaults to true
     * @param {string} frameInfo.format Requested video format, available formats are 'image-data' and 'canvas'.
     * @param {number} frameInfo.cacheTimeout Will reuse previous image data if the time since capture is less than
     *                                        the cacheTimeout.  Defaults to 16ms.
     * @returns {ArrayBuffer|Canvas|string|null} Frame data in requested format, null when errors.
     */
    getFrame ({
        dimensions = VideoProvider.DIMENSIONS,
        mirror = this.mirror,
        format = VideoProvider.FORMAT_IMAGE_DATA,
        cacheTimeout = this._frameCacheTimeout
    }) {
        if (!this.videoReady) {
            return null;
        }
        const [width, height] = dimensions;
        const workspace = this._getWorkspace({dimensions, mirror: Boolean(mirror)});
        const {videoWidth, videoHeight} = this._video;
        const {canvas, context, lastUpdate, cacheData} = workspace;
        const now = Date.now();

        // if the canvas hasn't been updated...
        if (lastUpdate + cacheTimeout < now) {

            if (mirror) {
                context.scale(-1, 1);
                context.translate(width * -1, 0);
            }

            context.drawImage(this._video,
                // source x, y, width, height
                0, 0, videoWidth, videoHeight,
                // dest x, y, width, height
                0, 0, width, height
            );

            // context.resetTransform() doesn't work on Edge but the following should
            context.setTransform(1, 0, 0, 1, 0, 0);
            workspace.lastUpdate = now;
        }

        // each data type has it's own data cache, but the canvas is the same
        if (!cacheData[format]) {
            cacheData[format] = {lastUpdate: 0};
        }
        const formatCache = cacheData[format];

        if (formatCache.lastUpdate + cacheTimeout < now) {
            if (format === VideoProvider.FORMAT_IMAGE_DATA) {
                formatCache.lastData = context.getImageData(0, 0, width, height);
            } else if (format === VideoProvider.FORMAT_CANVAS) {
                // this will never change
                formatCache.lastUpdate = Infinity;
                formatCache.lastData = canvas;
            } else {
                log.error(`video io error - unimplemented format ${format}`);
                // cache the null result forever, don't log about it again..
                formatCache.lastUpdate = Infinity;
                formatCache.lastData = null;
            }

            // rather than set to now, this data is as stale as it's canvas is
            formatCache.lastUpdate = Math.max(workspace.lastUpdate, formatCache.lastUpdate);
        }

        return formatCache.lastData;
    }

    /**
     * Method called when an error happens.  Default implementation is just to log error.
     * @abstract
     * @param {Error} error An error object from getUserMedia or other source of error.
     */
    onError (error) {
        log.error('Unhandled video io device error', error);
    }

    /**
     * Create a video stream.
     * @private
     * @returns {Promise} When video has been received, rejected if video is not received
     */
    _setupVideo () {
        if (this._singleSetup) {
            return this._singleSetup;
        }

        const activationId = ++this._activationId;

        const acquisition = requestVideoStream({
            width: {min: 480, ideal: 640},
            height: {min: 360, ideal: 480}
        });
        this._cameraRequest = acquisition;

        const setupPromise = acquisition.ready
            .then(stream => {
                if (
                    !stream ||
                    !this.enabled ||
                    activationId !== this._activationId
                ) {
                    return null;
                }

                const video = document.createElement('video');
                this._video = video;
                this._track = stream.getTracks()[0] || null;

                try {
                    video.srcObject = stream;
                } catch (error) {
                    this._videoUrl = window.URL.createObjectURL(stream);
                    video.src = this._videoUrl;
                }

                return Promise.resolve(video.play()).then(() => {
                    if (!this.enabled || activationId !== this._activationId) return null;
                    this._playing = true;
                    return this;
                });
            })
            .catch(error => {
                if (activationId !== this._activationId) return null;
                this.enabled = false;
                this._teardown();
                this.onError(error);
                throw error;
            });

        this._singleSetup = setupPromise;

        return setupPromise;
    }

    get videoReady () {
        if (!this.enabled) {
            return false;
        }
        if (!this._playing) {
            return false;
        }
        if (!this._video) {
            return false;
        }
        if (!this._track) {
            return false;
        }
        const {videoWidth, videoHeight} = this._video;
        if (typeof videoWidth !== 'number' || typeof videoHeight !== 'number') {
            return false;
        }
        if (videoWidth === 0 || videoHeight === 0) {
            return false;
        }
        return true;
    }

    /**
     * get an internal workspace for canvas/context/caches
     * this uses some document stuff to create a canvas and what not, probably needs abstraction
     * into the renderer layer?
     * @param root0
     * @param root0.dimensions
     * @param root0.mirror
     * @private
     * @returns {object} A workspace for canvas/data storage.  Internal format not documented intentionally
     */
    _getWorkspace ({dimensions, mirror}) {
        let workspace = this._workspace.find(space => (
            space.dimensions.join('-') === dimensions.join('-') &&
            space.mirror === mirror
        ));
        if (!workspace) {
            workspace = {
                dimensions,
                mirror,
                canvas: document.createElement('canvas'),
                lastUpdate: 0,
                cacheData: {}
            };
            workspace.canvas.width = dimensions[0];
            workspace.canvas.height = dimensions[1];
            workspace.context = workspace.canvas.getContext('2d');
            this._workspace.push(workspace);
        }
        return workspace;
    }
}

export default VideoProvider;
