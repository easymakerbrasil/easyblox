import PropTypes from 'prop-types';
import React from 'react';

class BoardSelector extends React.PureComponent {
    constructor (props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange (event) {
        const boardId = event.target.value;

        this.props.onBoardChange(
            boardId === '' ? null : boardId
        );
    }

    render () {
        return (
            <select
                aria-label="Placa"
                value={this.props.selectedBoard || ''}
                onChange={this.handleChange}
            >
                <option value="">
                    Nenhuma placa
                </option>
                <option value="arduino-uno">
                    Arduino UNO
                </option>
            </select>
        );
    }
}

BoardSelector.propTypes = {
    selectedBoard: PropTypes.oneOf([
        'arduino-uno'
    ]),
    onBoardChange: PropTypes.func.isRequired
};

export default BoardSelector;
