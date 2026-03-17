import {
    createMessageErrorResponse,
    createMessageProtocolError,
    createMessageRequest,
    isMessageResponse,
    MessageErrorCode
} from '../constants/messages.js';

export async function sendTabCommand({
    tabsApi,
    tabId,
    action,
    payload = {},
    logger = console,
    silent = false
}) {
    const request = createMessageRequest(action, payload);

    if (!tabId) {
        return createMessageErrorResponse(
            createMessageProtocolError('缺少可用的标签页', MessageErrorCode.TRANSPORT_ERROR),
            request.requestId
        );
    }

    try {
        const response = await tabsApi.sendMessage(tabId, request);
        if (!isMessageResponse(response) || response.requestId !== request.requestId) {
            return createMessageErrorResponse(
                createMessageProtocolError('收到无效的消息响应', MessageErrorCode.INVALID_RESPONSE),
                request.requestId
            );
        }

        return response;
    } catch (error) {
        if (!silent) {
            logger.error('发送消息失败:', error);
        }

        return createMessageErrorResponse(
            createMessageProtocolError(error?.message || '发送消息失败', MessageErrorCode.TRANSPORT_ERROR),
            request.requestId
        );
    }
}
