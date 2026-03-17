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
