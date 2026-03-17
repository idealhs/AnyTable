import { closeDropdownPopup, getDropdownOptionLabel, openDropdownPopup, setDropdownButtonValue } from './dropdown-popup.js';
import {
    createDefaultFilterGroup,
    createDefaultFilterRule,
    findFilterNodeIndex,
    isFilterGroup,
    MAX_FILTER_NESTING_DEPTH,
    removeLeadingFilterOperator
} from './filter-panel-state.js';
import { getPanelColumnLabel } from './advanced-panel-common.js';
import { translate } from './panel-utils.js';

function getNextSiblingNodeId(operatorElement) {
    let nextElement = operatorElement.nextElementSibling;
    while (nextElement) {
        const ruleId = nextElement.getAttribute('data-rule-id');
        if (ruleId) {
            return ruleId;
        }

        const groupId = nextElement.getAttribute('data-group-id');
        if (groupId) {
            return groupId;
        }

        nextElement = nextElement.nextElementSibling;
    }

    return null;
}

export function setupFilterComparatorVisibility(rowElement) {
    const comparatorButton = rowElement.querySelector('.anytable-adv-comparator');
    const valueInput = rowElement.querySelector('.anytable-adv-value');
    const rangeBox = rowElement.querySelector('.anytable-adv-range');
    const flagsInput = rowElement.querySelector('.anytable-adv-flags');
    const comparator = comparatorButton.getAttribute('data-value');

    const showRange = comparator === 'between';
    const showRegex = comparator === 'regex';
    const hideValue = comparator === 'between' || comparator === 'isEmpty' || comparator === 'isNotEmpty';

    rangeBox.style.display = showRange ? '' : 'none';
    flagsInput.style.display = showRegex ? '' : 'none';
    valueInput.style.display = hideValue ? 'none' : '';
}

export function bindFilterTreeEvents({
    containerElement,
    children,
    depth,
    optionSets,
    setHint,
    reRender
}) {
    const directChildren = Array.from(containerElement.children);

    for (const element of directChildren) {
        if (element.classList.contains('anytable-adv-rule-operator')) {
            const button = element.querySelector('.anytable-adv-inline-operator');
            const ruleId = getNextSiblingNodeId(element);
            if (button && ruleId !== null) {
                const index = findFilterNodeIndex(children, ruleId);
                if (index >= 0) {
                    const currentValue = children[index].operator || 'AND';
                    setDropdownButtonValue(button, currentValue, getDropdownOptionLabel(optionSets.operatorOptions, currentValue, currentValue));
                    button.addEventListener('click', () => {
                        openDropdownPopup({
                            anchorButton: button,
                            currentValue: children[index].operator || 'AND',
                            groups: optionSets.operatorOptions,
                            onSelect: (newValue) => {
                                children[index].operator = newValue;
                                setDropdownButtonValue(button, newValue, getDropdownOptionLabel(optionSets.operatorOptions, newValue, newValue));
                            }
                        });
                    });
                }
            }
            continue;
        }

        const ruleId = element.getAttribute('data-rule-id');
        const groupId = element.getAttribute('data-group-id');

        if (ruleId) {
            const index = findFilterNodeIndex(children, ruleId);
            if (index < 0) {
                continue;
            }

            const rule = children[index];
            const columnButton = element.querySelector('.anytable-adv-filter-column');
            if (columnButton) {
                setDropdownButtonValue(columnButton, rule.column, getPanelColumnLabel(optionSets.columnTitles, rule.column));
                columnButton.addEventListener('click', () => {
                    openDropdownPopup({
                        anchorButton: columnButton,
                        currentValue: String(rule.column),
                        groups: optionSets.columnOptions,
                        onSelect: (newValue) => {
                            rule.column = Number(newValue);
                            setDropdownButtonValue(columnButton, newValue, getPanelColumnLabel(optionSets.columnTitles, rule.column));
                        }
                    });
                });
            }

            const comparatorButton = element.querySelector('.anytable-adv-comparator');
            if (comparatorButton) {
                setDropdownButtonValue(comparatorButton, rule.comparator, getDropdownOptionLabel(optionSets.comparatorOptions, rule.comparator, rule.comparator));
                comparatorButton.addEventListener('click', () => {
                    openDropdownPopup({
                        anchorButton: comparatorButton,
                        currentValue: rule.comparator,
                        groups: optionSets.comparatorOptions,
                        onSelect: (newValue) => {
                            rule.comparator = newValue;
                            setDropdownButtonValue(comparatorButton, newValue, getDropdownOptionLabel(optionSets.comparatorOptions, newValue, newValue));
                            setupFilterComparatorVisibility(element);
                        }
                    });
                });
            }
            setupFilterComparatorVisibility(element);

            const negateButton = element.querySelector('.anytable-adv-negate');
            if (negateButton) {
                negateButton.addEventListener('click', () => {
                    rule.negated = !rule.negated;
                    negateButton.classList.toggle('active', rule.negated);
                });
            }

            const valueInput = element.querySelector('.anytable-adv-value');
            if (valueInput) {
                valueInput.addEventListener('input', () => {
                    rule.value = valueInput.value;
                });
            }

            const minInput = element.querySelector('.anytable-adv-min');
            if (minInput) {
                minInput.addEventListener('input', () => {
                    rule.options = rule.options || {};
                    rule.options.min = minInput.value;
                });
            }

            const maxInput = element.querySelector('.anytable-adv-max');
            if (maxInput) {
                maxInput.addEventListener('input', () => {
                    rule.options = rule.options || {};
                    rule.options.max = maxInput.value;
                });
            }

            const flagsInput = element.querySelector('.anytable-adv-flags');
            if (flagsInput) {
                flagsInput.addEventListener('input', () => {
                    rule.options = rule.options || {};
                    rule.options.flags = flagsInput.value;
                });
            }

            const removeButton = element.querySelector('.anytable-adv-remove-rule');
            if (removeButton) {
                removeButton.addEventListener('click', () => {
                    closeDropdownPopup();
                    if (children.length <= 1) {
                        setHint(translate('advancedPanel.filter.hint.keepOneRule'), true);
                        return;
                    }

                    children.splice(index, 1);
                    removeLeadingFilterOperator(children);
                    reRender();
                });
            }
            continue;
        }

        if (!groupId) {
            continue;
        }

        const index = findFilterNodeIndex(children, groupId);
        if (index < 0) {
            continue;
        }

        const groupNode = children[index];
        if (!isFilterGroup(groupNode)) {
            continue;
        }

        const negateButton = element.querySelector(':scope > .anytable-adv-group-header > .anytable-adv-negate');
        if (negateButton) {
            negateButton.addEventListener('click', () => {
                groupNode.negated = !groupNode.negated;
                negateButton.classList.toggle('active', groupNode.negated);
            });
        }

        const removeGroupButton = element.querySelector(':scope > .anytable-adv-group-header > .anytable-adv-remove-group');
        if (removeGroupButton) {
            removeGroupButton.addEventListener('click', () => {
                closeDropdownPopup();
                if (children.length <= 1) {
                    setHint(translate('advancedPanel.filter.hint.keepOneRule'), true);
                    return;
                }

                children.splice(index, 1);
                removeLeadingFilterOperator(children);
                reRender();
            });
        }

        const addRuleButton = element.querySelector(':scope > .anytable-adv-group-actions > .anytable-adv-add-rule');
        if (addRuleButton) {
            addRuleButton.addEventListener('click', () => {
                closeDropdownPopup();
                const newRule = createDefaultFilterRule(0);
                newRule.operator = 'AND';
                groupNode.children.push(newRule);
                reRender();
                setHint('');
            });
        }

        const addGroupButton = element.querySelector(':scope > .anytable-adv-group-actions > .anytable-adv-add-group');
        if (addGroupButton) {
            addGroupButton.addEventListener('click', () => {
                closeDropdownPopup();
                if (depth + 1 >= MAX_FILTER_NESTING_DEPTH) {
                    setHint(translate('advancedPanel.filter.hint.maxDepth', {max: MAX_FILTER_NESTING_DEPTH}), true);
                    return;
                }

                const newGroup = createDefaultFilterGroup(0);
                newGroup.operator = 'AND';
                groupNode.children.push(newGroup);
                reRender();
                setHint('');
            });
        }

        const childContainer = element.querySelector(':scope > .anytable-adv-group-children');
        if (childContainer) {
            bindFilterTreeEvents({
                containerElement: childContainer,
                children: groupNode.children,
                depth: depth + 1,
                optionSets,
                setHint,
                reRender
            });
        }
    }
}
