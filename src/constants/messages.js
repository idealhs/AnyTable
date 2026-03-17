export const MessageAction = Object.freeze({
    START_PICKING: 'startPicking',
    CLEAR_SELECTION: 'clearSelection',
    GET_SELECTION_STATE: 'getSelectionState',
    SET_AUTO_ENHANCE: 'setAutoEnhance',
    SET_MULTI_COLUMN_SORT: 'setMultiColumnSort',
    SET_TOOLBAR_DEFAULT_EXPANDED: 'setToolbarDefaultExpanded'
});

export const MessageErrorCode = Object.freeze({
    INVALID_REQUEST: 'invalidRequest',
    INVALID_PAYLOAD: 'invalidPayload',
    UNSUPPORTED_ACTION: 'unsupportedAction',
    INVALID_RESPONSE: 'invalidResponse',
    TRANSPORT_ERROR: 'transportError',
    INTERNAL_ERROR: 'internalError'
});

let requestSequence = 0;

export function createMessageProtocolError(message, code = MessageErrorCode.INTERNAL_ERROR) {
    const error = new Error(message);
    error.code = code;
    return error;
}

export function createMessageRequestId() {
    requestSequence += 1;
    return `anytable-${Date.now()}-${requestSequence}`;
}

export function createMessageRequest(action, payload = {}, requestId = createMessageRequestId()) {
    return {
        action,
        payload,
        requestId
    };
}

export function createMessageSuccessResponse(data = null, requestId = null) {
    return {
        success: true,
        data,
        error: null,
        requestId
    };
}

export function createMessageErrorResponse(error, requestId = null) {
    const normalizedError = normalizeMessageError(error);
    return {
        success: false,
        data: null,
        error: normalizedError,
        requestId
    };
}

export function normalizeMessageError(error) {
    if (error && typeof error === 'object' && typeof error.message === 'string' && typeof error.code === 'string') {
        return {
            message: error.message,
            code: error.code
        };
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            code: typeof error.code === 'string' ? error.code : MessageErrorCode.INTERNAL_ERROR
        };
    }

    if (typeof error === 'string' && error) {
        return {
            message: error,
            code: MessageErrorCode.INTERNAL_ERROR
        };
    }

    return {
        message: '操作失败',
        code: MessageErrorCode.INTERNAL_ERROR
    };
}

export function isMessageRequest(request) {
    return Boolean(
        request
        && typeof request === 'object'
        && typeof request.action === 'string'
        && typeof request.requestId === 'string'
        && (request.payload === undefined || isPlainObject(request.payload))
    );
}

export function isMessageResponse(response) {
    return Boolean(
        response
        && typeof response === 'object'
        && typeof response.success === 'boolean'
        && (response.requestId === null || typeof response.requestId === 'string')
        && 'data' in response
        && 'error' in response
    );
}

function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}
