import { detectColumnUnitSystem } from '../core/type-parser.js';
import { closeDropdownPopup, fitDropdownButtonWidth, getDropdownButtonValue, openDropdownPopup, setDropdownButtonValue } from './dropdown-popup.js';
import { escapeHtml, createCloseIconSvg, setInnerHTML, translate, createOverlayAndDialog } from './panel-utils.js';

function detectColumnType(values) {
    if (!values || values.length === 0) return 'text';
    return detectColumnUnitSystem(values).type;
}

const SORT_TYPE_GROUPS = [
    ['auto'],
    ['number', 'text', 'date', 'percent'],
    ['duration', 'mass', 'length', 'area', 'volume', 'speed',
     'temperature', 'pressure', 'energy', 'power', 'voltage',
     'current', 'resistance', 'frequency', 'dataSize', 'bitrate']
];

function getTypeLabel(type) {
    return translate(`advancedPanel.sort.type.${type}`) || type;
}

function getButtonLabel(type, getColumnValues, columnIndex) {
    if (type === 'auto') {
        let detectedLabel = '';
        if (typeof getColumnValues === 'function') {
            const values = getColumnValues(columnIndex);
            const detected = detectColumnType(values);
            detectedLabel = getTypeLabel(detected);
        }
        return translate('advancedPanel.sort.typeButton.autoFormat', {type: detectedLabel || '...'});
    }
    return getTypeLabel(type);
}

function updateTypeButtonLabel(rowElement, getColumnValues, minWidth = 0) {
    const btn = rowElement.querySelector('.anytable-adv-sort-type-btn');
    const columnButton = rowElement.querySelector('.anytable-adv-sort-column');
    if (!btn) return;

    const type = getDropdownButtonValue(btn) || 'auto';
    const colIdx = Number(getDropdownButtonValue(columnButton));
    setDropdownButtonValue(btn, type, getButtonLabel(type, getColumnValues, colIdx), {minWidth});
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDirectionLabel(direction) {
    const text = direction === 'desc'
        ? translate('advancedPanel.sort.direction.desc')
        : translate('advancedPanel.sort.direction.asc');
    const arrow = direction === 'desc' ? ' \u2193' : ' \u2191';
    return text + arrow;
}

function getColumnLabel(columnTitles, columnIndex) {
    return columnTitles[columnIndex]
        || translate('advancedPanel.common.columnFallback', {index: columnIndex + 1});
}

function buildOptionButtonHtml(className, value, label) {
    return `<button type="button" class="anytable-adv-select-btn ${className}" data-value="${escapeHtml(String(value))}" aria-expanded="false">${escapeHtml(label)}</button>`;
}

function getSortTypeOptionGroups() {
    return SORT_TYPE_GROUPS.map((group) => group.map((type) => ({
        value: type,
        label: getTypeLabel(type)
    })));
}

function getColumnOptionGroups(columnTitles, usedColumns, currentColumn) {
    return [columnTitles.map((title, index) => ({
        value: String(index),
        label: getColumnLabel(columnTitles, index),
        disabled: index !== currentColumn && usedColumns.has(index)
    }))];
}

function buildSortRuleRowHtml(columnTitles, rule) {
    const column = Number.isInteger(rule?.column) ? rule.column : 0;
    const direction = rule?.direction === 'desc' ? 'desc' : 'asc';
    const type = rule?.type || 'auto';

    const dirLabel = getDirectionLabel(direction);

    return `
        <div class="anytable-adv-sort-row" data-sort-id="${escapeHtml(rule.id)}">
            <div class="anytable-adv-sort-grid">
                ${buildOptionButtonHtml('anytable-adv-sort-column', column, getColumnLabel(columnTitles, column))}
                <button type="button" class="anytable-adv-sort-direction" data-sort-direction="${direction}">${dirLabel}</button>
                ${buildOptionButtonHtml('anytable-adv-sort-type-btn', type, getTypeLabel(type))}
                <button type="button" class="anytable-adv-remove-sort-rule">${translate('advancedPanel.common.delete')}</button>
            </div>
        </div>
    `;
}

function parseSortRuleRow(rowElement) {
    const column = Number(getDropdownButtonValue(rowElement.querySelector('.anytable-adv-sort-column')));
    if (Number.isNaN(column)) {
        return {error: translate('advancedPanel.sort.errors.invalidColumn')};
    }

    const dirBtn = rowElement.querySelector('.anytable-adv-sort-direction');
    const direction = dirBtn.getAttribute('data-sort-direction') === 'desc' ? 'desc' : 'asc';
    const typeBtn = rowElement.querySelector('.anytable-adv-sort-type-btn');
    const type = getDropdownButtonValue(typeBtn) || 'auto';

    const rule = {
        column,
        direction,
        type,
        unitConfig: null
    };

    return {rule};
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
    const {overlay, dialog, destroy} = createOverlayAndDialog();
    const effectiveColumnIndex = columnIndex ?? 0;
    const seedRules = Array.isArray(initialRules) && initialRules.length
        ? initialRules
        : [{column: effectiveColumnIndex, direction: 'asc', type: 'auto', unitConfig: null, id: generateId('sort')}];

    // 创建 header
    const header = document.createElement('div');
    header.className = 'anytable-advanced-header';

    const title = document.createElement('div');
    title.className = 'anytable-advanced-title';
    title.textContent = translate('advancedPanel.sort.title');
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

    const sortList = document.createElement('div');
    sortList.className = 'anytable-adv-sort-list';
    body.appendChild(sortList);

    const groupActions = document.createElement('div');
    groupActions.className = 'anytable-adv-group-actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'anytable-advanced-btn anytable-adv-add-sort-rule';
    addBtn.textContent = translate('advancedPanel.sort.addRule');
    groupActions.appendChild(addBtn);

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

    const selectMinWidth = addBtn ? addBtn.offsetWidth : 120;

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

    const currentRules = seedRules.map((rule) => ({
        id: generateId('sort'),
        column: Number.isInteger(rule.column) ? rule.column : effectiveColumnIndex,
        direction: rule.direction === 'desc' ? 'desc' : 'asc',
        type: rule.type || 'auto',
        unitConfig: rule.unitConfig || null
    }));

    function getUsedColumns(rules) {
        return new Set(rules.map(r => r.column));
    }

    function updateMultiColumnHint(rules) {
        if (rules.length > 1) {
            setHint(translate('advancedPanel.sort.hint.multiColumnAuto'));
        } else {
            // 清除该提示（如果当前显示的正好是该提示）
            if (hintElement.textContent === translate('advancedPanel.sort.hint.multiColumnAuto')) {
                setHint('');
            }
        }
    }

    function getFirstUnusedColumn(rules) {
        const used = getUsedColumns(rules);
        const totalColumns = columnTitles.length;
        for (let i = 0; i < totalColumns; i++) {
            if (!used.has(i)) return i;
        }
        return effectiveColumnIndex;
    }

    function bindSortRow(row, rules, index) {
        const rule = rules[index];
        const columnButton = row.querySelector('.anytable-adv-sort-column');
        const directionBtn = row.querySelector('.anytable-adv-sort-direction');
        const typeBtn = row.querySelector('.anytable-adv-sort-type-btn');

        setDropdownButtonValue(columnButton, rule.column, getColumnLabel(columnTitles, rule.column), {minWidth: selectMinWidth});
        directionBtn.setAttribute('data-sort-direction', rule.direction);
        directionBtn.textContent = getDirectionLabel(rule.direction);
        setDropdownButtonValue(typeBtn, rule.type, getTypeLabel(rule.type), {minWidth: selectMinWidth});

        columnButton.addEventListener('click', () => {
            openDropdownPopup({
                anchorButton: columnButton,
                currentValue: String(rule.column),
                groups: getColumnOptionGroups(columnTitles, getUsedColumns(rules), rule.column),
                onSelect: (newValue) => {
                    rule.column = Number(newValue);
                    setDropdownButtonValue(columnButton, newValue, getColumnLabel(columnTitles, rule.column), {minWidth: selectMinWidth});
                    updateTypeButtonLabel(row, getColumnValues, selectMinWidth);
                }
            });
        });

        directionBtn.addEventListener('click', () => {
            closeDropdownPopup();
            rule.direction = rule.direction === 'asc' ? 'desc' : 'asc';
            directionBtn.setAttribute('data-sort-direction', rule.direction);
            directionBtn.textContent = getDirectionLabel(rule.direction);
        });

        typeBtn.addEventListener('click', () => {
            openDropdownPopup({
                anchorButton: typeBtn,
                currentValue: rule.type,
                groups: getSortTypeOptionGroups(),
                searchable: true,
                searchPlaceholder: translate('advancedPanel.sort.typePopup.searchPlaceholder'),
                onSelect: (newType) => {
                    rule.type = newType;
                    updateTypeButtonLabel(row, getColumnValues, selectMinWidth);
                }
            });
        });

        fitDropdownButtonWidth(columnButton, selectMinWidth);
        updateTypeButtonLabel(row, getColumnValues, selectMinWidth);

        row.querySelector('.anytable-adv-remove-sort-rule').addEventListener('click', () => {
            closeDropdownPopup();
            if (rules.length <= 1) {
                setHint(translate('advancedPanel.sort.hint.keepOneRule'), true);
                return;
            }
            const idx = rules.indexOf(rule);
            if (idx >= 0) rules.splice(idx, 1);
            row.remove();
            updateMultiColumnHint(rules);
        });
    }

    function renderSortRules(rules) {
        const htmlString = rules
            .map((rule) => buildSortRuleRowHtml(columnTitles, rule))
            .join('');
        setInnerHTML(sortList, htmlString);

        const rows = Array.from(sortList.querySelectorAll('.anytable-adv-sort-row'));
        rows.forEach((row, index) => bindSortRow(row, rules, index));
        updateMultiColumnHint(rules);
    }

    function appendSortRule(rule, rules) {
        const tmp = document.createElement('div');
        setInnerHTML(tmp, buildSortRuleRowHtml(columnTitles, rule));
        const row = tmp.firstElementChild;
        sortList.appendChild(row);
        bindSortRow(row, rules, rules.length - 1);
        updateMultiColumnHint(rules);
    }

    renderSortRules(currentRules);

    dialog.querySelector('.anytable-adv-add-sort-rule').addEventListener('click', () => {
        if (currentRules.length >= columnTitles.length) {
            setHint(translate('advancedPanel.sort.hint.allColumnsUsed'), true);
            return;
        }
        const newRule = {
            id: generateId('sort'),
            column: getFirstUnusedColumn(currentRules),
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
            column: effectiveColumnIndex,
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
