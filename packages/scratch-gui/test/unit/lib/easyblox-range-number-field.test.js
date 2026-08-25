import registerEasyBloxRangeNumberField
    from '../../../src/lib/easyblox-range-number-field';

describe('EasyBlox range number field', () => {
    let ScratchBlocks;
    let RegisteredField;
    let baseHtmlInputKeyDown;
    let baseShowEditor;

    beforeEach(() => {
        baseHtmlInputKeyDown = jest.fn();
        baseShowEditor = jest.fn();
        class MockFieldNumber {
            constructor (value, min, max, precision) {
                this.value_ = Number(value);
                this.min_ = min;
                this.max_ = max;
                this.precision_ = precision;
            }

            getValue () {
                return this.value_;
            }

            getMin () {
                return this.min_;
            }

            getMax () {
                return this.max_;
            }

            getPrecision () {
                return this.precision_;
            }

            setValue (value) {
                let numericValue = Number(value);

                if (!Number.isFinite(numericValue)) {
                    return;
                }

                if (typeof this.min_ === 'number') {
                    numericValue = Math.max(this.min_, numericValue);
                }

                if (typeof this.max_ === 'number') {
                    numericValue = Math.min(this.max_, numericValue);
                }

                this.value_ = numericValue;
            }

            onHtmlInputKeyDown_ (event) {
                baseHtmlInputKeyDown(event);
            }

            showEditor_ (event) {
                baseShowEditor(event);
            }
        }

        RegisteredField = null;

        ScratchBlocks = {
            FieldNumber: MockFieldNumber,
            fieldRegistry: {
                register: jest.fn((name, fieldClass) => {
                    RegisteredField = fieldClass;
                })
            }
        };

        registerEasyBloxRangeNumberField(ScratchBlocks);
    });

    test('registers the reusable EasyBlox range field', () => {
        expect(ScratchBlocks.fieldRegistry.register).toHaveBeenCalledWith(
            'field_easyblox_range_number',
            expect.any(Function)
        );
        expect(RegisteredField).toBeTruthy();
    });

    test('accepts positive decimal values with min zero and no max', () => {
        const field = RegisteredField.fromJson({
            value: 1,
            min: 0,
            precision: 0.1
        });

        expect(field.getMin()).toBe(0);
        expect(field.getMax()).toBeUndefined();
        expect(field.getPrecision()).toBe(0.1);

        field.setValue(2.5);

        expect(field.getValue()).toBe(2.5);
    });

    test('rejects negative values when configured with min zero', () => {
        const field = RegisteredField.fromJson({
            value: 1,
            min: 0,
            precision: 0.1
        });

        field.setValue(-5);

        expect(field.getValue()).toBe(0);
    });

    test('prevents minus key when minimum is zero', () => {
        const field = RegisteredField.fromJson({
            value: 1,
            min: 0,
            precision: 0.1
        });

        const event = {
            key: '-',
            preventDefault: jest.fn()
        };

        field.onHtmlInputKeyDown_(event);

        expect(baseHtmlInputKeyDown).toHaveBeenCalledWith(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    test('keeps the normal numeric editor when maximum is unbounded', () => {
        const field = RegisteredField.fromJson({
            value: 1,
            min: 0,
            precision: 0.1
        });

        field.max_ = Infinity;

        field.showEditor_({pointerType: 'mouse'});

        expect(baseShowEditor).toHaveBeenCalled();
        expect(document.querySelector('input[type="range"]')).toBeNull();
    });
});
