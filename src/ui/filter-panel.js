import { closeDropdownPopup, getDropdownButtonValue, getDropdownOptionLabel, openDropdownPopup, setDropdownButtonValue } from './dropdown-popup.js';
import { escapeHtml, createCloseIconSvg, setInnerHTML, parseNumberLike, translate, createOverlayAndDialog } from './panel-utils.js';

const FILTER_COMPARATOR_VALUES = ['contains', 'startsWith', 'endsWith', 'equals', 'regex', '>', '>=', '<', '<=', 'between', 'isEmpty', 'isNotEmpty'];
const FILTER_OPERATOR_VALUES = ['AND', 'OR'];

function getColumnLabel(columnTitles, columnIndex) {
    return columnTitles[columnIndex]
        || translate('advancedPanel.common.columnFallback', {index: columnIndex + 1});
}

function buildOptionButtonHtml(className, value, label) {
    return `<button type="button" class="anytable-adv-select-btn ${className}" data-value="${escapeHtml(String(value))}" aria-expanded="false">${escapeHtml(label)}</button>`;
}

function buildColumnOptionGroups(columnTitles) {
    return [columnTitles.map((title, index) => ({
        value: String(index),
        label: getColumnLabel(columnTitles, index)
    }))];
}

function buildComparatorOptionGroups() {
    return [FILTER_COMPARATOR_VALUES.map((value) => ({
        value,
        label: translate(`advancedPanel.filter.comparator.${getComparatorTranslationKey(value)}`)
    }))];
}

function buildOperatorOptionGroups() {
    return [FILTER_OPERATOR_VALUES.map((value) => ({
        value,
        label: translate(`advancedPanel.filter.operator.${value.toLowerCase()}`)
    }))];
}

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

function buildFilterOperatorHtml(operator, operatorOptions) {
    return `
        <div class="anytable-adv-rule-operator">
            ${buildOptionButtonHtml('anytable-adv-inline-operator', operator, getDropdownOptionLabel(operatorOptions, operator, operator))}
        </div>
    `;
}

const MAX_NESTING_DEPTH = 4;

function isGroup(node) {
    return Array.isArray(node.children);
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
                ${buildOptionButtonHtml('anytable-adv-filter-column', rule.column ?? 0, getColumnLabel(optionSets.columnTitles, rule.column ?? 0))}
                ${buildOptionButtonHtml('anytable-adv-comparator', comparator, getDropdownOptionLabel(optionSets.comparatorOptions, comparator, comparator))}
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

function createDefaultFilterRule(columnIndex) {
    return {
        id: generateId('leaf'),
        column: columnIndex,
        comparator: 'contains',
        value: '',
        options: {}
    };
}

function createDefaultGroup(columnIndex) {
    return {
        id: generateId('group'),
        children: [createDefaultFilterRule(columnIndex)]
    };
}

function normalizeNode(node, fallbackColumnIndex, index, globalOperator) {
    const operator = index === 0 ? undefined : (node.operator || globalOperator);
    if (Array.isArray(node.children)) {
        return {
            id: node.id || generateId('group'),
            negated: node.negated || false,
            operator,
            children: normalizeChildren(node.children, fallbackColumnIndex, null)
        };
    }
    return {
        id: node.id || generateId('leaf'),
        column: Number.isInteger(node.column) ? node.column : fallbackColumnIndex,
        comparator: node.comparator || 'contains',
        negated: node.negated || false,
        value: node.value || '',
        options: {...(node.options || {})},
        operator
    };
}

function normalizeChildren(children, fallbackColumnIndex, globalOperator) {
    if (!Array.isArray(children) || children.length === 0) {
        return [createDefaultFilterRule(fallbackColumnIndex)];
    }
    return children.map((child, index) => normalizeNode(child, fallbackColumnIndex, index, globalOperator));
}

function ensureFilterRules(initialRuleGroup, fallbackColumnIndex) {
    if (!initialRuleGroup || !Array.isArray(initialRuleGroup.children) || initialRuleGroup.children.length === 0) {
        return [createDefaultFilterRule(fallbackColumnIndex)];
    }
    const globalOperator = initialRuleGroup.operator === 'OR' ? 'OR' : null;
    return normalizeChildren(initialRuleGroup.children, fallbackColumnIndex, globalOperator);
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
                ${buildChildrenHtml(groupNode.children, depth + 1, optionSets)}
            </div>
            <div class="anytable-adv-group-actions">
                <button type="button" class="anytable-advanced-btn anytable-adv-add-rule">${translate('advancedPanel.filter.addRule')}</button>
                <button type="button" class="anytable-advanced-btn anytable-adv-add-group">${translate('advancedPanel.filter.addGroup')}</button>
            </div>
        </div>
    `;
}

function buildChildrenHtml(children, depth, optionSets) {
    let html = '';
    children.forEach((child, index) => {
        if (index > 0) {
            html += buildFilterOperatorHtml(child.operator || 'AND', optionSets.operatorOptions);
        }
        if (isGroup(child)) {
            html += buildGroupHtml(child, depth, optionSets);
        } else {
            html += buildFilterRuleRowHtml(child, optionSets);
        }
    });
    return html;
}

function renderTree(containerEl, children, optionSets, setHint) {
    setInnerHTML(containerEl, buildChildrenHtml(children, 0, optionSets));

    const reRender = () => renderTree(containerEl, children, optionSets, setHint);
    bindChildrenEvents(containerEl, children, 0, optionSets, setHint, reRender);
}

function findNodeIndex(children, id) {
    return children.findIndex((c) => c.id === id);
}

function bindChildrenEvents(containerEl, children, depth, optionSets, setHint, reRender) {
    const directChildren = Array.from(containerEl.children);

    for (const el of directChildren) {
        if (el.classList.contains('anytable-adv-rule-operator')) {
            const button = el.querySelector('.anytable-adv-inline-operator');
            const ruleId = getNextSiblingNodeId(el);
            if (button && ruleId !== null) {
                const idx = findNodeIndex(children, ruleId);
                if (idx >= 0) {
                    const currentValue = children[idx].operator || 'AND';
                    setDropdownButtonValue(button, currentValue, getDropdownOptionLabel(optionSets.operatorOptions, currentValue, currentValue));
                    button.addEventListener('click', () => {
                        openDropdownPopup({
                            anchorButton: button,
                            currentValue: children[idx].operator || 'AND',
                            groups: optionSets.operatorOptions,
                            onSelect: (newValue) => {
                                children[idx].operator = newValue;
                                setDropdownButtonValue(button, newValue, getDropdownOptionLabel(optionSets.operatorOptions, newValue, newValue));
                            }
                        });
                    });
                }
            }
            continue;
        }

        const ruleId = el.getAttribute('data-rule-id');
        const groupId = el.getAttribute('data-group-id');

        if (ruleId) {
            const idx = findNodeIndex(children, ruleId);
            if (idx < 0) continue;
            const rule = children[idx];

            const columnButton = el.querySelector('.anytable-adv-filter-column');
            if (columnButton) {
                setDropdownButtonValue(columnButton, rule.column, getColumnLabel(optionSets.columnTitles, rule.column));
                columnButton.addEventListener('click', () => {
                    openDropdownPopup({
                        anchorButton: columnButton,
                        currentValue: String(rule.column),
                        groups: optionSets.columnOptions,
                        onSelect: (newValue) => {
                            rule.column = Number(newValue);
                            setDropdownButtonValue(columnButton, newValue, getColumnLabel(optionSets.columnTitles, rule.column));
                        }
                    });
                });
            }

            const comparatorButton = el.querySelector('.anytable-adv-comparator');
            if (comparatorButton) {
                setDropdownButtonValue(comparatorButton, rule.comparator, getDropdownOptionLabel(optionSets.comparatorOptions, rule.comparator, rule.comparator));
            }
            setupFilterComparatorVisibility(el);

            const negateBtn = el.querySelector('.anytable-adv-negate');
            if (negateBtn) {
                negateBtn.addEventListener('click', () => {
                    rule.negated = !rule.negated;
                    negateBtn.classList.toggle('active', rule.negated);
                });
            }

            if (comparatorButton) {
                comparatorButton.addEventListener('click', () => {
                    openDropdownPopup({
                        anchorButton: comparatorButton,
                        currentValue: rule.comparator,
                        groups: optionSets.comparatorOptions,
                        onSelect: (newValue) => {
                            rule.comparator = newValue;
                            setDropdownButtonValue(comparatorButton, newValue, getDropdownOptionLabel(optionSets.comparatorOptions, newValue, newValue));
                            setupFilterComparatorVisibility(el);
                        }
                    });
                });
            }

            const valueInput = el.querySelector('.anytable-adv-value');
            if (valueInput) {
                valueInput.addEventListener('input', () => {
                    rule.value = valueInput.value;
                });
            }

            const minInput = el.querySelector('.anytable-adv-min');
            const maxInput = el.querySelector('.anytable-adv-max');
            if (minInput) {
                minInput.addEventListener('input', () => {
                    rule.options = rule.options || {};
                    rule.options.min = minInput.value;
                });
            }
            if (maxInput) {
                maxInput.addEventListener('input', () => {
                    rule.options = rule.options || {};
                    rule.options.max = maxInput.value;
                });
            }

            const flagsInput = el.querySelector('.anytable-adv-flags');
            if (flagsInput) {
                flagsInput.addEventListener('input', () => {
                    rule.options = rule.options || {};
                    rule.options.flags = flagsInput.value;
                });
            }

            const removeBtn = el.querySelector('.anytable-adv-remove-rule');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    closeDropdownPopup();
                    if (children.length <= 1) {
                        setHint(translate('advancedPanel.filter.hint.keepOneRule'), true);
                        return;
                    }
                    children.splice(idx, 1);
                    if (children.length > 0 && children[0].operator) {
                        delete children[0].operator;
                    }
                    reRender();
                });
            }
        } else if (groupId) {
            const idx = findNodeIndex(children, groupId);
            if (idx < 0) continue;
            const groupNode = children[idx];

            const negateBtn = el.querySelector(':scope > .anytable-adv-group-header > .anytable-adv-negate');
            if (negateBtn) {
                negateBtn.addEventListener('click', () => {
                    groupNode.negated = !groupNode.negated;
                    negateBtn.classList.toggle('active', groupNode.negated);
                });
            }

            const removeGroupBtn = el.querySelector(':scope > .anytable-adv-group-header > .anytable-adv-remove-group');
            if (removeGroupBtn) {
                removeGroupBtn.addEventListener('click', () => {
                    closeDropdownPopup();
                    if (children.length <= 1) {
                        setHint(translate('advancedPanel.filter.hint.keepOneRule'), true);
                        return;
                    }
                    children.splice(idx, 1);
                    if (children.length > 0 && children[0].operator) {
                        delete children[0].operator;
                    }
                    reRender();
                });
            }

            const addRuleBtn = el.querySelector(':scope > .anytable-adv-group-actions > .anytable-adv-add-rule');
            if (addRuleBtn) {
                addRuleBtn.addEventListener('click', () => {
                    closeDropdownPopup();
                    const newRule = createDefaultFilterRule(0);
                    newRule.operator = 'AND';
                    groupNode.children.push(newRule);
                    reRender();
                    setHint('');
                });
            }

            const addGroupBtn = el.querySelector(':scope > .anytable-adv-group-actions > .anytable-adv-add-group');
            if (addGroupBtn) {
                addGroupBtn.addEventListener('click', () => {
                    closeDropdownPopup();
                    if (depth + 1 >= MAX_NESTING_DEPTH) {
                        setHint(translate('advancedPanel.filter.hint.maxDepth', {max: MAX_NESTING_DEPTH}), true);
                        return;
                    }
                    const newGroup = createDefaultGroup(0);
                    newGroup.operator = 'AND';
                    groupNode.children.push(newGroup);
                    reRender();
                    setHint('');
                });
            }

            const groupChildrenContainer = el.querySelector(':scope > .anytable-adv-group-children');
            if (groupChildrenContainer) {
                bindChildrenEvents(groupChildrenContainer, groupNode.children, depth + 1, optionSets, setHint, reRender);
            }
        }
    }
}

function getNextSiblingNodeId(operatorEl) {
    let next = operatorEl.nextElementSibling;
    while (next) {
        const ruleId = next.getAttribute('data-rule-id');
        if (ruleId) return ruleId;
        const groupId = next.getAttribute('data-group-id');
        if (groupId) return groupId;
        next = next.nextElementSibling;
    }
    return null;
}

function collectRuleTree(containerEl, children) {
    const collected = [];

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (isGroup(child)) {
            const groupEl = containerEl.querySelector(`:scope > [data-group-id="${CSS.escape(child.id)}"]`);
            if (!groupEl) continue;

            const negated = groupEl.querySelector(':scope > .anytable-adv-group-header > .anytable-adv-negate')?.classList.contains('active') || false;
            const groupChildrenContainer = groupEl.querySelector(':scope > .anytable-adv-group-children');

            const subResult = collectRuleTree(groupChildrenContainer, child.children);
            if (subResult.error) return subResult;

            const groupRule = {
                id: child.id,
                negated,
                children: subResult.rules
            };
            if (i > 0) {
                groupRule.operator = child.operator || 'AND';
            }
            collected.push(groupRule);
        } else {
            const rowEl = containerEl.querySelector(`:scope > [data-rule-id="${CSS.escape(child.id)}"]`);
            if (!rowEl) continue;

            const {rule, error} = parseFilterRuleRow(rowEl);
            if (error) return {error};

            if (i > 0) {
                rule.operator = child.operator || 'AND';
            }
            collected.push(rule);
        }
    }

    return {rules: collected};
}

function parseFilterRuleRow(rowElement) {
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
        const valueText = rowElement.querySelector('.anytable-adv-value').value;
        const numericValue = parseNumberLike(valueText);
        if (Number.isNaN(numericValue)) {
            return {error: translate('advancedPanel.filter.errors.numericRequired')};
        }
        rule.value = numericValue;
        return {rule};
    }

    const value = rowElement.querySelector('.anytable-adv-value').value;
    rule.value = value;
    return {rule};
}

function setupFilterComparatorVisibility(rowElement) {
    const comparatorButton = rowElement.querySelector('.anytable-adv-comparator');
    const valueInput = rowElement.querySelector('.anytable-adv-value');
    const rangeBox = rowElement.querySelector('.anytable-adv-range');
    const flagsInput = rowElement.querySelector('.anytable-adv-flags');

    const applyVisibility = () => {
        const comparator = getDropdownButtonValue(comparatorButton);
        const showRange = comparator === 'between';
        const showRegex = comparator === 'regex';
        const hideValue = comparator === 'between' || comparator === 'isEmpty' || comparator === 'isNotEmpty';

        rangeBox.style.display = showRange ? '' : 'none';
        flagsInput.style.display = showRegex ? '' : 'none';
        valueInput.style.display = hideValue ? 'none' : '';
    };

    applyVisibility();
}

export function openAdvancedFilterPanel({
    columnTitles,
    initialRuleGroup,
    onApply,
    onCancel
}) {
    const {overlay, dialog, destroy} = createOverlayAndDialog();
    const optionSets = {
        columnTitles,
        columnOptions: buildColumnOptionGroups(columnTitles),
        comparatorOptions: buildComparatorOptionGroups(),
        operatorOptions: buildOperatorOptionGroups()
    };
    const currentRules = ensureFilterRules(initialRuleGroup, 0);

    // 创建 header
    const header = document.createElement('div');
    header.className = 'anytable-advanced-header';

    const title = document.createElement('div');
    title.className = 'anytable-advanced-title';
    title.textContent = translate('advancedPanel.filter.title');
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'anytable-advanced-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', translate('advancedPanel.common.close'));
    closeBtn.appendChild(createCloseIconSvg());
    header.appendChild(closeBtn);

    // 创建 body
    const body = document.createElement('div');
    body.className = 'anytable-advanced-body';

    const ruleList = document.createElement('div');
    ruleList.className = 'anytable-adv-rule-list';
    body.appendChild(ruleList);

    const groupActions = document.createElement('div');
    groupActions.className = 'anytable-adv-group-actions';

    const addRuleBtn = document.createElement('button');
    addRuleBtn.type = 'button';
    addRuleBtn.className = 'anytable-advanced-btn anytable-adv-add-rule';
    addRuleBtn.textContent = translate('advancedPanel.filter.addRule');
    groupActions.appendChild(addRuleBtn);

    const addGroupBtn = document.createElement('button');
    addGroupBtn.type = 'button';
    addGroupBtn.className = 'anytable-advanced-btn anytable-adv-add-group';
    addGroupBtn.textContent = translate('advancedPanel.filter.addGroup');
    groupActions.appendChild(addGroupBtn);

    body.appendChild(groupActions);

    const hintElement = document.createElement('div');
    hintElement.className = 'anytable-advanced-hint';
    hintElement.setAttribute('data-role', 'hint');
    body.appendChild(hintElement);

    // 创建 footer
    const footer = document.createElement('div');
    footer.className = 'anytable-advanced-footer';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'anytable-advanced-btn anytable-advanced-reset';
    resetBtn.textContent = translate('advancedPanel.common.reset');
    footer.appendChild(resetBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'anytable-advanced-btn anytable-advanced-cancel';
    cancelBtn.textContent = translate('advancedPanel.common.cancel');
    footer.appendChild(cancelBtn);

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'anytable-advanced-btn primary anytable-advanced-apply';
    applyBtn.textContent = translate('advancedPanel.common.apply');
    footer.appendChild(applyBtn);

    // 组装对话框
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);

    function setHint(message, isError = false) {
        hintElement.textContent = message || '';
        hintElement.classList.toggle('error', Boolean(isError));
    }

    function closePanel(triggerCancel = true) {
        closeDropdownPopup();
        destroy();
        if (triggerCancel && typeof onCancel === 'function') {
            onCancel();
        }
    }

    function doRender() {
        renderTree(ruleList, currentRules, optionSets, setHint);
    }

    doRender();

    const rootActions = dialog.querySelector('.anytable-advanced-body > .anytable-adv-group-actions');

    rootActions.querySelector('.anytable-adv-add-rule').addEventListener('click', () => {
        closeDropdownPopup();
        const newRule = createDefaultFilterRule(0);
        if (currentRules.length > 0) {
            newRule.operator = 'AND';
        }
        currentRules.push(newRule);
        doRender();
        setHint('');
    });

    rootActions.querySelector('.anytable-adv-add-group').addEventListener('click', () => {
        closeDropdownPopup();
        const newGroup = createDefaultGroup(0);
        if (currentRules.length > 0) {
            newGroup.operator = 'AND';
        }
        currentRules.push(newGroup);
        doRender();
        setHint('');
    });

    dialog.querySelector('.anytable-advanced-close').addEventListener('click', () => closePanel(true));
    dialog.querySelector('.anytable-advanced-cancel').addEventListener('click', () => closePanel(true));
    dialog.querySelector('.anytable-advanced-reset').addEventListener('click', () => {
        closeDropdownPopup();
        currentRules.length = 0;
        currentRules.push(createDefaultFilterRule(0));
        doRender();
        setHint(translate('advancedPanel.filter.hint.resetDone'));
    });

    dialog.querySelector('.anytable-advanced-apply').addEventListener('click', () => {
        if (currentRules.length === 0) {
            setHint(translate('advancedPanel.filter.hint.needOneRule'), true);
            return;
        }

        const {rules, error} = collectRuleTree(ruleList, currentRules);
        if (error) {
            setHint(error, true);
            return;
        }

        if (!rules || rules.length === 0) {
            setHint(translate('advancedPanel.filter.hint.needOneRule'), true);
            return;
        }

        const ruleGroup = {
            id: `group-${Date.now()}`,
            children: rules
        };

        if (typeof onApply === 'function') {
            onApply(ruleGroup);
        }
        closePanel(false);
    });

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closePanel(true);
        }
    });

    return {
        close: () => closePanel(false),
        overlay,
        dialog
    };
}
