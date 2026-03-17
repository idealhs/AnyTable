import { applyCombinedFilters } from '../core/filter-engine.js';
import { computeStatisticsData } from '../core/statistics-engine.js';
import { buildTableModel } from '../core/table-model.js';
import { getTableColumnCount } from '../core/table-structure.js';
import { renderStatisticsRows, removeStatisticsRows } from '../ui/statistics-renderer.js';

function hasProcessableRows(table) {
    return buildTableModel(table).bodyRows.length > 0;
}

export class FilterController {
    constructor({ stateStore, controlPanelManager, toolbar }) {
        this.stateStore = stateStore;
        this.controlPanelManager = controlPanelManager;
        this.toolbar = toolbar;
    }

    applyAllFilters(table) {
        const filterValues = this.stateStore.getFilterValues(table);
        const advancedRuleGroup = this.stateStore.getAdvancedFilterRules(table);
        applyCombinedFilters(table, filterValues, advancedRuleGroup);
        this.updateFilterInputsDisabledState(table);
        this.controlPanelManager.refreshFilterButtons(table);
        this.toolbar.refreshActiveStates(table);
        this.refreshStatistics(table);
    }

    applyAdvancedFilterRuleGroup(table, ruleGroup) {
        this.stateStore.setFilterValues(table, {});
        this.controlPanelManager.syncFilterInputValues(table, {});
        this.stateStore.setAdvancedFilterRules(table, ruleGroup);
        this.applyAllFilters(table);
    }

    updateFilterInputsDisabledState(table) {
        const hasAdvanced = this.stateStore.getAdvancedFilterRules(table) !== null;
        this.controlPanelManager.setFilterInputsDisabledState(table, hasAdvanced);
    }

    filterTable(table, columnIndex, filterText) {
        if (!hasProcessableRows(table)) {
            return;
        }

        this.stateStore.setFilterValue(table, columnIndex, filterText);
        this.applyAllFilters(table);
    }

    applyStatistics(table, rules) {
        this.stateStore.setStatisticsRules(table, rules);
        this.toolbar.refreshActiveStates(table);
        this.refreshStatistics(table);
    }

    refreshStatistics(table) {
        const rules = this.stateStore.getStatisticsRules(table);
        if (!rules || rules.length === 0) {
            removeStatisticsRows(table);
            return;
        }

        const statsData = computeStatisticsData(rules, table);
        renderStatisticsRows(table, statsData, getTableColumnCount(table));
    }
}
