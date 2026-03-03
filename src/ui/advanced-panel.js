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

function getColumnOptionsHtml(columnTitles) {
    return columnTitles
        .map((title, index) => `<option value="${index}">${escapeHtml(title || `列${index + 1}`)}</option>`)
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

function buildFilterRuleRowHtml(columnOptionsHtml, rule, index) {
    const comparator = rule?.comparator || 'contains';
    const column = Number.isInteger(rule?.column) ? rule.column : 0;
    const value = rule?.value || '';
    const flags = rule?.options?.flags || '';
    const min = rule?.options?.min ?? '';
    const max = rule?.options?.max ?? '';

    const showRange = comparator === 'between';
    const showRegex = comparator === 'regex';
    const hideValue = comparator === 'between' || comparator === 'isEmpty' || comparator === 'isNotEmpty';

    return `
        <div class="anytable-adv-rule-row" data-rule-index="${index}">
            <div class="anytable-adv-rule-grid">
                <select class="anytable-adv-column">${columnOptionsHtml}</select>
                <select class="anytable-adv-comparator">
                    <option value="contains">包含</option>
                    <option value="startsWith">开头是</option>
                    <option value="endsWith">结尾是</option>
                    <option value="equals">等于</option>
                    <option value="regex">正则</option>
                    <option value=">">大于</option>
                    <option value=">=">大于等于</option>
                    <option value="<">小于</option>
                    <option value="<=">小于等于</option>
                    <option value="between">区间</option>
                    <option value="isEmpty">为空</option>
                    <option value="isNotEmpty">不为空</option>
                </select>
                <input type="text" class="anytable-adv-value" placeholder="值" style="display:${hideValue ? 'none' : ''};" value="${escapeHtml(value)}">
                <div class="anytable-adv-range" style="display:${showRange ? '' : 'none'};">
                    <input type="text" class="anytable-adv-min" placeholder="最小值" value="${escapeHtml(min)}">
                    <input type="text" class="anytable-adv-max" placeholder="最大值" value="${escapeHtml(max)}">
                </div>
                <input type="text" class="anytable-adv-flags" placeholder="flags" style="display:${showRegex ? '' : 'none'};" value="${escapeHtml(flags)}">
                <button type="button" class="anytable-advanced-btn danger anytable-adv-remove-rule">删除</button>
            </div>
        </div>
    `;
}

function createDefaultFilterRule(columnIndex) {
    return {
        id: `leaf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        column: columnIndex,
        comparator: 'contains',
        value: '',
        options: {}
    };
}

function ensureFilterRules(initialRuleGroup, fallbackColumnIndex) {
    if (!initialRuleGroup || !Array.isArray(initialRuleGroup.children) || initialRuleGroup.children.length === 0) {
        return {
            operator: 'AND',
            rules: [createDefaultFilterRule(fallbackColumnIndex)]
        };
    }

    return {
        operator: initialRuleGroup.operator === 'OR' ? 'OR' : 'AND',
        rules: initialRuleGroup.children.map((rule) => ({
            id: rule.id || `leaf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            column: Number.isInteger(rule.column) ? rule.column : fallbackColumnIndex,
            comparator: rule.comparator || 'contains',
            value: rule.value || '',
            options: {...(rule.options || {})}
        }))
    };
}

function parseFilterRuleRow(rowElement) {
    const comparator = rowElement.querySelector('.anytable-adv-comparator').value;
    const column = Number(rowElement.querySelector('.anytable-adv-column').value);

    if (Number.isNaN(column)) {
        return {error: '列选择无效'};
    }

    const rule = {
        id: `leaf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        column,
        comparator,
        value: '',
        options: {}
    };

    if (comparator === 'between') {
        const min = parseNumberLike(rowElement.querySelector('.anytable-adv-min').value);
        const max = parseNumberLike(rowElement.querySelector('.anytable-adv-max').value);
        if (Number.isNaN(min) || Number.isNaN(max)) {
            return {error: '区间筛选需要有效的最小值和最大值'};
        }
        if (min > max) {
            return {error: '区间筛选最小值不能大于最大值'};
        }
        rule.options = {min, max};
        return {rule};
    }

    if (comparator === 'regex') {
        const value = rowElement.querySelector('.anytable-adv-value').value.trim();
        const flags = rowElement.querySelector('.anytable-adv-flags').value.trim();
        if (!value) {
            return {error: '正则筛选必须输入表达式'};
        }
        try {
            new RegExp(value, flags);
        } catch (error) {
            return {error: `正则表达式无效：${error.message}`};
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
            return {error: '数值比较器需要有效的数字'};
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

function buildSortRuleRowHtml(columnOptionsHtml, rule, index) {
    const column = Number.isInteger(rule?.column) ? rule.column : 0;
    const direction = rule?.direction === 'desc' ? 'desc' : 'asc';
    const type = rule?.type || 'auto';
    const mappingText = rule?.unitConfig?.mapping
        ? Object.entries(rule.unitConfig.mapping).map(([unit, factor]) => `${unit}=${factor}`).join('\n')
        : '';
    const showCustom = type === 'custom';

    return `
        <div class="anytable-adv-sort-row" data-sort-index="${index}">
            <div class="anytable-adv-sort-grid">
                <select class="anytable-adv-sort-column">${columnOptionsHtml}</select>
                <select class="anytable-adv-sort-direction">
                    <option value="asc">升序</option>
                    <option value="desc">降序</option>
                </select>
                <select class="anytable-adv-sort-type">
                    <option value="auto">自动识别</option>
                    <option value="number">数值</option>
                    <option value="text">文本</option>
                    <option value="date">日期</option>
                    <option value="custom">自定义单位映射</option>
                </select>
                <textarea class="anytable-adv-sort-mapping" rows="3" placeholder="单位=倍率，每行一条" style="display:${showCustom ? '' : 'none'};">${escapeHtml(mappingText)}</textarea>
                <button type="button" class="anytable-advanced-btn danger anytable-adv-remove-sort-rule">删除</button>
            </div>
        </div>
    `;
}

function parseSortMapping(mappingText) {
    const mapping = {};
    const lines = mappingText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    for (const line of lines) {
        const [unitPart, factorPart] = line.split('=');
        const unit = (unitPart || '').trim().toLowerCase();
        const factor = Number((factorPart || '').trim());
        if (!unit || Number.isNaN(factor)) {
            return {error: `单位映射格式错误：${line}`};
        }
        mapping[unit] = factor;
    }

    if (!Object.keys(mapping).length) {
        return {error: '自定义单位映射不能为空'};
    }

    return {mapping};
}

function parseSortRuleRow(rowElement) {
    const column = Number(rowElement.querySelector('.anytable-adv-sort-column').value);
    if (Number.isNaN(column)) {
        return {error: '列选择无效'};
    }

    const direction = rowElement.querySelector('.anytable-adv-sort-direction').value === 'desc' ? 'desc' : 'asc';
    const type = rowElement.querySelector('.anytable-adv-sort-type').value || 'auto';

    const rule = {
        column,
        direction,
        type,
        unitConfig: null
    };

    if (type === 'custom') {
        const mappingInput = rowElement.querySelector('.anytable-adv-sort-mapping');
        const {mapping, error} = parseSortMapping(mappingInput.value);
        if (error) {
            return {error};
        }
        rule.unitConfig = {
            kind: 'custom',
            mapping
        };
    }

    return {rule};
}

function setupSortTypeVisibility(rowElement) {
    const typeSelect = rowElement.querySelector('.anytable-adv-sort-type');
    const mappingInput = rowElement.querySelector('.anytable-adv-sort-mapping');

    const applyVisibility = () => {
        mappingInput.style.display = typeSelect.value === 'custom' ? '' : 'none';
    };

    typeSelect.addEventListener('change', applyVisibility);
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
    const columnOptionsHtml = getColumnOptionsHtml(columnTitles);
    const state = ensureFilterRules(initialRuleGroup, columnIndex);

    dialog.innerHTML = `
        <div class="anytable-advanced-header">
            <div class="anytable-advanced-title">高级筛选</div>
            <button class="anytable-advanced-close" type="button" aria-label="关闭">${MATERIAL_CLOSE_ICON_SVG}</button>
        </div>
        <div class="anytable-advanced-body">
            <div class="anytable-advanced-row compact">
                <label>逻辑关系</label>
                <select class="anytable-adv-operator">
                    <option value="AND">AND（并且）</option>
                    <option value="OR">OR（或者）</option>
                </select>
            </div>
            <div class="anytable-adv-rule-list"></div>
            <div class="anytable-advanced-row compact">
                <button type="button" class="anytable-advanced-btn anytable-adv-add-rule">+ 添加条件</button>
            </div>
            <div class="anytable-advanced-hint" data-role="hint"></div>
        </div>
        <div class="anytable-advanced-footer">
            <button type="button" class="anytable-advanced-btn anytable-advanced-reset">重置</button>
            <button type="button" class="anytable-advanced-btn anytable-advanced-cancel">取消</button>
            <button type="button" class="anytable-advanced-btn primary anytable-advanced-apply">应用</button>
        </div>
    `;

    const operatorSelect = dialog.querySelector('.anytable-adv-operator');
    const ruleList = dialog.querySelector('.anytable-adv-rule-list');
    const hintElement = dialog.querySelector('[data-role="hint"]');

    operatorSelect.value = state.operator;

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

    function renderRules(rules) {
        ruleList.innerHTML = rules
            .map((rule, index) => buildFilterRuleRowHtml(columnOptionsHtml, rule, index))
            .join('');

        const rows = Array.from(ruleList.querySelectorAll('.anytable-adv-rule-row'));
        rows.forEach((row, index) => {
            const rule = rules[index] || createDefaultFilterRule(columnIndex);
            row.querySelector('.anytable-adv-column').value = String(rule.column);
            row.querySelector('.anytable-adv-comparator').value = rule.comparator;

            setupFilterComparatorVisibility(row);

            row.querySelector('.anytable-adv-remove-rule').addEventListener('click', () => {
                if (rules.length <= 1) {
                    setHint('至少保留一个筛选条件。', true);
                    return;
                }
                rules.splice(index, 1);
                renderRules(rules);
            });
        });
    }

    const currentRules = [...state.rules];
    renderRules(currentRules);

    dialog.querySelector('.anytable-adv-add-rule').addEventListener('click', () => {
        currentRules.push(createDefaultFilterRule(columnIndex));
        renderRules(currentRules);
        setHint('');
    });

    dialog.querySelector('.anytable-advanced-close').addEventListener('click', () => closePanel(true));
    dialog.querySelector('.anytable-advanced-cancel').addEventListener('click', () => closePanel(true));
    dialog.querySelector('.anytable-advanced-reset').addEventListener('click', () => {
        operatorSelect.value = 'AND';
        currentRules.length = 0;
        currentRules.push(createDefaultFilterRule(columnIndex));
        renderRules(currentRules);
        setHint('已重置高级筛选配置。');
    });

    dialog.querySelector('.anytable-advanced-apply').addEventListener('click', () => {
        const rows = Array.from(ruleList.querySelectorAll('.anytable-adv-rule-row'));
        if (!rows.length) {
            setHint('请至少添加一个筛选条件。', true);
            return;
        }

        const rules = [];
        for (const row of rows) {
            const {rule, error} = parseFilterRuleRow(row);
            if (error) {
                setHint(error, true);
                return;
            }
            rules.push(rule);
        }

        const ruleGroup = {
            id: `group-${Date.now()}`,
            operator: operatorSelect.value === 'OR' ? 'OR' : 'AND',
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
    onApply,
    onCancel
}) {
    const {overlay, dialog} = createOverlayAndDialog();
    const columnOptionsHtml = getColumnOptionsHtml(columnTitles);
    const seedRules = Array.isArray(initialRules) && initialRules.length
        ? initialRules
        : [{column: columnIndex, direction: 'asc', type: 'auto', unitConfig: null}];

    dialog.innerHTML = `
        <div class="anytable-advanced-header">
            <div class="anytable-advanced-title">高级排序</div>
            <button class="anytable-advanced-close" type="button" aria-label="关闭">${MATERIAL_CLOSE_ICON_SVG}</button>
        </div>
        <div class="anytable-advanced-body">
            <div class="anytable-adv-sort-list"></div>
            <div class="anytable-advanced-row compact">
                <button type="button" class="anytable-advanced-btn anytable-adv-add-sort-rule">+ 添加排序规则</button>
            </div>
            <div class="anytable-advanced-hint" data-role="hint"></div>
        </div>
        <div class="anytable-advanced-footer">
            <button type="button" class="anytable-advanced-btn anytable-advanced-reset">重置</button>
            <button type="button" class="anytable-advanced-btn anytable-advanced-cancel">取消</button>
            <button type="button" class="anytable-advanced-btn primary anytable-advanced-apply">应用</button>
        </div>
    `;

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
        column: Number.isInteger(rule.column) ? rule.column : columnIndex,
        direction: rule.direction === 'desc' ? 'desc' : 'asc',
        type: rule.type || 'auto',
        unitConfig: rule.unitConfig || null
    }));

    function renderSortRules(rules) {
        sortList.innerHTML = rules
            .map((rule, index) => buildSortRuleRowHtml(columnOptionsHtml, rule, index))
            .join('');

        const rows = Array.from(sortList.querySelectorAll('.anytable-adv-sort-row'));
        rows.forEach((row, index) => {
            const rule = rules[index];
            row.querySelector('.anytable-adv-sort-column').value = String(rule.column);
            row.querySelector('.anytable-adv-sort-direction').value = rule.direction;
            row.querySelector('.anytable-adv-sort-type').value = rule.type;

            setupSortTypeVisibility(row);

            row.querySelector('.anytable-adv-remove-sort-rule').addEventListener('click', () => {
                if (rules.length <= 1) {
                    setHint('至少保留一个排序规则。', true);
                    return;
                }
                rules.splice(index, 1);
                renderSortRules(rules);
            });
        });
    }

    renderSortRules(currentRules);

    dialog.querySelector('.anytable-adv-add-sort-rule').addEventListener('click', () => {
        currentRules.push({
            column: columnIndex,
            direction: 'asc',
            type: 'auto',
            unitConfig: null
        });
        renderSortRules(currentRules);
        setHint('');
    });

    dialog.querySelector('.anytable-advanced-close').addEventListener('click', () => closePanel(true));
    dialog.querySelector('.anytable-advanced-cancel').addEventListener('click', () => closePanel(true));
    dialog.querySelector('.anytable-advanced-reset').addEventListener('click', () => {
        currentRules.length = 0;
        currentRules.push({
            column: columnIndex,
            direction: 'asc',
            type: 'auto',
            unitConfig: null
        });
        renderSortRules(currentRules);
        setHint('已重置高级排序配置。');
    });

    dialog.querySelector('.anytable-advanced-apply').addEventListener('click', () => {
        const rows = Array.from(sortList.querySelectorAll('.anytable-adv-sort-row'));
        if (!rows.length) {
            setHint('请至少添加一个排序规则。', true);
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
