const appConfig =
    require(
        './webpack.app.config'
    );

module.exports = {
    ...appConfig,

    mode:
        'production',

    devtool:
        false
};
