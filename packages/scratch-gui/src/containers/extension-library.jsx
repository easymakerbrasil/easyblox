import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from '@scratch/scratch-vm';
import {defineMessages, injectIntl} from 'react-intl';
import intlShape from '../lib/intlShape.js';

import {
    getBoardById,
    getVisibleExtensions
} from '../lib/libraries/extensions/index.jsx';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';

const messages = defineMessages({
    extensionTitle: {
        defaultMessage: 'Choose an Extension',
        description: 'Heading for the extension library',
        id: 'gui.extensionLibrary.chooseAnExtension'
    },
    extensionUrl: {
        defaultMessage: 'Enter the URL of the extension',
        description: 'Prompt for unoffical extension url',
        id: 'gui.extensionLibrary.extensionUrl'
    },
    selectBoardForExtension: {
        defaultMessage: 'Selecione uma placa para usar esta extensão',
        description: 'Message shown when an extension requires a board capability but no board is selected',
        id: 'gui.extensionLibrary.selectBoardForExtension'
    },
    incompatibleBoardExtension: {
        defaultMessage: 'Esta extensão não é compatível com a placa selecionada',
        description: 'Message shown when the selected board does not provide the capability required by an extension',
        id: 'gui.extensionLibrary.incompatibleBoardExtension'
    }
});

export class ExtensionLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemRemove',
            'handleItemSelect',
            'isItemRemovable'
        ]);
    }
    handleItemRemove (item) {
        if (
            item &&
            item.extensionId &&
            this.props.onExtensionRemove
        ) {
            this.props.onExtensionRemove(item.extensionId);
        }
    }
    handleItemSelect (item) {
        const id = item.extensionId;
        let url = item.extensionURL ? item.extensionURL : id;
        if (!item.disabled && !id) {
            // eslint-disable-next-line no-alert
            url = prompt(this.props.intl.formatMessage(messages.extensionUrl));
        }
        if (id && !item.disabled) {
            if (this.props.vm.extensionManager.isExtensionLoaded(url)) {
                if (this.props.onExtensionActivate) {
                    this.props.onExtensionActivate(id);
                }
                this.props.onCategorySelected(id);
            } else {
                this.props.vm.extensionManager.loadExtensionURL(url).then(() => {
                    if (this.props.onExtensionActivate) {
                        this.props.onExtensionActivate(id);
                    }
                    this.props.onCategorySelected(id);
                });
            }
        }
    }
    isItemRemovable (item) {
        return Boolean(
            item &&
            item.extensionId &&
            this.props.activeExtensionIds.includes(item.extensionId)
        );
    }
    render () {
        const activeBoard = this.props.activeBoardId ?
            getBoardById(this.props.activeBoardId) :
            null;

        const activeBoardCapabilities = new Set(
            activeBoard &&
            Array.isArray(activeBoard.capabilities) ?
                activeBoard.capabilities :
                []
        );

        const extensionLibraryThumbnailData = getVisibleExtensions().map(extension => {
            const requiredBoardCapability =
                extension.requiredBoardCapability;

            const boardCapabilityMissing =
                Boolean(requiredBoardCapability) &&
                (
                    !activeBoard ||
                    !activeBoardCapabilities.has(
                        requiredBoardCapability
                    )
                );

            const staticallyDisabled =
                Boolean(extension.disabled);

            let disabledMessage = null;

            if (
                !staticallyDisabled &&
                boardCapabilityMissing
            ) {
                disabledMessage = this.props.intl.formatMessage(
                    activeBoard ?
                        messages.incompatibleBoardExtension :
                        messages.selectBoardForExtension
                );
            }

            return {
                rawURL: extension.iconURL || extensionIcon,
                ...extension,
                disabled:
                    staticallyDisabled ||
                    boardCapabilityMissing,
                disabledMessage
            };
        });
        return (
            <LibraryComponent
                data={extensionLibraryThumbnailData}
                filterable={false}
                id="extensionLibrary"
                isItemRemovable={this.isItemRemovable}
                title={this.props.intl.formatMessage(messages.extensionTitle)}
                visible={this.props.visible}
                onItemRemove={this.handleItemRemove}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

ExtensionLibrary.propTypes = {
    activeBoardId: PropTypes.string,
    activeExtensionIds: PropTypes.arrayOf(PropTypes.string),
    intl: intlShape.isRequired,
    onCategorySelected: PropTypes.func,
    onExtensionActivate: PropTypes.func,
    onExtensionRemove: PropTypes.func,
    onRequestClose: PropTypes.func,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

ExtensionLibrary.defaultProps = {
    activeBoardId: null,
    activeExtensionIds: []
};

export default injectIntl(ExtensionLibrary);
