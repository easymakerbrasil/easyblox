import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import React from 'react';
import ProjectReplacementModal from '../components/project-replacement-modal/project-replacement-modal.jsx';

const MenuBarHOC = function (WrappedComponent) {
    class MenuBarContainer extends React.PureComponent {
        constructor (props) {
            super(props);
            this.state = {replacementOpen: false};
            this.pendingNewProject = null;

            bindAll(this, [
                'requestNewProjectConfirmation',
                'handleReplacementConfirm',
                'handleReplacementCancel',
                'shouldSaveBeforeTransition'
            ]);
        }
        componentWillUnmount () {
            this.pendingNewProject = null;
        }
        requestNewProjectConfirmation (onConfirm) {
            if (this.pendingNewProject) return;
            if (this.props.projectChanged && !this.props.canCreateNew) {
                this.pendingNewProject = onConfirm;
                this.setState({replacementOpen: true});
                return;
            }
            onConfirm();
        }
        handleReplacementConfirm () {
            if (!this.pendingNewProject) return;
            const onConfirm = this.pendingNewProject;
            this.pendingNewProject = null;
            this.setState({replacementOpen: false}, onConfirm);
        }
        handleReplacementCancel () {
            this.pendingNewProject = null;
            this.setState({replacementOpen: false});
        }
        shouldSaveBeforeTransition () {
            return (this.props.canSave && this.props.projectChanged);
        }
        render () {
            const {
                 
                projectChanged,
                 
                ...props
            } = this.props;
            return (
                <React.Fragment>
                    <WrappedComponent
                        requestNewProjectConfirmation={this.requestNewProjectConfirmation}
                        shouldSaveBeforeTransition={this.shouldSaveBeforeTransition}
                        {...props}
                    />
                    <ProjectReplacementModal
                        isOpen={this.state.replacementOpen}
                        operation="new"
                        onConfirm={this.handleReplacementConfirm}
                        onCancel={this.handleReplacementCancel}
                    />
                </React.Fragment>
            );
        }
    }

    MenuBarContainer.propTypes = {
        canCreateNew: PropTypes.bool,
        canSave: PropTypes.bool,
        projectChanged: PropTypes.bool
    };
    const mapStateToProps = state => ({
        projectChanged: state.scratchGui.projectChanged
    });
    const mapDispatchToProps = () => ({});
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(MenuBarContainer);
};

export default MenuBarHOC;
