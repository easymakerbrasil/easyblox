import React from 'react';
import {
    createRoot
} from 'react-dom/client';

import {
    EasyConectApp
} from './easyconect-app';

const rootElement =
    document.getElementById(
        'root'
    );

if (!rootElement) {
    throw new Error(
        'EasyConect Web root element was not found'
    );
}

const root =
    createRoot(
        rootElement
    );

root.render(
    <React.StrictMode>
        <EasyConectApp />
    </React.StrictMode>
);

const registerServiceWorker =
    async () => {
        if (
            !(
                'serviceWorker' in
                navigator
            )
        ) {
            return false;
        }

        try {
            await navigator
                .serviceWorker
                .register(
                    '/service-worker.js',
                    {
                        scope:
                            '/'
                    }
                );

            return true;
        } catch (error) {
            return false;
        }
    };

registerServiceWorker();
