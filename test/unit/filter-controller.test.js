import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCell, mockRow, mockTable } from './helpers/mock-table.js';

describe('FilterController', () => {
    let FilterController;
    let applyCombinedFiltersMock;
    let computeStatisticsDataMock;
    let renderStatisticsRowsMock;
    let removeStatisticsRowsMock;
    let getTableColumnCountMock;

    beforeEach(async () => {
        vi.resetModules();
        applyCombinedFiltersMock = vi.fn();
        computeStatisticsDataMock = vi.fn(() => [{label: 'sum', value: 10}]);
        renderStatisticsRowsMock = vi.fn();
        removeStatisticsRowsMock = vi.fn();
        getTableColumnCountMock = vi.fn(() => 3);

        vi.doMock('../../src/core/filter-engine.js', () => ({
            applyCombinedFilters: applyCombinedFiltersMock
        }));
        vi.doMock('../../src/core/statistics-engine.js', () => ({
            computeStatisticsData: computeStatisticsDataMock
        }));
        vi.doMock('../../src/core/table-structure.js', () => ({
            getTableColumnCount: getTableColumnCountMock
        }));
        vi.doMock('../../src/ui/statistics-renderer.js', () => ({
            renderStatisticsRows: renderStatisticsRowsMock,
            removeStatisticsRows: removeStatisticsRowsMock
        }));

        ({ FilterController } = await import('../../src/controllers/filter-controller.js'));
    });

    it('clears basic filters before applying an advanced filter rule group', () => {
        const table = {};
        const stateStore = {
            setFilterValues: vi.fn(),
            setAdvancedFilterRules: vi.fn()
        };
        const controlPanelManager = {
            syncFilterInputValues: vi.fn()
        };
        const controller = new FilterController({
            stateStore,
            controlPanelManager,
            toolbar: {
                refreshActiveStates: vi.fn()
            }
        });
        const applyAllFiltersSpy = vi.spyOn(controller, 'applyAllFilters').mockImplementation(() => {});
        const ruleGroup = {id: 'group-1', children: []};

        controller.applyAdvancedFilterRuleGroup(table, ruleGroup);

        expect(stateStore.setFilterValues).toHaveBeenCalledWith(table, {});
        expect(controlPanelManager.syncFilterInputValues).toHaveBeenCalledWith(table, {});
        expect(stateStore.setAdvancedFilterRules).toHaveBeenCalledWith(table, ruleGroup);
        expect(applyAllFiltersSpy).toHaveBeenCalledWith(table);
    });

    it('updates filter state and reapplies filters when the table has processable rows', () => {
        const table = mockTable({
            theadRows: [mockRow([mockCell('Name', {tagName: 'TH'})])],
            bodySections: [[mockRow([mockCell('Alice')])]]
        });
        const stateStore = {
            setFilterValue: vi.fn()
        };
        const controller = new FilterController({
            stateStore,
            controlPanelManager: {
                refreshFilterButtons: vi.fn(),
                setFilterInputsDisabledState: vi.fn()
            },
            toolbar: {
                refreshActiveStates: vi.fn()
            }
        });
        const applyAllFiltersSpy = vi.spyOn(controller, 'applyAllFilters').mockImplementation(() => {});

        controller.filterTable(table, 0, 'ali');

        expect(stateStore.setFilterValue).toHaveBeenCalledWith(table, 0, 'ali');
        expect(applyAllFiltersSpy).toHaveBeenCalledWith(table);
    });

    it('applies combined filters and refreshes dependent UI state', () => {
        const table = {};
        const advancedRuleGroup = {id: 'group-1', children: []};
        const stateStore = {
            getFilterValues: vi.fn(() => ({0: 'Alice'})),
            getAdvancedFilterRules: vi.fn(() => advancedRuleGroup),
            getStatisticsRules: vi.fn(() => [{column: 1, operation: 'count'}])
        };
        const controlPanelManager = {
            refreshFilterButtons: vi.fn(),
            setFilterInputsDisabledState: vi.fn()
        };
        const toolbar = {
            refreshActiveStates: vi.fn()
        };
        const controller = new FilterController({
            stateStore,
            controlPanelManager,
            toolbar
        });

        controller.applyAllFilters(table);

        expect(applyCombinedFiltersMock).toHaveBeenCalledWith(table, {0: 'Alice'}, advancedRuleGroup);
        expect(controlPanelManager.setFilterInputsDisabledState).toHaveBeenCalledWith(table, true);
        expect(controlPanelManager.refreshFilterButtons).toHaveBeenCalledWith(table);
        expect(toolbar.refreshActiveStates).toHaveBeenCalledWith(table);
        expect(computeStatisticsDataMock).toHaveBeenCalledWith([{column: 1, operation: 'count'}], table);
    });

    it('toggles filter input disabled state based on whether advanced rules exist', () => {
        const table = {};
        const stateStore = {
            getAdvancedFilterRules: vi.fn()
        };
        const controlPanelManager = {
            setFilterInputsDisabledState: vi.fn()
        };
        const controller = new FilterController({
            stateStore,
            controlPanelManager,
            toolbar: {
                refreshActiveStates: vi.fn()
            }
        });

        stateStore.getAdvancedFilterRules.mockReturnValueOnce(null);
        controller.updateFilterInputsDisabledState(table);

        stateStore.getAdvancedFilterRules.mockReturnValueOnce({id: 'group-2', children: []});
        controller.updateFilterInputsDisabledState(table);

        expect(controlPanelManager.setFilterInputsDisabledState).toHaveBeenNthCalledWith(1, table, false);
        expect(controlPanelManager.setFilterInputsDisabledState).toHaveBeenNthCalledWith(2, table, true);
    });

    it('skips filtering when the table has no processable rows', () => {
        const table = mockTable({
            theadRows: [mockRow([mockCell('Name', {tagName: 'TH'})])],
            bodySections: [[]]
        });
        const stateStore = {
            setFilterValue: vi.fn()
        };
        const controller = new FilterController({
            stateStore,
            controlPanelManager: {
                refreshFilterButtons: vi.fn(),
                setFilterInputsDisabledState: vi.fn()
            },
            toolbar: {
                refreshActiveStates: vi.fn()
            }
        });
        const applyAllFiltersSpy = vi.spyOn(controller, 'applyAllFilters').mockImplementation(() => {});

        controller.filterTable(table, 0, 'ali');

        expect(stateStore.setFilterValue).not.toHaveBeenCalled();
        expect(applyAllFiltersSpy).not.toHaveBeenCalled();
    });

    it('stores statistics rules and refreshes toolbar plus statistics rows', () => {
        const table = {};
        const stateStore = {
            setStatisticsRules: vi.fn()
        };
        const toolbar = {
            refreshActiveStates: vi.fn()
        };
        const controller = new FilterController({
            stateStore,
            controlPanelManager: {
                refreshFilterButtons: vi.fn(),
                setFilterInputsDisabledState: vi.fn()
            },
            toolbar
        });
        const refreshStatisticsSpy = vi.spyOn(controller, 'refreshStatistics').mockImplementation(() => {});
        const rules = [{column: 0, operation: 'sum'}];

        controller.applyStatistics(table, rules);

        expect(stateStore.setStatisticsRules).toHaveBeenCalledWith(table, rules);
        expect(toolbar.refreshActiveStates).toHaveBeenCalledWith(table);
        expect(refreshStatisticsSpy).toHaveBeenCalledWith(table);
    });

    it('renders statistics rows using the shared table column model', () => {
        const table = {};
        const stateStore = {
            getStatisticsRules: vi.fn(() => [{column: 1, operation: 'sum'}])
        };
        const controller = new FilterController({
            stateStore,
            controlPanelManager: {
                refreshFilterButtons: vi.fn(),
                setFilterInputsDisabledState: vi.fn()
            },
            toolbar: {
                refreshActiveStates: vi.fn()
            }
        });

        controller.refreshStatistics(table);

        expect(computeStatisticsDataMock).toHaveBeenCalledWith([{column: 1, operation: 'sum'}], table);
        expect(getTableColumnCountMock).toHaveBeenCalledWith(table);
        expect(renderStatisticsRowsMock).toHaveBeenCalledWith(table, [{label: 'sum', value: 10}], 3);
        expect(removeStatisticsRowsMock).not.toHaveBeenCalled();
    });

    it('removes statistics rows when no statistics rules are configured', () => {
        const table = {};
        const controller = new FilterController({
            stateStore: {
                getStatisticsRules: vi.fn(() => [])
            },
            controlPanelManager: {
                refreshFilterButtons: vi.fn(),
                setFilterInputsDisabledState: vi.fn()
            },
            toolbar: {
                refreshActiveStates: vi.fn()
            }
        });

        controller.refreshStatistics(table);

        expect(removeStatisticsRowsMock).toHaveBeenCalledWith(table);
        expect(renderStatisticsRowsMock).not.toHaveBeenCalled();
    });
});
