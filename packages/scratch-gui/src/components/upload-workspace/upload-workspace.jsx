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

const toggleBoolean = function (value) {
    return !value;
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

const UploadWorkspace = ({
    boardName,
    code,
    error = null
}) => {
    const [
        serialMonitorExpanded,
        setSerialMonitorExpanded
    ] = useState(false);

    const [
        rawCodeVisible,
        setRawCodeVisible
    ] = useState(false);

    const hasCode =
        !error &&
        code.trim().length > 0;

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

    const handleSerialMonitorToggle = useCallback(
        () => {
            setSerialMonitorExpanded(toggleBoolean);
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
                        disabled
                        title="A gravação na placa será ativada na próxima etapa."
                        type="button"
                    >
                        Enviar para {boardName || 'a placa'}
                    </button>
                </div>
            </section>

            <section className={styles.serialMonitor}>
                <button
                    aria-expanded={serialMonitorExpanded}
                    className={styles.serialMonitorToggle}
                    type="button"
                    onClick={handleSerialMonitorToggle}
                >
                    <span>
                        Monitor Serial
                    </span>
                    <span
                        aria-hidden="true"
                        className={styles.serialMonitorIndicator}
                    >
                        {serialMonitorExpanded ?
                            '▲' :
                            '▼'
                        }
                    </span>
                </button>

                {serialMonitorExpanded ? (
                    <div
                        aria-label="Monitor Serial"
                        className={styles.serialMonitorRegion}
                        role="region"
                    >
                        <p className={styles.serialMonitorPlaceholder}>
                            O Monitor Serial será disponibilizado durante a integração com a placa.
                        </p>
                    </div>
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
    error: PropTypes.string
};

export default UploadWorkspace;
