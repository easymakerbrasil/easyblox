import PropTypes from 'prop-types';
import React from 'react';

import styles from './program-mode-selector.css';

class ProgramModeSelector extends React.PureComponent {
    constructor (props) {
        super(props);

        this.handleStageClick = this.handleStageClick.bind(this);
        this.handleUploadClick = this.handleUploadClick.bind(this);
    }

    handleStageClick () {
        this.props.onModeChange('stage');
    }

    handleUploadClick () {
        this.props.onModeChange('upload');
    }

    render () {
        return (
            <div className={styles.selector}>
                <button
                    aria-pressed={this.props.mode === 'stage'}
                    className={styles.button}
                    type="button"
                    onClick={this.handleStageClick}
                >
                    Palco
                </button>

                <button
                    aria-pressed={this.props.mode === 'upload'}
                    className={styles.button}
                    type="button"
                    onClick={this.handleUploadClick}
                >
                    Carregar
                </button>
            </div>
        );
    }
}

ProgramModeSelector.propTypes = {
    mode: PropTypes.oneOf([
        'stage',
        'upload'
    ]).isRequired,
    onModeChange: PropTypes.func.isRequired
};

export default ProgramModeSelector;
