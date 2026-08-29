import PropTypes from 'prop-types';
import React from 'react';
import Modal from '../../containers/modal.jsx';
import Box from '../box/box.jsx';
import {defineMessages, FormattedMessage, useIntl} from 'react-intl';

import booleanInputIcon from './icon--boolean-input.svg';
import textInputIcon from './icon--text-input.svg';
import labelIcon from './icon--label.svg';

import styles from './custom-procedures.css';

const messages = defineMessages({
    myblockModalTitle: {
        defaultMessage: 'Make a Block',
        description: 'Title for the modal where you create a custom block.',
        id: 'gui.customProcedures.myblockModalTitle'
    }
});

const CustomProcedures = props => {
    const intl = useIntl();
    return (
        <Modal
            className={styles.modalContent}
            contentLabel={intl.formatMessage(messages.myblockModalTitle)}
            onRequestClose={props.onCancel}
        >
            <Box
                className={styles.workspace}
                componentRef={props.componentRef}
            />
            <Box className={styles.body}>
                <div className={styles.optionsRow}>
                    <div
                        className={styles.optionCard}
                        role="button"
                        tabIndex="0"
                        onClick={props.onAddInteger}
                    >
                        <img
                            className={styles.optionIcon}
                            src={textInputIcon}
                        />
                        <div className={styles.optionTitle}>
                            <FormattedMessage
                                defaultMessage="Adicionar entrada"
                                description="Label for button to add an integer input"
                                id="gui.customProcedures.easybloxAddIntegerInput"
                            />
                        </div>
                        <div className={styles.optionDescription}>
                            <FormattedMessage
                                defaultMessage="Número inteiro"
                                description="Description of the EasyBlox integer input type"
                                id="gui.customProcedures.easybloxIntegerType"
                            />
                        </div>
                    </div>

                    <div
                        className={styles.optionCard}
                        role="button"
                        tabIndex="0"
                        onClick={props.onAddDecimal}
                    >
                        <img
                            className={styles.optionIcon}
                            src={textInputIcon}
                        />
                        <div className={styles.optionTitle}>
                            <FormattedMessage
                                defaultMessage="Adicionar entrada"
                                description="Label for button to add a decimal input"
                                id="gui.customProcedures.easybloxAddDecimalInput"
                            />
                        </div>
                        <div className={styles.optionDescription}>
                            <FormattedMessage
                                defaultMessage="Número decimal"
                                description="Description of the EasyBlox decimal input type"
                                id="gui.customProcedures.easybloxDecimalType"
                            />
                        </div>
                    </div>

                    <div
                        className={styles.optionCard}
                        role="button"
                        tabIndex="0"
                        onClick={props.onAddText}
                    >
                        <img
                            className={styles.optionIcon}
                            src={textInputIcon}
                        />
                        <div className={styles.optionTitle}>
                            <FormattedMessage
                                defaultMessage="Adicionar entrada"
                                description="Label for button to add a text input"
                                id="gui.customProcedures.easybloxAddTextInput"
                            />
                        </div>
                        <div className={styles.optionDescription}>
                            <FormattedMessage
                                defaultMessage="Texto"
                                description="Description of the EasyBlox text input type"
                                id="gui.customProcedures.easybloxTextType"
                            />
                        </div>
                    </div>

                    <div
                        className={styles.optionCard}
                        role="button"
                        tabIndex="0"
                        onClick={props.onAddBoolean}
                    >
                        <img
                            className={styles.optionIcon}
                            src={booleanInputIcon}
                        />
                        <div className={styles.optionTitle}>
                            <FormattedMessage
                                defaultMessage="Adicionar entrada"
                                description="Label for button to add a boolean input"
                                id="gui.customProcedures.easybloxAddBooleanInput"
                            />
                        </div>
                        <div className={styles.optionDescription}>
                            <FormattedMessage
                                defaultMessage="Verdadeiro/Falso"
                                description="Description of the EasyBlox boolean input type"
                                id="gui.customProcedures.easybloxBooleanType"
                            />
                        </div>
                    </div>
                </div>

                <div className={`${styles.optionsRow} ${styles.labelRow}`}>
                    <div
                        className={styles.optionCard}
                        role="button"
                        tabIndex="0"
                        onClick={props.onAddLabel}
                    >
                        <img
                            className={styles.optionIcon}
                            src={labelIcon}
                        />
                        <div className={styles.optionTitle}>
                            <FormattedMessage
                                defaultMessage="Adicionar rótulo"
                                description="Label for button to add a label"
                                id="gui.customProcedures.easybloxAddLabel"
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.checkboxRow}>
                    <label>
                        <input
                            checked={props.warp}
                            type="checkbox"
                            onChange={props.onToggleWarp}
                        />
                        <FormattedMessage
                            defaultMessage="Run without screen refresh"
                            description="Label for checkbox to run without screen refresh"
                            id="gui.customProcedures.runWithoutScreenRefresh"
                        />
                    </label>
                </div>
                <Box className={styles.buttonRow}>
                    <button
                        className={styles.cancelButton}
                        onClick={props.onCancel}
                    >
                        <FormattedMessage
                            defaultMessage="Cancel"
                            description="Label for button to cancel custom procedure edits"
                            id="gui.customProcedures.cancel"
                        />
                    </button>
                    <button
                        className={styles.okButton}
                        onClick={props.onOk}
                    >
                        <FormattedMessage
                            defaultMessage="OK"
                            description="Label for button to save new custom procedure"
                            id="gui.customProcedures.ok"
                        />
                    </button>
                </Box>
            </Box>
        </Modal>
    );
};

CustomProcedures.propTypes = {
    componentRef: PropTypes.func.isRequired,
    onAddBoolean: PropTypes.func.isRequired,
    onAddDecimal: PropTypes.func.isRequired,
    onAddInteger: PropTypes.func.isRequired,
    onAddLabel: PropTypes.func.isRequired,
    onAddText: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    onToggleWarp: PropTypes.func.isRequired,
    warp: PropTypes.bool.isRequired
};

export default CustomProcedures;
