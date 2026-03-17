import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupMessageHandler } from '../../src/message-handler.js';
import { createPopupController } from '../../src/popup/popup-controller.js';
import { createPopupPageClient } from '../../src/popup/popup-page-client.js';
import { createCommandService } from '../../src/services/command-service.js';

function createViewStub() {
    return {
        renderLocaleOptions: vi.fn(),
        bindHandlers: vi.fn(),
        syncLocale: vi.fn(),
        setLocaleMenuOpen: vi.fn(),
        renderControls: vi.fn(),
        renderPageState: vi.fn(),
        syncPopupRootSize: vi.fn(),
        showStatus: vi.fn(),
        getPageStatusDescription: vi.fn(() => 'page-status'),
        isInsideLocalePicker: vi.fn(() => false),
        focusLocaleTrigger: vi.fn()
    };
}

describe('popup 与 content 消息协同', () => {
    let browserApi;
    let enhancer;
    let logger;
    let messageListener;

    beforeEach(() => {
        messageListener = null;
        logger = {
            error: vi.fn()
        };
        enhancer = {
            getSelectionState: vi.fn(() => ({
                hasSelection: true,
                enhancedCount: 2
            })),
            setAutoEnhanceEnabled: vi.fn((enabled) => ({
                autoEnhance: enabled,
                hasSelection: true,
                enhancedCount: 2
            })),
            startPicking: vi.fn(),
            clearSelection: vi.fn(() => ({
                hasSelection: false,
                enhancedCount: 0
            })),
            setMultiColumnSortEnabled: vi.fn(),
            setToolbarDefaultExpanded: vi.fn()
        };

        globalThis.window = {};
        globalThis.chrome = {
            runtime: {
                onMessage: {
                    addListener: vi.fn((listener) => {
                        messageListener = listener;
                    })
                }
            }
        };

        browserApi = {
            tabs: {
                query: vi.fn().mockResolvedValue([{
                    id: 7,
                    url: 'https://example.com/table'
                }]),
                sendMessage: vi.fn((tabId, request) => new Promise((resolve) => {
                    messageListener(request, { tab: { id: tabId } }, resolve);
                }))
            }
        };

        setupMessageHandler(createCommandService(enhancer));
    });

    it('通过统一协议完成初始化与偏好同步', async () => {
        const pageClient = createPopupPageClient({
            browserApi,
            logger
        });
        const view = createViewStub();
        const controller = createPopupController({
            i18n: {
                init: vi.fn().mockResolvedValue(undefined),
                setLocale: vi.fn().mockResolvedValue(undefined),
                t: vi.fn((key) => key)
            },
            view,
            pageClient,
            preferenceStore: {
                load: vi.fn().mockResolvedValue({
                    autoEnhance: true,
                    multiColumnSort: false,
                    toolbarDefaultExpanded: true
                }),
                save: vi.fn().mockResolvedValue(true)
            },
            closeWindow: vi.fn(),
            logger
        });

        await controller.init();

        expect(controller.state.pageStatus).toBe('ready');
        expect(controller.state.hasSelection).toBe(true);
        expect(controller.state.enhancedCount).toBe(2);
        expect(enhancer.getSelectionState).toHaveBeenCalledTimes(1);

        await controller.handlePreferenceChange('autoEnhance', false);

        expect(enhancer.setAutoEnhanceEnabled).toHaveBeenCalledWith(false);
        expect(controller.state.autoEnhance).toBe(false);
        expect(browserApi.tabs.sendMessage.mock.calls.map(([, request]) => request.action)).toEqual([
            'getSelectionState',
            'setAutoEnhance',
            'getSelectionState'
        ]);
        expect(view.showStatus).toHaveBeenLastCalledWith('popup.autoEnhance.disabled', 'success');
    });
});
