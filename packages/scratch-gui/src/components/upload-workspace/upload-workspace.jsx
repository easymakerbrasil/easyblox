import PropTypes from 'prop-types';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

import Modal from '../modal/modal.jsx';

import styles from './upload-workspace.css';

const EMPTY_PREVIEW_MESSAGE =
    'Monte seu programa com blocos para visualizar o código Arduino.';

const getPrismTokenClassName = function (token) {
    const aliases = token.alias ?
        (
            Array.isArray(token.alias) ?
                token.alias :
                [token.alias]
        ) :
        [];

    return [
        'token',
        token.type,
        ...aliases
    ].join(' ');
};

const renderPrismToken = (
    token,
    key
) => {
    if (typeof token === 'string') {
        return (
            <React.Fragment key={key}>
                {token}
            </React.Fragment>
        );
    }

    const contents = Array.isArray(token.content) ?
        token.content :
        [token.content];

    return (
        <span
            className={getPrismTokenClassName(token)}
            key={key}
        >
            {contents.map(
                (content, index) => renderPrismToken(
                    content,
                    `${key}-${index}`
                )
            )}
        </span>
    );
};

const copyTextToClipboard = function (text) {
    if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
    ) {
        return Promise.resolve(
            navigator.clipboard.writeText(text)
        );
    }

    const textArea = document.createElement('textarea');

    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);

    let copied = false;

    try {
        textArea.select();
        copied = document.execCommand('copy');
    } finally {
        document.body.removeChild(textArea);
    }

    return Promise.resolve(copied);
};

const renderLineNumber = function (lineNumber) {
    return (
        <li
            className={styles.lineNumber}
            key={lineNumber}
        >
            {lineNumber}
        </li>
    );
};


const getSerialMonitorStatusMessage = function (
    state,
    baudRate
) {
    switch (state) {
    case 'connecting':
        return baudRate ?
            `Conectando ao Monitor Serial em ${baudRate} baud...` :
            'Conectando ao Monitor Serial...';

    case 'connected':
        return baudRate ?
            `Monitor Serial conectado em ${baudRate} baud.` :
            'Monitor Serial conectado.';

    case 'connection-required':
        return 'Conecte a placa pelo EasyBlox para usar o Monitor Serial.';

    case 'disconnected':
        return 'Monitor Serial desconectado.';

    case 'error':
        return 'Não foi possível abrir o Monitor Serial.';

    case 'unavailable':
    default:
        return 'Este programa não inicializa a comunicação Serial.';
    }
};

const UploadWorkspace = ({
    boardName,
    code,
    error = null,
    onClearSerialMonitor = null,
    onUpload = null,
    outputEntries = [],
    serialMonitorBaudRate = null,
    serialMonitorState = 'unavailable',
    serialMonitorText = '',
    uploadState = 'idle'
}) => {
    const [
        bottomPanelExpanded,
        setBottomPanelExpanded
    ] = useState(false);

    const [
        bottomPanelTab,
        setBottomPanelTab
    ] = useState('output');

    const [
        rawCodeVisible,
        setRawCodeVisible
    ] = useState(false);

    const hasCode =
        !error &&
        code.trim().length > 0;

    const uploadBusy =
        uploadState === 'building' ||
        uploadState === 'preparing' ||
        uploadState === 'uploading';

    const lineNumbers = useMemo(
        () => {
            if (!hasCode) {
                return [];
            }

            const lineCount =
                code.split('\n').length;

            const numbers = [];

            for (
                let lineNumber = 1;
                lineNumber <= lineCount;
                lineNumber++
            ) {
                numbers.push(lineNumber);
            }

            return numbers;
        },
        [
            code,
            hasCode
        ]
    );

    const highlightedTokens = useMemo(
        () => {
            if (!hasCode) {
                return [];
            }

            return Prism.tokenize(
                code,
                Prism.languages.cpp
            );
        },
        [
            code,
            hasCode
        ]
    );

    useEffect(
        () => {
            if (!hasCode) {
                setRawCodeVisible(false);
            }
        },
        [hasCode]
    );

    useEffect(
        () => {
            if (
                uploadState !== 'idle' &&
                outputEntries.length > 0
            ) {
                setBottomPanelTab('output');
                setBottomPanelExpanded(true);
            }
        },
        [
            outputEntries.length,
            uploadState
        ]
    );

    const handleOutputTabSelect = useCallback(
        () => {
            setBottomPanelTab('output');
            setBottomPanelExpanded(true);
        },
        []
    );

    const handleSerialTabSelect = useCallback(
        () => {
            setBottomPanelTab('serial');
            setBottomPanelExpanded(true);
        },
        []
    );

    const handleBottomPanelToggle = useCallback(
        () => {
            setBottomPanelExpanded(
                expanded => !expanded
            );
        },
        []
    );

    const handleRawCodeOpen = useCallback(
        () => {
            if (hasCode) {
                setRawCodeVisible(true);
            }
        },
        [hasCode]
    );

    const handleRawCodeClose = useCallback(
        () => {
            setRawCodeVisible(false);
        },
        []
    );

    const handleCopyCode = useCallback(
        () => {
            copyTextToClipboard(code)
                .catch(() => null);
        },
        [code]
    );

    return (
        <div className={styles.workspace}>
            <section
                aria-label="Código Arduino"
                className={styles.previewCard}
            >
                <header className={styles.previewHeader}>
                    <h2 className={styles.previewTitle}>
                        Código Arduino
                    </h2>
                    <span className={styles.readOnlyBadge}>
                        Somente leitura
                    </span>
                </header>

                <div className={styles.previewBody}>
                    {error ? (
                        <div className={styles.feedbackState}>
                            <p
                                className={styles.errorMessage}
                                role="alert"
                            >
                                {error}
                            </p>
                        </div>
                    ) : hasCode ? (
                        <div
                            aria-label="Pré-visualização do código Arduino"
                            className={styles.codeViewport}
                            role="region"
                        >
                            <ol
                                aria-hidden="true"
                                className={styles.lineNumbers}
                            >
                                {lineNumbers.map(renderLineNumber)}
                            </ol>

                            <pre className={styles.codePre}>
                                <code className="language-cpp">
                                    {highlightedTokens.map(
                                        (
                                            token,
                                            index
                                        ) => renderPrismToken(
                                            token,
                                            `token-${index}`
                                        )
                                    )}
                                </code>
                            </pre>
                        </div>
                    ) : (
                        <div className={styles.feedbackState}>
                            <p className={styles.emptyMessage}>
                                {EMPTY_PREVIEW_MESSAGE}
                            </p>
                        </div>
                    )}
                </div>

                <div className={styles.actionBar}>
                    <button
                        className={`${styles.actionButton} ${styles.secondaryAction}`}
                        disabled={!hasCode}
                        type="button"
                        onClick={handleRawCodeOpen}
                    >
                        Ver código bruto
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.primaryAction}`}
                        disabled={
                            !hasCode ||
                            !onUpload ||
                            uploadBusy
                        }
                        type="button"
                        onClick={onUpload}
                    >
                        {uploadBusy ?
                            `Enviando para ${boardName || 'a placa'}...` :
                            `Enviar para ${boardName || 'a placa'}`
                        }
                    </button>
                </div>
            </section>

            <section className={styles.bottomPanel}>
                <div className={styles.bottomPanelToolbar}>
                    <div
                        aria-label="Painel inferior"
                        className={styles.bottomPanelTabs}
                        role="tablist"
                    >
                        <button
                            aria-selected={bottomPanelTab === 'output'}
                            className={styles.bottomPanelTab}
                            role="tab"
                            type="button"
                            onClick={handleOutputTabSelect}
                        >
                            Saída
                        </button>

                        <button
                            aria-selected={bottomPanelTab === 'serial'}
                            className={styles.bottomPanelTab}
                            role="tab"
                            type="button"
                            onClick={handleSerialTabSelect}
                        >
                            Monitor Serial
                        </button>
                    </div>

                    <button
                        aria-label={
                            bottomPanelExpanded ?
                                'Recolher painel inferior' :
                                'Expandir painel inferior'
                        }
                        className={styles.bottomPanelCollapse}
                        type="button"
                        onClick={handleBottomPanelToggle}
                    >
                        {bottomPanelExpanded ? '▼' : '▲'}
                    </button>
                </div>

                {bottomPanelExpanded ? (
                    bottomPanelTab === 'output' ? (
                        <div
                            aria-label="Saída do envio"
                            className={styles.outputRegion}
                            role="region"
                        >
                            {outputEntries.length > 0 ? (
                                <ol className={styles.outputList}>
                                    {outputEntries.map(entry => (
                                        <li
                                            className={styles.outputEntry}
                                            data-state={entry.state}
                                            key={entry.id}
                                        >
                                            {entry.message}
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className={styles.serialMonitorPlaceholder}>
                                    Nenhuma operação de envio realizada.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div
                            aria-label="Monitor Serial"
                            aria-live="polite"
                            className={styles.serialMonitorRegion}
                            role="region"
                        >
                            <div>
                                <span
                                    aria-hidden="true"
                                    className={styles.serialMonitorIndicator}
                                    data-state={serialMonitorState}
                                />

                                <span>
                                    {getSerialMonitorStatusMessage(
                                        serialMonitorState,
                                        serialMonitorBaudRate
                                    )}
                                </span>

                                <button
                                    aria-label="Limpar Monitor Serial"
                                    className={`${styles.actionButton} ${styles.secondaryAction}`}
                                    disabled={
                                        !onClearSerialMonitor ||
                                        serialMonitorText.length === 0
                                    }
                                    type="button"
                                    onClick={onClearSerialMonitor}
                                >
                                    Limpar
                                </button>
                            </div>

                            {serialMonitorText.length > 0 ? (
                                <pre
                                    className={styles.serialMonitorPlaceholder}
                                    data-testid="serial-monitor-output"
                                >
                                    {serialMonitorText}
                                </pre>
                            ) : null}
                        </div>
                    )
                ) : null}
            </section>

            {rawCodeVisible ? (
                <Modal
                    className={styles.rawCodeModal}
                    contentLabel="Código bruto Arduino"
                    onRequestClose={handleRawCodeClose}
                >
                    <div className={styles.rawCodeBody}>
                        <p className={styles.rawCodeDescription}>
                            Este é exatamente o código C++ gerado pelo EasyBlox.
                        </p>

                        <textarea
                            aria-label="Código bruto C++"
                            className={styles.rawCodeTextarea}
                            readOnly
                            spellCheck={false}
                            value={code}
                        />

                        <div className={styles.rawCodeActions}>
                            <button
                                className={`${styles.actionButton} ${styles.secondaryAction}`}
                                type="button"
                                onClick={handleCopyCode}
                            >
                                Copiar código
                            </button>
                        </div>
                    </div>
                </Modal>
            ) : null}
        </div>
    );
};

UploadWorkspace.propTypes = {
    boardName: PropTypes.node,
    code: PropTypes.string.isRequired,
    error: PropTypes.string,
    onClearSerialMonitor: PropTypes.func,
    onUpload: PropTypes.func,
    outputEntries: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            message: PropTypes.string.isRequired,
            state: PropTypes.string.isRequired
        })
    ),

    serialMonitorBaudRate: PropTypes.number,
    serialMonitorState: PropTypes.oneOf([
        'unavailable',
        'connection-required',
        'disconnected',
        'connecting',
        'connected',
        'error'
    ]),
    serialMonitorText: PropTypes.string,

    uploadState: PropTypes.oneOf([
        'idle',
        'building',
        'preparing',
        'uploading',
        'success',
        'error'
    ])
};

export default UploadWorkspace;
