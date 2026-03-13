import { getCellText } from './table-data.js';
import { parseValueAndUnit } from './type-parser.js';

export function getVisibleNumericValues(table, columnIndex) {
    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) return [];

    const values = [];
    const rows = tbody.getElementsByTagName('tr');
    for (const row of rows) {
        if (row.hasAttribute('data-anytable-stats-row')) continue;
        if (row.style.display === 'none') continue;

        const text = getCellText(row, columnIndex);
        const parsed = parseValueAndUnit(text);
        if (parsed.success && !Number.isNaN(parsed.value)) {
            values.push(parsed.value);
        }
    }
    return values;
}

function getVisibleNonEmptyCount(table, columnIndex) {
    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) return 0;

    let count = 0;
    const rows = tbody.getElementsByTagName('tr');
    for (const row of rows) {
        if (row.hasAttribute('data-anytable-stats-row')) continue;
        if (row.style.display === 'none') continue;

        const text = getCellText(row, columnIndex);
        if (text !== '') count++;
    }
    return count;
}

export function calculateStatistic(values, statType) {
    const n = values.length;
    if (n === 0) return null;

    switch (statType) {
        case 'count':
            return n;
        case 'sum':
            return values.reduce((a, b) => a + b, 0);
        case 'average':
            return values.reduce((a, b) => a + b, 0) / n;
        case 'median': {
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(n / 2);
            return n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        }
        case 'min':
            return Math.min(...values);
        case 'max':
            return Math.max(...values);
        case 'range':
            return Math.max(...values) - Math.min(...values);
        case 'variance': {
            const mean = values.reduce((a, b) => a + b, 0) / n;
            return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
        }
        case 'stddev': {
            const avg = values.reduce((a, b) => a + b, 0) / n;
            const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / n;
            return Math.sqrt(variance);
        }
        default:
            return null;
    }
}

export function computeStatisticsData(rules, table) {
    // Returns Map<statType, Map<columnIndex, number|null>>
    const result = new Map();
    if (!rules || rules.length === 0) return result;

    // Group rules by statType
    const rulesByType = new Map();
    for (const rule of rules) {
        if (!rulesByType.has(rule.statType)) {
            rulesByType.set(rule.statType, []);
        }
        rulesByType.get(rule.statType).push(rule.column);
    }

    // Cache numeric values per column
    const numericCache = new Map();
    function getNumericValues(colIdx) {
        if (!numericCache.has(colIdx)) {
            numericCache.set(colIdx, getVisibleNumericValues(table, colIdx));
        }
        return numericCache.get(colIdx);
    }

    for (const [statType, columns] of rulesByType) {
        const columnResults = new Map();
        for (const colIdx of columns) {
            if (statType === 'count') {
                columnResults.set(colIdx, getVisibleNonEmptyCount(table, colIdx));
            } else {
                const values = getNumericValues(colIdx);
                columnResults.set(colIdx, calculateStatistic(values, statType));
            }
        }
        result.set(statType, columnResults);
    }

    return result;
}
