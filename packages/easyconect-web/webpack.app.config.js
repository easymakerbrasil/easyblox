const path = require('path');
const CopyWebpackPlugin =
    require('copy-webpack-plugin');

module.exports = {
    mode:
        'development',

    entry:
        path.resolve(
            __dirname,
            'src/app/index.jsx'
        ),

    output: {
        filename:
            'easyconect-web.js',

        path:
            path.resolve(
                __dirname,
                'dist/app'
            ),

        clean:
            true
    },

    module: {
        rules: [
            {
                test:
                    /\.jsx?$/,

                exclude:
                    /node_modules/,

                use: {
                    loader:
                        'babel-loader',

                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    targets:
                                        'defaults'
                                }
                            ],
                            [
                                '@babel/preset-react',
                                {
                                    runtime:
                                        'automatic'
                                }
                            ]
                        ]
                    }
                }
            }
        ]
    },

    resolve: {
        extensions: [
            '.js',
            '.jsx'
        ]
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
                            'src/app/index.html'
                        ),

                    to:
                        'index.html'
                },
                {
                    from:
                        path.resolve(
                            __dirname,
                            'src/app/easyconect-app.css'
                        ),

                    to:
                        'easyconect-app.css'
                },
                {
                    from:
                        path.resolve(
                            __dirname,
                            'src/pwa/manifest.webmanifest'
                        ),

                    to:
                        'manifest.webmanifest'
                },
                {
                    from:
                        path.resolve(
                            __dirname,
                            'src/pwa/service-worker.js'
                        ),

                    to:
                        'service-worker.js'
                },
                {
                    from:
                        path.resolve(
                            __dirname,
                            'src/pwa/easyblox-icon.svg'
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
                    'dist/app'
                )
        },

        host:
            '127.0.0.1',

        port:
            8611,

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
