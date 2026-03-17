import {
    createMessageErrorResponse,
    createMessageProtocolError,
    createMessageSuccessResponse,
    isMessageRequest,
    MessageErrorCode
} from './constants/messages.js';

export function setupMessageHandler(commandService) {
    const browser = window.browser || chrome;

    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const handleMessage = async () => {
            if (!isMessageRequest(request)) {
                return createMessageErrorResponse(
                    createMessageProtocolError('无效的消息请求', MessageErrorCode.INVALID_REQUEST),
                    request?.requestId ?? null
                );
            }

            try {
                const data = await commandService.execute(request.action, request.payload || {}, { sender });
                return createMessageSuccessResponse(data, request.requestId);
            } catch (error) {
                console.error('处理消息失败:', error);
                return createMessageErrorResponse(error, request.requestId);
            }
        };

        handleMessage().then(sendResponse);
        return true;
    });
}
