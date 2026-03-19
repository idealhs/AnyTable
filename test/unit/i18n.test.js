import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createBrowserApi({ storedLocale, uiLocale } = {}) {
    const getMock = vi.fn().mockResolvedValue(storedLocale === undefined ? {} : { locale: storedLocale });
    const setMock = vi.fn().mockResolvedValue();
    const addListenerMock = vi.fn();

    return {
        api: {
            storage: {
                local: {
                    get: getMock,
                    set: setMock
                },
                onChanged: {
                    addListener: addListenerMock
                }
            },
            i18n: uiLocale
                ? {
                    getUILanguage: vi.fn(() => uiLocale)
                }
                : undefined
        },
        mocks: {
            addListenerMock,
            getMock,
            setMock
        }
    };
}

async function loadI18nWithWindow(windowValue) {
    vi.resetModules();
    globalThis.window = windowValue;
    const module = await import('../../src/i18n/i18n.js');
    return module.default;
}

describe('i18n', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete globalThis.window;
        delete globalThis.browser;
        delete globalThis.chrome;
    });

    it('keeps an existing stored locale as the source of truth', async () => {
        const { api, mocks } = createBrowserApi({
            storedLocale: 'fr-FR',
            uiLocale: 'ja'
        });
        const i18n = await loadI18nWithWindow({
            browser: api,
            dispatchEvent: vi.fn(),
            navigator: {
                languages: ['zh-CN'],
                language: 'en-US'
            }
        });

        await i18n.init();

        expect(i18n.getCurrentLocale()).toBe('fr-FR');
        expect(mocks.setMock).not.toHaveBeenCalled();
        expect(mocks.addListenerMock).toHaveBeenCalledOnce();
    });

    it('detects the browser UI locale on first launch and persists it', async () => {
        const { api, mocks } = createBrowserApi({
            uiLocale: 'ja'
        });
        const i18n = await loadI18nWithWindow({
            browser: api,
            dispatchEvent: vi.fn(),
            navigator: {
                languages: ['fr-FR'],
                language: 'en-US'
            }
        });

        await i18n.init();

        expect(i18n.getCurrentLocale()).toBe('ja-JP');
        expect(mocks.setMock).toHaveBeenCalledWith({ locale: 'ja-JP' });
    });

    it('falls back to English when the environment locale cannot be resolved', async () => {
        const { api, mocks } = createBrowserApi();
        const i18n = await loadI18nWithWindow({
            browser: api,
            dispatchEvent: vi.fn(),
            navigator: {
                languages: ['xx-YY'],
                language: ''
            }
        });

        await i18n.init();

        expect(i18n.getCurrentLocale()).toBe('en-US');
        expect(mocks.setMock).toHaveBeenCalledWith({ locale: 'en-US' });
    });
});
