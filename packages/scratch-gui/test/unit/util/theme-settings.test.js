/* eslint-env jest */

import {DEFAULT_THEME, themeMap} from '../../../src/lib/settings/theme';
import {detectTheme} from '../../../src/lib/settings/theme/persistence';

test('EasyBlox only offers the default block theme', () => {
    expect(Object.keys(themeMap)).toEqual([DEFAULT_THEME]);
});

test('falls back to default when an old cat-blocks preference is stored', () => {
    document.cookie = 'scratchblockstheme=cat-blocks';
    expect(detectTheme()).toEqual(DEFAULT_THEME);
});