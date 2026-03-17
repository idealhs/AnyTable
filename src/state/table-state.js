export class TableStateStore {
    constructor() {
        this.sortRulesByTable = new WeakMap();
        this.originalRowOrderByTable = new WeakMap();
        this.filterValuesByTable = new WeakMap();
        this.advancedFilterRulesByTable = new WeakMap();
        this.advancedSortRulesByTable = new WeakMap();
        this.statisticsRulesByTable = new WeakMap();
    }

    initTable(table, originalRowOrder = null) {
        if (!this.sortRulesByTable.has(table)) {
            this.sortRulesByTable.set(table, []);
        }
        if (!this.originalRowOrderByTable.has(table)) {
            this.originalRowOrderByTable.set(table, originalRowOrder || null);
        }
        if (!this.filterValuesByTable.has(table)) {
            this.filterValuesByTable.set(table, {});
        }
    }

    clearTable(table) {
        this.sortRulesByTable.delete(table);
        this.originalRowOrderByTable.delete(table);
        this.filterValuesByTable.delete(table);
        this.advancedFilterRulesByTable.delete(table);
        this.advancedSortRulesByTable.delete(table);
        this.statisticsRulesByTable.delete(table);
    }

    getSortRules(table) {
        return this.sortRulesByTable.get(table) || [];
    }

    setSortRules(table, rules) {
        this.sortRulesByTable.set(table, Array.isArray(rules) ? [...rules] : []);
    }

    getOriginalRowOrder(table) {
        return this.originalRowOrderByTable.get(table) || null;
    }

    setOriginalRowOrder(table, rowOrderState) {
        this.originalRowOrderByTable.set(table, rowOrderState || null);
    }

    getFilterValues(table) {
        return this.filterValuesByTable.get(table) || {};
    }

    setFilterValues(table, filterValues) {
        this.filterValuesByTable.set(table, {...(filterValues || {})});
    }

    setFilterValue(table, columnIndex, filterText) {
        const currentFilterValues = this.getFilterValues(table);
        currentFilterValues[columnIndex] = filterText;
        this.filterValuesByTable.set(table, currentFilterValues);
        return currentFilterValues;
    }

    getAdvancedFilterRules(table) {
        return this.advancedFilterRulesByTable.get(table) || null;
    }

    setAdvancedFilterRules(table, ruleGroup) {
        this.advancedFilterRulesByTable.set(table, ruleGroup || null);
    }

    getAdvancedSortRules(table) {
        return this.advancedSortRulesByTable.get(table) || [];
    }

    setAdvancedSortRules(table, sortRules) {
        this.advancedSortRulesByTable.set(table, Array.isArray(sortRules) ? [...sortRules] : []);
    }

    getStatisticsRules(table) {
        return this.statisticsRulesByTable.get(table) || [];
    }

    setStatisticsRules(table, rules) {
        this.statisticsRulesByTable.set(table, Array.isArray(rules) ? [...rules] : []);
    }
}
