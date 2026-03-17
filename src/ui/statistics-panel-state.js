import { createPanelNodeId } from './advanced-panel-common.js';

export function createStatisticsRule(rule = null, fallbackColumnIndex = 0) {
    return {
        id: createPanelNodeId('stats'),
        column: Number.isInteger(rule?.column) ? rule.column : fallbackColumnIndex,
        statType: rule?.statType || 'count'
    };
}

export function normalizeStatisticsRules(initialRules, fallbackColumnIndex = 0) {
    if (!Array.isArray(initialRules) || initialRules.length === 0) {
        return [createStatisticsRule(null, fallbackColumnIndex)];
    }

    return initialRules.map((rule) => createStatisticsRule(rule, fallbackColumnIndex));
}
