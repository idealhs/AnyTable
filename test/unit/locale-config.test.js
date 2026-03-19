import { describe, expect, it } from 'vitest';

import {
    findSupportedLocale,
    DEFAULT_LOCALE,
    FALLBACK_LOCALE,
    LOCALE_DEFINITIONS,
    getLocaleDefinition,
    normalizeLocaleCode
} from '../../src/i18n/locale-config.js';

const REQUIRED_LOCALES = [
    'en-US',
    'zh-CN',
    'zh-TW',
    'es-ES',
    'fr-FR',
    'de-DE',
    'pt-PT',
    'ru-RU',
    'ar-SA',
    'ja-JP',
    'ko-KR'
];

function collectLeafKeys(value, prefix = '') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return prefix ? [prefix] : [];
    }

    return Object.entries(value)
        .flatMap(([key, nestedValue]) => collectLeafKeys(nestedValue, prefix ? `${prefix}.${key}` : key))
        .sort();
}

describe('locale-config', () => {
    it('exposes all required locales in the expected order', () => {
        expect(DEFAULT_LOCALE).toBe('en-US');
        expect(FALLBACK_LOCALE).toBe('en-US');
        expect(LOCALE_DEFINITIONS.map(({ code }) => code)).toEqual(REQUIRED_LOCALES);
    });

    it('normalizes legacy and language-only locale codes', () => {
        expect(normalizeLocaleCode('zh')).toBe('zh-CN');
        expect(normalizeLocaleCode('en')).toBe('en-US');
        expect(normalizeLocaleCode('zh_tw')).toBe('zh-TW');
        expect(normalizeLocaleCode('zh-HK')).toBe('zh-TW');
        expect(normalizeLocaleCode('zh-Hant')).toBe('zh-TW');
        expect(normalizeLocaleCode('AR')).toBe('ar-SA');
        expect(normalizeLocaleCode('ja-JP')).toBe('ja-JP');
        expect(normalizeLocaleCode('unknown')).toBeNull();
    });

    it('selects the first supported locale from a candidate list', () => {
        expect(findSupportedLocale(['unknown', 'zh-HK', 'en-GB'])).toBe('zh-TW');
        expect(findSupportedLocale(['pt-BR', 'es-MX'])).toBe('pt-PT');
        expect(findSupportedLocale(['', null, undefined])).toBeNull();
    });

    it('returns locale metadata including RTL direction', () => {
        expect(getLocaleDefinition('zh')?.code).toBe('zh-CN');
        expect(getLocaleDefinition('ar-SA')?.direction).toBe('rtl');
        expect(getLocaleDefinition('fr-FR')?.direction).toBe('ltr');
    });

    it('keeps translation keys aligned across all locale packs', async () => {
        const modules = await Promise.all(LOCALE_DEFINITIONS.map(({ load }) => load()));
        const [baseModule, ...otherModules] = modules;
        const baseKeys = collectLeafKeys(baseModule.default);

        otherModules.forEach((module) => {
            expect(collectLeafKeys(module.default)).toEqual(baseKeys);
        });
    });
});
