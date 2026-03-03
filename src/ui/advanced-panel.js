import i18n from '../i18n/i18n.js';
import { parseNumberWithUnit } from '../core/type-parser.js';

function escapeHtml(text) {
    return (text ?? '')
        .toString()
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

const MATERIAL_CLOSE_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>';

function parseNumberLike(value) {
    if (value === null || value === undefined) return NaN;
    const normalized = value.toString().replace(/,/g, '').trim();
    return Number(normalized);
}

function translate(key, params = null) {
    const message = i18n.t(key);
    if (!params || typeof message !== 'string') {
        return message;
    }

    return Object.entries(params).reduce(
        (output, [name, value]) => output.replaceAll(`{${name}}`, String(value)),
        message
    );
}

function getColumnOptionsHtml(columnTitles) {
    return columnTitles
        .map((title, index) => `<option value="${index}">${escapeHtml(title || translate('advancedPanel.common.columnFallback', {index: index + 1}))}</option>`)
        .join('');
}

function createOverlayAndDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'anytable-advanced-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'anytable-advanced-dialog';

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    return {overlay, dialog};
}

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

function buildFilterRuleRowHtml(rule) {
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
        column: fallbackColumnIndex,
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

function buildGroupHtml(groupNode, depth) {
    const negated = groupNode.negated || false;
    return `
        <div class="anytable-adv-rule-group" data-group-id="${escapeHtml(groupNode.id)}">
            <div class="anytable-adv-group-header">
                <button type="button" class="anytable-adv-negate${negated ? ' active' : ''}" title="${translate('advancedPanel.filter.groupNegateTooltip')}">!</button>
                <span class="anytable-adv-group-label">${translate('advancedPanel.filter.groupLabel')}</span>
                <button type="button" class="anytable-adv-remove-group">${translate('advancedPanel.common.delete')}</button>
            </div>
            <div class="anytable-adv-group-children">
                ${buildChildrenHtml(groupNode.children, depth + 1)}
            </div>
            <div class="anytable-adv-group-actions">
                <button type="button" class="anytable-advanced-btn anytable-adv-add-rule">${translate('advancedPanel.filter.addRule')}</button>
                <button type="button" class="anytable-advanced-btn anytable-adv-add-group">${translate('advancedPanel.filter.addGroup')}</button>
            </div>
        </div>
    `;
}

function buildChildrenHtml(children, depth) {
    let html = '';
    children.forEach((child, index) => {
        if (index > 0) {
            html += buildFilterOperatorHtml(child.operator || 'AND');
        }
        if (isGroup(child)) {
            html += buildGroupHtml(child, depth);
        } else {
            html += buildFilterRuleRowHtml(child);
        }
    });
    return html;
}

function renderTree(containerEl, children, columnIndex, setHint) {
    containerEl.innerHTML = buildChildrenHtml(children, 0);

    const reRender = () => renderTree(containerEl, children, columnIndex, setHint);
    bindChildrenEvents(containerEl, children, 0, columnIndex, setHint, reRender);
}

function findNodeIndex(children, id) {
    return children.findIndex((c) => c.id === id);
}

function bindChildrenEvents(containerEl, children, depth, columnIndex, setHint, reRender) {
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
                    const newRule = createDefaultFilterRule(columnIndex);
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
                    const newGroup = createDefaultGroup(columnIndex);
                    newGroup.operator = 'AND';
                    groupNode.children.push(newGroup);
                    reRender();
                    setHint('');
                });
            }

            const groupChildrenContainer = el.querySelector(':scope > .anytable-adv-group-children');
            if (groupChildrenContainer) {
                bindChildrenEvents(groupChildrenContainer, groupNode.children, depth + 1, columnIndex, setHint, reRender);
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

function collectRuleTree(containerEl, children, columnIndex) {
    const collected = [];

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (isGroup(child)) {
            const groupEl = containerEl.querySelector(`:scope > [data-group-id="${CSS.escape(child.id)}"]`);
            if (!groupEl) continue;

            const negated = groupEl.querySelector(':scope > .anytable-adv-group-header > .anytable-adv-negate')?.classList.contains('active') || false;
            const groupChildrenContainer = groupEl.querySelector(':scope > .anytable-adv-group-children');

            const subResult = collectRuleTree(groupChildrenContainer, child.children, columnIndex);
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

            const {rule, error} = parseFilterRuleRow(rowEl, columnIndex);
            if (error) return {error};

            if (i > 0) {
                rule.operator = child.operator || 'AND';
            }
            collected.push(rule);
        }
    }

    return {rules: collected};
}

function parseFilterRuleRow(rowElement, columnIndex) {
    const comparator = rowElement.querySelector('.anytable-adv-comparator').value;
    const negated = rowElement.querySelector('.anytable-adv-negate').classList.contains('active');

    const rule = {
        id: `leaf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        column: columnIndex,
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

function detectColumnType(values) {
    if (!values || values.length === 0) return 'text';

    const counts = {};
    for (const val of values) {
        const result = parseNumberWithUnit(val);
        const type = result.success ? result.type : 'text';
        counts[type] = (counts[type] || 0) + 1;
    }

    let best = 'text';
    let bestCount = 0;
    for (const [type, count] of Object.entries(counts)) {
        if (count > bestCount) {
            best = type;
            bestCount = count;
        }
    }
    return best;
}

function buildSortRuleRowHtml(columnOptionsHtml, rule) {
    const column = Number.isInteger(rule?.column) ? rule.column : 0;
    const direction = rule?.direction === 'desc' ? 'desc' : 'asc';
    const type = rule?.type || 'auto';

    return `
        <div class="anytable-adv-sort-row" data-sort-id="${escapeHtml(rule.id)}">
            <div class="anytable-adv-sort-grid">
                <select class="anytable-adv-sort-column">${columnOptionsHtml}</select>
                <select class="anytable-adv-sort-direction">
                    <option value="asc">${translate('advancedPanel.sort.direction.asc')}</option>
                    <option value="desc">${translate('advancedPanel.sort.direction.desc')}</option>
                </select>
                <select class="anytable-adv-sort-type">
                    <option value="auto">${translate('advancedPanel.sort.type.auto')}</option>
                    <option value="number">${translate('advancedPanel.sort.type.number')}</option>
                    <option value="text">${translate('advancedPanel.sort.type.text')}</option>
                    <option value="date">${translate('advancedPanel.sort.type.date')}</option>
                </select>
                <span class="anytable-adv-detected-type" style="display:${type === 'auto' ? '' : 'none'};"></span>
                <button type="button" class="anytable-adv-remove-sort-rule">${translate('advancedPanel.common.delete')}</button>
            </div>
        </div>
    `;
}

function parseSortRuleRow(rowElement) {
    const column = Number(rowElement.querySelector('.anytable-adv-sort-column').value);
    if (Number.isNaN(column)) {
        return {error: translate('advancedPanel.sort.errors.invalidColumn')};
    }

    const direction = rowElement.querySelector('.anytable-adv-sort-direction').value === 'desc' ? 'desc' : 'asc';
    const type = rowElement.querySelector('.anytable-adv-sort-type').value || 'auto';

    const rule = {
        column,
        direction,
        type,
        unitConfig: null
    };

    return {rule};
}

function fitSelectWidth(selectEl, minWidth = 0) {
    const selected = selectEl.options[selectEl.selectedIndex];
    if (!selected) return;
    const measure = document.createElement('span');
    measure.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + getComputedStyle(selectEl).font;
    measure.textContent = selected.textContent;
    document.body.appendChild(measure);
    selectEl.style.width = Math.max(measure.offsetWidth + 28, minWidth) + 'px';
    measure.remove();
}

function updateDetectedTypeLabel(rowElement, getColumnValues) {
    const typeSelect = rowElement.querySelector('.anytable-adv-sort-type');
    const label = rowElement.querySelector('.anytable-adv-detected-type');
    const columnSelect = rowElement.querySelector('.anytable-adv-sort-column');
    if (!label) return;

    if (typeSelect.value !== 'auto') {
        label.style.display = 'none';
        return;
    }

    label.style.display = '';
    if (typeof getColumnValues !== 'function') {
        label.textContent = '';
        return;
    }

    const colIdx = Number(columnSelect.value);
    const values = getColumnValues(colIdx);
    const detected = detectColumnType(values);
    const detectedLabel = translate(`advancedPanel.sort.detectedType.${detected}`);
    label.textContent = detectedLabel ? `→ ${detectedLabel}` : '';
}

function setupSortTypeVisibility(rowElement, getColumnValues) {
    const typeSelect = rowElement.querySelector('.anytable-adv-sort-type');
    const columnSelect = rowElement.querySelector('.anytable-adv-sort-column');

    const applyVisibility = () => {
        updateDetectedTypeLabel(rowElement, getColumnValues);
    };

    typeSelect.addEventListener('change', applyVisibility);
    columnSelect.addEventListener('change', () => updateDetectedTypeLabel(rowElement, getColumnValues));
    applyVisibility();
}

export function openAdvancedFilterPanel({
    columnIndex,
    columnTitles,
    initialRuleGroup,
    onApply,
    onCancel
}) {
    const {overlay, dialog} = createOverlayAndDialog();
    const currentRules = ensureFilterRules(initialRuleGroup, columnIndex);
    const columnName = columnTitles[columnIndex] || translate('advancedPanel.common.columnFallback', {index: columnIndex + 1});

    dialog.innerHTML = `
        <div class="anytable-advanced-header">
            <div class="anytable-advanced-title">${translate('advancedPanel.filter.title')} - ${escapeHtml(columnName)}</div>
            <button class="anytable-advanced-close" type="button" aria-label="${translate('advancedPanel.common.close')}">${MATERIAL_CLOSE_ICON_SVG}</button>
        </div>
        <div class="anytable-advanced-body">
            <div class="anytable-adv-rule-list"></div>
            <div class="anytable-adv-group-actions">
                <button type="button" class="anytable-advanced-btn anytable-adv-add-rule">${translate('advancedPanel.filter.addRule')}</button>
                <button type="button" class="anytable-advanced-btn anytable-adv-add-group">${translate('advancedPanel.filter.addGroup')}</button>
            </div>
            <div class="anytable-advanced-hint" data-role="hint"></div>
        </div>
        <div class="anytable-advanced-footer">
            <button type="button" class="anytable-advanced-btn anytable-advanced-reset">${translate('advancedPanel.common.reset')}</button>
            <button type="button" class="anytable-advanced-btn anytable-advanced-cancel">${translate('advancedPanel.common.cancel')}</button>
            <button type="button" class="anytable-advanced-btn primary anytable-advanced-apply">${translate('advancedPanel.common.apply')}</button>
        </div>
    `;

    const ruleList = dialog.querySelector('.anytable-adv-rule-list');
    const hintElement = dialog.querySelector('[data-role="hint"]');

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
        renderTree(ruleList, currentRules, columnIndex, setHint);
    }

    doRender();

    const rootActions = dialog.querySelector('.anytable-advanced-body > .anytable-adv-group-actions');

    rootActions.querySelector('.anytable-adv-add-rule').addEventListener('click', () => {
        const newRule = createDefaultFilterRule(columnIndex);
        if (currentRules.length > 0) {
            newRule.operator = 'AND';
        }
        currentRules.push(newRule);
        doRender();
        setHint('');
    });

    rootActions.querySelector('.anytable-adv-add-group').addEventListener('click', () => {
        const newGroup = createDefaultGroup(columnIndex);
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
        currentRules.push(createDefaultFilterRule(columnIndex));
        doRender();
        setHint(translate('advancedPanel.filter.hint.resetDone'));
    });

    dialog.querySelector('.anytable-advanced-apply').addEventListener('click', () => {
        if (currentRules.length === 0) {
            setHint(translate('advancedPanel.filter.hint.needOneRule'), true);
            return;
        }

        const {rules, error} = collectRuleTree(ruleList, currentRules, columnIndex);
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

export function openAdvancedSortPanel({
    columnIndex,
    columnTitles,
    initialRules,
    tableElement,
    getColumnValues,
    onApply,
    onCancel
}) {
    const {overlay, dialog} = createOverlayAndDialog();
    const columnOptionsHtml = getColumnOptionsHtml(columnTitles);
    const seedRules = Array.isArray(initialRules) && initialRules.length
        ? initialRules
        : [{column: columnIndex, direction: 'asc', type: 'auto', unitConfig: null, id: generateId('sort')}];

    dialog.innerHTML = `
        <div class="anytable-advanced-header">
            <div class="anytable-advanced-title">${translate('advancedPanel.sort.title')}</div>
            <button class="anytable-advanced-close" type="button" aria-label="${translate('advancedPanel.common.close')}">${MATERIAL_CLOSE_ICON_SVG}</button>
        </div>
        <div class="anytable-advanced-body">
            <div class="anytable-adv-sort-list"></div>
            <div class="anytable-adv-group-actions">
                <button type="button" class="anytable-advanced-btn anytable-adv-add-sort-rule">${translate('advancedPanel.sort.addRule')}</button>
            </div>
            <div class="anytable-advanced-hint" data-role="hint"></div>
        </div>
        <div class="anytable-advanced-footer">
            <button type="button" class="anytable-advanced-btn anytable-advanced-reset">${translate('advancedPanel.common.reset')}</button>
            <button type="button" class="anytable-advanced-btn anytable-advanced-cancel">${translate('advancedPanel.common.cancel')}</button>
            <button type="button" class="anytable-advanced-btn primary anytable-advanced-apply">${translate('advancedPanel.common.apply')}</button>
        </div>
    `;

    const addBtn = dialog.querySelector('.anytable-adv-add-sort-rule');
    const selectMinWidth = addBtn ? addBtn.offsetWidth : 120;

    const sortList = dialog.querySelector('.anytable-adv-sort-list');
    const hintElement = dialog.querySelector('[data-role="hint"]');

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

    const currentRules = seedRules.map((rule) => ({
        id: generateId('sort'),
        column: Number.isInteger(rule.column) ? rule.column : columnIndex,
        direction: rule.direction === 'desc' ? 'desc' : 'asc',
        type: rule.type || 'auto',
        unitConfig: rule.unitConfig || null
    }));

    function bindSortRow(row, rules, index) {
        const rule = rules[index];
        const columnSelect = row.querySelector('.anytable-adv-sort-column');
        const directionSelect = row.querySelector('.anytable-adv-sort-direction');
        const typeSelect = row.querySelector('.anytable-adv-sort-type');

        columnSelect.value = String(rule.column);
        directionSelect.value = rule.direction;
        typeSelect.value = rule.type;

        columnSelect.addEventListener('change', () => { rule.column = Number(columnSelect.value); fitSelectWidth(columnSelect, selectMinWidth); });
        directionSelect.addEventListener('change', () => { rule.direction = directionSelect.value; fitSelectWidth(directionSelect); });
        typeSelect.addEventListener('change', () => { rule.type = typeSelect.value; fitSelectWidth(typeSelect, selectMinWidth); });

        fitSelectWidth(columnSelect, selectMinWidth);
        fitSelectWidth(directionSelect);
        fitSelectWidth(typeSelect, selectMinWidth);

        setupSortTypeVisibility(row, getColumnValues);

        row.querySelector('.anytable-adv-remove-sort-rule').addEventListener('click', () => {
            if (rules.length <= 1) {
                setHint(translate('advancedPanel.sort.hint.keepOneRule'), true);
                return;
            }
            const idx = rules.indexOf(rule);
            if (idx >= 0) rules.splice(idx, 1);
            row.remove();
        });
    }

    function renderSortRules(rules) {
        sortList.innerHTML = rules
            .map((rule) => buildSortRuleRowHtml(columnOptionsHtml, rule))
            .join('');

        const rows = Array.from(sortList.querySelectorAll('.anytable-adv-sort-row'));
        rows.forEach((row, index) => bindSortRow(row, rules, index));
    }

    function appendSortRule(rule, rules) {
        const tmp = document.createElement('div');
        tmp.innerHTML = buildSortRuleRowHtml(columnOptionsHtml, rule);
        const row = tmp.firstElementChild;
        sortList.appendChild(row);
        bindSortRow(row, rules, rules.length - 1);
    }

    renderSortRules(currentRules);

    dialog.querySelector('.anytable-adv-add-sort-rule').addEventListener('click', () => {
        const newRule = {
            id: generateId('sort'),
            column: columnIndex,
            direction: 'asc',
            type: 'auto',
            unitConfig: null
        };
        currentRules.push(newRule);
        appendSortRule(newRule, currentRules);
        setHint('');
    });

    dialog.querySelector('.anytable-advanced-close').addEventListener('click', () => closePanel(true));
    dialog.querySelector('.anytable-advanced-cancel').addEventListener('click', () => closePanel(true));
    dialog.querySelector('.anytable-advanced-reset').addEventListener('click', () => {
        currentRules.length = 0;
        currentRules.push({
            id: generateId('sort'),
            column: columnIndex,
            direction: 'asc',
            type: 'auto',
            unitConfig: null
        });
        renderSortRules(currentRules);
        setHint(translate('advancedPanel.sort.hint.resetDone'));
    });

    dialog.querySelector('.anytable-advanced-apply').addEventListener('click', () => {
        const rows = Array.from(sortList.querySelectorAll('.anytable-adv-sort-row'));
        if (!rows.length) {
            setHint(translate('advancedPanel.sort.hint.needOneRule'), true);
            return;
        }

        const rules = [];
        for (const row of rows) {
            const {rule, error} = parseSortRuleRow(row);
            if (error) {
                setHint(error, true);
                return;
            }
            rules.push(rule);
        }

        if (typeof onApply === 'function') {
            onApply(rules);
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
