const {
    app
} = require('electron');

app.whenReady()
    .then(() => {
        console.log(
            `EasyBlox Desktop ${app.getVersion()} host initialized`
        );
    });

app.on(
    'window-all-closed',
    () => {
        app.quit();
    }
);
