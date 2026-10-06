const React =
    require(
        'react'
    );

const {
    EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS,
    EASYCONECT_TERMINAL_MESSAGE_TYPES
} = require(
    '@easymaker/easyconect-core'
);

const EasyConectTerminal = ({
    terminalSession
}) => {
    const [
        messageType,
        setMessageType
    ] = React.useState(
        EASYCONECT_TERMINAL_MESSAGE_TYPES
            .TEXT
    );

    const [
        inputValue,
        setInputValue
    ] = React.useState(
        ''
    );

    const [
        history,
        setHistory
    ] = React.useState(
        []
    );

    const [
        isSending,
        setIsSending
    ] = React.useState(
        false
    );

    const [
        sendError,
        setSendError
    ] = React.useState(
        null
    );

    const historyRef =
        React.useRef(
            null
        );

    React.useEffect(
        () => {
            setSendError(
                null
            );

            setIsSending(
                false
            );

            setHistory(
                terminalSession ?
                    terminalSession
                        .getHistory() :
                    []
            );

            if (!terminalSession) {
                return undefined;
            }

            return terminalSession
                .onHistoryChange(
                    nextHistory => {
                        setHistory(
                            nextHistory
                        );
                    }
                );
        },
        [
            terminalSession
        ]
    );

    React.useEffect(
        () => {
            if (!historyRef.current) {
                return;
            }

            historyRef.current.scrollTop =
                historyRef.current
                    .scrollHeight;
        },
        [
            history
        ]
    );

    const handleMessageTypeClick =
        React.useCallback(
            event => {
                const nextMessageType =
                    event.currentTarget
                        .dataset.messageType;

                if (
                    nextMessageType !==
                        EASYCONECT_TERMINAL_MESSAGE_TYPES
                            .TEXT &&
                    nextMessageType !==
                        EASYCONECT_TERMINAL_MESSAGE_TYPES
                            .NUMBER
                ) {
                    return;
                }

                setMessageType(
                    nextMessageType
                );

                setInputValue(
                    ''
                );

                setSendError(
                    null
                );
            },
            []
        );

    const handleInputChange =
        React.useCallback(
            event => {
                setInputValue(
                    event.currentTarget
                        .value
                );

                setSendError(
                    null
                );
            },
            []
        );

    const handleSubmit =
        React.useCallback(
            async event => {
                event.preventDefault();

                if (
                    !terminalSession ||
                    isSending
                ) {
                    return;
                }

                if (
                    inputValue.length ===
                        0 ||
                    inputValue.trim()
                        .length ===
                        0
                ) {
                    setSendError(
                        'Digite uma mensagem antes de enviar.'
                    );

                    return;
                }

                setIsSending(
                    true
                );

                setSendError(
                    null
                );

                try {
                    if (
                        messageType ===
                        EASYCONECT_TERMINAL_MESSAGE_TYPES
                            .NUMBER
                    ) {
                        const numericValue =
                            Number(
                                inputValue
                            );

                        if (
                            !Number.isFinite(
                                numericValue
                            )
                        ) {
                            setSendError(
                                'Digite um número válido.'
                            );

                            return;
                        }

                        await terminalSession
                            .sendNumber(
                                numericValue
                            );
                    } else {
                        await terminalSession
                            .sendText(
                                inputValue
                            );
                    }

                    setInputValue(
                        ''
                    );
                } catch (error) {
                    setSendError(
                        'Não foi possível enviar a mensagem.'
                    );
                } finally {
                    setIsSending(
                        false
                    );
                }
            },
            [
                inputValue,
                isSending,
                messageType,
                terminalSession
            ]
        );

    const handleClearHistory =
        React.useCallback(
            () => {
                if (!terminalSession) {
                    return;
                }

                terminalSession
                    .clearHistory();

                setSendError(
                    null
                );
            },
            [
                terminalSession
            ]
        );

    const isTextMode =
        messageType ===
        EASYCONECT_TERMINAL_MESSAGE_TYPES
            .TEXT;

    return (
        <div className="terminal-workspace">
            {!terminalSession && (
                <p className="terminal-unavailable">
                    Conecte o Bluetooth para usar o Terminal.
                </p>
            )}

            <div className="terminal-panel">
                <div className="terminal-toolbar">
                    <div>
                        <h3 className="terminal-history-title">
                            Histórico da sessão
                        </h3>

                        <p className="terminal-history-description">
                            Mensagens enviadas e recebidas pelo EasyConect.
                        </p>
                    </div>

                    <button
                        className="terminal-clear-button"
                        type="button"
                        disabled={
                            !terminalSession ||
                            history.length ===
                                0
                        }
                        onClick={
                            handleClearHistory
                        }
                    >
                        Limpar
                    </button>
                </div>

                <div
                    aria-live="polite"
                    className="terminal-history"
                    ref={
                        historyRef
                    }
                    role="log"
                >
                    {
                        history.length ===
                            0 ? (
                                <p className="terminal-history-empty">
                                    Nenhuma mensagem nesta sessão.
                                </p>
                            ) :
                            history.map(
                                (
                                    entry,
                                    index
                                ) => {
                                    const isOutgoing =
                                        entry.direction ===
                                        EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS
                                            .OUTGOING;

                                    const isText =
                                        entry.type ===
                                        EASYCONECT_TERMINAL_MESSAGE_TYPES
                                            .TEXT;

                                    return (
                                        <div
                                            className={[
                                                'terminal-history-entry',
                                                isOutgoing ?
                                                    'terminal-history-entry-outgoing' :
                                                    'terminal-history-entry-incoming'
                                            ]
                                                .join(
                                                    ' '
                                                )}
                                            key={
                                                `${index}-${entry.direction}-${entry.type}`
                                            }
                                        >
                                            <div className="terminal-history-meta">
                                                <span className="terminal-history-direction">
                                                    {
                                                        isOutgoing ?
                                                            'Enviado' :
                                                            'Recebido'
                                                    }
                                                </span>

                                                <span className="terminal-history-type">
                                                    {
                                                        isText ?
                                                            'Texto' :
                                                            'Número'
                                                    }
                                                </span>
                                            </div>

                                            <div className="terminal-history-message">
                                                {
                                                    String(
                                                        entry.payload
                                                    )
                                                }
                                            </div>
                                        </div>
                                    );
                                }
                            )
                    }
                </div>

                <form
                    className="terminal-composer"
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div
                        aria-label="Tipo de mensagem"
                        className="terminal-type-selector"
                        role="group"
                    >
                        <button
                            aria-pressed={
                                isTextMode
                            }
                            className={[
                                'terminal-type-button',
                                isTextMode ?
                                    'terminal-type-button-active' :
                                    null
                            ]
                                .filter(
                                    Boolean
                                )
                                .join(
                                    ' '
                                )}
                            data-message-type={
                                EASYCONECT_TERMINAL_MESSAGE_TYPES
                                    .TEXT
                            }
                            type="button"
                            disabled={
                                !terminalSession ||
                                isSending
                            }
                            onClick={
                                handleMessageTypeClick
                            }
                        >
                            Texto
                        </button>

                        <button
                            aria-pressed={
                                !isTextMode
                            }
                            className={[
                                'terminal-type-button',
                                !isTextMode ?
                                    'terminal-type-button-active' :
                                    null
                            ]
                                .filter(
                                    Boolean
                                )
                                .join(
                                    ' '
                                )}
                            data-message-type={
                                EASYCONECT_TERMINAL_MESSAGE_TYPES
                                    .NUMBER
                            }
                            type="button"
                            disabled={
                                !terminalSession ||
                                isSending
                            }
                            onClick={
                                handleMessageTypeClick
                            }
                        >
                            Número
                        </button>
                    </div>

                    <input
                        aria-label={
                            isTextMode ?
                                'Mensagem de texto' :
                                'Mensagem numérica'
                        }
                        className="terminal-input"
                        disabled={
                            !terminalSession ||
                            isSending
                        }
                        inputMode={
                            isTextMode ?
                                'text' :
                                'decimal'
                        }
                        placeholder={
                            isTextMode ?
                                'Digite uma mensagem' :
                                'Digite um número'
                        }
                        step={
                            isTextMode ?
                                undefined :
                                'any'
                        }
                        type={
                            isTextMode ?
                                'text' :
                                'number'
                        }
                        value={
                            inputValue
                        }
                        onChange={
                            handleInputChange
                        }
                    />

                    <button
                        className="terminal-send-button"
                        type="submit"
                        disabled={
                            !terminalSession ||
                            isSending ||
                            inputValue.length ===
                                0
                        }
                    >
                        {
                            isSending ?
                                'Enviando...' :
                                'Enviar'
                        }
                    </button>

                    {sendError && (
                        <p
                            aria-live="assertive"
                            className="terminal-error"
                        >
                            {sendError}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export {
    EasyConectTerminal
};
