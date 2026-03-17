import { translate } from './panel-utils.js';

export function hasDuplicateStatisticsRules(rules) {
    const seen = new Set();
    for (const rule of rules) {
        const key = `${rule.column}:${rule.statType}`;
        if (seen.has(key)) {
            return true;
        }
        seen.add(key);
    }

    return false;
}

export function validateStatisticsRules(rules) {
    if (!Array.isArray(rules) || rules.length === 0) {
        return translate('advancedPanel.statistics.hint.needOneRule');
    }

    if (hasDuplicateStatisticsRules(rules)) {
        return translate('advancedPanel.statistics.hint.duplicateRule');
    }

    return null;
}
