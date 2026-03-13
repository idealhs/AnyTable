import { detectColumnUnitSystem } from '../core/type-parser.js';
import { escapeHtml, createCloseIconSvg, setInnerHTML, translate, getColumnOptionsHtml, createOverlayAndDialog } from './panel-utils.js';

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

const SORT_TYPE_OPTIONS = SORT_TYPE_GROUPS.flat();

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

function updateTypeButtonLabel(rowElement, getColumnValues) {
    const btn = rowElement.querySelector('.anytable-adv-sort-type-btn');
    const columnSelect = rowElement.querySelector('.anytable-adv-sort-column');
    if (!btn) return;

    const type = btn.getAttribute('data-sort-type') || 'auto';
    const colIdx = Number(columnSelect.value);
    btn.textContent = getButtonLabel(type, getColumnValues, colIdx);
}

function closeSortTypePopup() {
    const existing = document.querySelector('.anytable-sort-type-popup');
    if (existing) existing.remove();
}

function openSortTypePopup(anchorButton, currentType, onSelect) {
    closeSortTypePopup();

    const popup = document.createElement('div');
    popup.className = 'anytable-sort-type-popup';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'anytable-sort-type-search';
    searchInput.placeholder = translate('advancedPanel.sort.typePopup.searchPlaceholder');
    popup.appendChild(searchInput);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'anytable-sort-type-options';
    popup.appendChild(optionsContainer);

    function renderOptions(filter) {
        optionsContainer.textContent = '';
        const lowerFilter = (filter || '').toLowerCase();

        SORT_TYPE_GROUPS.forEach((group, groupIndex) => {
            const filtered = group.filter(type => {
                const label = getTypeLabel(type);
                return !lowerFilter || label.toLowerCase().includes(lowerFilter) || type.toLowerCase().includes(lowerFilter);
            });
            if (filtered.length === 0) return;

            if (groupIndex > 0 && optionsContainer.children.length > 0 && !lowerFilter) {
                const divider = document.createElement('div');
                divider.className = 'anytable-sort-type-divider';
                optionsContainer.appendChild(divider);
            }

            for (const type of filtered) {
                const option = document.createElement('div');
                option.className = 'anytable-sort-type-option';
                if (type === currentType) option.classList.add('selected');
                option.textContent = getTypeLabel(type);
                option.addEventListener('click', () => {
                    onSelect(type);
                    closePopup();
                });
                optionsContainer.appendChild(option);
            }
        });
    }

    renderOptions('');

    searchInput.addEventListener('input', () => {
        renderOptions(searchInput.value);
    });

    document.body.appendChild(popup);

    // Position below the anchor button
    const rect = anchorButton.getBoundingClientRect();
    popup.style.top = (rect.bottom + 2) + 'px';
    popup.style.left = rect.left + 'px';

    // Adjust if popup goes off-screen
    const popupRect = popup.getBoundingClientRect();
    if (popupRect.right > window.innerWidth) {
        popup.style.left = (window.innerWidth - popupRect.width - 4) + 'px';
    }
    if (popupRect.bottom > window.innerHeight) {
        popup.style.top = (rect.top - popupRect.height - 2) + 'px';
    }

    searchInput.focus();

    function closePopup() {
        popup.remove();
        document.removeEventListener('mousedown', outsideClickHandler, true);
        document.removeEventListener('keydown', escHandler, true);
    }

    function outsideClickHandler(e) {
        if (!popup.contains(e.target) && e.target !== anchorButton) {
            closePopup();
        }
    }

    function escHandler(e) {
        if (e.key === 'Escape') {
            e.stopPropagation();
            e.preventDefault();
            closePopup();
        }
    }

    // Delay to avoid immediate close from the same click
    setTimeout(() => {
        document.addEventListener('mousedown', outsideClickHandler, true);
        document.addEventListener('keydown', escHandler, true);
    }, 0);
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
                <button type="button" class="anytable-adv-sort-type-btn" data-sort-type="${escapeHtml(type)}">${getTypeLabel(type)}</button>
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
    const typeBtn = rowElement.querySelector('.anytable-adv-sort-type-btn');
    const type = (typeBtn && typeBtn.getAttribute('data-sort-type')) || 'auto';

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
        closeSortTypePopup();
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

    function getUsedColumns(rules) {
        return new Set(rules.map(r => r.column));
    }

    function updateColumnOptions(rules) {
        const used = getUsedColumns(rules);
        const rows = Array.from(sortList.querySelectorAll('.anytable-adv-sort-row'));
        rows.forEach((row, i) => {
            const select = row.querySelector('.anytable-adv-sort-column');
            if (!select) return;
            const currentVal = Number(select.value);
            Array.from(select.options).forEach(opt => {
                const val = Number(opt.value);
                opt.disabled = val !== currentVal && used.has(val);
            });
        });
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
        return columnIndex;
    }

    function bindSortRow(row, rules, index) {
        const rule = rules[index];
        const columnSelect = row.querySelector('.anytable-adv-sort-column');
        const directionSelect = row.querySelector('.anytable-adv-sort-direction');
        const typeBtn = row.querySelector('.anytable-adv-sort-type-btn');

        columnSelect.value = String(rule.column);
        directionSelect.value = rule.direction;
        typeBtn.setAttribute('data-sort-type', rule.type);

        columnSelect.addEventListener('change', () => {
            rule.column = Number(columnSelect.value);
            fitSelectWidth(columnSelect, selectMinWidth);
            updateColumnOptions(rules);
            updateTypeButtonLabel(row, getColumnValues);
        });
        directionSelect.addEventListener('change', () => { rule.direction = directionSelect.value; fitSelectWidth(directionSelect); });

        typeBtn.addEventListener('click', () => {
            openSortTypePopup(typeBtn, rule.type, (newType) => {
                rule.type = newType;
                typeBtn.setAttribute('data-sort-type', newType);
                updateTypeButtonLabel(row, getColumnValues);
            });
        });

        fitSelectWidth(columnSelect, selectMinWidth);
        fitSelectWidth(directionSelect);

        updateTypeButtonLabel(row, getColumnValues);

        row.querySelector('.anytable-adv-remove-sort-rule').addEventListener('click', () => {
            if (rules.length <= 1) {
                setHint(translate('advancedPanel.sort.hint.keepOneRule'), true);
                return;
            }
            const idx = rules.indexOf(rule);
            if (idx >= 0) rules.splice(idx, 1);
            row.remove();
            updateColumnOptions(rules);
            updateMultiColumnHint(rules);
        });
    }

    function renderSortRules(rules) {
        const htmlString = rules
            .map((rule) => buildSortRuleRowHtml(columnOptionsHtml, rule))
            .join('');
        setInnerHTML(sortList, htmlString);

        const rows = Array.from(sortList.querySelectorAll('.anytable-adv-sort-row'));
        rows.forEach((row, index) => bindSortRow(row, rules, index));
        updateColumnOptions(rules);
        updateMultiColumnHint(rules);
    }

    function appendSortRule(rule, rules) {
        const tmp = document.createElement('div');
        setInnerHTML(tmp, buildSortRuleRowHtml(columnOptionsHtml, rule));
        const row = tmp.firstElementChild;
        sortList.appendChild(row);
        bindSortRow(row, rules, rules.length - 1);
        updateColumnOptions(rules);
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
