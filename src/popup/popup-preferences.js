export const POPUP_PREFERENCE_DEFAULTS = Object.freeze({
    autoEnhance: true,
    multiColumnSort: false,
    toolbarDefaultExpanded: true
});

export const POPUP_PREFERENCE_KEYS = Object.freeze([
    'autoEnhance',
    'multiColumnSort',
    'toolbarDefaultExpanded'
]);

export function normalizePopupPreferences(result = {}) {
    return {
        autoEnhance: result.autoEnhance !== false,
        multiColumnSort: result.multiColumnSort === true,
        toolbarDefaultExpanded: result.toolbarDefaultExpanded !== false
    };
}

export async function loadPopupPreferences(storageApi, logger = console) {
    try {
        const result = await storageApi.get(POPUP_PREFERENCE_KEYS);
        return normalizePopupPreferences(result);
    } catch (error) {
        logger.error('加载设置失败:', error);
        return {...POPUP_PREFERENCE_DEFAULTS};
    }
}

export async function savePopupPreference(storageApi, key, value, logger = console) {
    try {
        await storageApi.set({[key]: value});
        return true;
    } catch (error) {
        logger.error('保存设置失败:', error);
        return false;
    }
}

export function createPopupPreferenceStore({storageApi, logger = console}) {
    return {
        load() {
            return loadPopupPreferences(storageApi, logger);
        },
        save(key, value) {
            return savePopupPreference(storageApi, key, value, logger);
        }
    };
}
