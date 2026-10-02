import PropTypes from 'prop-types';
import React from 'react';

import {
    getBoardById,
    getVisibleBoards
} from '../../lib/libraries/extensions/index.jsx';

class BoardSelector extends React.PureComponent {
    constructor (props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange (event) {
        const boardId =
            event.target.value;

        if (boardId === '') {
            this.props.onBoardChange(null);
            return;
        }

        const board =
            getBoardById(boardId);

        if (
            !board ||
            board.releaseState !== 'available'
        ) {
            return;
        }

        this.props.onBoardChange(
            boardId
        );
    }

    render () {
        const visibleBoards = getVisibleBoards();

        return (
            <select
                aria-label="Placa"
                value={this.props.selectedBoard || ''}
                onChange={this.handleChange}
            >
                <option value="">
                    Nenhuma placa
                </option>
                {visibleBoards.map(board => (
                    <option
                        disabled={
                            board.releaseState !==
                            'available'
                        }
                        key={board.boardId}
                        value={board.boardId}
                    >
                        {board.name}
                    </option>
                ))}
            </select>
        );
    }
}

BoardSelector.propTypes = {
    selectedBoard: PropTypes.string,
    onBoardChange: PropTypes.func.isRequired
};

export default BoardSelector;
