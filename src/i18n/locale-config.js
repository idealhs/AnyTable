export const LOCALE_DEFINITIONS = [
    {
        code: 'zh',
        shortLabel: '中',
        nativeName: '简体中文',
        englishName: 'Chinese',
        load: () => import('./zh.js')
    },
    {
        code: 'en',
        shortLabel: 'EN',
        nativeName: 'English',
        englishName: 'English',
        load: () => import('./en.js')
    }
];

export const LOCALE_MAP = Object.fromEntries(
    LOCALE_DEFINITIONS.map((localeDefinition) => [
        localeDefinition.code,
        localeDefinition.load
    ])
);

export function getLocaleDefinition(localeCode) {
    return LOCALE_DEFINITIONS.find((localeDefinition) => localeDefinition.code === localeCode) || null;
}
