import {LibraryComponent} from '../../../src/components/library/library.jsx';

describe('LibraryComponent removable items', () => {
    const translateItem = {
        extensionId: 'translate',
        featured: true,
        name: 'Traduzir',
        rawURL: 'translate.svg'
    };

    const musicItem = {
        extensionId: 'music',
        featured: true,
        name: 'Música',
        rawURL: 'music.svg'
    };

    test('removes an item without closing the library', () => {
        const onItemRemove = jest.fn();
        const onRequestClose = jest.fn();

        const instance = {
            props: {
                onItemRemove,
                onRequestClose
            },
            getFilteredData: jest.fn().mockReturnValue([
                translateItem
            ]),
            constructKey: LibraryComponent.prototype.constructKey
        };

        LibraryComponent.prototype.handleRemove.call(
            instance,
            'Traduzir'
        );

        expect(onItemRemove).toHaveBeenCalledTimes(1);
        expect(onItemRemove).toHaveBeenCalledWith(translateItem);
        expect(onRequestClose).not.toHaveBeenCalled();
    });

    test('passes the remove action only to removable items', () => {
        const instance = {
            props: {
                isItemRemovable: item =>
                    item.extensionId === 'translate',
                onItemRemove: jest.fn(),
                showPlayButton: false
            },
            state: {
                playingItem: null
            },
            constructKey: LibraryComponent.prototype.constructKey,
            handleMouseEnter: jest.fn(),
            handleMouseLeave: jest.fn(),
            handleRemove: jest.fn(),
            handleSelect: jest.fn()
        };

        const translateElement =
            LibraryComponent.prototype.renderElement.call(
                instance,
                translateItem
            );

        const musicElement =
            LibraryComponent.prototype.renderElement.call(
                instance,
                musicItem
            );

        expect(translateElement.props.onRemove)
            .toBe(instance.handleRemove);

        expect(musicElement.props.onRemove)
            .toBeNull();
    });
});
