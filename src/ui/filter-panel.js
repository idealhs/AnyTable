import { escapeHtml, createCloseIconSvg, setInnerHTML, parseNumberLike, translate, getColumnOptionsHtml, createOverlayAndDialog } from './panel-utils.js';

function buildFilterOperatorHtml(operator) {
    return `
        <div class="anytable-adv-rule-operator">
            <select class="anytable-adv-inline-operator">
                <option value="AND">${translate('advancedPanel.filter.operator.and')}</option>
                <option value="OR">${translate('advancedPanel.filter.operator.or')}</option>
            </select>
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

function buildFilterRuleRowHtml(rule, columnOptionsHtml) {
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
                <select class="anytable-adv-filter-column">${columnOptionsHtml}</select>
                <select class="anytable-adv-comparator">
                    <option value="contains">${translate('advancedPanel.filter.comparator.contains')}</option>
                    <option value="startsWith">${translate('advancedPanel.filter.comparator.startsWith')}</option>
                    <option value="endsWith">${translate('advancedPanel.filter.comparator.endsWith')}</option>
                    <option value="equals">${translate('advancedPanel.filter.comparator.equals')}</option>
                    <option value="regex">${translate('advancedPanel.filter.comparator.regex')}</option>
                    <option value=">">${translate('advancedPanel.filter.comparator.gt')}</option>
                    <option value=">=">${translate('advancedPanel.filter.comparator.gte')}</option>
                    <option value="<">${translate('advancedPanel.filter.comparator.lt')}</option>
                    <option value="<=">${translate('advancedPanel.filter.comparator.lte')}</option>
                    <option value="between">${translate('advancedPanel.filter.comparator.between')}</option>
                    <option value="isEmpty">${translate('advancedPanel.filter.comparator.isEmpty')}</option>
                    <option value="isNotEmpty">${translate('advancedPanel.filter.comparator.isNotEmpty')}</option>
                </select>
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

function buildGroupHtml(groupNode, depth, columnOptionsHtml) {
    const negated = groupNode.negated || false;
    return `
        <div class="anytable-adv-rule-group" data-group-id="${escapeHtml(groupNode.id)}">
            <div class="anytable-adv-group-header">
                <button type="button" class="anytable-adv-negate${negated ? ' active' : ''}" title="${translate('advancedPanel.filter.groupNegateTooltip')}">!</button>
                <span class="anytable-adv-group-label">${translate('advancedPanel.filter.groupLabel')}</span>
                <button type="button" class="anytable-adv-remove-group">${translate('advancedPanel.common.delete')}</button>
            </div>
            <div class="anytable-adv-group-children">
                ${buildChildrenHtml(groupNode.children, depth + 1, columnOptionsHtml)}
            </div>
            <div class="anytable-adv-group-actions">
                <button type="button" class="anytable-advanced-btn anytable-adv-add-rule">${translate('advancedPanel.filter.addRule')}</button>
                <button type="button" class="anytable-advanced-btn anytable-adv-add-group">${translate('advancedPanel.filter.addGroup')}</button>
            </div>
        </div>
    `;
}

function buildChildrenHtml(children, depth, columnOptionsHtml) {
    let html = '';
    children.forEach((child, index) => {
        if (index > 0) {
            html += buildFilterOperatorHtml(child.operator || 'AND');
        }
        if (isGroup(child)) {
            html += buildGroupHtml(child, depth, columnOptionsHtml);
        } else {
            html += buildFilterRuleRowHtml(child, columnOptionsHtml);
        }
    });
    return html;
}

function renderTree(containerEl, children, columnOptionsHtml, setHint) {
    setInnerHTML(containerEl, buildChildrenHtml(children, 0, columnOptionsHtml));

    const reRender = () => renderTree(containerEl, children, columnOptionsHtml, setHint);
    bindChildrenEvents(containerEl, children, 0, columnOptionsHtml, setHint, reRender);
}

function findNodeIndex(children, id) {
    return children.findIndex((c) => c.id === id);
}

function bindChildrenEvents(containerEl, children, depth, columnOptionsHtml, setHint, reRender) {
    const directChildren = Array.from(containerEl.children);

    for (const el of directChildren) {
        if (el.classList.contains('anytable-adv-rule-operator')) {
            const select = el.querySelector('.anytable-adv-inline-operator');
            const ruleId = getNextSiblingNodeId(el);
            if (select && ruleId !== null) {
                const idx = findNodeIndex(children, ruleId);
                if (idx >= 0) {
                    select.value = children[idx].operator || 'AND';
                    select.addEventListener('change', () => {
                        children[idx].operator = select.value;
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

            const columnSelect = el.querySelector('.anytable-adv-filter-column');
            if (columnSelect) {
                columnSelect.value = String(rule.column);
                columnSelect.addEventListener('change', () => {
                    rule.column = Number(columnSelect.value);
                });
            }

            const comparatorSelect = el.querySelector('.anytable-adv-comparator');
            if (comparatorSelect) {
                comparatorSelect.value = rule.comparator;
            }
            setupFilterComparatorVisibility(el);

            const negateBtn = el.querySelector('.anytable-adv-negate');
            if (negateBtn) {
                negateBtn.addEventListener('click', () => {
                    rule.negated = !rule.negated;
                    negateBtn.classList.toggle('active', rule.negated);
                });
            }

            if (comparatorSelect) {
                comparatorSelect.addEventListener('change', () => {
                    rule.comparator = comparatorSelect.value;
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
                bindChildrenEvents(groupChildrenContainer, groupNode.children, depth + 1, columnOptionsHtml, setHint, reRender);
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
    const comparator = rowElement.querySelector('.anytable-adv-comparator').value;
    const negated = rowElement.querySelector('.anytable-adv-negate').classList.contains('active');
    const column = Number(rowElement.querySelector('.anytable-adv-filter-column').value);

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
    const comparatorSelect = rowElement.querySelector('.anytable-adv-comparator');
    const valueInput = rowElement.querySelector('.anytable-adv-value');
    const rangeBox = rowElement.querySelector('.anytable-adv-range');
    const flagsInput = rowElement.querySelector('.anytable-adv-flags');

    const applyVisibility = () => {
        const comparator = comparatorSelect.value;
        const showRange = comparator === 'between';
        const showRegex = comparator === 'regex';
        const hideValue = comparator === 'between' || comparator === 'isEmpty' || comparator === 'isNotEmpty';

        rangeBox.style.display = showRange ? '' : 'none';
        flagsInput.style.display = showRegex ? '' : 'none';
        valueInput.style.display = hideValue ? 'none' : '';
    };

    comparatorSelect.addEventListener('change', applyVisibility);
    applyVisibility();
}

export function openAdvancedFilterPanel({
    columnTitles,
    initialRuleGroup,
    onApply,
    onCancel
}) {
    const {overlay, dialog} = createOverlayAndDialog();
    const columnOptionsHtml = getColumnOptionsHtml(columnTitles);
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
        overlay.remove();
        if (triggerCancel && typeof onCancel === 'function') {
            onCancel();
        }
    }

    function doRender() {
        renderTree(ruleList, currentRules, columnOptionsHtml, setHint);
    }

    doRender();

    const rootActions = dialog.querySelector('.anytable-advanced-body > .anytable-adv-group-actions');

    rootActions.querySelector('.anytable-adv-add-rule').addEventListener('click', () => {
        const newRule = createDefaultFilterRule(0);
        if (currentRules.length > 0) {
            newRule.operator = 'AND';
        }
        currentRules.push(newRule);
        doRender();
        setHint('');
    });

    rootActions.querySelector('.anytable-adv-add-group').addEventListener('click', () => {
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
