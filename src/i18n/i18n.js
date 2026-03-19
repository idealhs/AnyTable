import {
    DEFAULT_LOCALE,
    FALLBACK_LOCALE,
    findSupportedLocale,
    getLocaleDefinition,
    LOCALE_MAP,
    normalizeLocaleCode
} from './locale-config.js';

// i18n 工具类
class I18n {
    constructor() {
        this.currentLocale = DEFAULT_LOCALE;
        this.translations = {};
        this.loaded = false;
        this.storageListenerRegistered = false;
        this.pendingLocale = null;
        this.localeMap = LOCALE_MAP;
    }

    // 初始化 i18n
    async init() {
        if (this.loaded) return;

        try {
            const browser = this.getBrowserApi();
            this.currentLocale = await this.resolveInitialLocale(browser);
            await this.loadTranslations();
            this.registerStorageListener(browser);
            this.loaded = true;
        } catch (error) {
            console.error('Failed to initialize i18n:', error);
        }
    }

    getBrowserApi() {
        return globalThis.window?.browser || globalThis.browser || globalThis.chrome || null;
    }

    async resolveInitialLocale(browser) {
        try {
            const result = await browser?.storage?.local?.get?.('locale');
            const storedLocale = normalizeLocaleCode(result?.locale);

            if (storedLocale) {
                return storedLocale;
            }
        } catch (error) {
            console.warn('Failed to read stored locale, falling back to environment detection:', error);
        }

        const detectedLocale = this.detectEnvironmentLocale(browser) || FALLBACK_LOCALE;

        try {
            await browser?.storage?.local?.set?.({ locale: detectedLocale });
        } catch (error) {
            console.warn(`Failed to persist initial locale ${detectedLocale}:`, error);
        }

        return detectedLocale;
    }

    detectEnvironmentLocale(browser) {
        const navigatorRef = globalThis.window?.navigator || globalThis.navigator;
        const localeCandidates = [];
        const uiLocale = browser?.i18n?.getUILanguage?.();

        if (typeof uiLocale === 'string') {
            localeCandidates.push(uiLocale);
        }

        if (Array.isArray(navigatorRef?.languages)) {
            localeCandidates.push(...navigatorRef.languages);
        }

        if (typeof navigatorRef?.language === 'string') {
            localeCandidates.push(navigatorRef.language);
        }

        if (typeof navigatorRef?.userLanguage === 'string') {
            localeCandidates.push(navigatorRef.userLanguage);
        }

        return findSupportedLocale(localeCandidates);
    }

    // 加载语言包
    async loadTranslations() {
        try {
            const importFn = this.localeMap[this.currentLocale];
            if (!importFn) {
                throw new Error(`Unsupported locale: ${this.currentLocale}`);
            }
            const module = await importFn();
            this.translations = module.default;
        } catch (error) {
            console.error(`Failed to load translations for ${this.currentLocale}:`, error);
            // 如果加载失败，尝试加载英文作为后备
            if (this.currentLocale !== FALLBACK_LOCALE) {
                this.currentLocale = FALLBACK_LOCALE;
                await this.loadTranslations();
            }
        }
    }

    // 切换语言
    async setLocale(locale) {
        const normalizedLocale = normalizeLocaleCode(locale);
        if (!normalizedLocale || normalizedLocale === this.currentLocale || !this.localeMap[normalizedLocale]) {
            return;
        }

        try {
            const browser = this.getBrowserApi();
            this.pendingLocale = normalizedLocale;
            await browser?.storage?.local?.set?.({ locale: normalizedLocale });
            this.currentLocale = normalizedLocale;
            await this.loadTranslations();

            // 触发语言变更事件
            globalThis.window?.dispatchEvent(new CustomEvent('localeChanged', {
                detail: { locale: this.currentLocale }
            }));
        } catch (error) {
            console.error(`Failed to set locale to ${normalizedLocale}:`, error);
        } finally {
            this.pendingLocale = null;
        }
    }

    // 监听存储变化，确保 popup/content script 之间语言同步
    registerStorageListener(browser) {
        if (this.storageListenerRegistered || !browser?.storage?.onChanged?.addListener) {
            return;
        }

        browser.storage.onChanged.addListener(async (changes, areaName) => {
            if (areaName !== 'local' || !changes.locale) {
                return;
            }

            const nextLocale = normalizeLocaleCode(changes.locale.newValue);
            if (
                !nextLocale ||
                !this.localeMap[nextLocale] ||
                nextLocale === this.currentLocale ||
                nextLocale === this.pendingLocale
            ) {
                return;
            }

            try {
                this.currentLocale = nextLocale;
                await this.loadTranslations();
                globalThis.window?.dispatchEvent(new CustomEvent('localeChanged', {
                    detail: { locale: this.currentLocale }
                }));
            } catch (error) {
                console.error('Failed to sync locale from storage change:', error);
            }
        });

        this.storageListenerRegistered = true;
    }

    // 获取翻译文本
    t(key) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // 如果找不到翻译，返回原始键
            }
        }

        return value || key;
    }

    // 获取当前语言
    getCurrentLocale() {
        return this.currentLocale;
    }

    // 获取当前语言的文本方向
    getDirection() {
        return getLocaleDefinition(this.currentLocale)?.direction === 'rtl' ? 'rtl' : 'ltr';
    }
}

// 创建全局 i18n 实例
const i18n = new I18n();
export default i18n;
