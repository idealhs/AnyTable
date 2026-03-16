import { MessageAction } from './constants/messages.js';

export function setupMessageHandler(enhancer) {
    const browser = window.browser || chrome;

    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const handleMessage = async () => {
            try {
                switch (request.action) {
                    case MessageAction.START_PICKING:
                        enhancer.pickingMode.startPicking();
                        return { success: true };
                    case MessageAction.CLEAR_SELECTION:
                        enhancer.pickingMode.clearSelection();
                        return { success: true };
                    case MessageAction.GET_SELECTION_STATE:
                        return { hasSelection: enhancer.selectedTables.size > 0 };
                    case MessageAction.SET_AUTO_ENHANCE:
                        enhancer.autoEnhance = request.enabled;
                        if (request.enabled) {
                            const tables = document.getElementsByTagName('table');
                            for (const table of tables) {
                                if (!enhancer.enhancedTables.has(table)) {
                                    enhancer.enhanceTable(table);
                                }
                            }
                        } else {
                            enhancer.enhancedTables.forEach(table => {
                                if (!enhancer.selectedTables.has(table)) {
                                    enhancer.removeEnhancement(table);
                                }
                            });
                        }
                        return { success: true };
                    case MessageAction.SET_MULTI_COLUMN_SORT:
                        enhancer.multiColumnSort = request.enabled;
                        enhancer.enhancedTables.forEach((table) => {
                            enhancer.refreshSortButtons(table);
                        });
                        return { success: true };
                    case MessageAction.SET_TOOLBAR_DEFAULT_EXPANDED:
                        enhancer.toolbarDefaultExpanded = request.enabled !== false;
                        enhancer.toolbar.setAllExpanded(enhancer.toolbarDefaultExpanded);
                        return { success: true };
                    default:
                        return { success: false, error: '未知的操作' };
                }
            } catch (error) {
                console.error('处理消息失败:', error);
                return { success: false, error: error.message };
            }
        };

        handleMessage().then(sendResponse);
        return true;
    });
}
