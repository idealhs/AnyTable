import { describe, expect, it } from 'vitest';
import {
    createMessageErrorResponse,
    createMessageProtocolError,
    createMessageRequest,
    createMessageSuccessResponse,
    isMessageRequest,
    isMessageResponse,
    MessageErrorCode
} from '../../src/constants/messages.js';

describe('message protocol helpers', () => {
    it('creates request envelopes with payload and request id', () => {
        const request = createMessageRequest('demoAction', { enabled: true }, 'req-42');

        expect(request).toEqual({
            action: 'demoAction',
            payload: { enabled: true },
            requestId: 'req-42'
        });
        expect(isMessageRequest(request)).toBe(true);
    });

    it('creates normalized success and error response envelopes', () => {
        const successResponse = createMessageSuccessResponse({ hasSelection: true }, 'req-success');
        const errorResponse = createMessageErrorResponse(
            createMessageProtocolError('请求无效', MessageErrorCode.INVALID_REQUEST),
            'req-error'
        );

        expect(successResponse).toEqual({
            success: true,
            data: { hasSelection: true },
            error: null,
            requestId: 'req-success'
        });
        expect(isMessageResponse(successResponse)).toBe(true);

        expect(errorResponse).toEqual({
            success: false,
            data: null,
            error: {
                message: '请求无效',
                code: MessageErrorCode.INVALID_REQUEST
            },
            requestId: 'req-error'
        });
        expect(isMessageResponse(errorResponse)).toBe(true);
    });
});
