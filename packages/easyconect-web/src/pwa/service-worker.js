const CACHE_PREFIX =
    'easyconect-web';

const CACHE_VERSION =
    'v3';

const CACHE_NAME =
    `${CACHE_PREFIX}-${CACHE_VERSION}`;

const APP_SHELL = [
    '/',
    '/index.html',
    '/easyconect-web.js',
    '/easyconect-app.css',
    '/manifest.webmanifest',
    '/easyblox-icon.svg'
];

self.addEventListener(
    'install',
    event => {
        event.waitUntil(
            caches
                .open(
                    CACHE_NAME
                )
                .then(
                    async cache => {
                        for (
                            const resource of
                            APP_SHELL
                        ) {
                            const cached =
                                await cache.match(
                                    resource
                                );

                            if (!cached) {
                                await cache.add(
                                    resource
                                );
                            }
                        }
                    }
                )
                .then(
                    () =>
                        self.skipWaiting()
                )
        );
    }
);

self.addEventListener(
    'activate',
    event => {
        event.waitUntil(
            caches
                .keys()
                .then(
                    cacheNames =>
                        Promise.all(
                            cacheNames
                                .filter(
                                    cacheName =>
                                        cacheName.startsWith(
                                            `${CACHE_PREFIX}-`
                                        ) &&
                                        cacheName !==
                                            CACHE_NAME
                                )
                                .map(
                                    cacheName =>
                                        caches.delete(
                                            cacheName
                                        )
                                )
                        )
                )
                .then(
                    () =>
                        self.clients.claim()
                )
        );
    }
);

const fetchAndRefreshCache =
    async request => {
        const response =
            await fetch(
                request,
                {
                    cache:
                        'no-cache'
                }
            );

        if (
            response.ok &&
            response.type ===
                'basic'
        ) {
            const cache =
                await caches.open(
                    CACHE_NAME
                );

            await cache.put(
                request,
                response.clone()
            );
        }

        return response;
    };

const respondNetworkFirst =
    async request => {
        try {
            return await fetchAndRefreshCache(
                request
            );
        } catch (error) {
            const cachedResponse =
                await caches.match(
                    request
                );

            if (cachedResponse) {
                return cachedResponse;
            }

            if (
                request.mode ===
                    'navigate'
            ) {
                const cachedIndex =
                    await caches.match(
                        '/index.html'
                    );

                if (cachedIndex) {
                    return cachedIndex;
                }
            }

            throw error;
        }
    };

self.addEventListener(
    'fetch',
    event => {
        const request =
            event.request;

        if (
            request.method !==
                'GET'
        ) {
            return;
        }

        const url =
            new URL(
                request.url
            );

        if (
            url.origin !==
                self.location.origin
        ) {
            return;
        }

        event.respondWith(
            respondNetworkFirst(
                request
            )
        );
    }
);
