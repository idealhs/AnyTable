import { parseNumberWithUnit } from './type-parser.js';

function normalizeValue(value) {
    return (value ?? '').toString().trim();
}

function parseByType(value, type) {
    const normalized = normalizeValue(value);

    if (type === 'text') {
        return {
            success: true,
            value: normalized,
            kind: 'text'
        };
    }

    if (type === 'number') {
        const parsed = Number(normalized.replace(/,/g, ''));
        return {
            success: !Number.isNaN(parsed),
            value: parsed,
            kind: 'number'
        };
    }

    if (type === 'date') {
        const timestamp = Date.parse(normalized);
        return {
            success: !Number.isNaN(timestamp),
            value: timestamp,
            kind: 'date'
        };
    }

    return parseNumberWithUnit(normalized);
}

function parseWithCustomUnitConfig(value, unitConfig) {
    const normalized = normalizeValue(value);
    const match = normalized.match(/^([-+]?\d*\.?\d+)\s*([^\d\s]+)$/);
    if (!match) {
        return {
            success: false,
            value: NaN,
            kind: 'custom-unit'
        };
    }

    const numberValue = Number(match[1]);
    if (Number.isNaN(numberValue)) {
        return {
            success: false,
            value: NaN,
            kind: 'custom-unit'
        };
    }

    const unit = match[2].toLowerCase();
    const mapping = unitConfig?.mapping || {};
    const factor = mapping[unit];
    if (typeof factor !== 'number') {
        return {
            success: false,
            value: NaN,
            kind: 'custom-unit'
        };
    }

    return {
        success: true,
        value: numberValue * factor,
        kind: 'custom-unit'
    };
}

function compareValues(aValue, bValue, rule) {
    const type = rule?.type || 'text';

    if (type === 'text') {
        return aValue.localeCompare(bValue);
    }

    if (type === 'custom' && rule?.unitConfig) {
        const parsedA = parseWithCustomUnitConfig(aValue, rule.unitConfig);
        const parsedB = parseWithCustomUnitConfig(bValue, rule.unitConfig);
        if (parsedA.success && parsedB.success && parsedA.value !== parsedB.value) {
            return parsedA.value - parsedB.value;
        }
    }

    if (type === 'number' || type === 'date') {
        const parsedA = parseByType(aValue, type);
        const parsedB = parseByType(bValue, type);
        if (parsedA.success && parsedB.success && parsedA.value !== parsedB.value) {
            return parsedA.value - parsedB.value;
        }
    }

    const parsedA = parseNumberWithUnit(aValue);
    const parsedB = parseNumberWithUnit(bValue);

    if (parsedA.success && parsedB.success) {
        if (parsedA.value !== parsedB.value) {
            return parsedA.value - parsedB.value;
        }
    }

    const fallbackA = parseFloat(aValue);
    const fallbackB = parseFloat(bValue);
    if (!Number.isNaN(fallbackA) && !Number.isNaN(fallbackB)) {
        if (fallbackA !== fallbackB) {
            return fallbackA - fallbackB;
        }
    }

    return aValue.localeCompare(bValue);
}

export function getNextSortDirection(currentDirection) {
    switch (currentDirection) {
        case 'none':
            return 'asc';
        case 'asc':
            return 'desc';
        case 'desc':
            return 'none';
        default:
            return 'asc';
    }
}

export function buildNextSortRules(currentRules, columnIndex, multiColumnSort) {
    const rules = Array.isArray(currentRules) ? [...currentRules] : [];
    const existingRule = rules.find((rule) => rule.column === columnIndex);

    const direction = existingRule
        ? getNextSortDirection(existingRule.direction)
        : 'asc';

    if (!multiColumnSort) {
        if (direction === 'none') {
            return {rules: [], direction};
        }

        return {
            rules: [{
                column: columnIndex,
                direction,
                type: 'auto',
                unitConfig: null
            }],
            direction
        };
    }

    if (direction === 'none') {
        return {
            rules: rules.filter((rule) => rule.column !== columnIndex),
            direction
        };
    }

    if (existingRule) {
        existingRule.direction = direction;
        return {rules, direction};
    }

    return {
        rules: [...rules, {
            column: columnIndex,
            direction,
            type: 'auto',
            unitConfig: null
        }],
        direction
    };
}

export function normalizeAdvancedSortRules(rules) {
    if (!Array.isArray(rules)) return [];

    return rules
        .map((rule) => {
            const column = Number(rule.column);
            if (Number.isNaN(column)) return null;

            const direction = rule.direction === 'desc' ? 'desc' : 'asc';
            const type = rule.type || 'auto';
            const unitConfig = rule.unitConfig || null;

            return {
                column,
                direction,
                type,
                unitConfig
            };
        })
        .filter(Boolean);
}

export function sortRowsByRules(rows, rules) {
    const sortingRules = Array.isArray(rules) ? rules : [];
    const sortableRows = Array.isArray(rows) ? [...rows] : [];

    sortableRows.sort((rowA, rowB) => {
        for (const rule of sortingRules) {
            const aValue = rowA.cells[rule.column]?.textContent.trim() || '';
            const bValue = rowB.cells[rule.column]?.textContent.trim() || '';

            const result = compareValues(aValue, bValue, rule);
            if (result === 0) continue;

            return rule.direction === 'desc' ? -result : result;
        }
        return 0;
    });

    return sortableRows;
}
