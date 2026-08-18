/**
 * Register the EasyBlox 8x8 LED matrix field.
 *
 * The field stores the matrix as 16 hexadecimal characters:
 * two characters per row, eight rows total.
 *
 * Example:
 * 8142241818244281
 *
 * Represents:
 * 81 42 24 18 18 24 42 81
 *
 * Bit 7 is the leftmost LED and bit 0 is the rightmost LED.
 * @param {object} ScratchBlocks Scratch Blocks namespace.
 */
const registerEasyBloxMatrix8x8Field = ScratchBlocks => {
    const MATRIX_SIZE = 8;
    const MATRIX_HEX_LENGTH = 16;

    const EMPTY_MATRIX = '0000000000000000';
    const FULL_MATRIX = 'FFFFFFFFFFFFFFFF';

    const MATRIX_PATTERNS = [
        {
            label: 'Coração',
            value: '0066FFFF7E3C1800'
        },
        {
            label: 'Feliz',
            value: '3C42A581A599423C'
        },
        {
            label: 'Triste',
            value: '3C42A58199A5423C'
        },
        {
            label: 'Seta ↑',
            value: '183C7EFF18181818'
        },
        {
            label: 'Seta ↓',
            value: '18181818FF7E3C18'
        },
        {
            label: 'Seta ←',
            value: '103070FFFF703010'
        },
        {
            label: 'Seta →',
            value: '080C0EFFFF0E0C08'
        },
        {
            label: 'Check ✓',
            value: '00010386CC783000'
        },
        {
            label: 'X',
            value: '8142241818244281'
        },
        {
            label: 'Quadrado',
            value: 'FF818181818181FF'
        },
        {
            label: 'Círculo',
            value: '3C4281818181423C'
        }
    ];

    const PaintStyle = {
        FILL: 'fill',
        CLEAR: 'clear'
    };

    class EasyBloxMatrix8x8Field extends ScratchBlocks.Field {
        /**
         * Construct the field.
         * @param {string} value Initial 8x8 matrix value.
         */
        constructor (value = EMPTY_MATRIX) {
            super(value);

            this.SERIALIZABLE = true;

            this.ledThumbNodes_ = [];
            this.ledButtons_ = [];

            this.matrixStage_ = null;
            this.arrow_ = null;
            this.paintStyle_ = null;

            this.matrixMoveWrapper_ = null;
            this.matrixReleaseWrapper_ = null;
        }

        /**
         * Construct the field from a Scratch Blocks JSON definition.
         * @param {object} options Field configuration.
         * @returns {EasyBloxMatrix8x8Field} Configured field.
         */
        static fromJson (options) {
            return new EasyBloxMatrix8x8Field(
                options.value || EMPTY_MATRIX
            );
        }

        /**
         * Normalize matrix values to exactly 16 hexadecimal characters.
         * @param {unknown} newValue Candidate field value.
         * @returns {string} Normalized matrix value.
         */
        doClassValidation_ (newValue) {
            const normalized = String(newValue || '')
                .replace(/[^0-9a-f]/gi, '')
                .toUpperCase()
                .slice(0, MATRIX_HEX_LENGTH);

            return normalized.padEnd(
                MATRIX_HEX_LENGTH,
                '0'
            );
        }

        /**
         * Update the field value and redraw the matrix.
         * @param {string} newValue New matrix value.
         */
        doValueUpdate_ (newValue) {
            super.doValueUpdate_(newValue);
            this.updateMatrix_();
        }

        /**
         * Build the thumbnail displayed directly inside the block.
         */
        initView () {
            this.updateSize_();

            const constants = this.getConstants();

            if (!constants) {
                return;
            }

            const gridUnit = constants.GRID_UNIT;
            const thumbnailSize = 33;
            const nodeSize = 3;
            const nodePad = 1;

            const thumbX = gridUnit;
            const thumbY =
                (this.size_.height - thumbnailSize) / 2;

            const thumbnail =
                ScratchBlocks.utils.dom.createSvgElement(
                    'g',
                    {
                        transform:
                            `translate(${thumbX}, ${thumbY})`,
                        cursor: 'pointer'
                    },
                    this.fieldGroup_
                );

            this.ledThumbNodes_ = [];

            for (let row = 0; row < MATRIX_SIZE; row++) {
                for (let column = 0;
                    column < MATRIX_SIZE;
                    column++) {
                    const led =
                        ScratchBlocks.utils.dom.createSvgElement(
                            'rect',
                            {
                                x:
                                    (nodeSize + nodePad) *
                                    column,
                                y:
                                    (nodeSize + nodePad) *
                                    row,
                                width: nodeSize,
                                height: nodeSize,
                                rx: 1,
                                ry: 1
                            },
                            thumbnail
                        );

                    this.ledThumbNodes_.push(led);
                }
            }

            const arrowSize = 12;
            const arrowX =
                thumbX + thumbnailSize + gridUnit;
            const arrowY =
                (this.size_.height - arrowSize) / 2;

            this.arrow_ =
                ScratchBlocks.utils.dom.createSvgElement(
                    'image',
                    {
                        height: `${arrowSize}px`,
                        width: `${arrowSize}px`,
                        transform:
                            `translate(${arrowX}, ${arrowY})`
                    },
                    this.fieldGroup_
                );

            this.arrow_.setAttributeNS(
                'http://www.w3.org/1999/xlink',
                'xlink:href',
                constants.FIELD_DROPDOWN_SVG_ARROW_DATAURI || ''
            );

            this.updateMatrix_();
        }

        /**
         * Open the 8x8 matrix editor.
         */
        showEditor_ () {
            const sourceBlock = this.getSourceBlock();

            if (!sourceBlock) {
                return;
            }

            ScratchBlocks.DropDownDiv.hideWithoutAnimation();
            ScratchBlocks.DropDownDiv.clearContent();

            ScratchBlocks.DropDownDiv.setColour(
                sourceBlock.getColour(),
                sourceBlock.getColourTertiary()
            );

            const contentDiv =
                ScratchBlocks.DropDownDiv.getContentDiv();

            const matrixNodeSize = 18;
            const matrixNodePad = 4;

            const matrixSize =
                (matrixNodeSize * MATRIX_SIZE) +
                (matrixNodePad * (MATRIX_SIZE + 1));

            this.matrixStage_ =
                ScratchBlocks.utils.dom.createSvgElement(
                    'svg',
                    {
                        xmlns: 'http://www.w3.org/2000/svg',
                        version: '1.1',
                        height: `${matrixSize}px`,
                        width: `${matrixSize}px`
                    },
                    contentDiv
                );

            this.ledButtons_ = [];

            for (let row = 0; row < MATRIX_SIZE; row++) {
                for (let column = 0;
                    column < MATRIX_SIZE;
                    column++) {
                    const x =
                        (matrixNodeSize * column) +
                        (matrixNodePad * (column + 1));

                    const y =
                        (matrixNodeSize * row) +
                        (matrixNodePad * (row + 1));

                    const led =
                        ScratchBlocks.utils.dom.createSvgElement(
                            'rect',
                            {
                                x: `${x}px`,
                                y: `${y}px`,
                                width: matrixNodeSize,
                                height: matrixNodeSize,
                                rx: 4,
                                ry: 4,
                                cursor: 'pointer'
                            },
                            this.matrixStage_
                        );

                    this.ledButtons_.push(led);
                }
            }

            this.createBasicActions_(
                contentDiv,
                sourceBlock
            );

            this.matrixTouchWrapper_ =
                ScratchBlocks.browserEvents.bind(
                    this.matrixStage_,
                    'mousedown',
                    this,
                    this.onMatrixMouseDown_.bind(this)
                );

            ScratchBlocks.DropDownDiv.showPositionedByBlock(
                this,
                sourceBlock,
                this.dropdownDispose_.bind(this)
            );

            this.updateMatrix_();
        }

        /**
         * Create matrix patterns and basic actions.
         * @param {HTMLElement} contentDiv Dropdown content.
         * @param {object} sourceBlock Source Scratch block.
         */
        createBasicActions_ (contentDiv, sourceBlock) {
            const patternRow = document.createElement('div');

            patternRow.style.display = 'flex';
            patternRow.style.justifyContent = 'center';
            patternRow.style.marginTop = '8px';

            const patternSelect = document.createElement('select');

            patternSelect.setAttribute(
                'aria-label',
                'Padrões da matriz 8 por 8'
            );

            patternSelect.style.cursor = 'pointer';
            patternSelect.style.padding = '5px 8px';

            const placeholder = document.createElement('option');

            placeholder.value = '';
            placeholder.textContent = 'Padrões';
            placeholder.selected = true;

            patternSelect.appendChild(placeholder);

            MATRIX_PATTERNS.forEach(pattern => {
                const option = document.createElement('option');

                option.value = pattern.value;
                option.textContent = pattern.label;

                patternSelect.appendChild(option);
            });

            patternSelect.addEventListener(
                'change',
                () => {
                    if (patternSelect.value) {
                        this.setValue(patternSelect.value);
                        patternSelect.value = '';
                    }
                }
            );

            patternRow.appendChild(patternSelect);
            contentDiv.appendChild(patternRow);

            const actions = document.createElement('div');

            actions.style.display = 'flex';
            actions.style.gap = '6px';
            actions.style.marginTop = '8px';
            actions.style.justifyContent = 'center';

            const createButton = (label, handler) => {
                const button =
                    document.createElement('button');

                button.type = 'button';
                button.textContent = label;
                button.style.cursor = 'pointer';
                button.style.padding = '5px 8px';

                button.addEventListener(
                    'click',
                    handler
                );

                return button;
            };

            actions.appendChild(
                createButton(
                    'Limpar',
                    () => this.setValue(EMPTY_MATRIX)
                )
            );

            actions.appendChild(
                createButton(
                    'Preencher',
                    () => this.setValue(FULL_MATRIX)
                )
            );

            actions.appendChild(
                createButton(
                    'Inverter',
                    () => this.invertMatrix_()
                )
            );

            actions.style.color =
                sourceBlock.getColour();

            contentDiv.appendChild(actions);
        }

        /**
         * Convert a field value to one row byte.
         * @param {number} row Matrix row.
         * @returns {number} Row value from 0 to 255.
         */
        getRowByte_ (row) {
            const value =
                this.getValue() || EMPTY_MATRIX;

            const offset = row * 2;

            return parseInt(
                value.substr(offset, 2),
                16
            ) || 0;
        }

        /**
         * Replace one row byte in the serialized matrix.
         * @param {number} row Matrix row.
         * @param {number} byte Row value.
         */
        setRowByte_ (row, byte) {
            const value =
                this.getValue() || EMPTY_MATRIX;

            const rowHex =
                (byte & 0xFF)
                    .toString(16)
                    .toUpperCase()
                    .padStart(2, '0');

            const offset = row * 2;

            const newValue =
                value.substring(0, offset) +
                rowHex +
                value.substring(offset + 2);

            this.setValue(newValue);
        }

        /**
         * Determine whether one LED is currently active.
         * @param {number} index LED index from 0 to 63.
         * @returns {boolean} True when the LED is on.
         */
        isLedOn_ (index) {
            const row =
                Math.floor(index / MATRIX_SIZE);

            const column =
                index % MATRIX_SIZE;

            const byte =
                this.getRowByte_(row);

            const mask =
                0x80 >> column;

            return (byte & mask) !== 0;
        }

        /**
         * Set one LED state.
         * @param {number} index LED index from 0 to 63.
         * @param {boolean} on Desired state.
         */
        setLed_ (index, on) {
            if (index < 0 ||
                index >= MATRIX_SIZE * MATRIX_SIZE) {
                return;
            }

            const row =
                Math.floor(index / MATRIX_SIZE);

            const column =
                index % MATRIX_SIZE;

            const mask =
                0x80 >> column;

            let byte =
                this.getRowByte_(row);

            if (on) {
                byte |= mask;
            } else {
                byte &= ~mask;
            }

            this.setRowByte_(
                row,
                byte
            );
        }

        /**
         * Toggle one LED.
         * @param {number} index LED index.
         */
        toggleLed_ (index) {
            this.setLed_(
                index,
                !this.isLedOn_(index)
            );
        }

        /**
         * Invert all 64 LEDs.
         */
        invertMatrix_ () {
            let result = '';

            for (let row = 0;
                row < MATRIX_SIZE;
                row++) {
                const inverted =
                    (~this.getRowByte_(row)) & 0xFF;

                result += inverted
                    .toString(16)
                    .toUpperCase()
                    .padStart(2, '0');
            }

            this.setValue(result);
        }

        /**
         * Redraw thumbnail and editor using the current value.
         */
        updateMatrix_ () {
            const sourceBlock =
                this.getSourceBlock();

            if (!sourceBlock) {
                return;
            }

            const offEditor =
                sourceBlock.getColourTertiary();

            const offThumbnail =
                sourceBlock.getColourSecondary();

            const onColour =
                'var(--colour-text)';

            for (let index = 0;
                index < MATRIX_SIZE * MATRIX_SIZE;
                index++) {
                const on =
                    this.isLedOn_(index);

                if (this.ledButtons_[index]) {
                    this.ledButtons_[index].setAttribute(
                        'fill',
                        on ? onColour : offEditor
                    );
                }

                if (this.ledThumbNodes_[index]) {
                    this.ledThumbNodes_[index].setAttribute(
                        'fill',
                        on ? onColour : offThumbnail
                    );
                }
            }
        }

        /**
         * Begin painting LEDs.
         * @param {PointerEvent} event Mouse event.
         */
        onMatrixMouseDown_ (event) {
            const index =
                this.getLedAtEvent_(event);

            if (index < 0) {
                this.paintStyle_ = null;
                return;
            }

            this.paintStyle_ =
                this.isLedOn_(index) ?
                    PaintStyle.CLEAR :
                    PaintStyle.FILL;

            this.toggleLed_(index);

            this.matrixMoveWrapper_ =
                ScratchBlocks.browserEvents.bind(
                    document.body,
                    'mousemove',
                    this,
                    this.onMatrixMouseMove_.bind(this)
                );

            this.matrixReleaseWrapper_ =
                ScratchBlocks.browserEvents.bind(
                    document.body,
                    'mouseup',
                    this,
                    this.onMatrixMouseUp_.bind(this)
                );
        }

        /**
         * Paint LEDs while dragging.
         * @param {PointerEvent} event Mouse event.
         */
        onMatrixMouseMove_ (event) {
            if (!this.paintStyle_) {
                return;
            }

            event.preventDefault();

            const index =
                this.getLedAtEvent_(event);

            if (index < 0) {
                return;
            }

            this.setLed_(
                index,
                this.paintStyle_ === PaintStyle.FILL
            );
        }

        /**
         * Finish a paint operation.
         */
        onMatrixMouseUp_ () {
            if (this.matrixMoveWrapper_) {
                ScratchBlocks.browserEvents.unbind(
                    this.matrixMoveWrapper_
                );

                this.matrixMoveWrapper_ = null;
            }

            if (this.matrixReleaseWrapper_) {
                ScratchBlocks.browserEvents.unbind(
                    this.matrixReleaseWrapper_
                );

                this.matrixReleaseWrapper_ = null;
            }

            this.paintStyle_ = null;
        }

        /**
         * Find the LED under a mouse event.
         * @param {PointerEvent} event Mouse event.
         * @returns {number} LED index or -1.
         */
        getLedAtEvent_ (event) {
            if (!this.matrixStage_) {
                return -1;
            }

            const bounds =
                this.matrixStage_.getBoundingClientRect();

            const matrixNodeSize = 18;
            const matrixNodePad = 4;

            const dx =
                event.clientX - bounds.left;

            const dy =
                event.clientY - bounds.top;

            if (dx < matrixNodePad ||
                dy < matrixNodePad ||
                dx >= bounds.width - matrixNodePad ||
                dy >= bounds.height - matrixNodePad) {
                return -1;
            }

            const cellSize =
                matrixNodeSize + matrixNodePad;

            const column =
                Math.floor(
                    (dx - matrixNodePad) /
                    cellSize
                );

            const row =
                Math.floor(
                    (dy - matrixNodePad) /
                    cellSize
                );

            if (column < 0 ||
                column >= MATRIX_SIZE ||
                row < 0 ||
                row >= MATRIX_SIZE) {
                return -1;
            }

            const localX =
                (dx - matrixNodePad) %
                cellSize;

            const localY =
                (dy - matrixNodePad) %
                cellSize;

            if (localX >= matrixNodeSize ||
                localY >= matrixNodeSize) {
                return -1;
            }

            return (
                (row * MATRIX_SIZE) +
                column
            );
        }

        /**
         * Cleanup after closing the dropdown.
         */
        dropdownDispose_ () {
            this.onMatrixMouseUp_();

            if (this.matrixTouchWrapper_) {
                ScratchBlocks.browserEvents.unbind(
                    this.matrixTouchWrapper_
                );

                this.matrixTouchWrapper_ = null;
            }

            this.matrixStage_ = null;
            this.ledButtons_ = [];

            this.updateMatrix_();
        }

        /**
         * Calculate field dimensions.
         */
        updateSize_ () {
            const constants =
                this.getConstants();

            if (!constants) {
                return;
            }

            this.size_.height =
                Math.max(
                    constants.FIELD_TEXT_HEIGHT,
                    36
                );

            this.size_.width =
                45 +
                (constants.GRID_UNIT * 4);

            this.positionBorderRect_();
        }

        /**
         * Make the whole source block the click target.
         * @returns {SVGElement} Click target.
         */
        getClickTarget_ () {
            const sourceBlock =
                this.getSourceBlock();

            return sourceBlock ?
                sourceBlock.getSvgRoot() :
                this.fieldGroup_;
        }

        /**
         * Dispose the field and bound events.
         */
        dispose () {
            this.onMatrixMouseUp_();

            if (this.matrixTouchWrapper_) {
                ScratchBlocks.browserEvents.unbind(
                    this.matrixTouchWrapper_
                );

                this.matrixTouchWrapper_ = null;
            }

            this.matrixStage_ = null;

            super.dispose();
        }
    }

    ScratchBlocks.fieldRegistry.register(
        'field_easyblox_matrix_8x8',
        EasyBloxMatrix8x8Field
    );
};

export default registerEasyBloxMatrix8x8Field;
