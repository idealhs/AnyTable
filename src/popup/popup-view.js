import { LOCALE_DEFINITIONS, getLocaleDefinition } from '../i18n/locale-config.js';

const STATUS_HIDE_DELAY = 2600;
const SVG_NS = 'http://www.w3.org/2000/svg';
const browserApi = globalThis.browser || globalThis.chrome;
const BRAND_LOGO_URL = browserApi?.runtime?.getURL('icons/anytable-96.png') || 'icons/anytable-96.png';

function createElements(documentRef) {
    return {
        pickButton: documentRef.getElementById('pickTable'),
        clearButton: documentRef.getElementById('clearSelection'),
        statusToast: documentRef.getElementById('status'),
        localePicker: documentRef.querySelector('.locale-picker'),
        localeTrigger: documentRef.getElementById('localeTrigger'),
        localeCurrentLabel: documentRef.getElementById('localeCurrentLabel'),
        localeMenu: documentRef.getElementById('localeMenu'),
        localeMenuList: documentRef.getElementById('localeMenuList'),
        autoEnhanceSwitch: documentRef.getElementById('autoEnhance'),
        multiColumnSortSwitch: documentRef.getElementById('multiColumnSort'),
        toolbarDefaultExpandedSwitch: documentRef.getElementById('toolbarDefaultExpanded'),
        pageHost: documentRef.getElementById('pageHost'),
        pageTitle: documentRef.getElementById('pageTitle'),
        pageFavicon: documentRef.getElementById('pageFavicon'),
        pageSupportBadge: documentRef.getElementById('pageSupportBadge'),
        pageStatusDescription: documentRef.getElementById('pageStatusDescription')
    };
}

function updateI18nElements(documentRef, i18n) {
    documentRef.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        element.textContent = i18n.t(key);
    });
}

function createLocaleCheckIcon(documentRef) {
    const iconWrapper = documentRef.createElement('span');
    iconWrapper.className = 'locale-option__check';
    iconWrapper.setAttribute('aria-hidden', 'true');

    const icon = documentRef.createElementNS(SVG_NS, 'svg');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('aria-hidden', 'true');

    const path = documentRef.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M3.5 8.5L6.5 11.5L12.5 5.5');

    icon.appendChild(path);
    iconWrapper.appendChild(icon);
    return iconWrapper;
}

function createLocaleOptionButton(documentRef, localeDefinition, onSelectLocale) {
    const button = documentRef.createElement('button');
    button.type = 'button';
    button.className = 'locale-option';
    button.dataset.locale = localeDefinition.code;

    const copy = documentRef.createElement('span');
    copy.className = 'locale-option__copy';

    const nativeName = documentRef.createElement('span');
    nativeName.className = 'locale-option__native';
    nativeName.textContent = localeDefinition.nativeName;

    const englishName = documentRef.createElement('span');
    englishName.className = 'locale-option__english';
    englishName.textContent = localeDefinition.englishName;

    copy.append(nativeName, englishName);

    const meta = documentRef.createElement('span');
    meta.className = 'locale-option__meta';

    const shortLabel = documentRef.createElement('span');
    shortLabel.className = 'locale-option__short';
    shortLabel.textContent = localeDefinition.shortLabel;

    meta.append(shortLabel, createLocaleCheckIcon(documentRef));
    button.append(copy, meta);

    button.addEventListener('click', async (event) => {
        event.stopPropagation();
        await onSelectLocale(localeDefinition.code);
    });

    return button;
}

function formatHostLabel(i18n, url) {
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

function getPageStatusDescription(i18n, state) {
    if (state.pageStatus === 'ready') {
        return i18n.t('popup.page.enhancedCount').replace('{count}', String(state.enhancedCount));
    }

    if (state.pageStatus === 'unsupported') {
        return i18n.t('popup.page.unsupportedDescription');
    }

    return i18n.t('popup.page.unavailableDescription');
}

export function createPopupView({
    document: documentRef,
    window: windowRef,
    i18n,
    localeDefinitions = LOCALE_DEFINITIONS,
    getLocaleDefinitionFn = getLocaleDefinition
}) {
    const elements = createElements(documentRef);
    let statusTimer = null;

    function renderPageIcon(pageIconUrl) {
        const nextIconUrl = pageIconUrl || BRAND_LOGO_URL;
        elements.pageFavicon.dataset.fallback = pageIconUrl ? 'false' : 'true';
        elements.pageFavicon.src = nextIconUrl;
    }

    elements.pageFavicon.addEventListener('error', () => {
        if (elements.pageFavicon.dataset.fallback === 'true') {
            return;
        }

        elements.pageFavicon.dataset.fallback = 'true';
        elements.pageFavicon.src = BRAND_LOGO_URL;
    });

    function renderLocaleOptions(onSelectLocale) {
        elements.localeMenuList.replaceChildren();

        localeDefinitions.forEach((localeDefinition) => {
            const button = createLocaleOptionButton(documentRef, localeDefinition, onSelectLocale);
            elements.localeMenuList.appendChild(button);
        });
    }

    function updateLocaleOptions() {
        const currentLocale = i18n.getCurrentLocale();
        const currentLocaleDefinition = getLocaleDefinitionFn(currentLocale);

        elements.localeCurrentLabel.textContent = currentLocaleDefinition?.shortLabel || currentLocale.toUpperCase();

        elements.localeMenuList.querySelectorAll('.locale-option').forEach((optionElement) => {
            const isActive = optionElement.dataset.locale === currentLocale;
            optionElement.classList.toggle('is-active', isActive);
            optionElement.setAttribute('role', 'option');
            optionElement.setAttribute('aria-selected', String(isActive));
        });
    }

    function syncLocale() {
        const currentLocaleDefinition = getLocaleDefinitionFn(i18n.getCurrentLocale());

        updateI18nElements(documentRef, i18n);
        documentRef.documentElement.lang = currentLocaleDefinition?.code || i18n.getCurrentLocale();
        documentRef.documentElement.dir = currentLocaleDefinition?.direction || 'ltr';
        documentRef.title = i18n.t('popup.title');
        elements.localeMenu.setAttribute('aria-label', i18n.t('popup.language.label'));
        elements.localeTrigger.setAttribute('aria-label', i18n.t('popup.language.label'));
        updateLocaleOptions();
    }

    function setLocaleMenuOpen(isOpen) {
        elements.localePicker.classList.toggle('is-open', isOpen);
        elements.localeMenu.hidden = !isOpen;
        elements.localeTrigger.setAttribute('aria-expanded', String(isOpen));
    }

    function renderControls(state) {
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

    function updateSupportBadge(pageStatus) {
        let textKey = 'popup.page.unavailable';
        let toneClass = 'status-chip status-chip--critical';

        if (pageStatus === 'ready') {
            textKey = 'popup.page.ready';
            toneClass = 'status-chip status-chip--positive';
        } else if (pageStatus === 'unsupported') {
            textKey = 'popup.page.unsupported';
            toneClass = 'status-chip status-chip--warning';
        }

        elements.pageSupportBadge.className = toneClass;
        elements.pageSupportBadge.textContent = i18n.t(textKey);
    }

    function renderPageState(state) {
        const hostLabel = state.currentTab ? formatHostLabel(i18n, state.currentTab.url) : i18n.t('popup.page.hostFallback');
        const titleLabel = state.currentTab?.title || i18n.t('popup.page.titleFallback');
        const pageIconUrl = state.currentTab?.favIconUrl || '';

        elements.pageHost.textContent = hostLabel;
        elements.pageTitle.textContent = titleLabel;
        elements.pageStatusDescription.textContent = getPageStatusDescription(i18n, state);
        renderPageIcon(pageIconUrl);

        updateSupportBadge(state.pageStatus);
    }

    function showStatus(message, type, autoHide = true) {
        if (statusTimer) {
            windowRef.clearTimeout(statusTimer);
            statusTimer = null;
        }

        elements.statusToast.textContent = message;
        elements.statusToast.className = `status-toast status-toast--${type} is-visible`;
        elements.statusToast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        elements.statusToast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

        if (!autoHide) {
            return;
        }

        statusTimer = windowRef.setTimeout(() => {
            elements.statusToast.className = 'status-toast';
        }, STATUS_HIDE_DELAY);
    }

    function syncPopupRootSize() {
        documentRef.documentElement.style.minHeight = '0';
        documentRef.body.style.minHeight = '0';
        documentRef.documentElement.style.height = 'auto';
        documentRef.body.style.height = 'auto';
    }

    function bindHandlers({
        onLocaleChanged,
        onDocumentClick,
        onDocumentKeydown,
        onToggleLocaleMenu,
        onPickTable,
        onClearSelection,
        onPreferenceChange
    }) {
        windowRef.addEventListener('localeChanged', onLocaleChanged);
        documentRef.addEventListener('click', onDocumentClick);
        documentRef.addEventListener('keydown', onDocumentKeydown);

        elements.localeTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            onToggleLocaleMenu();
        });

        elements.pickButton.addEventListener('click', onPickTable);
        elements.clearButton.addEventListener('click', onClearSelection);

        elements.autoEnhanceSwitch.addEventListener('change', () => {
            onPreferenceChange('autoEnhance', elements.autoEnhanceSwitch.checked);
        });

        elements.multiColumnSortSwitch.addEventListener('change', () => {
            onPreferenceChange('multiColumnSort', elements.multiColumnSortSwitch.checked);
        });

        elements.toolbarDefaultExpandedSwitch.addEventListener('change', () => {
            onPreferenceChange('toolbarDefaultExpanded', elements.toolbarDefaultExpandedSwitch.checked);
        });
    }

    return {
        elements,
        bindHandlers,
        renderLocaleOptions,
        syncLocale,
        setLocaleMenuOpen,
        renderControls,
        renderPageState,
        showStatus,
        syncPopupRootSize,
        getPageStatusDescription(state) {
            return getPageStatusDescription(i18n, state);
        },
        isInsideLocalePicker(target) {
            return elements.localePicker.contains(target);
        },
        focusLocaleTrigger() {
            elements.localeTrigger.focus();
        }
    };
}
