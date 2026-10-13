import {defineMessages} from 'react-intl';

const reactIntlMessages = defineMessages({
    backdrop: {
        defaultMessage: 'backdrop{index}',
        description: 'Default name for a new backdrop, scratch will automatically adjust the number if necessary',
        id: 'gui.sharedMessages.backdrop'
    },
    costume: {
        defaultMessage: 'costume{index}',
        description: 'Default name for a new costume, scratch will automatically adjust the number if necessary',
        id: 'gui.sharedMessages.costume'
    },
    sprite: {
        defaultMessage: 'Sprite{index}',
        description: 'Default name for a new sprite, scratch will automatically adjust the number if necessary',
        id: 'gui.sharedMessages.sprite'
    },
    pop: {
        defaultMessage: 'pop',
        description: 'Name of the pop sound, the default sound added to a sprite',
        id: 'gui.sharedMessages.pop'
    },
    replaceProjectWarning: {
        id: 'gui.sharedMessages.replaceProjectWarning',
        defaultMessage: 'Replace contents of the current project?',
        description: 'Confirmation that user wants to overwrite the current project contents'
    },
    projectReplacementOpenTitle: {
        id: 'gui.projectReplacement.openTitle',
        defaultMessage: 'Abrir outro projeto?',
        description: 'Title for confirming replacement by opening a project'
    },
    projectReplacementImportTitle: {
        id: 'gui.projectReplacement.importTitle',
        defaultMessage: 'Importar outro projeto?',
        description: 'Title for confirming replacement by importing a project'
    },
    projectReplacementNewTitle: {
        id: 'gui.projectReplacement.newTitle',
        defaultMessage: 'Criar novo projeto?',
        description: 'Title for confirming replacement with a new project'
    },
    projectReplacementWarning: {
        id: 'gui.projectReplacement.warning',
        defaultMessage: 'O projeto atual será substituído. ' +
            'Salve-o antes de continuar se quiser manter suas alterações.',
        description: 'Warning shown before replacing the current project'
    },
    projectReplacementOpenAction: {
        id: 'gui.projectReplacement.openAction',
        defaultMessage: 'Abrir projeto',
        description: 'Action to confirm opening another project'
    },
    projectReplacementImportAction: {
        id: 'gui.projectReplacement.importAction',
        defaultMessage: 'Importar projeto',
        description: 'Action to confirm importing another project'
    },
    projectReplacementNewAction: {
        id: 'gui.projectReplacement.newAction',
        defaultMessage: 'Criar novo projeto',
        description: 'Action to confirm creating a new project'
    },
    projectReplacementCancel: {
        id: 'gui.projectReplacement.cancel',
        defaultMessage: 'Cancelar',
        description: 'Action to keep the current project'
    },
    loadFromComputerTitle: {
        id: 'gui.sharedMessages.loadFromComputerTitle',
        defaultMessage: 'Load from your computer',
        description: 'Title for uploading a project from your computer'
    }
});

export default reactIntlMessages;
