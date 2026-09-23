import PropTypes from 'prop-types';
import React from 'react';

import Modal from '../modal/modal.jsx';

import EasyBloxQrPreview from './easyblox-qr-preview.jsx';
import styles from './easyblox-qr-modal.css';

const MODE_CREATE = 'create';
const MODE_MANAGE = 'manage';

const PREVIEW_RASTER_SIZE = 256;
const DOWNLOAD_RASTER_SIZE = 1024;

const drawQrRasterToCanvas = (
    canvas,
    raster
) => {
    if (
        !canvas ||
        !raster
    ) {
        return false;
    }

    canvas.width =
        raster.width;
    canvas.height =
        raster.height;

    const context =
        canvas.getContext('2d');

    if (!context) {
        return false;
    }

    const imageData =
        context.createImageData(
            raster.width,
            raster.height
        );

    imageData.data.set(
        raster.pixels
    );

    context.putImageData(
        imageData,
        0,
        0
    );

    return true;
};

const sanitizeDownloadName = name =>
    String(name)
        .trim()
        .replace(
            /[<>:"/\\|?*]/g,
            '-'
        );

class EasyBloxQrModal extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            mode:
                props.initialMode ||
                MODE_CREATE,
            name: '',
            content: '',
            editingId: null,
            editingName: '',
            editingContent: '',
            pendingDeleteId: null,
            error: ''
        };

        this.handleNameChange =
            this.handleNameChange.bind(this);
        this.handleContentChange =
            this.handleContentChange.bind(this);
        this.handleEditingNameChange =
            this.handleEditingNameChange.bind(this);
        this.handleEditingContentChange =
            this.handleEditingContentChange.bind(this);
        this.handleCreateModeClick =
            this.handleCreateModeClick.bind(this);
        this.handleManageModeClick =
            this.handleManageModeClick.bind(this);
        this.handleCreateNew =
            this.handleCreateNew.bind(this);
        this.handleCreate =
            this.handleCreate.bind(this);
        this.handleEditClick =
            this.handleEditClick.bind(this);
        this.handleCancelEdit =
            this.handleCancelEdit.bind(this);
        this.handleSaveEdit =
            this.handleSaveEdit.bind(this);
        this.handleRequestDelete =
            this.handleRequestDelete.bind(this);
        this.handleCancelDelete =
            this.handleCancelDelete.bind(this);
        this.handleConfirmDelete =
            this.handleConfirmDelete.bind(this);
        this.handleDownload =
            this.handleDownload.bind(this);
        this.renderQrCode =
            this.renderQrCode.bind(this);
    }

    getQrCodes () {
        const {vm} =
            this.props;

        return (
            typeof vm.getEasyBloxQrCodes ===
                'function' ?
                vm.getEasyBloxQrCodes() :
                []
        );
    }

    handleNameChange (event) {
        this.setState({
            name:
                event.target.value
        });
    }

    handleContentChange (event) {
        this.setState({
            content:
                event.target.value
        });
    }

    handleEditingNameChange (event) {
        this.setState({
            editingName:
                event.target.value
        });
    }

    handleEditingContentChange (event) {
        this.setState({
            editingContent:
                event.target.value
        });
    }

    handleCreateModeClick () {
        this.setState({
            error: '',
            mode:
                MODE_CREATE
        });
    }

    handleManageModeClick () {
        this.setState({
            error: '',
            mode:
                MODE_MANAGE
        });
    }

    handleCreateNew () {
        this.setState({
            mode:
                MODE_CREATE,
            name: '',
            content: '',
            editingId: null,
            editingName: '',
            editingContent: '',
            pendingDeleteId: null,
            error: ''
        });
    }

    handleCreate (event) {
        event.preventDefault();

        const {
            name,
            content
        } = this.state;

        if (!name.trim()) {
            this.setState({
                error:
                    'Informe um nome para o QR Code.'
            });
            return;
        }

        if (!content.length) {
            this.setState({
                error:
                    'Informe o conteúdo do QR Code.'
            });
            return;
        }

        try {
            this.props.vm.createEasyBloxQrCode(
                name,
                content
            );

            this.setState({
                mode:
                    MODE_MANAGE,
                name: '',
                content: '',
                error: ''
            });
        } catch (createError) {
            this.setState({
                error:
                    createError &&
                    createError.message ?
                        createError.message :
                        'Não foi possível criar o QR Code.'
            });
        }
    }

    handleEditClick (event) {
        const id =
            event.currentTarget.dataset.qrId;

        const qrCode =
            this.getQrCodes().find(
                item =>
                    item.id === id
            );

        if (!qrCode) {
            return;
        }

        this.setState({
            editingId:
                qrCode.id,
            editingName:
                qrCode.name,
            editingContent:
                qrCode.content,
            pendingDeleteId:
                null,
            error:
                ''
        });
    }

    handleCancelEdit () {
        this.setState({
            editingId:
                null,
            editingName:
                '',
            editingContent:
                '',
            error:
                ''
        });
    }

    handleSaveEdit (event) {
        event.preventDefault();

        const {
            editingId,
            editingName,
            editingContent
        } = this.state;

        if (!editingName.trim()) {
            this.setState({
                error:
                    'Informe um nome para o QR Code.'
            });
            return;
        }

        if (!editingContent.length) {
            this.setState({
                error:
                    'Informe o conteúdo do QR Code.'
            });
            return;
        }

        try {
            this.props.vm.updateEasyBloxQrCode(
                editingId,
                {
                    name:
                        editingName,
                    content:
                        editingContent
                }
            );

            this.setState({
                editingId:
                    null,
                editingName:
                    '',
                editingContent:
                    '',
                error:
                    ''
            });
        } catch (updateError) {
            this.setState({
                error:
                    updateError &&
                    updateError.message ?
                        updateError.message :
                        'Não foi possível atualizar o QR Code.'
            });
        }
    }

    handleRequestDelete (event) {
        this.setState({
            pendingDeleteId:
                event.currentTarget.dataset.qrId,
            error:
                ''
        });
    }

    handleCancelDelete () {
        this.setState({
            pendingDeleteId:
                null
        });
    }

    handleConfirmDelete (event) {
        const id =
            event.currentTarget.dataset.qrId;

        try {
            this.props.vm.deleteEasyBloxQrCode(
                id
            );

            const nextState = {
                pendingDeleteId:
                    null,
                error:
                    ''
            };

            if (
                this.state.editingId === id
            ) {
                nextState.editingId =
                    null;
                nextState.editingName =
                    '';
                nextState.editingContent =
                    '';
            }

            this.setState(
                nextState
            );
        } catch (deleteError) {
            this.setState({
                error:
                    deleteError &&
                    deleteError.message ?
                        deleteError.message :
                        'Não foi possível excluir o QR Code.'
            });
        }
    }

    handleDownload (event) {
        const id =
            event.currentTarget.dataset.qrId;

        const qrCode =
            this.getQrCodes().find(
                item =>
                    item.id === id
            );

        if (!qrCode) {
            return;
        }

        try {
            const raster =
                this.props.vm
                    .getEasyBloxQrCodeRaster(
                        id,
                        {
                            size:
                                DOWNLOAD_RASTER_SIZE
                        }
                    );

            if (!raster) {
                throw new Error(
                    'QR Code resource is unavailable'
                );
            }

            const canvas =
                document.createElement(
                    'canvas'
                );

            if (
                !drawQrRasterToCanvas(
                    canvas,
                    raster
                )
            ) {
                throw new Error(
                    'QR Code canvas is unavailable'
                );
            }

            const link =
                document.createElement(
                    'a'
                );

            const fileName =
                sanitizeDownloadName(
                    qrCode.name
                ) ||
                'QR-Code';

            link.download =
                `${fileName}.png`;

            link.href =
                canvas.toDataURL(
                    'image/png'
                );

            link.click();
        } catch (downloadError) {
            this.setState({
                error:
                    downloadError &&
                    downloadError.message ?
                        downloadError.message :
                        'Não foi possível baixar o QR Code.'
            });
        }
    }

    renderCreate () {
        const {
            content,
            error,
            name
        } = this.state;

        return (
            <form
                className={styles.form}
                onSubmit={this.handleCreate}
            >
                <div className={styles.intro}>
                    Crie um QR Code que ficará salvo junto com este projeto.
                </div>

                <label className={styles.field}>
                    <span className={styles.label}>
                        Nome
                    </span>

                    <input
                        autoFocus
                        aria-label="Nome do QR Code"
                        className={styles.input}
                        maxLength={80}
                        placeholder="Ex.: Estação 1"
                        type="text"
                        value={name}
                        onChange={this.handleNameChange}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>
                        Conteúdo
                    </span>

                    <textarea
                        aria-label="Conteúdo do QR Code"
                        className={styles.textarea}
                        placeholder="Texto, link ou informação que será armazenada no QR Code"
                        rows={5}
                        value={content}
                        onChange={this.handleContentChange}
                    />
                </label>

                {error ? (
                    <div
                        className={styles.error}
                        role="alert"
                    >
                        {error}
                    </div>
                ) : null}

                <div className={styles.footer}>
                    <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={
                            this.props.onRequestClose
                        }
                    >
                        Cancelar
                    </button>

                    <button
                        className={styles.primaryButton}
                        type="submit"
                    >
                        Criar
                    </button>
                </div>
            </form>
        );
    }

    renderEditForm (qrCode) {
        return (
            <form
                className={styles.editForm}
                onSubmit={this.handleSaveEdit}
            >
                <label className={styles.field}>
                    <span className={styles.label}>
                        Nome
                    </span>

                    <input
                        aria-label={`Nome do QR Code ${qrCode.name}`}
                        className={styles.input}
                        maxLength={80}
                        type="text"
                        value={
                            this.state
                                .editingName
                        }
                        onChange={
                            this.handleEditingNameChange
                        }
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>
                        Conteúdo
                    </span>

                    <textarea
                        aria-label={`Conteúdo do QR Code ${qrCode.name}`}
                        className={styles.textarea}
                        rows={4}
                        value={
                            this.state
                                .editingContent
                        }
                        onChange={
                            this.handleEditingContentChange
                        }
                    />
                </label>

                <div className={styles.inlineActions}>
                    <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={
                            this.handleCancelEdit
                        }
                    >
                        Cancelar
                    </button>

                    <button
                        className={styles.primaryButton}
                        type="submit"
                    >
                        Salvar
                    </button>
                </div>
            </form>
        );
    }

    renderQrCode (qrCode) {
        const {
            editingId,
            pendingDeleteId
        } = this.state;

        const previewRaster =
            this.props.vm
                .getEasyBloxQrCodeRaster(
                    qrCode.id,
                    {
                        size:
                            PREVIEW_RASTER_SIZE
                    }
                );

        return (
            <div
                className={styles.resource}
                key={qrCode.id}
            >
                {editingId === qrCode.id ?
                    this.renderEditForm(
                        qrCode
                    ) :
                    (
                        <div className={styles.resourceOverview}>
                            <div className={styles.previewFrame}>
                                {previewRaster ? (
                                    <EasyBloxQrPreview
                                        drawRaster={
                                            drawQrRasterToCanvas
                                        }
                                        name={qrCode.name}
                                        raster={previewRaster}
                                    />
                                ) : null}
                            </div>

                            <div className={styles.resourceDetails}>
                                <div className={styles.resourceInfo}>
                                    <div className={styles.resourceName}>
                                        {qrCode.name}
                                    </div>

                                    <div className={styles.resourceContent}>
                                        {qrCode.content}
                                    </div>
                                </div>

                                {pendingDeleteId === qrCode.id ? (
                                    <div className={styles.deleteConfirmation}>
                                        <span>
                                            Excluir este QR Code?
                                        </span>

                                        <div className={styles.inlineActions}>
                                            <button
                                                className={styles.secondaryButton}
                                                type="button"
                                                onClick={
                                                    this.handleCancelDelete
                                                }
                                            >
                                                Cancelar
                                            </button>

                                            <button
                                                className={styles.dangerButton}
                                                data-qr-id={qrCode.id}
                                                type="button"
                                                onClick={
                                                    this.handleConfirmDelete
                                                }
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.inlineActions}>
                                        <button
                                            className={styles.secondaryButton}
                                            data-qr-id={qrCode.id}
                                            type="button"
                                            onClick={
                                                this.handleDownload
                                            }
                                        >
                                            Baixar PNG
                                        </button>

                                        <button
                                            className={styles.secondaryButton}
                                            data-qr-id={qrCode.id}
                                            type="button"
                                            onClick={
                                                this.handleEditClick
                                            }
                                        >
                                            Editar
                                        </button>

                                        <button
                                            className={styles.deleteButton}
                                            data-qr-id={qrCode.id}
                                            type="button"
                                            onClick={
                                                this.handleRequestDelete
                                            }
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
            </div>
        );
    }

    renderManage () {
        const qrCodes =
            this.getQrCodes();

        return (
            <div className={styles.manage}>
                <div className={styles.manageHeader}>
                    <div>
                        <div className={styles.manageTitle}>
                            QR Codes do projeto
                        </div>

                        <div className={styles.manageSubtitle}>
                            Renomear um QR Code não altera os blocos que já o utilizam.
                        </div>
                    </div>

                    <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={
                            this.handleCreateNew
                        }
                    >
                        Criar novo
                    </button>
                </div>

                {this.state.error ? (
                    <div
                        className={styles.error}
                        role="alert"
                    >
                        {this.state.error}
                    </div>
                ) : null}

                {qrCodes.length > 0 ? (
                    <div className={styles.resourceList}>
                        {qrCodes.map(
                            this.renderQrCode
                        )}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        Nenhum QR Code foi criado neste projeto.
                    </div>
                )}

                <div className={styles.footer}>
                    <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={
                            this.props.onRequestClose
                        }
                    >
                        Concluir
                    </button>
                </div>
            </div>
        );
    }

    render () {
        const {mode} =
            this.state;

        return (
            <Modal
                className={styles.modal}
                contentLabel={
                    mode === MODE_CREATE ?
                        'Criar QR Code' :
                        'Gerenciar QR Codes'
                }
                onRequestClose={
                    this.props.onRequestClose
                }
            >
                <div className={styles.body}>
                    <div className={styles.modeTabs}>
                        <button
                            className={
                                mode === MODE_CREATE ?
                                    styles.activeTab :
                                    styles.tab
                            }
                            type="button"
                            onClick={
                                this.handleCreateModeClick
                            }
                        >
                            Criar QR Code
                        </button>

                        <button
                            className={
                                mode === MODE_MANAGE ?
                                    styles.activeTab :
                                    styles.tab
                            }
                            type="button"
                            onClick={
                                this.handleManageModeClick
                            }
                        >
                            Gerenciar
                        </button>
                    </div>

                    {mode === MODE_CREATE ?
                        this.renderCreate() :
                        this.renderManage()}
                </div>
            </Modal>
        );
    }
}

EasyBloxQrModal.propTypes = {
    initialMode: PropTypes.oneOf([
        MODE_CREATE,
        MODE_MANAGE
    ]),
    onRequestClose:
        PropTypes.func.isRequired,
    vm: PropTypes.shape({
        createEasyBloxQrCode:
            PropTypes.func.isRequired,
        deleteEasyBloxQrCode:
            PropTypes.func.isRequired,
        getEasyBloxQrCodeRaster:
            PropTypes.func.isRequired,
        getEasyBloxQrCodes:
            PropTypes.func.isRequired,
        updateEasyBloxQrCode:
            PropTypes.func.isRequired
    }).isRequired
};

export default EasyBloxQrModal;
