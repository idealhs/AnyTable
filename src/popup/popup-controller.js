import { MessageAction } from '../constants/messages.js';
import { applyPopupSelectionState, clearPopupSelectionState, createPopupState } from './popup-state.js';

const PREFERENCE_CONFIGS = Object.freeze({
    autoEnhance: {
        action: MessageAction.SET_AUTO_ENHANCE,
        enabledMessageKey: 'popup.autoEnhance.enabled',
        disabledMessageKey: 'popup.autoEnhance.disabled'
    },
    multiColumnSort: {
        action: MessageAction.SET_MULTI_COLUMN_SORT,
        enabledMessageKey: 'popup.multiColumnSort.enabled',
        disabledMessageKey: 'popup.multiColumnSort.disabled'
    },
    toolbarDefaultExpanded: {
        action: MessageAction.SET_TOOLBAR_DEFAULT_EXPANDED,
        enabledMessageKey: 'popup.toolbarDefaultExpanded.expanded',
        disabledMessageKey: 'popup.toolbarDefaultExpanded.collapsed'
    }
});

export function createPopupController({
    i18n,
    view,
    pageClient,
    preferenceStore,
    closeWindow = () => window.close(),
    logger = console,
    state = createPopupState()
}) {
    function render() {
        view.setLocaleMenuOpen(state.localeMenuOpen);
        view.renderControls(state);
        view.renderPageState(state);
        view.syncPopupRootSize();
    }

    function syncLocale() {
        view.syncLocale();
        render();
    }

    function setLocaleMenuOpen(isOpen) {
        state.localeMenuOpen = isOpen;
        view.setLocaleMenuOpen(isOpen);
    }

    async function refreshPageContext() {
        state.currentTab = await pageClient.getCurrentTab();

        if (!state.currentTab) {
            state.pageStatus = 'unavailable';
            clearPopupSelectionState(state);
            render();
            return;
        }

        if (!pageClient.isSupportedTab(state.currentTab)) {
            state.pageStatus = 'unsupported';
            clearPopupSelectionState(state);
            render();
            return;
        }

        const response = await pageClient.sendCommand(MessageAction.GET_SELECTION_STATE, {}, true, state.currentTab);
        if (!pageClient.hasFailedResponse(response, '获取页面状态', true) && response?.data && typeof response.data.hasSelection === 'boolean') {
            state.pageStatus = 'ready';
            applyPopupSelectionState(state, response.data);
        } else {
            state.pageStatus = 'unavailable';
            clearPopupSelectionState(state);
        }

        render();
    }

    async function loadSettings() {
        Object.assign(state, await preferenceStore.load());
        render();
    }

    async function handlePreferenceChange(key, nextValue) {
        const config = PREFERENCE_CONFIGS[key];
        if (!config) {
            return;
        }

        const previousValue = state[key];
        state.pendingSettingKey = key;
        render();

        const saveSucceeded = await preferenceStore.save(key, nextValue);
        if (!saveSucceeded) {
            state[key] = previousValue;
            state.pendingSettingKey = null;
            render();
            view.showStatus(i18n.t('popup.status.error'), 'error');
            return;
        }

        state[key] = nextValue;
        render();

        let syncFailed = false;
        try {
            const response = await pageClient.sendCommand(config.action, {enabled: nextValue}, true, state.currentTab);
            syncFailed = state.pageStatus === 'ready'
                && pageClient.hasFailedResponse(response, '同步页面设置');
        } catch (error) {
            logger.error('同步页面设置失败:', error);
            syncFailed = true;
        } finally {
            state.pendingSettingKey = null;
            await refreshPageContext();
            render();
        }

        if (syncFailed) {
            view.showStatus(i18n.t('popup.status.error'), 'error');
            return;
        }

        view.showStatus(
            i18n.t(nextValue ? config.enabledMessageKey : config.disabledMessageKey),
            'success'
        );
    }

    async function handlePickTable() {
        if (state.pageStatus !== 'ready') {
            view.showStatus(view.getPageStatusDescription(state), 'error');
            return;
        }

        state.activeAction = 'pick';
        render();

        try {
            const response = await pageClient.sendCommand(MessageAction.START_PICKING, {}, false, state.currentTab);
            if (!pageClient.hasFailedResponse(response, '启动选择器') && response?.data?.picking) {
                view.showStatus(i18n.t('popup.status.picking'), 'picking', false);
                closeWindow();
                return;
            }

            view.showStatus(i18n.t('popup.status.error'), 'error');
        } catch (error) {
            logger.error('启动选择器失败:', error);
            view.showStatus(i18n.t('popup.status.error'), 'error');
        } finally {
            state.activeAction = null;
            render();
        }
    }

    async function handleClearSelection() {
        if (state.pageStatus !== 'ready' || !state.hasSelection) {
            view.showStatus(view.getPageStatusDescription(state), 'error');
            return;
        }

        state.activeAction = 'clear';
        render();

        try {
            const response = await pageClient.sendCommand(MessageAction.CLEAR_SELECTION, {}, false, state.currentTab);
            if (!pageClient.hasFailedResponse(response, '清除选择') && response?.data) {
                applyPopupSelectionState(state, response.data);
                render();
                view.showStatus(i18n.t('popup.status.success'), 'success');
                await refreshPageContext();
            } else {
                view.showStatus(i18n.t('popup.status.error'), 'error');
            }
        } catch (error) {
            logger.error('清除选择失败:', error);
            view.showStatus(i18n.t('popup.status.error'), 'error');
        } finally {
            state.activeAction = null;
            render();
        }
    }

    async function handleLocaleSelect(locale) {
        await i18n.setLocale(locale);
        setLocaleMenuOpen(false);
    }

    function handleLocaleChanged() {
        syncLocale();
    }

    function handleDocumentClick(event) {
        if (!state.localeMenuOpen) {
            return;
        }

        if (!view.isInsideLocalePicker(event.target)) {
            setLocaleMenuOpen(false);
        }
    }

    function handleDocumentKeydown(event) {
        if (event.key === 'Escape' && state.localeMenuOpen) {
            setLocaleMenuOpen(false);
            view.focusLocaleTrigger();
        }
    }

    async function init() {
        await i18n.init();

        view.renderLocaleOptions(handleLocaleSelect);
        view.bindHandlers({
            onLocaleChanged: handleLocaleChanged,
            onDocumentClick: handleDocumentClick,
            onDocumentKeydown: handleDocumentKeydown,
            onToggleLocaleMenu() {
                setLocaleMenuOpen(!state.localeMenuOpen);
            },
            onPickTable: handlePickTable,
            onClearSelection: handleClearSelection,
            onPreferenceChange: handlePreferenceChange
        });

        syncLocale();
        await Promise.all([loadSettings(), refreshPageContext()]);
    }

    return {
        state,
        init,
        loadSettings,
        refreshPageContext,
        handlePreferenceChange,
        handlePickTable,
        handleClearSelection,
        handleLocaleChanged,
        handleDocumentClick,
        handleDocumentKeydown,
        setLocaleMenuOpen
    };
}
