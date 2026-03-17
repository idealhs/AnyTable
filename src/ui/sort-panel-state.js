import { createPanelNodeId } from './advanced-panel-common.js';

export function createSortRule(rule = null, fallbackColumnIndex = 0) {
    return {
        id: createPanelNodeId('sort'),
        column: Number.isInteger(rule?.column) ? rule.column : fallbackColumnIndex,
        direction: rule?.direction === 'desc' ? 'desc' : 'asc',
        type: rule?.type || 'auto'
    };
}

export function normalizeSortRules(initialRules, fallbackColumnIndex = 0) {
    if (!Array.isArray(initialRules) || initialRules.length === 0) {
        return [createSortRule(null, fallbackColumnIndex)];
    }

    return initialRules.map((rule) => createSortRule(rule, fallbackColumnIndex));
}

export function getUsedSortColumns(rules) {
    return new Set(rules.map((rule) => rule.column));
}

export function getFirstUnusedSortColumn(rules, totalColumns, fallbackColumnIndex = 0) {
    const usedColumns = getUsedSortColumns(rules);
    for (let index = 0; index < totalColumns; index += 1) {
        if (!usedColumns.has(index)) {
            return index;
        }
    }

    return fallbackColumnIndex;
}
