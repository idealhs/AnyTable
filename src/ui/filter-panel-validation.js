import { getDropdownButtonValue } from './dropdown-popup.js';
import { parseNumberLike, translate } from './panel-utils.js';
import { isFilterGroup } from './filter-panel-state.js';

function findDirectChildByAttribute(containerElement, attributeName, expectedValue) {
    return Array.from(containerElement?.children || []).find((element) => (
        element.getAttribute?.(attributeName) === expectedValue
    )) || null;
}

export function parseFilterRuleRow(rowElement) {
    const comparator = getDropdownButtonValue(rowElement.querySelector('.anytable-adv-comparator'));
    const negated = rowElement.querySelector('.anytable-adv-negate').classList.contains('active');
    const column = Number(getDropdownButtonValue(rowElement.querySelector('.anytable-adv-filter-column')));

    const rule = {
        id: `leaf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        column,
        comparator,
        negated,
        value: '',
        options: {}
    };

    if (comparator === 'between') {
        const min = parseNumberLike(rowElement.querySelector('.anytable-adv-min').value);
        const max = parseNumberLike(rowElement.querySelector('.anytable-adv-max').value);
        if (Number.isNaN(min) || Number.isNaN(max)) {
            return {error: translate('advancedPanel.filter.errors.betweenInvalid')};
        }
        if (min > max) {
            return {error: translate('advancedPanel.filter.errors.betweenOrder')};
        }
        rule.options = {min, max};
        return {rule};
    }

    if (comparator === 'regex') {
        const value = rowElement.querySelector('.anytable-adv-value').value.trim();
        const flags = rowElement.querySelector('.anytable-adv-flags').value.trim();
        if (!value) {
            return {error: translate('advancedPanel.filter.errors.regexRequired')};
        }
        try {
            new RegExp(value, flags);
        } catch (error) {
            return {error: translate('advancedPanel.filter.errors.regexInvalid', {message: error.message})};
        }
        rule.value = value;
        rule.options = {flags};
        return {rule};
    }

    if (comparator === 'isEmpty' || comparator === 'isNotEmpty') {
        return {rule};
    }

    if (comparator === '>' || comparator === '>=' || comparator === '<' || comparator === '<=') {
        const numericValue = parseNumberLike(rowElement.querySelector('.anytable-adv-value').value);
        if (Number.isNaN(numericValue)) {
            return {error: translate('advancedPanel.filter.errors.numericRequired')};
        }
        rule.value = numericValue;
        return {rule};
    }

    rule.value = rowElement.querySelector('.anytable-adv-value').value;
    return {rule};
}

export function collectFilterRuleTree(containerElement, children) {
    const collected = [];

    for (let index = 0; index < children.length; index += 1) {
        const child = children[index];

        if (isFilterGroup(child)) {
            const groupElement = findDirectChildByAttribute(containerElement, 'data-group-id', child.id);
            if (!groupElement) {
                continue;
            }

            const childContainer = Array.from(groupElement.children).find((element) => (
                element.classList?.contains('anytable-adv-group-children')
            )) || null;
            const result = collectFilterRuleTree(childContainer, child.children);
            if (result.error) {
                return result;
            }

            const groupRule = {
                id: child.id,
                negated: groupElement.querySelector('.anytable-adv-group-header > .anytable-adv-negate')?.classList.contains('active') || false,
                children: result.rules
            };
            if (index > 0) {
                groupRule.operator = child.operator || 'AND';
            }
            collected.push(groupRule);
            continue;
        }

        const rowElement = findDirectChildByAttribute(containerElement, 'data-rule-id', child.id);
        if (!rowElement) {
            continue;
        }

        const {rule, error} = parseFilterRuleRow(rowElement);
        if (error) {
            return {error};
        }

        if (index > 0) {
            rule.operator = child.operator || 'AND';
        }
        collected.push(rule);
    }

    return {rules: collected};
}
