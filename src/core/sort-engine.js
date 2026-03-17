import { parseValueAndUnit, convertToBase, detectColumnUnitSystem, getUnitSystemByName, tryParseDate } from './type-parser.js';
import { getCellText } from './table-data.js';

function normalizeValue(value) {
    return (value ?? '').toString().trim();
}

// Legacy type migration map
const TYPE_MIGRATION = { time: 'duration', weight: 'mass', unit: 'auto' };

// All known unit system type names
const UNIT_SYSTEM_TYPES = new Set([
    'duration', 'mass', 'length', 'area', 'volume', 'speed',
    'temperature', 'pressure', 'energy', 'power', 'voltage',
    'current', 'resistance', 'frequency', 'dataSize', 'bitrate'
]);

function parseWithCustomUnitConfig(value, unitConfig) {
    const normalized = normalizeValue(value);
    const match = normalized.match(/^([-+]?\d*\.?\d+)\s*([^\d\s]+)$/);
    if (!match) {
        return { success: false, value: NaN, kind: 'custom-unit' };
    }

    const numberValue = Number(match[1]);
    if (Number.isNaN(numberValue)) {
        return { success: false, value: NaN, kind: 'custom-unit' };
    }

    const unit = match[2].toLowerCase();
    const mapping = unitConfig?.mapping || {};
    const factor = mapping[unit];
    if (typeof factor !== 'number') {
        return { success: false, value: NaN, kind: 'custom-unit' };
    }

    return { success: true, value: numberValue * factor, kind: 'custom-unit' };
}

function compareValues(aValue, bValue, rule) {
    const type = rule?.type || 'text';

    // Text comparison
    if (type === 'text') {
        return aValue.localeCompare(bValue);
    }

    // Custom unit config
    if (type === 'custom' && rule?.unitConfig) {
        const parsedA = parseWithCustomUnitConfig(aValue, rule.unitConfig);
        const parsedB = parseWithCustomUnitConfig(bValue, rule.unitConfig);
        if (parsedA.success && parsedB.success && parsedA.value !== parsedB.value) {
            return parsedA.value - parsedB.value;
        }
    }

    // Number
    if (type === 'number') {
        const numA = Number(aValue.replace(/,/g, ''));
        const numB = Number(bValue.replace(/,/g, ''));
        if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
            return numA - numB;
        }
    }

    // Date
    if (type === 'date') {
        const dateOrder = rule._dateOrder || null;
        const dA = tryParseDate(aValue, dateOrder);
        const dB = tryParseDate(bValue, dateOrder);
        if (dA && dB && dA.timestamp !== dB.timestamp) {
            return dA.timestamp - dB.timestamp;
        }
    }

    // Percent
    if (type === 'percent') {
        const pA = parseValueAndUnit(aValue);
        const pB = parseValueAndUnit(bValue);
        if (pA.success && pB.success && pA.value !== pB.value) {
            return pA.value - pB.value;
        }
    }

    // Unit system type (duration, mass, length, etc.)
    if (UNIT_SYSTEM_TYPES.has(type)) {
        const system = rule._unitSystem || getUnitSystemByName(type);
        if (system) {
            const parsedA = parseValueAndUnit(aValue);
            const parsedB = parseValueAndUnit(bValue);
            if (parsedA.success && parsedB.success) {
                const baseA = convertToBase(parsedA.value, parsedA.unit || '', system);
                const baseB = convertToBase(parsedB.value, parsedB.unit || '', system);
                if (!Number.isNaN(baseA) && !Number.isNaN(baseB) && baseA !== baseB) {
                    return baseA - baseB;
                }
            }
        }
    }

    // Auto — use resolved type if available
    if (type === 'auto') {
        const resolvedType = rule._resolvedType;
        const resolvedSystem = rule._unitSystem;

        if (resolvedType && resolvedType !== 'auto') {
            // Recurse with resolved type
            const resolvedRule = { ...rule, type: resolvedType, _unitSystem: resolvedSystem };
            const result = compareValues(aValue, bValue, resolvedRule);
            if (result !== 0) return result;
        }

        // Fallback: try parseValueAndUnit
        const parsedA = parseValueAndUnit(aValue);
        const parsedB = parseValueAndUnit(bValue);
        if (parsedA.success && parsedB.success) {
            // If same system, convert to base
            if (parsedA.system && parsedB.system && parsedA.system.name === parsedB.system.name) {
                const baseA = convertToBase(parsedA.value, parsedA.unit, parsedA.system);
                const baseB = convertToBase(parsedB.value, parsedB.unit, parsedB.system);
                if (!Number.isNaN(baseA) && !Number.isNaN(baseB) && baseA !== baseB) {
                    return baseA - baseB;
                }
            }
            // Both numeric
            if (parsedA.value !== parsedB.value) {
                return parsedA.value - parsedB.value;
            }
        }
    }

    // Numeric fallback
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
        return {
            rules: rules.map(r => r.column === columnIndex ? { ...r, direction } : r),
            direction
        };
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
            let type = rule.type || 'auto';
            // Migrate legacy types
            if (TYPE_MIGRATION[type]) {
                type = TYPE_MIGRATION[type];
            }
            const unitConfig = rule.unitConfig || null;

            return { column, direction, type, unitConfig };
        })
        .filter(Boolean);
}

export function sortRowsByRules(rows, rules, {tableModel = null} = {}) {
    const sortingRules = Array.isArray(rules) ? rules.map(rule => ({ ...rule })) : [];
    const sortableRows = Array.isArray(rows) ? [...rows] : [];

    // Pre-process: resolve 'auto' types via column detection
    for (const rule of sortingRules) {
        if (rule.type === 'auto' && !rule._resolvedType) {
            const colValues = sortableRows.map(row =>
                getCellText(row, rule.column, tableModel)
            );
            const detection = detectColumnUnitSystem(colValues);
            rule._resolvedType = detection.type;
            rule._unitSystem = detection.system;
            rule._dateOrder = detection.dateOrder || null;
        }
        // Also resolve dateOrder for explicitly typed 'date' columns
        if (rule.type === 'date' && !rule._dateOrder) {
            const colValues = sortableRows.map(row =>
                getCellText(row, rule.column, tableModel)
            );
            const detection = detectColumnUnitSystem(colValues);
            rule._dateOrder = detection.dateOrder || null;
        }
    }

    sortableRows.sort((rowA, rowB) => {
        for (const rule of sortingRules) {
            const aValue = getCellText(rowA, rule.column, tableModel);
            const bValue = getCellText(rowB, rule.column, tableModel);

            const result = compareValues(aValue, bValue, rule);
            if (result === 0) continue;

            return rule.direction === 'desc' ? -result : result;
        }
        return 0;
    });

    return sortableRows;
}
