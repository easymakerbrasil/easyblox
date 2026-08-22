import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useRef} from 'react';
import {useIntl, FormattedMessage, defineMessage} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import languageIcon from '../language-selector/language-icon.svg';
import {selectLocale} from '../../reducers/locales.js';
import useMenuNavigation from '../../hooks/use-menu-navigation';

import stylesSettingsMenu from './settings-menu.css';
import stylesLanguageMenu from './language-menu.css';

import dropdownCaret from './dropdown-caret.svg';

const languageMenu = defineMessage({
    id: 'gui.aria.languageMenu',
    defaultMessage: 'Language menu',
    description: 'accessibility label for language menu'
});

const EASYBLOX_LOCALES = [
    {
        id: 'pt-br',
        name: 'Português'
    },
    {
        id: 'en',
        name: 'English'
    },
    {
        id: 'es-419',
        name: 'Español'
    }
];

const LanguageMenu = ({
    currentLocale,
    isRtl,
    onChangeLanguage,
    depth
}) => {
    const intl = useIntl();

    const selectedRef = useRef(null);

    const {
        isExpanded,
        handleKeyDown,
        handleKeyDownOpenMenu,
        handleOnOpen,
        menuRef
    } = useMenuNavigation({
        depth: depth ?? 1,
        defaultIndexOnOpen: EASYBLOX_LOCALES.findIndex(locale => locale.id === currentLocale),
        isRtl
    });

    const setRef = useCallback(component => {
        selectedRef.current = component;
    }, []);

    const handleMouseOver = useCallback(() => {
        // If we are using hover rather than clicks for submenus, scroll the selected option into view
        if (isExpanded() && selectedRef.current) {
            selectedRef.current.scrollIntoView({block: 'center'});
        }
    }, [isExpanded]);

    return (
        <MenuItem
            ref={menuRef}
            isExpanded={isExpanded()}
            ariaLabel={intl.formatMessage(languageMenu)}
            onKeyDown={handleKeyDown}
            isDataMenuItemWrapper
        >
            <button
                className={stylesSettingsMenu.option}
                onClick={handleOnOpen}
                onMouseOver={handleMouseOver}
                data-menu-item
            >
                <img
                    className={stylesSettingsMenu.icon}
                    src={languageIcon}
                />
                <span className={stylesSettingsMenu.submenuLabel}>
                    <FormattedMessage
                        defaultMessage="Language"
                        description="Language sub-menu"
                        id="gui.menuBar.language"
                    />
                </span>
                <img
                    className={stylesSettingsMenu.expandCaret}
                    src={dropdownCaret}
                />
            </button>
            <Submenu
                className={stylesLanguageMenu.languageSubmenu}
                place={isRtl ? 'left' : 'right'}
            >
                {
                    EASYBLOX_LOCALES
                        .map(locale => {
                            const isSelected = currentLocale === locale.id;

                            return (<MenuItem
                                key={locale.id}
                                className={stylesLanguageMenu.languageMenuItem}
                                // eslint-disable-next-line react/jsx-no-bind
                                onClick={() => onChangeLanguage(locale.id)}
                                isDataMenuItem
                                onParentKeyDown={handleKeyDownOpenMenu}
                                isSelected={isSelected}
                            >
                                <img
                                    className={classNames(stylesSettingsMenu.check, {
                                        [stylesSettingsMenu.selected]: isSelected
                                    })}
                                    src={check}
                                    {...(isSelected && {ref: setRef})}
                                />
                                {locale.name}
                            </MenuItem>);
                        })
                }
            </Submenu>
        </MenuItem>
    );
};

LanguageMenu.propTypes = {
    currentLocale: PropTypes.string,
    isRtl: PropTypes.bool,
    onChangeLanguage: PropTypes.func,
    depth: PropTypes.number
};

const mapStateToProps = state => ({
    currentLocale: state.locales.locale,
    isRtl: state.locales.isRtl,
    messagesByLocale: state.locales.messagesByLocale
});

const mapDispatchToProps = dispatch => ({
    onChangeLanguage: locale => {
        dispatch(selectLocale(locale));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LanguageMenu);
