import React from 'react';
import * as ScratchBlocks from 'scratch-blocks';
import styles from './menu-bar.css';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import editIcon from './icon--edit.svg';
import {useIntl, FormattedMessage, defineMessage} from 'react-intl';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuItem, MenuSection} from '../menu/menu.jsx';
import useMenuNavigation from '../../hooks/use-menu-navigation';
import dropdownCaret from './dropdown-caret.svg';
import DeletionRestorer from '../../containers/deletion-restorer.jsx';
import TurboMode from '../../containers/turbo-mode.jsx';

const editMenuAriaMessage = defineMessage({
    id: 'gui.aria.editMenu',
    defaultMessage: 'Edit menu',
    description: 'accessibility label for edit menu'
});

const getWorkspace = () => ScratchBlocks.getMainWorkspace();

const EditMenu = ({
    isRtl,
    onRestoreOption,
    restoreOptionMessage,
    depth
}) => {
    const intl = useIntl();

    const {
        menuRef,
        isExpanded,
        handleKeyDown,
        handleKeyDownOpenMenu,
        handleOnOpen,
        handleOnClose
    } = useMenuNavigation({
        depth,
        isRtl
    });

    const [historyState, setHistoryState] = React.useState({
        canUndo: false,
        canRedo: false
    });

    const refreshHistoryState = React.useCallback(() => {
        const workspace = getWorkspace();

        setHistoryState({
            canUndo: Boolean(
                workspace &&
                workspace.getUndoStack().length > 0
            ),
            canRedo: Boolean(
                workspace &&
                workspace.getRedoStack().length > 0
            )
        });
    }, []);

    const handleEditMenuOpen = React.useCallback(() => {
        refreshHistoryState();
        handleOnOpen();
    }, [
        handleOnOpen,
        refreshHistoryState
    ]);

    const handleUndo = React.useCallback(() => {
        const workspace = getWorkspace();

        if (
            workspace &&
            workspace.getUndoStack().length > 0
        ) {
            workspace.undo(false);
        }

        refreshHistoryState();
        handleOnClose();
    }, [
        handleOnClose,
        refreshHistoryState
    ]);

    const handleRedo = React.useCallback(() => {
        const workspace = getWorkspace();

        if (
            workspace &&
            workspace.getRedoStack().length > 0
        ) {
            workspace.undo(true);
        }

        refreshHistoryState();
        handleOnClose();
    }, [
        handleOnClose,
        refreshHistoryState
    ]);

    return (
        <button
            className={classNames(styles.menuBarItem, styles.hoverable, {
                [styles.active]: isExpanded()
            })}
            onClick={handleEditMenuOpen}
            aria-label={intl.formatMessage(editMenuAriaMessage)}
            aria-expanded={isExpanded()}
            onKeyDown={handleKeyDown}
            ref={menuRef}
        >
            <img src={editIcon} />
            <span className={styles.collapsibleLabel}>
                <FormattedMessage
                    defaultMessage="Edit"
                    description="Text for edit dropdown menu"
                    id="gui.menuBar.edit"
                />
            </span>
            <img src={dropdownCaret} />
            <MenuBarMenu
                className={classNames(styles.menuBarMenu)}
                open={isExpanded()}
                place={isRtl ? 'left' : 'right'}
                onRequestClose={handleOnClose}
            >
                <MenuItem
                    className={classNames({
                        [styles.disabled]: !historyState.canUndo
                    })}
                    onClick={handleUndo}
                    isDataMenuItem
                    onParentKeyDown={handleKeyDownOpenMenu}
                    isDisabled={!historyState.canUndo}
                >
                    <div className={styles.editMenuCommand}>
                        <FormattedMessage
                            defaultMessage="Desfazer"
                            description="Menu bar item for undoing the last workspace action"
                            id="gui.menuBar.undo"
                        />
                        <span className={styles.editMenuShortcut}>
                            Ctrl+Z
                        </span>
                    </div>
                </MenuItem>

                <MenuItem
                    className={classNames({
                        [styles.disabled]: !historyState.canRedo
                    })}
                    onClick={handleRedo}
                    isDataMenuItem
                    onParentKeyDown={handleKeyDownOpenMenu}
                    isDisabled={!historyState.canRedo}
                >
                    <div className={styles.editMenuCommand}>
                        <FormattedMessage
                            defaultMessage="Refazer"
                            description="Menu bar item for redoing the last workspace action"
                            id="gui.menuBar.redo"
                        />
                        <span className={styles.editMenuShortcut}>
                            Ctrl+Shift+Z
                        </span>
                    </div>
                </MenuItem>

                <DeletionRestorer>{(handleRestore, {restorable, deletedItem}) => (
                    <MenuItem
                        className={classNames({[styles.disabled]: !restorable})}
                        onClick={onRestoreOption(handleRestore)}
                        isDataMenuItem
                        onParentKeyDown={handleKeyDownOpenMenu}
                        isDisabled={!restorable}
                    >
                        {restoreOptionMessage(deletedItem)}
                    </MenuItem>
                )}</DeletionRestorer>
                <MenuSection>
                    <TurboMode>{(toggleTurboMode, {turboMode}) => (
                        <MenuItem
                            onClick={toggleTurboMode}
                            isDataMenuItem
                            onParentKeyDown={handleKeyDownOpenMenu}
                        >
                            {turboMode ? (
                                <FormattedMessage
                                    defaultMessage="Turn off Turbo Mode"
                                    description="Menu bar item for turning off turbo mode"
                                    id="gui.menuBar.turboModeOff"
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="Turn on Turbo Mode"
                                    description="Menu bar item for turning on turbo mode"
                                    id="gui.menuBar.turboModeOn"
                                />
                            )}
                        </MenuItem>
                    )}</TurboMode>
                </MenuSection>
            </MenuBarMenu>
        </button>
    );
};

EditMenu.propTypes = {
    isRtl: PropTypes.bool,
    restoreOptionMessage: PropTypes.func.isRequired,
    onRestoreOption: PropTypes.func.isRequired,
    depth: PropTypes.number
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

export default connect(
    mapStateToProps
)(EditMenu);
