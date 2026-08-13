import {resolveUseAutoScan} from '../../../src/lib/connection-utils';
import {PLATFORM} from '../../../src/lib/platform';

describe('resolveUseAutoScan', () => {
    test('preserves false for legacy extensions', () => {
        expect(resolveUseAutoScan(false, null, PLATFORM.WEB)).toEqual(false);
    });

    test('preserves true for legacy extensions', () => {
        expect(resolveUseAutoScan(true, null, PLATFORM.DESKTOP)).toEqual(true);
    });

    test('uses auto scan for serial connections on web', () => {
        expect(resolveUseAutoScan(false, 'serial', PLATFORM.WEB)).toEqual(true);
    });

    test('uses list scanning for serial connections on desktop', () => {
        expect(resolveUseAutoScan(true, 'serial', PLATFORM.DESKTOP)).toEqual(false);
    });

    test('preserves the configured behavior for serial connections on unsupported platforms', () => {
        expect(resolveUseAutoScan(false, 'serial', PLATFORM.ANDROID)).toEqual(false);
        expect(resolveUseAutoScan(true, 'serial', PLATFORM.ANDROID)).toEqual(true);
    });
});
