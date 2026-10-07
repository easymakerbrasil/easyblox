const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const DEFAULT_HOST =
    '127.0.0.1';

const DEFAULT_PORT =
    8601;

const CONTENT_TYPES =
    Object.freeze({
        '.css': 'text/css; charset=utf-8',
        '.gif': 'image/gif',
        '.html': 'text/html; charset=utf-8',
        '.ico': 'image/x-icon',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.map': 'application/json; charset=utf-8',
        '.mp3': 'audio/mpeg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ttf': 'font/ttf',
        '.wasm': 'application/wasm',
        '.wav': 'audio/wav',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
    });

class GuiStaticServer {
    constructor (options = {}) {
        if (
            typeof options.rootPath !==
                'string' ||
            options.rootPath.length === 0
        ) {
            throw new TypeError(
                'EasyBlox GUI static server requires a root path'
            );
        }

        this._host =
            options.host ||
            DEFAULT_HOST;

        this._port =
            Number.isInteger(
                options.port
            ) ?
                options.port :
                DEFAULT_PORT;

        this._rootPath =
            path.resolve(
                options.rootPath
            );

        this._server =
            http.createServer(
                (
                    request,
                    response
                ) => {
                    this._handleRequest(
                        request,
                        response
                    );
                }
            );
    }

    listen () {
        if (
            this._server.listening
        ) {
            return Promise.resolve(
                this.address()
            );
        }

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const handleError =
                    error => {
                        reject(error);
                    };

                this._server.once(
                    'error',
                    handleError
                );

                this._server.listen(
                    this._port,
                    this._host,
                    () => {
                        this._server
                            .removeListener(
                                'error',
                                handleError
                            );

                        resolve(
                            this.address()
                        );
                    }
                );
            }
        );
    }

    close () {
        if (
            !this._server.listening
        ) {
            return Promise.resolve();
        }

        return new Promise(
            (
                resolve,
                reject
            ) => {
                this._server.close(
                    error => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve();
                    }
                );
            }
        );
    }

    address () {
        const address =
            this._server.address();

        return {
            host:
                this._host,
            port:
                address &&
                typeof address ===
                    'object' ?
                    address.port :
                    this._port
        };
    }

    _handleRequest (
        request,
        response
    ) {
        if (
            request.method !== 'GET' &&
            request.method !== 'HEAD'
        ) {
            response.statusCode =
                405;

            response.end();
            return;
        }

        let url;

        try {
            url =
                new URL(
                    request.url,
                    `http://${this._host}`
                );
        } catch (error) {
            response.statusCode =
                400;

            response.end();
            return;
        }

        let pathname;

        try {
            pathname =
                decodeURIComponent(
                    url.pathname
                );
        } catch (error) {
            response.statusCode =
                400;

            response.end();
            return;
        }

        const relativePath =
            pathname === '/' ?
                'index.html' :
                pathname.replace(
                    /^\/+/,
                    ''
                );

        const filePath =
            path.resolve(
                this._rootPath,
                relativePath
            );

        const rootPrefix =
            `${this._rootPath}${path.sep}`;

        if (
            filePath !==
                this._rootPath &&
            !filePath.startsWith(
                rootPrefix
            )
        ) {
            response.statusCode =
                403;

            response.end();
            return;
        }

        fs.stat(
            filePath,
            (
                error,
                stats
            ) => {
                if (
                    error ||
                    !stats.isFile()
                ) {
                    response.statusCode =
                        404;

                    response.end();
                    return;
                }

                const extension =
                    path.extname(
                        filePath
                    ).toLowerCase();

                const contentType =
                    CONTENT_TYPES[
                        extension
                    ] ||
                    'application/octet-stream';

                response.setHeader(
                    'Content-Type',
                    contentType
                );

                response.setHeader(
                    'Cache-Control',
                    'no-store'
                );

                response.statusCode =
                    200;

                if (
                    request.method ===
                    'HEAD'
                ) {
                    response.end();
                    return;
                }

                const stream =
                    fs.createReadStream(
                        filePath
                    );

                stream.on(
                    'error',
                    () => {
                        if (
                            !response.headersSent
                        ) {
                            response.statusCode =
                                500;
                        }

                        response.end();
                    }
                );

                stream.pipe(
                    response
                );
            }
        );
    }
}

module.exports =
    GuiStaticServer;

module.exports.DEFAULT_HOST =
    DEFAULT_HOST;

module.exports.DEFAULT_PORT =
    DEFAULT_PORT;
