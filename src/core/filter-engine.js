import { getCellText } from './table-data.js';
import { buildTableModel } from './table-model.js';
import { clearRowFilterHidden, markRowAsFilterHidden } from './row-visibility.js';

function safeToLowerCase(value) {
    return (value ?? '').toString().toLowerCase();
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return NaN;
    const normalized = value.toString().replace(/,/g, '').trim();
    return Number(normalized);
}

function evaluateLeafRule(cellText, rule) {
    const comparator = rule?.comparator;
    const rawValue = rule?.value ?? '';
    const options = rule?.options || {};

    const normalizedCellText = (cellText ?? '').toString();
    const lowerCellText = safeToLowerCase(normalizedCellText);
    const lowerRuleValue = safeToLowerCase(rawValue);

    switch (comparator) {
        case 'contains':
            return lowerCellText.includes(lowerRuleValue);
        case 'startsWith':
            return lowerCellText.startsWith(lowerRuleValue);
        case 'endsWith':
            return lowerCellText.endsWith(lowerRuleValue);
        case 'equals':
            return lowerCellText === lowerRuleValue;
        case 'regex': {
            try {
                const pattern = rawValue.toString();
                const flags = options.flags || '';
                const regex = new RegExp(pattern, flags);
                return regex.test(normalizedCellText);
            } catch (error) {
                return false;
            }
        }
        case 'isEmpty':
            return normalizedCellText.trim() === '';
        case 'isNotEmpty':
            return normalizedCellText.trim() !== '';
        case '>':
        case '>=':
        case '<':
        case '<=':
        case 'between': {
            const cellNumber = toNumber(normalizedCellText);
            if (Number.isNaN(cellNumber)) return false;

            if (comparator === 'between') {
                const min = toNumber(options.min);
                const max = toNumber(options.max);
                if (Number.isNaN(min) || Number.isNaN(max)) return false;
                return cellNumber >= min && cellNumber <= max;
            }

            const targetNumber = toNumber(rawValue);
            if (Number.isNaN(targetNumber)) return false;

            if (comparator === '>') return cellNumber > targetNumber;
            if (comparator === '>=') return cellNumber >= targetNumber;
            if (comparator === '<') return cellNumber < targetNumber;
            return cellNumber <= targetNumber;
        }
        default:
            return lowerCellText.includes(lowerRuleValue);
    }
}

function evaluateRuleTree(row, ruleNode, tableModel = null) {
    if (!ruleNode) return true;

    if (Array.isArray(ruleNode.children)) {
        const children = ruleNode.children;
        if (children.length === 0) return true;

        let result;
        const hasPerRuleOperator = children.some((child) => child.operator);
        if (hasPerRuleOperator || !ruleNode.operator) {
            result = evaluateRuleTree(row, children[0], tableModel);
            for (let i = 1; i < children.length; i++) {
                const childResult = evaluateRuleTree(row, children[i], tableModel);
                if (children[i].operator === 'OR') {
                    result = result || childResult;
                } else {
                    result = result && childResult;
                }
            }
        } else {
            const operator = ruleNode.operator === 'OR' ? 'OR' : 'AND';
            if (operator === 'OR') {
                result = children.some((child) => evaluateRuleTree(row, child, tableModel));
            } else {
                result = children.every((child) => evaluateRuleTree(row, child, tableModel));
            }
        }

        if (ruleNode.negated) {
            result = !result;
        }
        return result;
    }

    const columnIndex = Number(ruleNode.column);
    const cellText = getCellText(row, columnIndex, tableModel);
    let result = evaluateLeafRule(cellText, ruleNode);
    if (ruleNode.negated) {
        result = !result;
    }
    return result;
}

function collectRuleColumns(ruleNode, columns) {
    if (!ruleNode) {
        return columns;
    }

    if (Array.isArray(ruleNode.children)) {
        ruleNode.children.forEach((child) => collectRuleColumns(child, columns));
        return columns;
    }

    const columnIndex = Number(ruleNode.column);
    if (Number.isInteger(columnIndex) && columnIndex >= 0) {
        columns.add(columnIndex);
    }

    return columns;
}

export function matchesBasicFilters(row, filterValues, tableModel = null) {
    for (const [columnKey, rawFilterValue] of Object.entries(filterValues || {})) {
        const columnIndex = Number(columnKey);
        if (!Number.isInteger(columnIndex) || columnIndex < 0) {
            continue;
        }

        const filterValue = safeToLowerCase(rawFilterValue);
        if (!filterValue) continue;

        const cellText = safeToLowerCase(getCellText(row, columnIndex, tableModel));
        if (!cellText.includes(filterValue)) {
            return false;
        }
    }
    return true;
}

export function matchesRuleTree(row, ruleGroup, tableModel = null) {
    if (!ruleGroup || !Array.isArray(ruleGroup.children) || ruleGroup.children.length === 0) {
        return true;
    }

    return evaluateRuleTree(row, ruleGroup, tableModel);
}

export function getRuleTreeColumns(ruleGroup) {
    return collectRuleColumns(ruleGroup, new Set());
}

export function applyCombinedFilters(table, filterValues = {}, advancedRuleGroup = null) {
    const tableModel = buildTableModel(table);

    tableModel.bodyRows.forEach((rowModel) => {
        const basicMatched = matchesBasicFilters(rowModel, filterValues || {}, tableModel);
        const advancedMatched = matchesRuleTree(rowModel, advancedRuleGroup, tableModel);
        if (basicMatched && advancedMatched) {
            clearRowFilterHidden(rowModel.row);
            return;
        }

        markRowAsFilterHidden(rowModel.row);
    });
}

export function applyBasicFilters(table, filterValues) {
    applyCombinedFilters(table, filterValues, null);
}

export function applyAdvancedFilterTree(table, ruleGroup) {
    applyCombinedFilters(table, {}, ruleGroup);
}

export function compileRuleTree(ruleGroup, tableModel = null) {
    return (row) => evaluateRuleTree(row, ruleGroup, tableModel);
}
