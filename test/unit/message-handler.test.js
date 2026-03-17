import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createMessageErrorResponse,
    createMessageProtocolError,
    createMessageRequest,
    createMessageSuccessResponse,
    MessageAction,
    MessageErrorCode
} from '../../src/constants/messages.js';
import { setupMessageHandler } from '../../src/message-handler.js';

describe('setupMessageHandler', () => {
    let addListener;
    let messageListener;
    let commandService;

    beforeEach(() => {
        addListener = vi.fn((listener) => {
            messageListener = listener;
        });
        commandService = {
            execute: vi.fn()
        };

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

    it('wraps successful command execution in a unified response envelope', async () => {
        commandService.execute.mockResolvedValue({
            toolbarDefaultExpanded: false
        });

        setupMessageHandler(commandService);

        expect(addListener).toHaveBeenCalledOnce();

        const request = createMessageRequest(
            MessageAction.SET_TOOLBAR_DEFAULT_EXPANDED,
            { enabled: false },
            'req-1'
        );
        const sendResponse = vi.fn();
        const keepChannelOpen = messageListener(request, null, sendResponse);

        expect(keepChannelOpen).toBe(true);

        await Promise.resolve();
        await Promise.resolve();

        expect(commandService.execute).toHaveBeenCalledWith(
            MessageAction.SET_TOOLBAR_DEFAULT_EXPANDED,
            { enabled: false },
            { sender: null }
        );
        expect(sendResponse).toHaveBeenCalledWith(
            createMessageSuccessResponse({ toolbarDefaultExpanded: false }, 'req-1')
        );
    });

    it('returns a protocol error envelope for invalid requests', async () => {
        setupMessageHandler(commandService);

        const sendResponse = vi.fn();
        const keepChannelOpen = messageListener(
            { action: MessageAction.GET_SELECTION_STATE },
            null,
            sendResponse
        );

        expect(keepChannelOpen).toBe(true);

        await Promise.resolve();
        await Promise.resolve();

        expect(commandService.execute).not.toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith(
            createMessageErrorResponse(
                createMessageProtocolError('无效的消息请求', MessageErrorCode.INVALID_REQUEST),
                null
            )
        );
    });
});
