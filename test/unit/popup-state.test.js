import { describe, expect, it } from 'vitest';
import {
    applyPopupSelectionState,
    clearPopupSelectionState,
    createPopupState
} from '../../src/popup/popup-state.js';

describe('popup state helpers', () => {
    it('creates a popup state from defaults and overrides', () => {
        const state = createPopupState({
            pageStatus: 'ready',
            autoEnhance: false
        });

        expect(state).toMatchObject({
            currentTab: null,
            pageStatus: 'ready',
            hasSelection: false,
            enhancedCount: 0,
            autoEnhance: false,
            multiColumnSort: false,
            toolbarDefaultExpanded: true,
            activeAction: null,
            pendingSettingKey: null,
            localeMenuOpen: false
        });
    });

    it('applies and clears popup selection state safely', () => {
        const state = createPopupState();

        applyPopupSelectionState(state, {
            hasSelection: true,
            enhancedCount: 3
        });
        expect(state.hasSelection).toBe(true);
        expect(state.enhancedCount).toBe(3);

        applyPopupSelectionState(state, {
            hasSelection: false,
            enhancedCount: 'invalid'
        });
        expect(state.hasSelection).toBe(false);
        expect(state.enhancedCount).toBe(0);

        state.hasSelection = true;
        state.enhancedCount = 9;
        clearPopupSelectionState(state);
        expect(state.hasSelection).toBe(false);
        expect(state.enhancedCount).toBe(0);
    });
});
