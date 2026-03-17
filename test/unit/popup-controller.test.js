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

    it('closes the locale menu on Escape and restores focus to the trigger', () => {
        const controller = createController();
        controller.setLocaleMenuOpen(true);

        controller.handleDocumentKeydown({key: 'Escape'});

        expect(controller.state.localeMenuOpen).toBe(false);
        expect(dependencies.view.setLocaleMenuOpen).toHaveBeenLastCalledWith(false);
        expect(dependencies.view.focusLocaleTrigger).toHaveBeenCalledOnce();
    });
});
