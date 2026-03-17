import { sendTabCommand } from '../services/message-client.js';

const UNSUPPORTED_TAB_URL_PATTERN = /^(chrome|edge|about|moz-extension|chrome-extension|view-source):/i;

export function isSupportedPopupTab(tab) {
    const url = tab?.url || '';
    return Boolean(tab?.id) && !UNSUPPORTED_TAB_URL_PATTERN.test(url);
}

export function hasFailedPopupResponse(response, context, logger = console, silent = false) {
    if (response?.success !== false) {
        return false;
    }

    if (!silent) {
        logger.error(`${context}失败:`, response.error);
    }

    return true;
}

export function createPopupPageClient({
    browserApi,
    sendTabCommandFn = sendTabCommand,
    logger = console
}) {
    async function getCurrentTab() {
        try {
            const tabs = await browserApi.tabs.query({active: true, currentWindow: true});
            return tabs[0] || null;
        } catch (error) {
            logger.error('获取当前标签页失败:', error);
            return null;
        }
    }

    async function sendCommand(action, payload = {}, silent = false, currentTab = null) {
        const tab = currentTab || await getCurrentTab();
        return sendTabCommandFn({
            tabsApi: browserApi.tabs,
            tabId: tab?.id || null,
            action,
            payload,
            silent,
            logger
        });
    }

    return {
        getCurrentTab,
        isSupportedTab: isSupportedPopupTab,
        sendCommand,
        hasFailedResponse(response, context, silent = false) {
            return hasFailedPopupResponse(response, context, logger, silent);
        }
    };
}
