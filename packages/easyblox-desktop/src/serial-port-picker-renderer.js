const picker =
    window.easybloxSerialPortPicker;

const portListElement =
    document.getElementById(
        'portList'
    );

const connectButton =
    document.getElementById(
        'connectButton'
    );

const cancelButton =
    document.getElementById(
        'cancelButton'
    );

const closeButton =
    document.getElementById(
        'closeButton'
    );

let selectedPortId =
    '';

const updateSelection =
    portId => {
        selectedPortId =
            portId;

        const cards =
            portListElement
                .querySelectorAll(
                    '.port-card'
                );

        cards.forEach(
            card => {
                const selected =
                    card.dataset.portId ===
                    selectedPortId;

                card.classList.toggle(
                    'selected',
                    selected
                );

                card.setAttribute(
                    'aria-pressed',
                    selected ?
                        'true' :
                        'false'
                );
            }
        );

        connectButton.disabled =
            selectedPortId.length ===
            0;
    };

const createPortCard =
    port => {
        const card =
            document.createElement(
                'button'
            );

        card.type =
            'button';

        card.className =
            'port-card';

        card.dataset.portId =
            port.portId;

        card.setAttribute(
            'aria-pressed',
            'false'
        );

        const badge =
            document.createElement(
                'span'
            );

        badge.className =
            'port-badge';

        badge.textContent =
            port.vendorId ||
            port.productId ?
                'USB' :
                'SER';

        const identity =
            document.createElement(
                'span'
            );

        identity.className =
            'port-identity';

        const name =
            document.createElement(
                'span'
            );

        name.className =
            'port-display-name';

        name.textContent =
            port.displayName ||
            'Porta serial';

        const portName =
            document.createElement(
                'span'
            );

        portName.className =
            'port-name';

        portName.textContent =
            port.portName ||
            'Porta não identificada';

        identity.append(
            name,
            portName
        );

        const indicator =
            document.createElement(
                'span'
            );

        indicator.className =
            'port-indicator';

        card.append(
            badge,
            identity,
            indicator
        );

        card.addEventListener(
            'click',
            () => {
                updateSelection(
                    port.portId
                );
            }
        );

        card.addEventListener(
            'dblclick',
            () => {
                picker.select(
                    port.portId
                );
            }
        );

        return card;
    };

const renderPorts =
    ports => {
        portListElement.replaceChildren();

        if (
            !Array.isArray(ports) ||
            ports.length === 0
        ) {
            const emptyState =
                document.createElement(
                    'div'
                );

            emptyState.className =
                'empty-state';

            const title =
                document.createElement(
                    'strong'
                );

            title.textContent =
                'Nenhuma porta serial encontrada';

            const detail =
                document.createElement(
                    'span'
                );

            detail.textContent =
                'Conecte a placa ao computador e tente novamente.';

            emptyState.append(
                title,
                detail
            );

            portListElement.append(
                emptyState
            );

            updateSelection('');

            return;
        }

        ports.forEach(
            port => {
                portListElement.append(
                    createPortCard(
                        port
                    )
                );
            }
        );

        updateSelection('');
    };

picker.onPorts(
    renderPorts
);

connectButton.addEventListener(
    'click',
    () => {
        if (
            selectedPortId.length ===
            0
        ) {
            return;
        }

        picker.select(
            selectedPortId
        );
    }
);

cancelButton.addEventListener(
    'click',
    () => {
        picker.cancel();
    }
);

closeButton.addEventListener(
    'click',
    () => {
        picker.cancel();
    }
);

window.addEventListener(
    'keydown',
    event => {
        if (
            event.key ===
            'Escape'
        ) {
            picker.cancel();
        }
    }
);
