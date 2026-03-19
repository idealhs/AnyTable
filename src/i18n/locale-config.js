export const FALLBACK_LOCALE = 'en-US';
export const DEFAULT_LOCALE = FALLBACK_LOCALE;

export const LOCALE_DEFINITIONS = [
    {
        code: 'en-US',
        shortLabel: 'EN',
        nativeName: 'English (US)',
        englishName: 'English (US)',
        load: () => import('./en-US.js'),
        direction: 'ltr'
    },
    {
        code: 'zh-CN',
        shortLabel: '简',
        nativeName: '简体中文',
        englishName: 'Chinese (Simplified)',
        load: () => import('./zh-CN.js'),
        direction: 'ltr'
    },
    {
        code: 'zh-TW',
        shortLabel: '繁',
        nativeName: '繁體中文',
        englishName: 'Chinese (Traditional)',
        load: () => import('./zh-TW.js'),
        direction: 'ltr'
    },
    {
        code: 'es-ES',
        shortLabel: 'ES',
        nativeName: 'Español (España)',
        englishName: 'Spanish (Spain)',
        load: () => import('./es-ES.js'),
        direction: 'ltr'
    },
    {
        code: 'fr-FR',
        shortLabel: 'FR',
        nativeName: 'Français (France)',
        englishName: 'French (France)',
        load: () => import('./fr-FR.js'),
        direction: 'ltr'
    },
    {
        code: 'de-DE',
        shortLabel: 'DE',
        nativeName: 'Deutsch (Deutschland)',
        englishName: 'German (Germany)',
        load: () => import('./de-DE.js'),
        direction: 'ltr'
    },
    {
        code: 'pt-PT',
        shortLabel: 'PT',
        nativeName: 'Português (Portugal)',
        englishName: 'Portuguese (Portugal)',
        load: () => import('./pt-PT.js'),
        direction: 'ltr'
    },
    {
        code: 'ru-RU',
        shortLabel: 'RU',
        nativeName: 'Русский (Россия)',
        englishName: 'Russian (Russia)',
        load: () => import('./ru-RU.js'),
        direction: 'ltr'
    },
    {
        code: 'ar-SA',
        shortLabel: 'AR',
        nativeName: 'العربية (السعودية)',
        englishName: 'Arabic (Saudi Arabia)',
        load: () => import('./ar-SA.js'),
        direction: 'rtl'
    },
    {
        code: 'ja-JP',
        shortLabel: 'JA',
        nativeName: '日本語',
        englishName: 'Japanese',
        load: () => import('./ja-JP.js'),
        direction: 'ltr'
    },
    {
        code: 'ko-KR',
        shortLabel: 'KO',
        nativeName: '한국어',
        englishName: 'Korean',
        load: () => import('./ko-KR.js'),
        direction: 'ltr'
    }
];

const LOCALE_ALIASES = {
    en: 'en-US',
    zh: 'zh-CN',
    'zh-hans': 'zh-CN',
    'zh-hant': 'zh-TW',
    'zh-hk': 'zh-TW',
    'zh-mo': 'zh-TW',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-PT',
    ru: 'ru-RU',
    ar: 'ar-SA',
    ja: 'ja-JP',
    ko: 'ko-KR'
};

export const LOCALE_MAP = Object.fromEntries(
    LOCALE_DEFINITIONS.map((localeDefinition) => [
        localeDefinition.code,
        localeDefinition.load
    ])
);

export function findSupportedLocale(localeCodes) {
    if (!Array.isArray(localeCodes)) {
        return null;
    }

    for (const localeCode of localeCodes) {
        const normalizedLocaleCode = normalizeLocaleCode(localeCode);
        if (normalizedLocaleCode) {
            return normalizedLocaleCode;
        }
    }

    return null;
}

export function normalizeLocaleCode(localeCode) {
    if (typeof localeCode !== 'string') {
        return null;
    }

    const normalizedInput = localeCode.trim().replace(/_/g, '-');
    if (!normalizedInput) {
        return null;
    }

    if (LOCALE_MAP[normalizedInput]) {
        return normalizedInput;
    }

    const lowerCasedInput = normalizedInput.toLowerCase();
    const exactMatch = LOCALE_DEFINITIONS.find(
        (localeDefinition) => localeDefinition.code.toLowerCase() === lowerCasedInput
    );

    if (exactMatch) {
        return exactMatch.code;
    }

    if (LOCALE_ALIASES[lowerCasedInput]) {
        return LOCALE_ALIASES[lowerCasedInput];
    }

    const [languageCode] = lowerCasedInput.split('-');
    return LOCALE_ALIASES[languageCode] || null;
}

export function getLocaleDefinition(localeCode) {
    const normalizedLocaleCode = normalizeLocaleCode(localeCode);
    return LOCALE_DEFINITIONS.find((localeDefinition) => localeDefinition.code === normalizedLocaleCode) || null;
}
