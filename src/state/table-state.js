export class TableStateStore {
    constructor() {
        this.sortRulesByTable = new Map();
        this.originalRowsByTable = new Map();
        this.filterValuesByTable = new Map();
        this.advancedFilterRulesByTable = new Map();
        this.advancedSortRulesByTable = new Map();
    }

    initTable(table, originalRows = []) {
        if (!this.sortRulesByTable.has(table)) {
            this.sortRulesByTable.set(table, []);
        }
        if (!this.originalRowsByTable.has(table)) {
            this.originalRowsByTable.set(table, [...originalRows]);
        }
        if (!this.filterValuesByTable.has(table)) {
            this.filterValuesByTable.set(table, {});
        }
    }

    clearTable(table) {
        this.sortRulesByTable.delete(table);
        this.originalRowsByTable.delete(table);
        this.filterValuesByTable.delete(table);
        this.advancedFilterRulesByTable.delete(table);
        this.advancedSortRulesByTable.delete(table);
    }

    getSortRules(table) {
        return this.sortRulesByTable.get(table) || [];
    }

    setSortRules(table, rules) {
        this.sortRulesByTable.set(table, Array.isArray(rules) ? [...rules] : []);
    }

    getOriginalRows(table) {
        return this.originalRowsByTable.get(table) || [];
    }

    setOriginalRows(table, rows) {
        this.originalRowsByTable.set(table, Array.isArray(rows) ? [...rows] : []);
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
}

