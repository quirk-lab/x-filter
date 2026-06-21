// Import via the public barrel so the package's re-export surface is exercised.
import { enUS, jaJP, locales, zhCN } from '@x-filter/react';

const allLocales = { enUS, zhCN, jaJP };
const canonicalKeys = Object.keys(enUS).sort();

describe('built-in locales', () => {
  it('every locale exposes exactly the same keys as en-US', () => {
    for (const [name, locale] of Object.entries(allLocales)) {
      expect({ name, keys: Object.keys(locale).sort() }).toEqual({ name, keys: canonicalKeys });
    }
  });

  it('every label is a non-empty string', () => {
    for (const locale of Object.values(allLocales)) {
      for (const [key, label] of Object.entries(locale)) {
        expect(typeof label).toBe('string');
        expect(label.trim().length).toBeGreaterThan(0);
        // guard against accidental key/value copy
        expect(label).not.toBe(key);
      }
    }
  });

  it('translations differ from English for translated keys', () => {
    // zh-CN / ja-JP should translate at least the action labels.
    expect(zhCN.addRule).not.toBe(enUS.addRule);
    expect(jaJP.addRule).not.toBe(enUS.addRule);
  });

  it('exposes a registry keyed by BCP-47 code', () => {
    expect(locales['en-US']).toBe(enUS);
    expect(locales['zh-CN']).toBe(zhCN);
    expect(locales['ja-JP']).toBe(jaJP);
    expect(Object.keys(locales).sort()).toEqual(['en-US', 'ja-JP', 'zh-CN']);
  });
});
