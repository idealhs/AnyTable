import i18n from './src/i18n/i18n.js';
import { MessageAction } from './src/constants/messages.js';
import { LOCALE_DEFINITIONS, getLocaleDefinition } from './src/i18n/locale-config.js';
import { sendTabCommand } from './src/services/message-client.js';

const STATUS_HIDE_DELAY = 2600;
const LOCALE_CHECK_ICON = `
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3.5 8.5L6.5 11.5L12.5 5.5"></path>
    </svg>
`;

document.addEventListener('DOMContentLoaded', async () => {
    const browserApi = window.browser || chrome;
    const elements = {
        pickButton: document.getElementById('pickTable'),
        clearButton: document.getElementById('clearSelection'),
        statusToast: document.getElementById('status'),
        localePicker: document.querySelector('.locale-picker'),
        localeTrigger: document.getElementById('localeTrigger'),
        localeCurrentLabel: document.getElementById('localeCurrentLabel'),
        localeMenu: document.getElementById('localeMenu'),
        localeMenuList: document.getElementById('localeMenuList'),
        autoEnhanceSwitch: document.getElementById('autoEnhance'),
        multiColumnSortSwitch: document.getElementById('multiColumnSort'),
        toolbarDefaultExpandedSwitch: document.getElementById('toolbarDefaultExpanded'),
        pageHost: document.getElementById('pageHost'),
        pageTitle: document.getElementById('pageTitle'),
        pageSupportBadge: document.getElementById('pageSupportBadge'),
        pageStatusDescription: document.getElementById('pageStatusDescription')
    };

    const state = {
        currentTab: null,
        pageStatus: 'unavailable',
        hasSelection: false,
        enhancedCount: 0,
        autoEnhance: true,
        multiColumnSort: false,
        toolbarDefaultExpanded: true,
        activeAction: null,
        pendingSettingKey: null,
        statusTimer: null,
        localeMenuOpen: false
    };

    await i18n.init();

    renderLocaleOptions();
    bindEvents();
    syncLocale();
    renderControls();
    renderPageState();
    syncPopupRootSize();

    await Promise.all([loadSettings(), refreshPageContext()]);

    function bindEvents() {
        window.addEventListener('localeChanged', handleLocaleChanged);
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleDocumentKeydown);

        elements.localeTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            setLocaleMenuOpen(!state.localeMenuOpen);
        });

        elements.pickButton.addEventListener('click', handlePickTable);
        elements.clearButton.addEventListener('click', handleClearSelection);

        elements.autoEnhanceSwitch.addEventListener('change', async () => {
            await handlePreferenceChange({
                key: 'autoEnhance',
                input: elements.autoEnhanceSwitch,
                action: MessageAction.SET_AUTO_ENHANCE,
                enabledMessageKey: 'popup.autoEnhance.enabled',
                disabledMessageKey: 'popup.autoEnhance.disabled'
            });
        });

        elements.multiColumnSortSwitch.addEventListener('change', async () => {
            await handlePreferenceChange({
                key: 'multiColumnSort',
                input: elements.multiColumnSortSwitch,
                action: MessageAction.SET_MULTI_COLUMN_SORT,
                enabledMessageKey: 'popup.multiColumnSort.enabled',
                disabledMessageKey: 'popup.multiColumnSort.disabled'
            });
        });

        elements.toolbarDefaultExpandedSwitch.addEventListener('change', async () => {
            await handlePreferenceChange({
                key: 'toolbarDefaultExpanded',
                input: elements.toolbarDefaultExpandedSwitch,
                action: MessageAction.SET_TOOLBAR_DEFAULT_EXPANDED,
                enabledMessageKey: 'popup.toolbarDefaultExpanded.expanded',
                disabledMessageKey: 'popup.toolbarDefaultExpanded.collapsed'
            });
        });
    }

    function handleLocaleChanged() {
        syncLocale();
        renderPageState();
        renderControls();
        syncPopupRootSize();
    }

    function handleDocumentClick(event) {
        if (!state.localeMenuOpen) {
            return;
        }

        if (!elements.localePicker.contains(event.target)) {
            setLocaleMenuOpen(false);
        }
    }

    function handleDocumentKeydown(event) {
        if (event.key === 'Escape' && state.localeMenuOpen) {
            setLocaleMenuOpen(false);
            elements.localeTrigger.focus();
        }
    }

    function syncLocale() {
        updateI18nElements();
        document.documentElement.lang = i18n.getCurrentLocale() === 'zh' ? 'zh-CN' : 'en';
        document.title = i18n.t('popup.title');
        elements.localeMenu.setAttribute('aria-label', i18n.t('popup.language.label'));
        elements.localeTrigger.setAttribute('aria-label', i18n.t('popup.language.label'));
        updateLocaleOptions();
    }

    function updateI18nElements() {
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            element.textContent = i18n.t(key);
        });
    }

    function renderLocaleOptions() {
        elements.localeMenuList.innerHTML = '';

        LOCALE_DEFINITIONS.forEach((localeDefinition) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'locale-option';
            button.dataset.locale = localeDefinition.code;
            button.innerHTML = `
                <span class="locale-option__copy">
                    <span class="locale-option__native">${localeDefinition.nativeName}</span>
                    <span class="locale-option__english">${localeDefinition.englishName}</span>
                </span>
                <span class="locale-option__meta">
                    <span class="locale-option__short">${localeDefinition.shortLabel}</span>
                    <span class="locale-option__check">${LOCALE_CHECK_ICON}</span>
                </span>
            `;
            button.addEventListener('click', async (event) => {
                event.stopPropagation();
                await i18n.setLocale(localeDefinition.code);
                setLocaleMenuOpen(false);
            });
            elements.localeMenuList.appendChild(button);
        });
    }

    function updateLocaleOptions() {
        const currentLocale = i18n.getCurrentLocale();
        const currentLocaleDefinition = getLocaleDefinition(currentLocale);

        elements.localeCurrentLabel.textContent = currentLocaleDefinition?.shortLabel || currentLocale.toUpperCase();

        elements.localeMenuList.querySelectorAll('.locale-option').forEach((optionElement) => {
            const isActive = optionElement.dataset.locale === currentLocale;
            optionElement.classList.toggle('is-active', isActive);
            optionElement.setAttribute('role', 'option');
            optionElement.setAttribute('aria-selected', String(isActive));
        });
    }

    function setLocaleMenuOpen(isOpen) {
        state.localeMenuOpen = isOpen;
        elements.localePicker.classList.toggle('is-open', isOpen);
        elements.localeMenu.hidden = !isOpen;
        elements.localeTrigger.setAttribute('aria-expanded', String(isOpen));
    }

    async function getCurrentTab() {
        try {
            const tabs = await browserApi.tabs.query({ active: true, currentWindow: true });
            return tabs[0] || null;
        } catch (error) {
            console.error('获取当前标签页失败:', error);
            return null;
        }
    }

    async function sendCommandToCurrentPage(action, payload = {}, silent = false) {
        const tab = state.currentTab || await getCurrentTab();
        return sendTabCommand({
            tabsApi: browserApi.tabs,
            tabId: tab?.id || null,
            action,
            payload,
            silent
        });
    }

    function hasFailedResponse(response, context, silent = false) {
        if (response?.success !== false) {
            return false;
        }

        if (!silent) {
            console.error(`${context}失败:`, response.error);
        }

        return true;
    }

    function applySelectionState(selectionState) {
        state.hasSelection = selectionState?.hasSelection === true;
        state.enhancedCount = Number.isInteger(selectionState?.enhancedCount) ? selectionState.enhancedCount : 0;
    }

    function clearSelectionState() {
        state.hasSelection = false;
        state.enhancedCount = 0;
    }

    function isSupportedTab(tab) {
        const url = tab?.url || '';
        return Boolean(tab?.id) && !/^(chrome|edge|about|moz-extension|chrome-extension|view-source):/i.test(url);
    }

    async function refreshPageContext() {
        state.currentTab = await getCurrentTab();

        if (!state.currentTab) {
            state.pageStatus = 'unavailable';
            state.hasSelection = false;
            state.enhancedCount = 0;
            renderPageState();
            renderControls();
            syncPopupRootSize();
            return;
        }

        if (!isSupportedTab(state.currentTab)) {
            state.pageStatus = 'unsupported';
            state.hasSelection = false;
            state.enhancedCount = 0;
            renderPageState();
            renderControls();
            syncPopupRootSize();
            return;
        }

        const response = await sendCommandToCurrentPage(MessageAction.GET_SELECTION_STATE, {}, true);

        if (!hasFailedResponse(response, '获取页面状态', true) && response?.data && typeof response.data.hasSelection === 'boolean') {
            state.pageStatus = 'ready';
            applySelectionState(response.data);
        } else {
            state.pageStatus = 'unavailable';
            clearSelectionState();
        }

        renderPageState();
        renderControls();
        syncPopupRootSize();
    }

    async function loadSettings() {
        try {
            const result = await browserApi.storage.local.get([
                'autoEnhance',
                'multiColumnSort',
                'toolbarDefaultExpanded'
            ]);

            state.autoEnhance = result.autoEnhance !== false;
            state.multiColumnSort = result.multiColumnSort === true;
            state.toolbarDefaultExpanded = result.toolbarDefaultExpanded !== false;
        } catch (error) {
            console.error('加载设置失败:', error);
            state.autoEnhance = true;
            state.multiColumnSort = false;
            state.toolbarDefaultExpanded = true;
        }

        renderControls();
        renderPageState();
        syncPopupRootSize();
    }

    async function handlePreferenceChange({
        key,
        input,
        action,
        enabledMessageKey,
        disabledMessageKey
    }) {
        const previousValue = state[key];
        const nextValue = input.checked;

        state.pendingSettingKey = key;
        renderControls();

        try {
            await browserApi.storage.local.set({ [key]: nextValue });
            state[key] = nextValue;
            renderControls();
        } catch (error) {
            console.error('保存设置失败:', error);
            state[key] = previousValue;
            input.checked = previousValue;
            state.pendingSettingKey = null;
            renderControls();
            syncPopupRootSize();
            showStatus(i18n.t('popup.status.error'), 'error');
            return;
        }

        let syncFailed = false;
        try {
            const response = await sendCommandToCurrentPage(action, { enabled: nextValue }, true);
            syncFailed = state.pageStatus === 'ready' && hasFailedResponse(response, '同步页面设置');
        } finally {
            state.pendingSettingKey = null;
            await refreshPageContext();
            renderControls();
            syncPopupRootSize();
        }

        if (syncFailed) {
            showStatus(i18n.t('popup.status.error'), 'error');
            return;
        }

        showStatus(
            i18n.t(nextValue ? enabledMessageKey : disabledMessageKey),
            'success'
        );
    }

    async function handlePickTable() {
        if (state.pageStatus !== 'ready') {
            showStatus(getPageStatusDescription(), 'error');
            return;
        }

        state.activeAction = 'pick';
        renderControls();

        try {
            const response = await sendCommandToCurrentPage(MessageAction.START_PICKING);
            if (!hasFailedResponse(response, '启动选择器') && response?.data?.picking) {
                showStatus(i18n.t('popup.status.picking'), 'picking', false);
                window.close();
                return;
            }

            showStatus(i18n.t('popup.status.error'), 'error');
        } catch (error) {
            console.error('启动选择器失败:', error);
            showStatus(i18n.t('popup.status.error'), 'error');
        } finally {
            state.activeAction = null;
            renderControls();
            syncPopupRootSize();
        }
    }

    async function handleClearSelection() {
        if (state.pageStatus !== 'ready' || !state.hasSelection) {
            showStatus(getPageStatusDescription(), 'error');
            return;
        }

        state.activeAction = 'clear';
        renderControls();

        try {
            const response = await sendCommandToCurrentPage(MessageAction.CLEAR_SELECTION);
            if (!hasFailedResponse(response, '清除选择') && response?.data) {
                applySelectionState(response.data);
                renderPageState();
                renderControls();
                syncPopupRootSize();
                showStatus(i18n.t('popup.status.success'), 'success');
                await refreshPageContext();
            } else {
                showStatus(i18n.t('popup.status.error'), 'error');
            }
        } catch (error) {
            console.error('清除选择失败:', error);
            showStatus(i18n.t('popup.status.error'), 'error');
        } finally {
            state.activeAction = null;
            renderControls();
            syncPopupRootSize();
        }
    }

    function renderControls() {
        const isPageReady = state.pageStatus === 'ready';

        elements.autoEnhanceSwitch.checked = state.autoEnhance;
        elements.multiColumnSortSwitch.checked = state.multiColumnSort;
        elements.toolbarDefaultExpandedSwitch.checked = state.toolbarDefaultExpanded;

        elements.autoEnhanceSwitch.disabled = state.pendingSettingKey === 'autoEnhance';
        elements.multiColumnSortSwitch.disabled = state.pendingSettingKey === 'multiColumnSort';
        elements.toolbarDefaultExpandedSwitch.disabled = state.pendingSettingKey === 'toolbarDefaultExpanded';

        elements.pickButton.disabled = !isPageReady || state.activeAction === 'pick';
        elements.clearButton.disabled = !isPageReady || !state.hasSelection || state.activeAction === 'clear';

        elements.pickButton.classList.toggle('is-loading', state.activeAction === 'pick');
        elements.clearButton.classList.toggle('is-loading', state.activeAction === 'clear');

        elements.pickButton.setAttribute('aria-busy', String(state.activeAction === 'pick'));
        elements.clearButton.setAttribute('aria-busy', String(state.activeAction === 'clear'));
    }

    function renderPageState() {
        const hostLabel = state.currentTab ? formatHostLabel(state.currentTab.url) : i18n.t('popup.page.hostFallback');
        const titleLabel = state.currentTab?.title || i18n.t('popup.page.titleFallback');

        elements.pageHost.textContent = hostLabel;
        elements.pageTitle.textContent = titleLabel;

        updateSupportBadge();
        elements.pageStatusDescription.textContent = getPageStatusDescription();
    }

    function updateSupportBadge() {
        let textKey = 'popup.page.unavailable';
        let toneClass = 'status-chip status-chip--critical';

        if (state.pageStatus === 'ready') {
            textKey = 'popup.page.ready';
            toneClass = 'status-chip status-chip--positive';
        } else if (state.pageStatus === 'unsupported') {
            textKey = 'popup.page.unsupported';
            toneClass = 'status-chip status-chip--warning';
        }

        elements.pageSupportBadge.className = toneClass;
        elements.pageSupportBadge.textContent = i18n.t(textKey);
    }

    function getPageStatusDescription() {
        if (state.pageStatus === 'ready') {
            return i18n.t('popup.page.enhancedCount').replace('{count}', String(state.enhancedCount));
        }

        if (state.pageStatus === 'unsupported') {
            return i18n.t('popup.page.unsupportedDescription');
        }

        return i18n.t('popup.page.unavailableDescription');
    }

    function formatHostLabel(url) {
        if (!url) {
            return i18n.t('popup.page.hostFallback');
        }

        try {
            const parsed = new URL(url);
            if (parsed.protocol === 'file:') {
                return i18n.t('popup.page.localFile');
            }

            return parsed.hostname || parsed.protocol.replace(':', '');
        } catch (error) {
            return i18n.t('popup.page.hostFallback');
        }
    }

    function showStatus(message, type, autoHide = true) {
        if (state.statusTimer) {
            window.clearTimeout(state.statusTimer);
            state.statusTimer = null;
        }

        elements.statusToast.textContent = message;
        elements.statusToast.className = `status-toast status-toast--${type} is-visible`;
        elements.statusToast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        elements.statusToast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

        if (!autoHide) {
            return;
        }

        state.statusTimer = window.setTimeout(() => {
            elements.statusToast.className = 'status-toast';
        }, STATUS_HIDE_DELAY);
    }

    function syncPopupRootSize() {
        // Chrome 的 action popup 对根节点的最小高度比较敏感，
        // 显式重置可以避免内容变少后保持旧高度。
        document.documentElement.style.minHeight = '0';
        document.body.style.minHeight = '0';
        document.documentElement.style.height = 'auto';
        document.body.style.height = 'auto';
    }
});
