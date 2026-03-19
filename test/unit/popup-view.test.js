// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPopupView } from '../../src/popup/popup-view.js';

function mountPopupDom() {
    document.body.innerHTML = `
        <div class="locale-picker">
            <button id="localeTrigger" type="button">
                <span id="localeCurrentLabel"></span>
            </button>
            <div id="localeMenu">
                <div id="localeMenuList"></div>
            </div>
        </div>
        <button id="pickTable" type="button"></button>
        <button id="clearSelection" type="button"></button>
        <div id="status"></div>
        <input id="autoEnhance" type="checkbox">
        <input id="multiColumnSort" type="checkbox">
        <input id="toolbarDefaultExpanded" type="checkbox">
        <div id="pageHost"></div>
        <div id="pageTitle"></div>
        <img id="pageFavicon" alt="">
        <div id="pageSupportBadge"></div>
        <div id="pageStatusDescription"></div>
    `;
}

function createI18n(currentLocale = 'zh-CN') {
    return {
        t: (key) => key,
        getCurrentLocale: () => currentLocale
    };
}

describe('popup view', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        document.documentElement.lang = '';
        document.documentElement.dir = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('renders locale options as safe text nodes and keeps click behavior intact', () => {
        mountPopupDom();
        const localeDefinitions = [
            {
                code: 'zh-CN',
                shortLabel: '<CN>',
                nativeName: '<img src=x onerror=alert(1)>',
                englishName: '<b>Chinese</b>',
                direction: 'ltr'
            }
        ];
        const onSelectLocale = vi.fn().mockResolvedValue(undefined);
        const view = createPopupView({
            document,
            window,
            i18n: createI18n(),
            localeDefinitions,
            getLocaleDefinitionFn: (localeCode) => localeDefinitions.find(
                (localeDefinition) => localeDefinition.code === localeCode
            ) || null
        });

        view.renderLocaleOptions(onSelectLocale);

        const option = document.querySelector('.locale-option');

        expect(option).not.toBeNull();
        expect(option.querySelector('.locale-option__native').textContent).toBe('<img src=x onerror=alert(1)>');
        expect(option.querySelector('.locale-option__english').textContent).toBe('<b>Chinese</b>');
        expect(option.querySelector('.locale-option__short').textContent).toBe('<CN>');
        expect(option.querySelector('.locale-option__native img')).toBeNull();
        expect(option.querySelector('.locale-option__english b')).toBeNull();
        expect(option.querySelector('.locale-option__check svg path')?.getAttribute('d')).toBe('M3.5 8.5L6.5 11.5L12.5 5.5');

        option.click();

        expect(onSelectLocale).toHaveBeenCalledWith('zh-CN');
    });
});
