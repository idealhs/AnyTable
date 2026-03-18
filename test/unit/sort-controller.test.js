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

    function createController(overrides = {}) {
        const defaultStateStore = {
            getSortRules: vi.fn(() => []),
            setSortRules: vi.fn(),
            setAdvancedSortRules: vi.fn(),
            getOriginalRowOrder: vi.fn(() => null),
            setOriginalRowOrder: vi.fn()
        };
        const defaultControlPanelManager = {
            getHeaderControl: vi.fn(() => null)
        };
        const defaultToolbar = {
            refreshActiveStates: vi.fn()
        };

        return new SortController({
            enhancedTables: new Set(),
            stateStore: {
                ...defaultStateStore,
                ...(overrides.stateStore || {})
            },
            controlPanelManager: {
                ...defaultControlPanelManager,
                ...(overrides.controlPanelManager || {})
            },
            toolbar: {
                ...defaultToolbar,
                ...(overrides.toolbar || {})
            },
            isMultiColumnSortEnabled: vi.fn(() => false),
            enableMultiColumnSort: vi.fn(),
            setSortButtonIcon: vi.fn(),
            ...overrides
        });
    }

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

    it('refreshes header sort buttons with priority only in multi-column mode', () => {
        const table = mockTable({
            theadRows: [mockRow([
                mockCell('Name', {tagName: 'TH'}),
                mockCell('Score', {tagName: 'TH'}),
                mockCell('City', {tagName: 'TH'})
            ])]
        });
        const controller = createController({
            stateStore: {
                getSortRules: vi.fn(() => [
                    {column: 1, direction: 'asc', type: 'number'},
                    {column: 0, direction: 'desc', type: 'text'}
                ])
            },
            isMultiColumnSortEnabled: vi.fn(() => true)
        });
        const updateSortButtonSpy = vi.spyOn(controller, 'updateSortButton').mockImplementation(() => {});

        controller.refreshSortButtons(table);

        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(1, table, 0, 'desc', 2);
        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(2, table, 1, 'asc', 1);
        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(3, table, 2, 'none', null);

        updateSortButtonSpy.mockClear();
        controller.isMultiColumnSortEnabled = vi.fn(() => false);

        controller.refreshSortButtons(table);

        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(1, table, 0, 'desc', null);
        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(2, table, 1, 'asc', null);
        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(3, table, 2, 'none', null);
    });

    it('refreshes sort buttons by logical column count when physical headers use colspan', () => {
        const table = mockTable({
            theadRows: [mockRow([
                mockCell('姓名', {tagName: 'TH', colSpan: 2}),
                mockCell('绩效', {tagName: 'TH'}),
                mockCell('城市', {tagName: 'TH'})
            ])],
            bodySections: [[
                mockRow([mockCell('张'), mockCell('三'), mockCell('88'), mockCell('上海')])
            ]]
        });
        const controller = createController({
            stateStore: {
                getSortRules: vi.fn(() => [
                    {column: 3, direction: 'desc', type: 'text'}
                ])
            }
        });
        const updateSortButtonSpy = vi.spyOn(controller, 'updateSortButton').mockImplementation(() => {});

        controller.refreshSortButtons(table);

        expect(updateSortButtonSpy).toHaveBeenCalledTimes(4);
        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(1, table, 0, 'none', null);
        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(2, table, 1, 'none', null);
        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(3, table, 2, 'none', null);
        expect(updateSortButtonSpy).toHaveBeenNthCalledWith(4, table, 3, 'desc', null);
    });

    it('updates sort button icon, class, and localized title when a header control exists', () => {
        const sortButton = {
            classList: createClassList(),
            title: ''
        };
        const table = {};
        const controller = createController({
            controlPanelManager: {
                getHeaderControl: vi.fn(() => ({sortButton}))
            }
        });

        controller.updateSortButton(table, 0, 'asc', 2);
        expect(controller.setSortButtonIcon).toHaveBeenLastCalledWith(sortButton, 'asc', 2);
        expect(sortButton.classList.contains('sort-asc')).toBe(true);
        expect(sortButton.title).toBe('columnControl.sort.ascending');

        controller.updateSortButton(table, 0, 'desc');
        expect(sortButton.classList.contains('sort-desc')).toBe(true);
        expect(sortButton.title).toBe('columnControl.sort.descending');

        controller.updateSortButton(table, 0, 'none');
        expect(sortButton.classList.contains('sort-none')).toBe(true);
        expect(sortButton.title).toBe('columnControl.sort.none');
    });

    it('syncs original row order only for enhanced tables', () => {
        const enhancedTable = mockTable({
            theadRows: [mockRow([mockCell('Name', {tagName: 'TH'})])],
            bodySections: [[mockRow([mockCell('Alice')])]]
        });
        const plainTable = {};
        const stateStore = {
            getSortRules: vi.fn(() => []),
            setSortRules: vi.fn(),
            setAdvancedSortRules: vi.fn(),
            getOriginalRowOrder: vi.fn(() => null),
            setOriginalRowOrder: vi.fn()
        };
        const controller = createController({
            enhancedTables: new Set([enhancedTable]),
            stateStore
        });

        controller.syncOriginalRowOrder(plainTable);
        controller.syncOriginalRowOrder(enhancedTable);

        expect(stateStore.setOriginalRowOrder).toHaveBeenCalledTimes(1);
        expect(stateStore.setOriginalRowOrder).toHaveBeenCalledWith(
            enhancedTable,
            expect.objectContaining({
                nextOrder: expect.any(Number),
                rowOrder: expect.any(WeakMap)
            })
        );
    });

    it('returns early when applying sort rules to a table without processable rows', () => {
        const table = mockTable({
            theadRows: [mockRow([mockCell('Name', {tagName: 'TH'})])],
            bodySections: [[]]
        });
        const controller = createController();

        controller.applySortRules(table, []);

        expect(controller.stateStore.setOriginalRowOrder).not.toHaveBeenCalled();
    });

    it('restores original row order and reinserts statistics rows before the first data row', () => {
        const statsRow = mockRow([mockCell('stats')], {isStats: true});
        const rowA = mockRow([mockCell('Alice')]);
        const rowB = mockRow([mockCell('Bob')]);
        const table = mockTable({
            theadRows: [mockRow([mockCell('Name', {tagName: 'TH'})])],
            bodySections: [[statsRow, rowB, rowA]]
        });
        const controller = createController();
        const tbody = table.getElementsByTagName('tbody')[0];

        controller.applySortRules(table, []);

        expect(controller.stateStore.setOriginalRowOrder).toHaveBeenCalledTimes(1);
        expect(tbody._rows[0]).toBe(statsRow);
        expect(tbody._rows.slice(1).map((row) => row.cells[0].textContent)).toEqual(['Bob', 'Alice']);
    });

    it('appends statistics rows back when the primary tbody has no current-table data rows', () => {
        const statsRow = mockRow([mockCell('stats')], {isStats: true});
        const dataRow = mockRow([mockCell('Alice')]);
        const table = mockTable({
            theadRows: [mockRow([mockCell('Name', {tagName: 'TH'})])],
            bodySections: [
                [statsRow],
                [dataRow]
            ]
        });
        const controller = createController();
        const firstTbody = table.getElementsByTagName('tbody')[0];
        const secondTbody = table.getElementsByTagName('tbody')[1];

        controller.applySortRules(table, []);

        expect(firstTbody._rows.at(-1)).toBe(statsRow);
        expect(secondTbody._rows[0]).toBe(dataRow);
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

    it('skips sorting when the table has no processable rows', () => {
        const table = mockTable({
            theadRows: [mockRow([mockCell('Name', {tagName: 'TH'})])],
            bodySections: [[]]
        });
        const controller = createController({
            enhancedTables: new Set([table])
        });
        const syncOriginalRowOrderSpy = vi.spyOn(controller, 'syncOriginalRowOrder').mockImplementation(() => {});
        const refreshSortButtonsSpy = vi.spyOn(controller, 'refreshSortButtons').mockImplementation(() => {});
        const applySortRulesSpy = vi.spyOn(controller, 'applySortRules').mockImplementation(() => {});

        controller.sortTable(table, 0);

        expect(syncOriginalRowOrderSpy).not.toHaveBeenCalled();
        expect(controller.stateStore.setSortRules).not.toHaveBeenCalled();
        expect(controller.stateStore.setAdvancedSortRules).not.toHaveBeenCalled();
        expect(refreshSortButtonsSpy).not.toHaveBeenCalled();
        expect(applySortRulesSpy).not.toHaveBeenCalled();
    });
});
