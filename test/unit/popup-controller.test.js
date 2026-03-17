import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('popup controller', () => {
    let createPopupController;
    let dependencies;

    beforeEach(async () => {
        vi.resetModules();

        ({ createPopupController } = await import('../../src/popup/popup-controller.js'));

        dependencies = {
            i18n: {
                init: vi.fn().mockResolvedValue(undefined),
                setLocale: vi.fn().mockResolvedValue(undefined),
                t: vi.fn((key) => key)
            },
            view: {
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
            },
            pageClient: {
                getCurrentTab: vi.fn(),
                isSupportedTab: vi.fn(() => true),
                sendCommand: vi.fn(),
                hasFailedResponse: vi.fn((response) => response?.success === false)
            },
            preferenceStore: {
                load: vi.fn().mockResolvedValue({
                    autoEnhance: false,
                    multiColumnSort: true,
                    toolbarDefaultExpanded: false
                }),
                save: vi.fn().mockResolvedValue(true)
            },
            closeWindow: vi.fn(),
            logger: {
                error: vi.fn()
            }
        };
    });

    function createController() {
        return createPopupController(dependencies);
    }

    it('initializes locale, preferences and page context through dedicated collaborators', async () => {
        const controller = createController();
        const currentTab = {id: 7, url: 'https://example.com/table', title: 'Example'};

        dependencies.pageClient.getCurrentTab.mockResolvedValue(currentTab);
        dependencies.pageClient.sendCommand.mockResolvedValue({
            success: true,
            data: {hasSelection: true, enhancedCount: 2}
        });

        await controller.init();

        expect(dependencies.i18n.init).toHaveBeenCalledOnce();
        expect(dependencies.view.renderLocaleOptions).toHaveBeenCalledOnce();
        expect(dependencies.view.bindHandlers).toHaveBeenCalledOnce();
        expect(controller.state.autoEnhance).toBe(false);
        expect(controller.state.multiColumnSort).toBe(true);
        expect(controller.state.toolbarDefaultExpanded).toBe(false);
        expect(controller.state.pageStatus).toBe('ready');
        expect(controller.state.hasSelection).toBe(true);
        expect(controller.state.enhancedCount).toBe(2);
        expect(dependencies.pageClient.sendCommand).toHaveBeenCalledWith('getSelectionState', {}, true, currentTab);
    });

    it('shows an error and restores previous state when saving preferences fails', async () => {
        const controller = createController();
        controller.state.pageStatus = 'ready';
        controller.state.autoEnhance = true;
        controller.state.currentTab = {id: 1, url: 'https://example.com'};

        dependencies.preferenceStore.save.mockResolvedValue(false);

        await controller.handlePreferenceChange('autoEnhance', false);

        expect(controller.state.autoEnhance).toBe(true);
        expect(controller.state.pendingSettingKey).toBe(null);
        expect(dependencies.pageClient.sendCommand).not.toHaveBeenCalled();
        expect(dependencies.view.showStatus).toHaveBeenCalledWith('popup.status.error', 'error');
    });

    it('reports an error when a ready page fails to sync the updated switch state', async () => {
        const controller = createController();
        const currentTab = {id: 3, url: 'https://example.com'};

        controller.state.pageStatus = 'ready';
        controller.state.currentTab = currentTab;
        controller.state.autoEnhance = true;
        dependencies.pageClient.getCurrentTab.mockResolvedValue(currentTab);
        dependencies.pageClient.sendCommand
            .mockResolvedValueOnce({success: false, error: {message: 'sync failed'}})
            .mockResolvedValueOnce({success: true, data: {hasSelection: false, enhancedCount: 0}});

        await controller.handlePreferenceChange('autoEnhance', false);

        expect(controller.state.pendingSettingKey).toBe(null);
        expect(controller.state.autoEnhance).toBe(false);
        expect(dependencies.pageClient.sendCommand).toHaveBeenNthCalledWith(1, 'setAutoEnhance', {enabled: false}, true, currentTab);
        expect(dependencies.pageClient.sendCommand).toHaveBeenNthCalledWith(2, 'getSelectionState', {}, true, currentTab);
        expect(dependencies.view.showStatus).toHaveBeenLastCalledWith('popup.status.error', 'error');
    });

    it('logs and reports an error when preference sync throws, then refreshes page context', async () => {
        const controller = createController();
        const currentTab = {id: 4, url: 'https://example.com'};

        controller.state.pageStatus = 'ready';
        controller.state.currentTab = currentTab;
        controller.state.multiColumnSort = true;
        dependencies.pageClient.getCurrentTab.mockResolvedValue(currentTab);
        dependencies.pageClient.sendCommand
            .mockRejectedValueOnce(new Error('sync exploded'))
            .mockResolvedValueOnce({success: true, data: {hasSelection: true, enhancedCount: 1}});

        await controller.handlePreferenceChange('multiColumnSort', false);

        expect(controller.state.multiColumnSort).toBe(false);
        expect(controller.state.pendingSettingKey).toBe(null);
        expect(dependencies.logger.error).toHaveBeenCalledWith('同步页面设置失败:', expect.any(Error));
        expect(dependencies.pageClient.sendCommand).toHaveBeenNthCalledWith(1, 'setMultiColumnSort', {enabled: false}, true, currentTab);
        expect(dependencies.pageClient.sendCommand).toHaveBeenNthCalledWith(2, 'getSelectionState', {}, true, currentTab);
        expect(dependencies.view.showStatus).toHaveBeenLastCalledWith('popup.status.error', 'error');
    });

    it('closes the locale menu on Escape and restores focus to the trigger', () => {
        const controller = createController();
        controller.setLocaleMenuOpen(true);

        controller.handleDocumentKeydown({key: 'Escape'});

        expect(controller.state.localeMenuOpen).toBe(false);
        expect(dependencies.view.setLocaleMenuOpen).toHaveBeenLastCalledWith(false);
        expect(dependencies.view.focusLocaleTrigger).toHaveBeenCalledOnce();
    });

    it('marks the popup unavailable when no active tab can be resolved', async () => {
        const controller = createController();
        controller.state.hasSelection = true;
        controller.state.enhancedCount = 3;
        dependencies.pageClient.getCurrentTab.mockResolvedValue(null);

        await controller.refreshPageContext();

        expect(controller.state.pageStatus).toBe('unavailable');
        expect(controller.state.hasSelection).toBe(false);
        expect(controller.state.enhancedCount).toBe(0);
        expect(dependencies.pageClient.sendCommand).not.toHaveBeenCalled();
    });

    it('marks unsupported tabs without sending a page command', async () => {
        const controller = createController();
        const unsupportedTab = {id: 8, url: 'chrome://extensions'};
        dependencies.pageClient.getCurrentTab.mockResolvedValue(unsupportedTab);
        dependencies.pageClient.isSupportedTab.mockReturnValue(false);

        await controller.refreshPageContext();

        expect(controller.state.pageStatus).toBe('unsupported');
        expect(controller.state.currentTab).toBe(unsupportedTab);
        expect(dependencies.pageClient.sendCommand).not.toHaveBeenCalled();
    });

    it('marks the popup unavailable when selection state sync fails or returns malformed data', async () => {
        const controller = createController();
        const currentTab = {id: 13, url: 'https://example.com'};
        controller.state.hasSelection = true;
        controller.state.enhancedCount = 5;
        dependencies.pageClient.getCurrentTab.mockResolvedValue(currentTab);
        dependencies.pageClient.sendCommand.mockResolvedValue({
            success: true,
            data: {enhancedCount: 2}
        });

        await controller.refreshPageContext();

        expect(controller.state.pageStatus).toBe('unavailable');
        expect(controller.state.currentTab).toBe(currentTab);
        expect(controller.state.hasSelection).toBe(false);
        expect(controller.state.enhancedCount).toBe(0);
    });

    it('starts table picking on ready pages and closes the popup on success', async () => {
        const controller = createController();
        const currentTab = {id: 9, url: 'https://example.com'};
        controller.state.pageStatus = 'ready';
        controller.state.currentTab = currentTab;
        dependencies.pageClient.sendCommand.mockResolvedValue({
            success: true,
            data: {picking: true}
        });

        await controller.handlePickTable();

        expect(dependencies.pageClient.sendCommand).toHaveBeenCalledWith('startPicking', {}, false, currentTab);
        expect(dependencies.view.showStatus).toHaveBeenCalledWith('popup.status.picking', 'picking', false);
        expect(dependencies.closeWindow).toHaveBeenCalledOnce();
        expect(controller.state.activeAction).toBe(null);
    });

    it('shows an error when the picker command completes without entering picking mode', async () => {
        const controller = createController();
        const currentTab = {id: 14, url: 'https://example.com'};
        controller.state.pageStatus = 'ready';
        controller.state.currentTab = currentTab;
        dependencies.pageClient.sendCommand.mockResolvedValue({
            success: true,
            data: {picking: false}
        });

        await controller.handlePickTable();

        expect(dependencies.pageClient.sendCommand).toHaveBeenCalledWith('startPicking', {}, false, currentTab);
        expect(dependencies.view.showStatus).toHaveBeenCalledWith('popup.status.error', 'error');
        expect(dependencies.closeWindow).not.toHaveBeenCalled();
        expect(controller.state.activeAction).toBe(null);
    });

    it('shows an error when table picking throws or page is not ready', async () => {
        const controller = createController();

        await controller.handlePickTable();
        expect(dependencies.view.showStatus).toHaveBeenCalledWith('page-status', 'error');

        dependencies.view.showStatus.mockClear();
        controller.state.pageStatus = 'ready';
        controller.state.currentTab = {id: 5, url: 'https://example.com'};
        dependencies.pageClient.sendCommand.mockRejectedValue(new Error('picker failed'));

        await controller.handlePickTable();

        expect(dependencies.logger.error).toHaveBeenCalledWith('启动选择器失败:', expect.any(Error));
        expect(dependencies.view.showStatus).toHaveBeenCalledWith('popup.status.error', 'error');
        expect(controller.state.activeAction).toBe(null);
    });

    it('clears selection, refreshes page context, and reports success', async () => {
        const controller = createController();
        const currentTab = {id: 12, url: 'https://example.com'};
        controller.state.pageStatus = 'ready';
        controller.state.currentTab = currentTab;
        controller.state.hasSelection = true;
        controller.state.enhancedCount = 2;
        dependencies.pageClient.getCurrentTab.mockResolvedValue(currentTab);
        dependencies.pageClient.sendCommand
            .mockResolvedValueOnce({success: true, data: {hasSelection: false, enhancedCount: 1}})
            .mockResolvedValueOnce({success: true, data: {hasSelection: false, enhancedCount: 0}});

        await controller.handleClearSelection();

        expect(dependencies.pageClient.sendCommand).toHaveBeenNthCalledWith(1, 'clearSelection', {}, false, currentTab);
        expect(dependencies.pageClient.sendCommand).toHaveBeenNthCalledWith(2, 'getSelectionState', {}, true, currentTab);
        expect(controller.state.hasSelection).toBe(false);
        expect(controller.state.enhancedCount).toBe(0);
        expect(dependencies.view.showStatus).toHaveBeenCalledWith('popup.status.success', 'success');
        expect(controller.state.activeAction).toBe(null);
    });

    it('shows an error when clearing selection returns a failed response', async () => {
        const controller = createController();
        const currentTab = {id: 15, url: 'https://example.com'};
        controller.state.pageStatus = 'ready';
        controller.state.currentTab = currentTab;
        controller.state.hasSelection = true;
        dependencies.pageClient.sendCommand.mockResolvedValue({success: false});

        await controller.handleClearSelection();

        expect(dependencies.pageClient.sendCommand).toHaveBeenCalledWith('clearSelection', {}, false, currentTab);
        expect(dependencies.view.showStatus).toHaveBeenCalledWith('popup.status.error', 'error');
        expect(controller.state.activeAction).toBe(null);
    });

    it('logs and reports an error when clearing selection throws', async () => {
        const controller = createController();
        const currentTab = {id: 16, url: 'https://example.com'};
        controller.state.pageStatus = 'ready';
        controller.state.currentTab = currentTab;
        controller.state.hasSelection = true;
        dependencies.pageClient.sendCommand.mockRejectedValue(new Error('clear failed'));

        await controller.handleClearSelection();

        expect(dependencies.logger.error).toHaveBeenCalledWith('清除选择失败:', expect.any(Error));
        expect(dependencies.view.showStatus).toHaveBeenCalledWith('popup.status.error', 'error');
        expect(controller.state.activeAction).toBe(null);
    });

    it('ignores inside locale clicks and closes the menu on outside clicks', () => {
        const controller = createController();
        const target = {};

        controller.setLocaleMenuOpen(true);
        dependencies.view.isInsideLocalePicker.mockReturnValue(true);
        controller.handleDocumentClick({target});
        expect(controller.state.localeMenuOpen).toBe(true);

        dependencies.view.isInsideLocalePicker.mockReturnValue(false);
        controller.handleDocumentClick({target});
        expect(controller.state.localeMenuOpen).toBe(false);
        expect(dependencies.view.setLocaleMenuOpen).toHaveBeenLastCalledWith(false);
    });

    it('wires locale handlers during init so toggling, selecting and locale refresh stay in sync', async () => {
        const controller = createController();
        const currentTab = {id: 17, url: 'https://example.com', title: 'Example'};

        dependencies.pageClient.getCurrentTab.mockResolvedValue(currentTab);
        dependencies.pageClient.sendCommand.mockResolvedValue({
            success: true,
            data: {hasSelection: false, enhancedCount: 0}
        });

        await controller.init();

        const handlers = dependencies.view.bindHandlers.mock.calls[0][0];
        const [onLocaleSelect] = dependencies.view.renderLocaleOptions.mock.calls[0];

        handlers.onToggleLocaleMenu();
        expect(controller.state.localeMenuOpen).toBe(true);

        await onLocaleSelect('zh-CN');
        expect(dependencies.i18n.setLocale).toHaveBeenCalledWith('zh-CN');
        expect(controller.state.localeMenuOpen).toBe(false);

        handlers.onLocaleChanged();
        expect(dependencies.view.syncLocale).toHaveBeenCalled();
    });
});
