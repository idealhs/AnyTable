import { describe, expect, it, vi } from 'vitest';
import { MessageAction, MessageErrorCode } from '../../src/constants/messages.js';
import { sendTabCommand } from '../../src/services/message-client.js';

describe('sendTabCommand', () => {
    it('sends a request envelope and returns the matching response', async () => {
        const sendMessage = vi.fn(async (tabId, request) => {
            expect(tabId).toBe(7);
            expect(request.action).toBe(MessageAction.GET_SELECTION_STATE);
            expect(request.payload).toEqual({});
            expect(typeof request.requestId).toBe('string');

            return {
                success: true,
                data: { hasSelection: true, enhancedCount: 2 },
                error: null,
                requestId: request.requestId
            };
        });

        const response = await sendTabCommand({
            tabsApi: { sendMessage },
            tabId: 7,
            action: MessageAction.GET_SELECTION_STATE
        });

        expect(sendMessage).toHaveBeenCalledOnce();
        expect(response).toEqual({
            success: true,
            data: { hasSelection: true, enhancedCount: 2 },
            error: null,
            requestId: expect.any(String)
        });
    });

    it('returns an invalid-response error for mismatched request ids', async () => {
        const response = await sendTabCommand({
            tabsApi: {
                sendMessage: vi.fn(async () => ({
                    success: true,
                    data: {},
                    error: null,
                    requestId: 'other-request'
                }))
            },
            tabId: 9,
            action: MessageAction.START_PICKING
        });

        expect(response.success).toBe(false);
        expect(response.error).toEqual({
            message: '收到无效的消息响应',
            code: MessageErrorCode.INVALID_RESPONSE
        });
    });

    it('returns a transport error when sending fails', async () => {
        const logger = {
            error: vi.fn()
        };
        const response = await sendTabCommand({
            tabsApi: {
                sendMessage: vi.fn(async () => {
                    throw new Error('Receiving end does not exist');
                })
            },
            tabId: 9,
            action: MessageAction.START_PICKING,
            logger
        });

        expect(response.success).toBe(false);
        expect(response.error).toEqual({
            message: 'Receiving end does not exist',
            code: MessageErrorCode.TRANSPORT_ERROR
        });
        expect(logger.error).toHaveBeenCalledOnce();
    });
});
