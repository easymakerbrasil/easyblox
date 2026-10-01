const PROJECT_JSON_FILENAME =
    'project.json';

const validateProjectObject =
    project => {
        if (
            !project ||
            typeof project !==
                'object' ||
            Array.isArray(
                project
            )
        ) {
            throw new TypeError(
                'PictoBlox project reader requires a project object'
            );
        }

        return project;
    };

const parseProjectJson =
    jsonText => {
        if (
            typeof jsonText !==
                'string'
        ) {
            throw new TypeError(
                'PictoBlox project JSON must be a string'
            );
        }

        let project;

        try {
            project =
                JSON.parse(
                    jsonText
                );
        } catch (error) {
            throw new Error(
                `Invalid PictoBlox project JSON: ${
                    error.message
                }`
            );
        }

        return validateProjectObject(
            project
        );
    };

module.exports = {
    PROJECT_JSON_FILENAME,
    parseProjectJson
};
