import { describe, expect, it, vi } from 'vitest';
import { MessageAction, MessageErrorCode } from '../../src/constants/messages.js';
import { createCommandService } from '../../src/services/command-service.js';

function createEnhancer() {
    return {
        startPicking: vi.fn(() => ({ picking: true })),
        clearSelection: vi.fn(() => ({ hasSelection: false, enhancedCount: 0 })),
        getSelectionState: vi.fn(() => ({ hasSelection: true, enhancedCount: 3 })),
        setAutoEnhanceEnabled: vi.fn((enabled) => ({ autoEnhance: enabled })),
        setMultiColumnSortEnabled: vi.fn((enabled) => ({ multiColumnSort: enabled })),
        setToolbarDefaultExpanded: vi.fn((enabled) => ({ toolbarDefaultExpanded: enabled }))
    };
}

describe('createCommandService', () => {
    it('dispatches actions to enhancer command methods', async () => {
        const enhancer = createEnhancer();
        const commandService = createCommandService(enhancer);

        const response = await commandService.execute(MessageAction.GET_SELECTION_STATE);

        expect(enhancer.getSelectionState).toHaveBeenCalledOnce();
        expect(response).toEqual({ hasSelection: true, enhancedCount: 3 });
    });

    it('passes boolean payloads to toggle commands', async () => {
        const enhancer = createEnhancer();
        const commandService = createCommandService(enhancer);

        const response = await commandService.execute(
            MessageAction.SET_MULTI_COLUMN_SORT,
            { enabled: true }
        );

        expect(enhancer.setMultiColumnSortEnabled).toHaveBeenCalledWith(true);
        expect(response).toEqual({ multiColumnSort: true });
    });

    it('rejects toggle commands with invalid payloads', async () => {
        const enhancer = createEnhancer();
        const commandService = createCommandService(enhancer);

        await expect(commandService.execute(MessageAction.SET_AUTO_ENHANCE, {})).rejects.toMatchObject({
            code: MessageErrorCode.INVALID_PAYLOAD
        });
    });

    it('rejects unsupported actions', async () => {
        const enhancer = createEnhancer();
        const commandService = createCommandService(enhancer);

        await expect(commandService.execute('unknownAction')).rejects.toMatchObject({
            code: MessageErrorCode.UNSUPPORTED_ACTION
        });
    });
});
