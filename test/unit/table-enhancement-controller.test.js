import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCell, mockRow, mockTable } from './helpers/mock-table.js';

function createClassList() {
    const classes = new Set();
    return {
        add: (...tokens) => tokens.forEach((token) => classes.add(token)),
        remove: (...tokens) => tokens.forEach((token) => classes.delete(token)),
        contains: (token) => classes.has(token)
    };
}

function createTable() {
    const table = mockTable({
        theadRows: [mockRow([mockCell('Name', {tagName: 'TH'})])],
        bodySections: [[mockRow([mockCell('Alice')])]]
    });
    table.classList = createClassList();
    return table;
}

describe('TableEnhancementController', () => {
    let TableEnhancementController;
    let isLikelyDataTableMock;
    let removeStatisticsRowsMock;

    beforeEach(async () => {
        vi.resetModules();
        isLikelyDataTableMock = vi.fn((table) => table.shouldAutoEnhance === true);
        removeStatisticsRowsMock = vi.fn();

        vi.doMock('../../src/core/table-detector.js', () => ({
            isLikelyDataTable: isLikelyDataTableMock
        }));
        vi.doMock('../../src/ui/statistics-renderer.js', () => ({
            removeStatisticsRows: removeStatisticsRowsMock
        }));

        ({ TableEnhancementController } = await import('../../src/controllers/table-enhancement-controller.js'));
    });

    it('enhances a table by initializing state, controls, and toolbar', () => {
        const table = createTable();
        const stateStore = {
            setOriginalRowOrder: vi.fn(),
            setSortRules: vi.fn()
        };
        const controlPanelManager = {
            attachTableControls: vi.fn()
        };
        const toolbar = {
            createToolbar: vi.fn()
        };
        const enhancedTables = new Set();
        const controller = new TableEnhancementController({
            enhancedTables,
            stateStore,
            controlPanelManager,
            toolbar,
            syncTablePresentation: vi.fn()
        });

        controller.enhanceTable(table);

        expect(stateStore.setOriginalRowOrder).toHaveBeenCalledTimes(1);
        expect(stateStore.setOriginalRowOrder.mock.calls[0][0]).toBe(table);
        expect(stateStore.setOriginalRowOrder.mock.calls[0][1]).not.toBeNull();
        expect(stateStore.setSortRules).toHaveBeenCalledWith(table, []);
        expect(controlPanelManager.attachTableControls).toHaveBeenCalledWith(table);
        expect(toolbar.createToolbar).toHaveBeenCalledWith(table);
        expect(enhancedTables.has(table)).toBe(true);
        expect(table.classList.contains('anytable-enhanced')).toBe(true);
    });

    it('removes toolbar, controls, statistics, and table state during cleanup', () => {
        const table = createTable();
        table.classList.add('anytable-enhanced');

        const stateStore = {
            clearTable: vi.fn()
        };
        const controlPanelManager = {
            removeTableControls: vi.fn()
        };
        const toolbar = {
            removeToolbar: vi.fn()
        };
        const enhancedTables = new Set([table]);
        const controller = new TableEnhancementController({
            enhancedTables,
            stateStore,
            controlPanelManager,
            toolbar,
            syncTablePresentation: vi.fn()
        });

        controller.removeEnhancement(table);

        expect(toolbar.removeToolbar).toHaveBeenCalledWith(table);
        expect(controlPanelManager.removeTableControls).toHaveBeenCalledWith(table);
        expect(removeStatisticsRowsMock).toHaveBeenCalledWith(table);
        expect(stateStore.clearTable).toHaveBeenCalledWith(table);
        expect(enhancedTables.has(table)).toBe(false);
        expect(table.classList.contains('anytable-enhanced')).toBe(false);
    });

    it('auto-enhances only the tables accepted by the detector', () => {
        const acceptedTable = {shouldAutoEnhance: true};
        const rejectedTable = {shouldAutoEnhance: false};
        const controller = new TableEnhancementController({
            enhancedTables: new Set(),
            stateStore: {
                setOriginalRowOrder: vi.fn(),
                setSortRules: vi.fn()
            },
            controlPanelManager: {
                attachTableControls: vi.fn()
            },
            toolbar: {
                createToolbar: vi.fn()
            },
            syncTablePresentation: vi.fn()
        });
        const enhanceTableSpy = vi.spyOn(controller, 'enhanceTable').mockImplementation(() => {});

        controller.autoEnhanceTables([acceptedTable, rejectedTable]);

        expect(isLikelyDataTableMock).toHaveBeenCalledWith(acceptedTable);
        expect(isLikelyDataTableMock).toHaveBeenCalledWith(rejectedTable);
        expect(enhanceTableSpy).toHaveBeenCalledTimes(1);
        expect(enhanceTableSpy).toHaveBeenCalledWith(acceptedTable);
    });

    it('rehydrates toolbar and replays presentation sync for moved enhanced tables', () => {
        const table = createTable();
        const syncTablePresentation = vi.fn();
        const toolbar = {
            recreateToolbar: vi.fn()
        };
        const controller = new TableEnhancementController({
            enhancedTables: new Set([table]),
            stateStore: {
                clearTable: vi.fn()
            },
            controlPanelManager: {
                removeTableControls: vi.fn()
            },
            toolbar,
            syncTablePresentation
        });

        controller.rehydrateTableUi(table);

        expect(toolbar.recreateToolbar).toHaveBeenCalledWith(table);
        expect(syncTablePresentation).toHaveBeenCalledWith(table);
    });
});
