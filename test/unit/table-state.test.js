import { describe, expect, it } from 'vitest';
import { TableStateStore } from '../../src/state/table-state.js';

describe('TableStateStore', () => {
    it('returns default values for unknown tables and initializes missing state once', () => {
        const store = new TableStateStore();
        const table = {};
        const originalRowOrder = { rows: [1, 2, 3] };

        expect(store.getSortRules(table)).toEqual([]);
        expect(store.getOriginalRowOrder(table)).toBe(null);
        expect(store.getFilterValues(table)).toEqual({});
        expect(store.getAdvancedFilterRules(table)).toBe(null);
        expect(store.getAdvancedSortRules(table)).toEqual([]);
        expect(store.getStatisticsRules(table)).toEqual([]);

        store.initTable(table, originalRowOrder);
        expect(store.getSortRules(table)).toEqual([]);
        expect(store.getOriginalRowOrder(table)).toBe(originalRowOrder);
        expect(store.getFilterValues(table)).toEqual({});

        store.setSortRules(table, [{ column: 0, direction: 'asc' }]);
        store.setFilterValues(table, { 0: 'alice' });
        store.initTable(table, { rows: ['should-not-overwrite'] });

        expect(store.getSortRules(table)).toEqual([{ column: 0, direction: 'asc' }]);
        expect(store.getOriginalRowOrder(table)).toBe(originalRowOrder);
        expect(store.getFilterValues(table)).toEqual({ 0: 'alice' });
    });

    it('clones mutable inputs, supports per-table updates, and clears all state', () => {
        const store = new TableStateStore();
        const table = {};
        const sortRules = [{ column: 1, direction: 'desc' }];
        const filterValues = { 1: 'bob' };
        const advancedFilterRules = { children: [{ column: 1, comparator: 'contains', value: 'bob' }] };
        const advancedSortRules = [{ column: 2, direction: 'asc' }];
        const statisticsRules = [{ column: 1, statType: 'count' }];
        const rowOrderState = { nextOrder: 10 };

        store.setSortRules(table, sortRules);
        store.setOriginalRowOrder(table, rowOrderState);
        store.setFilterValues(table, filterValues);
        store.setAdvancedFilterRules(table, advancedFilterRules);
        store.setAdvancedSortRules(table, advancedSortRules);
        store.setStatisticsRules(table, statisticsRules);

        sortRules.push({ column: 99, direction: 'asc' });
        filterValues[2] = 'mutated';
        advancedSortRules.push({ column: 3, direction: 'desc' });
        statisticsRules.push({ column: 3, statType: 'sum' });

        expect(store.getSortRules(table)).toEqual([{ column: 1, direction: 'desc' }]);
        expect(store.getOriginalRowOrder(table)).toBe(rowOrderState);
        expect(store.getFilterValues(table)).toEqual({ 1: 'bob' });
        expect(store.getAdvancedFilterRules(table)).toBe(advancedFilterRules);
        expect(store.getAdvancedSortRules(table)).toEqual([{ column: 2, direction: 'asc' }]);
        expect(store.getStatisticsRules(table)).toEqual([{ column: 1, statType: 'count' }]);

        const updatedFilters = store.setFilterValue(table, 2, 'carol');
        expect(updatedFilters).toEqual({ 1: 'bob', 2: 'carol' });
        expect(store.getFilterValues(table)).toEqual({ 1: 'bob', 2: 'carol' });

        store.clearTable(table);

        expect(store.getSortRules(table)).toEqual([]);
        expect(store.getOriginalRowOrder(table)).toBe(null);
        expect(store.getFilterValues(table)).toEqual({});
        expect(store.getAdvancedFilterRules(table)).toBe(null);
        expect(store.getAdvancedSortRules(table)).toEqual([]);
        expect(store.getStatisticsRules(table)).toEqual([]);
    });

    it('normalizes invalid setter input to empty state', () => {
        const store = new TableStateStore();
        const table = {};

        store.setSortRules(table, null);
        store.setOriginalRowOrder(table, null);
        store.setFilterValues(table, null);
        store.setAdvancedFilterRules(table, null);
        store.setAdvancedSortRules(table, null);
        store.setStatisticsRules(table, null);

        expect(store.getSortRules(table)).toEqual([]);
        expect(store.getOriginalRowOrder(table)).toBe(null);
        expect(store.getFilterValues(table)).toEqual({});
        expect(store.getAdvancedFilterRules(table)).toBe(null);
        expect(store.getAdvancedSortRules(table)).toEqual([]);
        expect(store.getStatisticsRules(table)).toEqual([]);
    });
});
