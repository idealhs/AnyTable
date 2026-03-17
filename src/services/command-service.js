import { createMessageProtocolError, MessageAction, MessageErrorCode } from '../constants/messages.js';

function readEnabledPayload(payload) {
    if (typeof payload?.enabled !== 'boolean') {
        throw createMessageProtocolError('消息载荷缺少 enabled 布尔值', MessageErrorCode.INVALID_PAYLOAD);
    }

    return payload.enabled;
}

export function createCommandService(enhancer) {
    return {
        async execute(action, payload = {}) {
            switch (action) {
                case MessageAction.START_PICKING:
                    return enhancer.startPicking();
                case MessageAction.CLEAR_SELECTION:
                    return enhancer.clearSelection();
                case MessageAction.GET_SELECTION_STATE:
                    return enhancer.getSelectionState();
                case MessageAction.SET_AUTO_ENHANCE:
                    return enhancer.setAutoEnhanceEnabled(readEnabledPayload(payload));
                case MessageAction.SET_MULTI_COLUMN_SORT:
                    return enhancer.setMultiColumnSortEnabled(readEnabledPayload(payload));
                case MessageAction.SET_TOOLBAR_DEFAULT_EXPANDED:
                    return enhancer.setToolbarDefaultExpanded(readEnabledPayload(payload));
                default:
                    throw createMessageProtocolError('未知的操作', MessageErrorCode.UNSUPPORTED_ACTION);
            }
        }
    };
}
