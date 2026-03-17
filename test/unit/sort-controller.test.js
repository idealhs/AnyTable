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

describe('SortController', () => {
    let SortController;

    beforeEach(async () => {
        vi.resetModules();
        vi.doMock('../../src/i18n/i18n.js', () => ({
            default: {
                t: vi.fn((key) => key)
            }
        }));

        ({ SortController } = await import('../../src/controllers/sort-controller.js'));
    });

    it('enables multi-column mode when applying advanced sort rules with multiple columns', () => {
        const table = {};
        const stateStore = {
            setAdvancedSortRules: vi.fn(),
            setSortRules: vi.fn()
        };
        const controller = new SortController({
            enhancedTables: new Set([table]),
            stateStore,
            controlPanelManager: {
                getHeaderControl: vi.fn(() => null)
            },
            toolbar: {
                refreshActiveStates: vi.fn()
            },
            isMultiColumnSortEnabled: vi.fn(() => false),
            enableMultiColumnSort: vi.fn(),
            setSortButtonIcon: vi.fn()
        });

        const syncOriginalRowOrderSpy = vi.spyOn(controller, 'syncOriginalRowOrder').mockImplementation(() => {});
        const refreshSortButtonsSpy = vi.spyOn(controller, 'refreshSortButtons').mockImplementation(() => {});
        const applySortRulesSpy = vi.spyOn(controller, 'applySortRules').mockImplementation(() => {});
        const rules = [
            {column: 0, direction: 'asc', type: 'auto'},
            {column: 1, direction: 'desc', type: 'auto'}
        ];

        controller.applyAdvancedSort(table, rules);

        expect(controller.enableMultiColumnSort).toHaveBeenCalledTimes(1);
        expect(stateStore.setAdvancedSortRules).toHaveBeenCalledWith(table, [
            expect.objectContaining({column: 0, direction: 'asc', type: 'auto'}),
            expect.objectContaining({column: 1, direction: 'desc', type: 'auto'})
        ]);
        expect(syncOriginalRowOrderSpy).toHaveBeenCalledWith(table);
        expect(stateStore.setSortRules).toHaveBeenCalledWith(table, [
            expect.objectContaining({column: 0, direction: 'asc', type: 'auto'}),
            expect.objectContaining({column: 1, direction: 'desc', type: 'auto'})
        ]);
        expect(refreshSortButtonsSpy).toHaveBeenCalledWith(table);
        expect(controller.toolbar.refreshActiveStates).toHaveBeenCalledWith(table);
        expect(applySortRulesSpy).toHaveBeenCalledWith(table, [
            expect.objectContaining({column: 0, direction: 'asc', type: 'auto'}),
            expect.objectContaining({column: 1, direction: 'desc', type: 'auto'})
        ]);
    });

    it('computes the next single-column sort rule and clears advanced rules', () => {
        const table = mockTable({
            theadRows: [mockRow([mockCell('Name', {tagName: 'TH'})])],
            bodySections: [[mockRow([mockCell('Alice')])]]
        });
        table.classList = createClassList();

        const stateStore = {
            getSortRules: vi.fn(() => []),
            setSortRules: vi.fn(),
            setAdvancedSortRules: vi.fn()
        };
        const controller = new SortController({
            enhancedTables: new Set([table]),
            stateStore,
            controlPanelManager: {
                getHeaderControl: vi.fn(() => null)
            },
            toolbar: {
                refreshActiveStates: vi.fn()
            },
            isMultiColumnSortEnabled: vi.fn(() => false),
            enableMultiColumnSort: vi.fn(),
            setSortButtonIcon: vi.fn()
        });

        const syncOriginalRowOrderSpy = vi.spyOn(controller, 'syncOriginalRowOrder').mockImplementation(() => {});
        const refreshSortButtonsSpy = vi.spyOn(controller, 'refreshSortButtons').mockImplementation(() => {});
        const applySortRulesSpy = vi.spyOn(controller, 'applySortRules').mockImplementation(() => {});

        controller.sortTable(table, 0);

        expect(syncOriginalRowOrderSpy).toHaveBeenCalledWith(table);
        expect(stateStore.setSortRules).toHaveBeenCalledWith(table, [
            expect.objectContaining({column: 0, direction: 'asc', type: 'auto'})
        ]);
        expect(stateStore.setAdvancedSortRules).toHaveBeenCalledWith(table, []);
        expect(refreshSortButtonsSpy).toHaveBeenCalledWith(table);
        expect(controller.toolbar.refreshActiveStates).toHaveBeenCalledWith(table);
        expect(applySortRulesSpy).toHaveBeenCalledWith(table, [
            expect.objectContaining({column: 0, direction: 'asc', type: 'auto'})
        ]);
    });
});
