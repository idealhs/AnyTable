import { buildColumnOptionGroups, buildSelectButtonHtml, getPanelColumnLabel } from './advanced-panel-common.js';
import { escapeHtml, setInnerHTML, translate } from './panel-utils.js';
import { FILTER_COMPARATOR_VALUES, isFilterGroup } from './filter-panel-state.js';
import { getDropdownOptionLabel } from './dropdown-popup.js';

function getComparatorTranslationKey(value) {
    switch (value) {
        case '>':
            return 'gt';
        case '>=':
            return 'gte';
        case '<':
            return 'lt';
        case '<=':
            return 'lte';
        default:
            return value;
    }
}

function buildComparatorOptionGroups() {
    return [FILTER_COMPARATOR_VALUES.map((value) => ({
        value,
        label: translate(`advancedPanel.filter.comparator.${getComparatorTranslationKey(value)}`)
    }))];
}

export function normalizeFilterOperator(operator) {
    return operator === 'OR' ? 'OR' : 'AND';
}

export function getFilterOperatorLabel(operator) {
    return normalizeFilterOperator(operator);
}

export function getFilterOperatorTooltip(operator) {
    const normalizedOperator = normalizeFilterOperator(operator);
    return translate(`advancedPanel.filter.operatorTooltip.${normalizedOperator.toLowerCase()}`) || normalizedOperator;
}

function buildFilterOperatorHtml(operator) {
    const normalizedOperator = normalizeFilterOperator(operator);
    const tooltip = getFilterOperatorTooltip(normalizedOperator);
    return `
        <div class="anytable-adv-rule-operator">
            <button
                type="button"
                class="anytable-adv-inline-operator"
                data-filter-operator="${normalizedOperator}"
                data-value="${normalizedOperator}"
                title="${escapeHtml(tooltip)}"
                aria-label="${escapeHtml(tooltip)}"
            >${escapeHtml(getFilterOperatorLabel(normalizedOperator))}</button>
        </div>
    `;
}

function buildFilterRuleRowHtml(rule, optionSets) {
    const comparator = rule?.comparator || 'contains';
    const negated = rule?.negated || false;
    const value = rule?.value || '';
    const flags = rule?.options?.flags || '';
    const min = rule?.options?.min ?? '';
    const max = rule?.options?.max ?? '';

    const showRange = comparator === 'between';
    const showRegex = comparator === 'regex';
    const hideValue = comparator === 'between' || comparator === 'isEmpty' || comparator === 'isNotEmpty';

    return `
        <div class="anytable-adv-rule-row" data-rule-id="${escapeHtml(rule.id)}">
            <div class="anytable-adv-rule-grid">
                <button type="button" class="anytable-adv-negate${negated ? ' active' : ''}" title="${translate('advancedPanel.filter.negateTooltip')}">!</button>
                ${buildSelectButtonHtml('anytable-adv-filter-column', rule.column ?? 0, getPanelColumnLabel(optionSets.columnTitles, rule.column ?? 0))}
                ${buildSelectButtonHtml('anytable-adv-comparator', comparator, getDropdownOptionLabel(optionSets.comparatorOptions, comparator, comparator))}
                <input type="text" class="anytable-adv-value" placeholder="${translate('advancedPanel.filter.valuePlaceholder')}" style="display:${hideValue ? 'none' : ''};" value="${escapeHtml(value)}">
                <div class="anytable-adv-range" style="display:${showRange ? '' : 'none'};">
                    <input type="text" class="anytable-adv-min" placeholder="${translate('advancedPanel.filter.minPlaceholder')}" value="${escapeHtml(min)}">
                    <input type="text" class="anytable-adv-max" placeholder="${translate('advancedPanel.filter.maxPlaceholder')}" value="${escapeHtml(max)}">
                </div>
                <input type="text" class="anytable-adv-flags" placeholder="${translate('advancedPanel.filter.flagsPlaceholder')}" style="display:${showRegex ? '' : 'none'};" value="${escapeHtml(flags)}">
                <button type="button" class="anytable-adv-remove-rule">${translate('advancedPanel.common.delete')}</button>
            </div>
        </div>
    `;
}

function buildGroupHtml(groupNode, depth, optionSets) {
    const negated = groupNode.negated || false;
    return `
        <div class="anytable-adv-rule-group" data-group-id="${escapeHtml(groupNode.id)}">
            <div class="anytable-adv-group-header">
                <button type="button" class="anytable-adv-negate${negated ? ' active' : ''}" title="${translate('advancedPanel.filter.groupNegateTooltip')}">!</button>
                <span class="anytable-adv-group-label">${translate('advancedPanel.filter.groupLabel')}</span>
                <button type="button" class="anytable-adv-remove-group">${translate('advancedPanel.common.delete')}</button>
            </div>
            <div class="anytable-adv-group-children">
                ${buildFilterChildrenHtml(groupNode.children, depth + 1, optionSets)}
            </div>
            <div class="anytable-adv-group-actions">
                <button type="button" class="anytable-advanced-btn anytable-adv-add-rule">${translate('advancedPanel.filter.addRule')}</button>
                <button type="button" class="anytable-advanced-btn anytable-adv-add-group">${translate('advancedPanel.filter.addGroup')}</button>
            </div>
        </div>
    `;
}

function buildFilterChildrenHtml(children, depth, optionSets) {
    let html = '';
    children.forEach((child, index) => {
        if (index > 0) {
            html += buildFilterOperatorHtml(child.operator || 'AND');
        }

        html += isFilterGroup(child)
            ? buildGroupHtml(child, depth, optionSets)
            : buildFilterRuleRowHtml(child, optionSets);
    });

    return html;
}

export function createFilterOptionSets(columnTitles) {
    return {
        columnTitles,
        columnOptions: buildColumnOptionGroups(columnTitles),
        comparatorOptions: buildComparatorOptionGroups()
    };
}

export function renderFilterTree(containerElement, children, optionSets) {
    setInnerHTML(containerElement, buildFilterChildrenHtml(children, 0, optionSets));
}
