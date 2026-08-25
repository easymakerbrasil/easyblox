/**
 * Register the reusable EasyBlox numeric range field.
 * The field keeps Blockly's numeric constraints and adds a slider
 * to the standard number editor.
 * @param {object} ScratchBlocks Scratch Blocks namespace.
 */
const registerEasyBloxRangeNumberField = ScratchBlocks => {
    class EasyBloxRangeNumberField extends ScratchBlocks.FieldNumber {
        /**
         * Construct the field from a Scratch Blocks JSON definition.
         * @param {object} options Field configuration.
         * @returns {EasyBloxRangeNumberField} Configured field.
         */
        static fromJson (options) {
            return new EasyBloxRangeNumberField(
                options.value,
                options.min,
                options.max,
                options.precision
            );
        }

        /**
         * Prevent typing a negative sign when the configured range
         * does not allow negative values.
         * @param {KeyboardEvent} event Keyboard event.
         */
        onHtmlInputKeyDown_ (event) {
            super.onHtmlInputKeyDown_(event);

            if (
                event.key === '-' &&
                this.getMin() >= 0
            ) {
                event.preventDefault();
            }
        }

        /**
         * Show the normal numeric editor together with a range slider.
         * @param {PointerEvent} event Event that opened the editor.
         */
        showEditor_ (event) {
            super.showEditor_(event, false, false);

            const min = this.getMin();
            const max = this.getMax();

            if (
                !Number.isFinite(min) ||
                !Number.isFinite(max)
            ) {
                return;
            }

            ScratchBlocks.DropDownDiv.hideWithoutAnimation();
            ScratchBlocks.DropDownDiv.clearContent();

            const contentDiv =
                ScratchBlocks.DropDownDiv.getContentDiv();

            const slider = document.createElement('input');

            slider.type = 'range';
            slider.min = String(this.getMin());
            slider.max = String(this.getMax());
            slider.step = String(this.getPrecision() || 1);
            slider.value = String(this.getValue());
            slider.style.width = '168px';

            slider.addEventListener('input', () => {
                this.setValue(Number(slider.value));

                if (this.htmlInput_) {
                    this.setEditorValue_(this.getValue());
                    this.resizeEditor_();
                }
            });

            contentDiv.appendChild(slider);

            const sourceBlock = this.getSourceBlock();

            if (!sourceBlock) {
                return;
            }

            ScratchBlocks.DropDownDiv.setColour(
                sourceBlock.getColour(),
                sourceBlock.getColourTertiary()
            );

            ScratchBlocks.DropDownDiv.showPositionedByBlock(
                this,
                sourceBlock
            );
        }
    }

    ScratchBlocks.fieldRegistry.register(
        'field_easyblox_range_number',
        EasyBloxRangeNumberField
    );
};

export default registerEasyBloxRangeNumberField;
