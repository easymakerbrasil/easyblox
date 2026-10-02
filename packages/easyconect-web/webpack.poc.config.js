const path = require('path');
const CopyWebpackPlugin =
    require('copy-webpack-plugin');

module.exports = {
    mode:
        'development',

    entry:
        path.resolve(
            __dirname,
            'src/poc/index.js'
        ),

    output: {
        filename:
            'easyconect-web-poc.js',

        path:
            path.resolve(
                __dirname,
                'dist/poc'
            ),

        clean:
            true
    },

    devtool:
        'source-map',

    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from:
                        path.resolve(
                            __dirname,
                            'src/poc/index.html'
                        ),

                    to:
                        'index.html'
                },
                {
                    from:
                        path.resolve(
                            __dirname,
                            'src/poc/manifest.webmanifest'
                        ),

                    to:
                        'manifest.webmanifest'
                },
                {
                    from:
                        path.resolve(
                            __dirname,
                            'src/poc/service-worker.js'
                        ),

                    to:
                        'service-worker.js'
                },
                {
                    from:
                        path.resolve(
                            __dirname,
                            'src/poc/easyblox-icon.svg'
                        ),

                    to:
                        'easyblox-icon.svg'
                }
            ]
        })
    ],

    devServer: {
        static: {
            directory:
                path.resolve(
                    __dirname,
                    'src/poc'
                )
        },

        host:
            '127.0.0.1',

        port:
            8610,

        hot:
            false,

        liveReload:
            true,

        client: {
            overlay:
                true
        }
    }
};
