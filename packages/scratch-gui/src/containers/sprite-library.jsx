import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, defineMessages} from 'react-intl';
import {connect} from 'react-redux';
import intlShape from '../lib/intlShape.js';
import {spriteShape} from '../lib/assets-prop-types.js';
import VM from '@scratch/scratch-vm';
import mergeDynamicAssets from '../lib/merge-dynamic-assets.js';

import spriteLibraryContent from '../lib/libraries/sprites.json';
import randomizeSpritePosition from '../lib/randomize-sprite-position';
import spriteTags from '../lib/libraries/sprite-tags';
import whizParadoPreview from '../lib/default-project/5848ed4b455e55aa97cb56404a22ef4a.png';
import whizPassadaPreview from '../lib/default-project/027345af81f9af923d045f52b1e63ae0.png';

import LibraryComponent from '../components/library/library.jsx';

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Sprite',
        description: 'Heading for the sprite library',
        id: 'gui.spriteLibrary.chooseASprite'
    }
});

class SpriteLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect',
            'mergeDynamicAssets'
        ]);
        this.processedSprites = {};
    }
    handleItemSelect (item) {
        const sprite = item.name === 'Whiz' ? {
            ...item,
            costumes: item.costumes.map(costume => {
                const cleanCostume = {...costume};
                delete cleanCostume.rawURL;
                return cleanCostume;
            })
        } : item;

        // Randomize position of library sprite
        randomizeSpritePosition(sprite);
        this.props.vm.addSprite(JSON.stringify(sprite)).then(() => {
            this.props.onActivateBlocksTab();
        });
    }
    mergeDynamicAssets () {
        if (this.processedSprites.source === this.props.dynamicSprites) {
            return this.processedSprites.data;
        }
        this.processedSprites = mergeDynamicAssets(
            spriteLibraryContent,
            this.props.dynamicSprites
        );
        return this.processedSprites.data;
    }
    render () {
        const data = this.mergeDynamicAssets().map(sprite => {
            if (sprite.name !== 'Whiz') return sprite;

            return {
                ...sprite,
                costumes: sprite.costumes.map(costume => ({
                    ...costume,
                    rawURL: costume.name === 'parado' ? whizParadoPreview : whizPassadaPreview
                }))
            };
        });
        return (
            <LibraryComponent
                data={data}
                id="spriteLibrary"
                tags={spriteTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

const mapStateToProps = state => ({
    dynamicSprites: state.scratchGui.dynamicAssets.sprites
});

SpriteLibrary.propTypes = {
    dynamicSprites: PropTypes.arrayOf(spriteShape),
    intl: intlShape.isRequired,
    onActivateBlocksTab: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default injectIntl(connect(mapStateToProps)(SpriteLibrary));
