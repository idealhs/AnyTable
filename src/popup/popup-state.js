const DEFAULT_POPUP_STATE = Object.freeze({
    currentTab: null,
    pageStatus: 'unavailable',
    hasSelection: false,
    enhancedCount: 0,
    autoEnhance: true,
    multiColumnSort: false,
    toolbarDefaultExpanded: true,
    activeAction: null,
    pendingSettingKey: null,
    localeMenuOpen: false
});

export function createPopupState(overrides = {}) {
    return {
        ...DEFAULT_POPUP_STATE,
        ...overrides
    };
}

export function applyPopupSelectionState(state, selectionState) {
    state.hasSelection = selectionState?.hasSelection === true;
    state.enhancedCount = Number.isInteger(selectionState?.enhancedCount) ? selectionState.enhancedCount : 0;
}

export function clearPopupSelectionState(state) {
    state.hasSelection = false;
    state.enhancedCount = 0;
}
