import { createPanelNodeId } from './advanced-panel-common.js';

export const FILTER_COMPARATOR_VALUES = ['contains', 'startsWith', 'endsWith', 'equals', 'regex', '>', '>=', '<', '<=', 'between', 'isEmpty', 'isNotEmpty'];
export const FILTER_OPERATOR_VALUES = ['AND', 'OR'];
export const MAX_FILTER_NESTING_DEPTH = 4;

export function isFilterGroup(node) {
    return Array.isArray(node?.children);
}

export function createDefaultFilterRule(columnIndex = 0) {
    return {
        id: createPanelNodeId('leaf'),
        column: columnIndex,
        comparator: 'contains',
        value: '',
        options: {}
    };
}

export function createDefaultFilterGroup(columnIndex = 0) {
    return {
        id: createPanelNodeId('group'),
        children: [createDefaultFilterRule(columnIndex)]
    };
}

function normalizeFilterChildren(children, fallbackColumnIndex, globalOperator) {
    if (!Array.isArray(children) || children.length === 0) {
        return [createDefaultFilterRule(fallbackColumnIndex)];
    }

    return children.map((child, index) => normalizeFilterNode(child, fallbackColumnIndex, index, globalOperator));
}

function normalizeFilterNode(node, fallbackColumnIndex, index, globalOperator) {
    const operator = index === 0 ? undefined : (node.operator || globalOperator);
    if (isFilterGroup(node)) {
        return {
            id: node.id || createPanelNodeId('group'),
            negated: node.negated || false,
            operator,
            children: normalizeFilterChildren(node.children, fallbackColumnIndex, null)
        };
    }

    return {
        id: node.id || createPanelNodeId('leaf'),
        column: Number.isInteger(node.column) ? node.column : fallbackColumnIndex,
        comparator: node.comparator || 'contains',
        negated: node.negated || false,
        value: node.value || '',
        options: {...(node.options || {})},
        operator
    };
}

export function ensureFilterRules(initialRuleGroup, fallbackColumnIndex = 0) {
    if (!initialRuleGroup || !Array.isArray(initialRuleGroup.children) || initialRuleGroup.children.length === 0) {
        return [createDefaultFilterRule(fallbackColumnIndex)];
    }

    const globalOperator = initialRuleGroup.operator === 'OR' ? 'OR' : null;
    return normalizeFilterChildren(initialRuleGroup.children, fallbackColumnIndex, globalOperator);
}

export function findFilterNodeIndex(children, id) {
    return children.findIndex((child) => child.id === id);
}

export function removeLeadingFilterOperator(children) {
    if (children.length > 0 && children[0].operator) {
        delete children[0].operator;
    }
}
