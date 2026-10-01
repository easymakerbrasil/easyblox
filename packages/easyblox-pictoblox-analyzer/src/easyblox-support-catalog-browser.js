const browserCatalog =
    require(
        './easyblox-support-catalog-browser.generated.json'
    );

const cloneJson =
    value =>
        JSON.parse(
            JSON.stringify(
                value
            )
        );

const createEasyBloxSupportCatalog =
    () =>
        cloneJson(
            browserCatalog
        );

module.exports = {
    createEasyBloxSupportCatalog
};
