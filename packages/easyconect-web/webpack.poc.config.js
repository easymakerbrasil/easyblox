const path = require('path');

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
