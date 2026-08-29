import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import PromptComponent from '../components/prompt/prompt.jsx';
import VM from '@scratch/scratch-vm';

class Prompt extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleOk',
            'handleScopeOptionSelection',
            'handleCancel',
            'handleChange',
            'handleKeyPress',
            'handleCloudVariableOptionChange',
            'handleEasyBloxVariableTypeChange'
        ]);
        this.state = {
            inputValue: '',
            globalSelected: true,
            cloudSelected: false,
            easybloxValueType: 'DECIMAL',
            canAddCloudVariable: (props.vm && props.vm.runtime.canAddCloudVariable()) || false
        };
    }
    handleKeyPress (event) {
        if (event.key === 'Enter') this.handleOk();
    }
    handleFocus (event) {
        event.target.select();
    }
    handleOk () {
        const variableOptions = {
            scope: this.state.globalSelected ? 'global' : 'local',
            isCloud: this.state.cloudSelected
        };

        if (this.props.showEasyBloxVariableTypeOptions) {
            variableOptions.easybloxValueType =
                this.state.easybloxValueType;
        }

        this.props.onOk(
            this.state.inputValue,
            variableOptions
        );
    }
    handleCancel () {
        this.props.onCancel();
    }
    handleChange (e) {
        this.setState({inputValue: e.target.value});
    }
    handleScopeOptionSelection (e) {
        this.setState({globalSelected: (e.target.value === 'global')});
    }
    handleCloudVariableOptionChange (e) {
        if (!this.props.showCloudOption) return;

        const checked = e.target.checked;
        this.setState({cloudSelected: checked});
        if (checked) {
            this.setState({globalSelected: true});
        }
    }
    handleEasyBloxVariableTypeChange (e) {
        this.setState({
            easybloxValueType: e.target.value
        });
    }
    render () {
        return (
            <PromptComponent
                canAddCloudVariable={this.state.canAddCloudVariable}
                cloudSelected={this.state.cloudSelected}
                defaultValue={this.props.defaultValue}
                easybloxValueType={this.state.easybloxValueType}
                globalSelected={this.state.globalSelected}
                isStage={this.props.isStage}
                showListMessage={this.props.showListMessage}
                label={this.props.label}
                showCloudOption={this.props.showCloudOption}
                showEasyBloxVariableTypeOptions={
                    this.props.showEasyBloxVariableTypeOptions
                }
                showVariableOptions={this.props.showVariableOptions}
                title={this.props.title}
                onCancel={this.handleCancel}
                onChange={this.handleChange}
                onCloudVarOptionChange={this.handleCloudVariableOptionChange}
                onEasyBloxVariableTypeChange={
                    this.handleEasyBloxVariableTypeChange
                }
                onFocus={this.handleFocus}
                onKeyPress={this.handleKeyPress}
                onOk={this.handleOk}
                onScopeOptionSelection={this.handleScopeOptionSelection}
            />
        );
    }
}

Prompt.propTypes = {
    defaultValue: PropTypes.string,
    isStage: PropTypes.bool.isRequired,
    showListMessage: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    showCloudOption: PropTypes.bool.isRequired,
    showVariableOptions: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    showEasyBloxVariableTypeOptions: PropTypes.bool,
    vm: PropTypes.instanceOf(VM)
};

export default Prompt;
