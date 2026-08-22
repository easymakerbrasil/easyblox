import PropTypes from 'prop-types';
import React from 'react';

import Modal from '../modal/modal.jsx';
import {getVisibleBoards} from '../../lib/libraries/extensions/index.jsx';
import styles from './board-selection-modal.css';

class BoardSelectionModal extends React.PureComponent {
    constructor (props) {
        super(props);

        this.handleBoardSelect = this.handleBoardSelect.bind(this);
    }

    handleBoardSelect (event) {
        this.props.onConfirm(event.currentTarget.dataset.boardId);
    }

    render () {
        const visibleBoards = getVisibleBoards().filter(board =>
            !this.props.requiredMode ||
            board.supportedModes.includes(this.props.requiredMode)
        );

        return (
            <Modal
                className={styles.modalContent}
                contentLabel="Selecione uma placa"
                headerClassName={styles.header}
                id="boardSelectionModal"
                onRequestClose={this.props.onCancel}
            >
                <div className={styles.body}>
                    <p className={styles.description}>
                        Escolha a placa que deseja programar.
                    </p>

                    <div className={styles.boardGrid}>
                        {visibleBoards.map(board => (
                            <button
                                aria-label={board.name}
                                className={styles.boardCard}
                                data-board-id={board.boardId}
                                key={board.boardId}
                                type="button"
                                onClick={this.handleBoardSelect}
                            >
                                <img
                                    alt=""
                                    className={styles.boardImage}
                                    src={board.iconURL}
                                />

                                <span className={styles.boardName}>
                                    {board.name}
                                </span>
                            </button>
                        ))}
                    </div>
                                        {this.props.selectedBoard ? (
                        <div className={styles.removeBoardSection}>
                            <button
                                className={styles.removeBoardButton}
                                type="button"
                                onClick={this.props.onRemove}
                            >
                                Remover placa selecionada
                            </button>
                        </div>
                    ) : null}
                </div>
            </Modal>
        );
    }
}

BoardSelectionModal.propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onRemove: PropTypes.func,
    requiredMode: PropTypes.oneOf([
        'stage',
        'upload'
    ]),
    selectedBoard: PropTypes.string
};

BoardSelectionModal.defaultProps = {
    onRemove: null,
    selectedBoard: null
};

export default BoardSelectionModal;
