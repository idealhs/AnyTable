import { describe, expect, it, vi } from 'vitest';
import {
    createPopupPageClient,
    hasFailedPopupResponse,
    isSupportedPopupTab
} from '../../src/popup/popup-page-client.js';

describe('popup page client helpers', () => {
    it('recognizes supported popup tabs', () => {
        expect(isSupportedPopupTab({ id: 1, url: 'https://example.com' })).toBe(true);
        expect(isSupportedPopupTab({ id: 1, url: 'chrome://extensions' })).toBe(false);
        expect(isSupportedPopupTab({ id: 1, url: 'view-source:https://example.com' })).toBe(false);
        expect(isSupportedPopupTab({ id: 0, url: 'https://example.com' })).toBe(false);
    });

    it('reports failed responses and respects the silent flag', () => {
        const logger = { error: vi.fn() };
        const failure = { success: false, error: { message: 'boom' } };

        expect(hasFailedPopupResponse({ success: true }, '同步页面设置', logger)).toBe(false);
        expect(hasFailedPopupResponse(failure, '同步页面设置', logger)).toBe(true);
        expect(logger.error).toHaveBeenCalledWith('同步页面设置失败:', failure.error);

        logger.error.mockClear();
        expect(hasFailedPopupResponse(failure, '同步页面设置', logger, true)).toBe(true);
        expect(logger.error).not.toHaveBeenCalled();
    });
});

describe('createPopupPageClient', () => {
    it('returns the active tab and delegates sendCommand with a provided current tab', async () => {
        const sendTabCommandFn = vi.fn().mockResolvedValue({ success: true });
        const browserApi = {
            tabs: {
                query: vi.fn().mockResolvedValue([{ id: 7, url: 'https://example.com' }])
            }
        };
        const client = createPopupPageClient({
            browserApi,
            sendTabCommandFn,
            logger: { error: vi.fn() }
        });
        const currentTab = { id: 9, url: 'https://example.com/table' };

        await expect(client.getCurrentTab()).resolves.toEqual({ id: 7, url: 'https://example.com' });
        await client.sendCommand('getSelectionState', { scope: 'all' }, true, currentTab);

        expect(browserApi.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
        expect(sendTabCommandFn).toHaveBeenCalledWith({
            tabsApi: browserApi.tabs,
            tabId: 9,
            action: 'getSelectionState',
            payload: { scope: 'all' },
            silent: true,
            logger: { error: expect.any(Function) }
        });
    });

    it('falls back to querying the current tab and logs query errors', async () => {
        const logger = { error: vi.fn() };
        const sendTabCommandFn = vi.fn().mockResolvedValue({ success: false });
        const browserApi = {
            tabs: {
                query: vi.fn()
                    .mockResolvedValueOnce([])
                    .mockRejectedValueOnce(new Error('query failed'))
            }
        };
        const client = createPopupPageClient({
            browserApi,
            sendTabCommandFn,
            logger
        });

        await client.sendCommand('clearSelection', {}, false);
        await expect(client.getCurrentTab()).resolves.toBe(null);

        expect(sendTabCommandFn).toHaveBeenCalledWith({
            tabsApi: browserApi.tabs,
            tabId: null,
            action: 'clearSelection',
            payload: {},
            silent: false,
            logger
        });
        expect(logger.error).toHaveBeenCalledWith('获取当前标签页失败:', expect.any(Error));
    });
});
