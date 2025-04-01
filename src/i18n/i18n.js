// i18n 工具类
class I18n {
    constructor() {
        this.currentLocale = 'zh'; // 默认语言
        this.translations = {};
        this.loaded = false;
        // 语言包映射
        this.localeMap = {
            'zh': () => import('./zh.js'),
            'en': () => import('./en.js')
        };
    }

    // 初始化 i18n
    async init() {
        if (this.loaded) return;

        try {
            // 从浏览器存储中获取语言设置
            const browser = window.browser || chrome;
            const result = await browser.storage.local.get('locale');
            if (result.locale && this.localeMap[result.locale]) {
                this.currentLocale = result.locale;
            }

            // 加载语言包
            await this.loadTranslations();
            this.loaded = true;
        } catch (error) {
            console.error('Failed to initialize i18n:', error);
        }
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
            if (this.currentLocale !== 'en') {
                this.currentLocale = 'en';
                await this.loadTranslations();
            }
        }
    }

    // 切换语言
    async setLocale(locale) {
        if (locale === this.currentLocale || !this.localeMap[locale]) return;

        try {
            const browser = window.browser || chrome;
            await browser.storage.local.set({ locale });
            this.currentLocale = locale;
            await this.loadTranslations();
            
            // 触发语言变更事件
            window.dispatchEvent(new CustomEvent('localeChanged', { 
                detail: { locale: this.currentLocale } 
            }));
        } catch (error) {
            console.error(`Failed to set locale to ${locale}:`, error);
        }
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
}

// 创建全局 i18n 实例
const i18n = new I18n();
export default i18n; 