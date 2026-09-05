import classNames from 'classnames';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import intlShape from '../../lib/intlShape.js';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import bowser from 'bowser';
import React from 'react';

import VM from '@scratch/scratch-vm';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import {ComingSoonTooltip} from '../coming-soon/coming-soon.jsx';
import ProjectTitleInput from './project-title-input.jsx';
import AuthorInfo from './author-info.jsx';
import MenuBarHOC from '../../containers/menu-bar-hoc.jsx';
import SettingsMenu from './settings-menu.jsx';
import FileMenu from './file-menu.jsx';
import EditMenu from './edit-menu.jsx';
import ModeMenu from './mode-menu.jsx';
import AboutMenu from './about-menu.jsx';
import ProgramModeSelector from '../program-mode-selector/program-mode-selector.jsx';
import HardwareControls from '../hardware-controls/hardware-controls.jsx';

import {setPlayer} from '../../reducers/mode';
import {
    isTimeTravel220022BC,
    isTimeTravel1920,
    isTimeTravel1990,
    isTimeTravel2020,
    isTimeTravelNow,
    setTimeTravel
} from '../../reducers/time-travel';
import {
    autoUpdateProject,
    getIsUpdating,
    getIsShowingProject,
    requestNewProject,
    remixProject
} from '../../reducers/project-state';
import {
    openLoginMenu,
    closeLoginMenu,
    loginMenuOpen
} from '../../reducers/menus';

import createEasyBloxProjectFileService from '../../lib/easyblox-project-file-service';
import downloadBlob from '../../lib/download-blob';
import {
    isControllerOpen,
    toggleController
} from '../../reducers/controller-desktop';
import {projectTitleInitialState} from '../../reducers/project-title';
import {PLATFORM} from '../../lib/platform';

import styles from './menu-bar.css';

import remixIcon from './icon--remix.svg';

import scratchLogo from './easyblox-logo.svg';
import scratchLogoAndroid from './easyblox-logo-android.svg';
import ninetiesLogo from './nineties_logo.svg';
import catLogo from './cat_logo.svg';
import prehistoricLogo from './prehistoric-logo.svg';
import oldtimeyLogo from './oldtimey-logo.svg';

import sharedMessages from '../../lib/shared-messages';

import {AccountMenuOptionsPropTypes} from '../../lib/account-menu-options';

const ariaMessages = defineMessages({
    tutorials: {
        id: 'gui.menuBar.tutorialsLibrary',
        defaultMessage: 'Tutorials',
        description: 'accessibility text for the tutorials button'
    },
    debug: {
        id: 'gui.menuBar.debug',
        defaultMessage: 'Debug',
        description: 'accessibility text for the debug button'
    },
    home: {
        id: 'gui.menuBar.home',
        defaultMessage: 'Home',
        description: 'accessibility text for the home button'
    },
    myStuff: {
        id: 'gui.menuBar.myStuff',
        defaultMessage: 'My Stuff',
        description: 'accessibility text for the my stuff button'
    }
});

const getScratchLogo = platform => (platform === PLATFORM.ANDROID ? scratchLogoAndroid : scratchLogo);

const MenuBarItemTooltip = ({
    children,
    className,
    enable,
    id,
    place = 'bottom'
}) => {
    if (enable) {
        return (
            <React.Fragment>
                {children}
            </React.Fragment>
        );
    }
    return (
        <ComingSoonTooltip
            className={classNames(styles.comingSoon, className)}
            place={place}
            tooltipClassName={styles.comingSoonTooltip}
            tooltipId={id}
        >
            {children}
        </ComingSoonTooltip>
    );
};

MenuBarItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    enable: PropTypes.bool,
    id: PropTypes.string,
    place: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

const MenuItemTooltip = ({id, isRtl, children, className}) => (
    <ComingSoonTooltip
        className={classNames(styles.comingSoon, className)}
        isRtl={isRtl}
        place={isRtl ? 'left' : 'right'}
        tooltipClassName={styles.comingSoonTooltip}
        tooltipId={id}
    >
        {children}
    </ComingSoonTooltip>
);

MenuItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    id: PropTypes.string,
    isRtl: PropTypes.bool
};

const quickSaveIconPath = [
    'M17 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4z',
    'm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
    'm3-10H5V5h10v4z'
].join('');

class MenuBar extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClickNew',
            'handleClickSeeCommunity',
            'handleClickShare',
            'handleProjectLoaded',
            'handleSave',
            'handleSaveAs',
            'handleSetMode',
            'handleKeyPress',
            'handleRestoreOption',
            'getProjectFilename',
            'restoreOptionMessage'
        ]);

        const showSaveFilePicker =
            typeof window !== 'undefined' &&
            typeof window.showSaveFilePicker === 'function' ?
                window.showSaveFilePicker.bind(window) :
                null;

        this.projectFileService =
            createEasyBloxProjectFileService({
                showSaveFilePicker,
                saveProjectSb3:
                    this.props.vm.saveProjectSb3.bind(
                        this.props.vm
                    ),
                getProjectFilename: this.getProjectFilename,
                downloadBlob
            });
    }
    componentDidMount () {
        document.addEventListener(
            'keydown',
            this.handleKeyPress
        );

        this.props.vm.on(
            'PROJECT_LOADED',
            this.handleProjectLoaded
        );
    }
    componentWillUnmount () {
        document.removeEventListener(
            'keydown',
            this.handleKeyPress
        );

        this.props.vm.removeListener(
            'PROJECT_LOADED',
            this.handleProjectLoaded
        );
    }
    handleProjectLoaded () {
        this.projectFileService.clearFileHandle();
    }
    handleSave () {
        return this.projectFileService.save();
    }
    handleSaveAs () {
        return this.projectFileService.saveAs();
    }
    getProjectFilename () {
        let filenameTitle = this.props.projectTitle;

        if (!filenameTitle || filenameTitle.length === 0) {
            filenameTitle = projectTitleInitialState;
        }

        return `${filenameTitle.substring(0, 100)}.sb3`;
    }
    handleClickNew () {
        // if the project is dirty, and user owns the project, we will autosave.
        // but if they are not logged in and can't save, user should consider
        // downloading or logging in first.
        // Note that if user is logged in and editing someone else's project,
        // they'll lose their work.
        const readyToReplaceProject = this.props.confirmReadyToReplaceProject(
            this.props.intl.formatMessage(sharedMessages.replaceProjectWarning)
        );
        if (readyToReplaceProject) {
            this.props.onClickNew(this.props.canSave && this.props.canCreateNew);
        }
    }
    handleClickSeeCommunity (waitForUpdate) {
        if (this.props.shouldSaveBeforeTransition()) {
            this.props.autoUpdateProject(); // save before transitioning to project page
            waitForUpdate({
                isSaving: true
            }); // queue the transition to project page
        } else {
            waitForUpdate(); // immediately transition to project page
        }
    }
    handleClickShare (waitForUpdate) {
        if (!this.props.isShared) {
            if (this.props.canShare) { // save before transitioning to project page
                this.props.onShare();
            }
            if (this.props.canSave) { // save before transitioning to project page
                this.props.autoUpdateProject();
                waitForUpdate({
                    isSaving: true,
                    isSharing: true
                }); // queue the transition to project page
            }
        }
    }
    handleSetMode (mode) {
        return () => {
            // Turn on/off filters for modes.
            if (mode === '1920') {
                document.documentElement.style.filter = 'brightness(.9)contrast(.8)sepia(1.0)';
                document.documentElement.style.height = '100%';
            } else if (mode === '1990') {
                document.documentElement.style.filter = 'hue-rotate(40deg)';
                document.documentElement.style.height = '100%';
            } else {
                document.documentElement.style.filter = '';
                document.documentElement.style.height = '';
            }

            // Change logo for modes
            if (mode === '1990') {
                document.getElementById('logo_img').src = ninetiesLogo;
            } else if (mode === '2020') {
                document.getElementById('logo_img').src = catLogo;
            } else if (mode === '1920') {
                document.getElementById('logo_img').src = oldtimeyLogo;
            } else if (mode === '220022BC') {
                document.getElementById('logo_img').src = prehistoricLogo;
            } else {
                document.getElementById('logo_img').src = getScratchLogo(this.props.platform);
            }

            this.props.onSetTimeTravelMode(mode);
        };
    }
    handleRestoreOption (restoreFun) {
        return () => {
            restoreFun();
        };
    }
    handleKeyPress (event) {
        const modifier = bowser.mac ? event.metaKey : event.ctrlKey;
        if (modifier && event.key === 's') {
            this.handleSave();
            event.preventDefault();
        }
    }
    restoreOptionMessage (deletedItem) {
        switch (deletedItem) {
        case 'Sprite':
            return (<FormattedMessage
                defaultMessage="Restore Sprite"
                description="Menu bar item for restoring the last deleted sprite."
                id="gui.menuBar.restoreSprite"
            />);
        case 'Sound':
            return (<FormattedMessage
                defaultMessage="Restore Sound"
                description="Menu bar item for restoring the last deleted sound."
                id="gui.menuBar.restoreSound"
            />);
        case 'Costume':
            return (<FormattedMessage
                defaultMessage="Restore Costume"
                description="Menu bar item for restoring the last deleted costume."
                id="gui.menuBar.restoreCostume"
            />);
        default: {
            return (<FormattedMessage
                defaultMessage="Restore"
                description="Menu bar item for restoring the last deleted item in its disabled state." /* eslint-disable-line @stylistic/max-len */
                id="gui.menuBar.restore"
            />);
        }
        }
    }
    render () {
        const remixMessage = (
            <FormattedMessage
                defaultMessage="Remix"
                description="Menu bar item for remixing"
                id="gui.menuBar.remix"
            />
        );
        const remixButton = (
            <Button
                className={classNames(
                    styles.menuBarButton,
                    styles.remixButton
                )}
                iconClassName={styles.remixButtonIcon}
                iconSrc={remixIcon}
                onClick={this.props.onClickRemix}
            >
                {remixMessage}
            </Button>
        );

        return (
            <Box
                className={classNames(
                    this.props.className,
                    styles.menuBar
                )}
                aria-label={this.props.ariaLabel}
                role={this.props.ariaRole}
                element="header"
            >
                <div className={styles.fileGroup}>
                    <button
                        aria-label={this.props.intl.formatMessage(ariaMessages.home)}
                        className={classNames(styles.menuBarItem)}
                        onClick={this.props.onClickLogo}
                    >
                        <img
                            id="logo_img"
                            alt="EasyBlox"
                            className={classNames(styles.scratchLogo, {
                                [styles.clickable]: typeof this.props.onClickLogo !== 'undefined'
                            })}
                            draggable={false}
                            src={getScratchLogo(this.props.platform)}
                        />
                    </button>
                    {(this.props.canManageFiles) && (<FileMenu
                        onStartSelectingFileUpload={this.props.onStartSelectingFileUpload}
                        onClickNew={this.handleClickNew}
                        onClickRemix={this.props.onClickRemix}
                        onClickSave={this.handleSave}
                        onClickSaveAs={this.handleSaveAs}
                        canCreateCopy={this.props.canCreateCopy}
                        canRemix={this.props.canRemix}
                        intl={this.props.intl}
                        isRtl={this.props.isRtl}
                        remixMessage={remixMessage}
                        depth={1}
                    />)}
                    <EditMenu
                        isRtl={this.props.isRtl}
                        onRestoreOption={this.handleRestoreOption}
                        restoreOptionMessage={this.restoreOptionMessage}
                        depth={1}
                    />
                    {this.props.isTotallyNormal && (<ModeMenu
                        onSetMode={this.handleSetMode}
                        modeNow={this.props.modeNow}
                        mode2020={this.props.mode2020}
                        isRtl={this.props.isRtl}
                        depth={1}
                    />)}

                    {this.props.canRemix ? (
                        <div className={classNames(styles.menuBarItem)}>
                            {remixButton}
                        </div>
                    ) : null}

                    {this.props.onClickAbout && (
                        <AboutMenu
                            onClick={this.props.onClickAbout}
                            isRtl={this.props.isRtl}
                            depth={1}
                        />
                    )}
                </div>
                <div className={styles.projectControlsGroup}>
                    {this.props.canEditTitle ? (
                        <div className={classNames(styles.menuBarItem, styles.growable)}>
                            <MenuBarItemTooltip
                                enable
                                id="title-field"
                            >
                                <ProjectTitleInput
                                    className={classNames(styles.titleFieldGrowable)}
                                />
                            </MenuBarItemTooltip>
                        </div>
                    ) : ((this.props.authorUsername &&
                        this.props.authorUsername !== this.props.username) ? (
                            <AuthorInfo
                                className={styles.authorInfo}
                                imageUrl={this.props.authorThumbnailUrl}
                                projectTitle={this.props.projectTitle}
                                userId={this.props.authorId}
                                username={this.props.authorUsername}
                                avatarBadge={this.props.authorAvatarBadge}
                            />
                        ) : null)}

                    <button
                        aria-label="Salvar"
                        className={classNames(
                            styles.menuBarItem,
                            styles.noOffset,
                            styles.hoverable,
                            styles.quickSaveButton
                        )}
                        title="Salvar"
                        type="button"
                        onClick={this.handleSave}
                    >
                        <svg
                            aria-hidden="true"
                            className={styles.quickSaveIcon}
                            viewBox="0 0 24 24"
                        >
                            <path d={quickSaveIconPath} />
                        </svg>
                    </button>
                </div>

                               <div className={styles.rightControlsGroup}>
                    <button
                        aria-label="Controlador"
                        aria-pressed={this.props.controllerOpen}
                        className={classNames(
                            styles.menuBarItem,
                            styles.controllerButton,
                            {
                                [styles.controllerButtonActive]:
                                    this.props.controllerOpen
                            }
                        )}
                        title="Controlador"
                        type="button"
                        onClick={this.props.onToggleController}
                    >
                        Controlador
                    </button>
                    <div className={styles.hardwareControlGroup}>
                        <HardwareControls
                            connectionState={this.props.connectionState}
                            selectedBoard={this.props.selectedBoard}
                            stageFirmwareIssue={this.props.stageFirmwareIssue}
                            onSelectBoard={this.props.onSelectBoard}
                            onConnect={this.props.onConnect}
                            onDisconnect={this.props.onDisconnect}
                            onPrepareStageFirmware={
                                this.props.onPrepareStageFirmware
                            }
                        />

                        <span className={styles.hardwareControlLabel}>
                            Modo
                        </span>

                        <ProgramModeSelector
                            mode={this.props.programMode}
                            onModeChange={this.props.onProgramModeChange}
                        />
                    </div>

                    {(this.props.canChangeColorMode ||
                        this.props.canChangeLanguage ||
                        this.props.canChangeTheme) && (
                        <div
                            className={classNames(
                                styles.menuBarItem,
                                styles.settingsControl
                            )}
                        >
                            <SettingsMenu
                                canChangeLanguage={this.props.canChangeLanguage}
                                canChangeColorMode={this.props.canChangeColorMode}
                                canChangeTheme={this.props.canChangeTheme}
                                hasActiveMembership={this.props.hasActiveMembership}
                                isRtl={this.props.isRtl}
                                depth={1}
                            />
                        </div>
                    )}
                </div>
            </Box>
        );
    }
}

MenuBar.propTypes = {
    accountMenuOpen: PropTypes.bool,
    ariaLabel: PropTypes.string,
    ariaRole: PropTypes.string,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorAvatarBadge: PropTypes.number,
    autoUpdateProject: PropTypes.func,
    canChangeLanguage: PropTypes.bool,
    canChangeColorMode: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    className: PropTypes.string,
    confirmReadyToReplaceProject: PropTypes.func,
    currentLocale: PropTypes.string.isRequired,
    enableCommunity: PropTypes.bool,
    hasActiveMembership: PropTypes.bool,
    intl: intlShape,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    isUpdating: PropTypes.bool,
    loginMenuOpen: PropTypes.bool,
    logo: PropTypes.string,
    mode1920: PropTypes.bool,
    mode1990: PropTypes.bool,
    mode2020: PropTypes.bool,
    mode220022BC: PropTypes.bool,
    modeNow: PropTypes.bool,
    onClickAbout: PropTypes.oneOfType([
        PropTypes.func, // button mode: call this callback when the About button is clicked
        PropTypes.arrayOf( // menu mode: list of items in the About menu
            PropTypes.shape({
                title: PropTypes.string, // text for the menu item
                onClick: PropTypes.func // call this callback when the menu item is clicked
            })
        )
    ]),
    onClickLogin: PropTypes.func,
    onClickLogo: PropTypes.func,
    onClickMode: PropTypes.func,
    onClickNew: PropTypes.func,
    onClickRemix: PropTypes.func,
    onClickSaveAsCopy: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onRequestCloseLogin: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onSetTimeTravelMode: PropTypes.func,
    onShare: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    controllerOpen: PropTypes.bool,
    onToggleController: PropTypes.func,

    connectionState: PropTypes.oneOf([
        'disconnected',
        'connecting',
        'connected',
        'uploading',
        'error',
        'restoring'
    ]),
    onSelectBoard: PropTypes.func,
    onConnect: PropTypes.func,
    onDisconnect: PropTypes.func,
    onPrepareStageFirmware: PropTypes.func,
    stageFirmwareIssue: PropTypes.oneOf([
        'legacy',
        'incompatible',
        'unidentified'
    ]),
    selectedBoard: PropTypes.oneOf([
        'arduino-uno'
    ]),

    programMode: PropTypes.oneOf([
        'stage',
        'upload'
    ]),
    onProgramModeChange: PropTypes.func,

    platform: PropTypes.oneOf(Object.keys(PLATFORM)),
    projectTitle: PropTypes.string,
    renderLogin: PropTypes.func,
    shouldSaveBeforeTransition: PropTypes.func,
    showComingSoon: PropTypes.bool,
    username: PropTypes.string,
    avatarBadge: PropTypes.number,
    userOwnsProject: PropTypes.bool,

    accountMenuOptions: AccountMenuOptionsPropTypes,

    vm: PropTypes.instanceOf(VM).isRequired
};

MenuBar.defaultProps = {
    logo: scratchLogo,
    onShare: () => {},
    controllerOpen: false,
    programMode: 'stage',
    connectionState: 'disconnected',
    onSelectBoard: () => {},
    onConnect: () => {},
    onDisconnect: () => {},
    onPrepareStageFirmware: () => {},
    selectedBoard: null,
    stageFirmwareIssue: null,
    onProgramModeChange: () => {}
};

const mapStateToProps = (state, ownProps) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    const user = state.session && state.session.session && state.session.session.user;
    const permissions = state.session && state.session.permissions;
    const sessionExists = state.session && typeof state.session.session !== 'undefined';

    return {
        currentLocale: state.locales.locale,
        isRtl: state.locales.isRtl,
        isUpdating: getIsUpdating(loadingState),
        isShowingProject: getIsShowingProject(loadingState),
        loginMenuOpen: loginMenuOpen(state),
        projectTitle: state.scratchGui.projectTitle,
        controllerOpen:
            ownProps.controllerOpen ??
            isControllerOpen(state),
        username: ownProps.username ?? (user ? user.username : null),
        avatarBadge: ownProps.avatarBadge ?? (user ? user.membership_avatar_badge : null),
        userIsEducator: permissions && permissions.educator,
        vm: state.scratchGui.vm,
        mode220022BC: isTimeTravel220022BC(state),
        mode1920: isTimeTravel1920(state),
        mode1990: isTimeTravel1990(state),
        mode2020: isTimeTravel2020(state),
        modeNow: isTimeTravelNow(state),

        platform: state.scratchGui.platform.platform,

        userOwnsProject: ownProps.userOwnsProject ?? (
            ownProps.authorUsername && user && (ownProps.authorUsername === user.username)
        ),

        accountMenuOptions: ownProps.accountMenuOptions ?? {
            canHaveSession: sessionExists ?? false,

            canRegister: true,
            canLogin: true,
            canLogout: true,

            avatarUrl: user?.thumbnailUrl,
            myStuffUrl: '/mystuff/',
            profileUrl: user && `/users/${user.username}`,
            myClassesUrl: permissions?.educator ? '/educators/classes/' : null,
            myClassUrl: user && permissions?.student ? `/classes/${user.classroomId}/` : null,
            accountSettingsUrl: '/accounts/settings/'
        }
    };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
    autoUpdateProject: () => dispatch(autoUpdateProject()),
    onClickNew: needSave => dispatch(requestNewProject(needSave)),
    onClickLogin: ownProps.onClickLogin ?? (() => dispatch(openLoginMenu())),
    onClickRemix: () => dispatch(remixProject()),
    onRequestCloseLogin: () => dispatch(closeLoginMenu()),
    onSeeCommunity: ownProps.onSeeCommunity ?? (() => dispatch(setPlayer(true))),
    onSetTimeTravelMode: mode => dispatch(setTimeTravel(mode)),
    onToggleController:
        ownProps.onToggleController ??
        (() => dispatch(toggleController()))
});

export default compose(
    injectIntl,
    MenuBarHOC,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(MenuBar);
