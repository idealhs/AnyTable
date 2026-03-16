import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageAction } from '../../src/constants/messages.js';
import { setupMessageHandler } from '../../src/message-handler.js';

describe('setupMessageHandler', () => {
    let addListener;
    let messageListener;

    beforeEach(() => {
        addListener = vi.fn((listener) => {
            messageListener = listener;
        });

        globalThis.window = {};
        globalThis.chrome = {
            runtime: {
                onMessage: {
                    addListener
                }
            }
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete globalThis.window;
        delete globalThis.chrome;
    });

    it('updates toolbar default state and applies it to existing toolbars', async () => {
        const enhancer = {
            toolbarDefaultExpanded: true,
            toolbar: {
                setAllExpanded: vi.fn()
            },
            enhancedTables: new Set(),
            refreshSortButtons: vi.fn(),
            pickingMode: {
                startPicking: vi.fn(),
                clearSelection: vi.fn()
            },
            selectedTables: new Set()
        };

        setupMessageHandler(enhancer);

        expect(addListener).toHaveBeenCalledOnce();

        const sendResponse = vi.fn();
        const keepChannelOpen = messageListener(
            {
                action: MessageAction.SET_TOOLBAR_DEFAULT_EXPANDED,
                enabled: false
            },
            null,
            sendResponse
        );

        expect(keepChannelOpen).toBe(true);

        await Promise.resolve();

        expect(enhancer.toolbarDefaultExpanded).toBe(false);
        expect(enhancer.toolbar.setAllExpanded).toHaveBeenCalledWith(false);
        expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
});
