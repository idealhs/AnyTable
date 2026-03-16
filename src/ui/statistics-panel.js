import { closeDropdownPopup, getDropdownButtonValue, openDropdownPopup, setDropdownButtonValue } from './dropdown-popup.js';
import { escapeHtml, createCloseIconSvg, setInnerHTML, translate, createOverlayAndDialog } from './panel-utils.js';

const STAT_TYPES = ['count', 'sum', 'average', 'median', 'min', 'max', 'range', 'variance', 'stddev'];

function getStatTypeLabel(type) {
    return translate(`advancedPanel.statistics.type.${type}`) || type;
}

function getColumnLabel(columnTitles, columnIndex) {
    return columnTitles[columnIndex]
        || translate('advancedPanel.common.columnFallback', {index: columnIndex + 1});
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildOptionButtonHtml(className, value, label) {
    return `<button type="button" class="anytable-adv-select-btn ${className}" data-value="${escapeHtml(String(value))}" aria-expanded="false">${escapeHtml(label)}</button>`;
}

function getColumnOptionGroups(columnTitles) {
    return [columnTitles.map((title, index) => ({
        value: String(index),
        label: getColumnLabel(columnTitles, index)
    }))];
}

function getStatTypeOptionGroups() {
    return [STAT_TYPES.map((type) => ({
        value: type,
        label: getStatTypeLabel(type)
    }))];
}

function buildStatsRuleRowHtml(columnTitles, rule) {
    const column = Number.isInteger(rule?.column) ? rule.column : 0;
    const statType = rule?.statType || 'count';

    return `
        <div class="anytable-adv-sort-row" data-stats-id="${escapeHtml(rule.id)}">
            <div class="anytable-adv-sort-grid">
                ${buildOptionButtonHtml('anytable-adv-stats-column', column, getColumnLabel(columnTitles, column))}
                ${buildOptionButtonHtml('anytable-adv-stats-type', statType, getStatTypeLabel(statType))}
                <button type="button" class="anytable-adv-remove-sort-rule">${translate('advancedPanel.common.delete')}</button>
            </div>
        </div>
    `;
}

export function openStatisticsPanel({
    columnIndex,
    columnTitles,
    initialRules,
    onApply,
    onCancel
}) {
    const {overlay, dialog, destroy} = createOverlayAndDialog();
    const effectiveColumnIndex = columnIndex ?? 0;
    const seedRules = Array.isArray(initialRules) && initialRules.length
        ? initialRules
        : [{column: effectiveColumnIndex, statType: 'count', id: generateId('stats')}];

    // Header
    const header = document.createElement('div');
    header.className = 'anytable-advanced-header';

    const title = document.createElement('div');
    title.className = 'anytable-advanced-title';
    title.textContent = translate('advancedPanel.statistics.title');
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'anytable-advanced-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', translate('advancedPanel.common.close'));
    closeBtn.appendChild(createCloseIconSvg());
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'anytable-advanced-body';

    const ruleList = document.createElement('div');
    ruleList.className = 'anytable-adv-sort-list';
    body.appendChild(ruleList);

    const groupActions = document.createElement('div');
    groupActions.className = 'anytable-adv-group-actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'anytable-advanced-btn anytable-adv-add-stats-rule';
    addBtn.textContent = translate('advancedPanel.statistics.addRule');
    groupActions.appendChild(addBtn);
    body.appendChild(groupActions);

    const hintElement = document.createElement('div');
    hintElement.className = 'anytable-advanced-hint';
    hintElement.setAttribute('data-role', 'hint');
    body.appendChild(hintElement);

    // Footer
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

    const currentRules = seedRules.map(rule => ({
        id: generateId('stats'),
        column: Number.isInteger(rule.column) ? rule.column : effectiveColumnIndex,
        statType: rule.statType || 'count'
    }));

    function bindStatsRow(row, rules, index) {
        const rule = rules[index];
        const columnButton = row.querySelector('.anytable-adv-stats-column');
        const typeButton = row.querySelector('.anytable-adv-stats-type');

        setDropdownButtonValue(columnButton, rule.column, getColumnLabel(columnTitles, rule.column));
        setDropdownButtonValue(typeButton, rule.statType, getStatTypeLabel(rule.statType));

        columnButton.addEventListener('click', () => {
            openDropdownPopup({
                anchorButton: columnButton,
                currentValue: String(rule.column),
                groups: getColumnOptionGroups(columnTitles),
                onSelect: (newValue) => {
                    rule.column = Number(newValue);
                    setDropdownButtonValue(columnButton, newValue, getColumnLabel(columnTitles, rule.column));
                }
            });
        });

        typeButton.addEventListener('click', () => {
            openDropdownPopup({
                anchorButton: typeButton,
                currentValue: rule.statType,
                groups: getStatTypeOptionGroups(),
                onSelect: (newValue) => {
                    rule.statType = newValue;
                    setDropdownButtonValue(typeButton, newValue, getStatTypeLabel(newValue));
                }
            });
        });

        row.querySelector('.anytable-adv-remove-sort-rule').addEventListener('click', () => {
            closeDropdownPopup();
            if (rules.length <= 1) {
                setHint(translate('advancedPanel.statistics.hint.keepOneRule'), true);
                return;
            }
            const idx = rules.indexOf(rule);
            if (idx >= 0) rules.splice(idx, 1);
            row.remove();
        });
    }

    function renderRules(rules) {
        const htmlString = rules
            .map(rule => buildStatsRuleRowHtml(columnTitles, rule))
            .join('');
        setInnerHTML(ruleList, htmlString);

        const rows = Array.from(ruleList.querySelectorAll('.anytable-adv-sort-row'));
        rows.forEach((row, index) => bindStatsRow(row, rules, index));
    }

    function appendRule(rule, rules) {
        const tmp = document.createElement('div');
        setInnerHTML(tmp, buildStatsRuleRowHtml(columnTitles, rule));
        const row = tmp.firstElementChild;
        ruleList.appendChild(row);
        bindStatsRow(row, rules, rules.length - 1);
    }

    function hasDuplicate(rules) {
        const seen = new Set();
        for (const r of rules) {
            const key = `${r.column}:${r.statType}`;
            if (seen.has(key)) return true;
            seen.add(key);
        }
        return false;
    }

    renderRules(currentRules);

    addBtn.addEventListener('click', () => {
        const newRule = {
            id: generateId('stats'),
            column: effectiveColumnIndex,
            statType: 'count'
        };
        currentRules.push(newRule);
        appendRule(newRule, currentRules);
        setHint('');
    });

    closeBtn.addEventListener('click', () => closePanel(true));
    cancelBtn.addEventListener('click', () => closePanel(true));

    resetBtn.addEventListener('click', () => {
        currentRules.length = 0;
        currentRules.push({
            id: generateId('stats'),
            column: effectiveColumnIndex,
            statType: 'count'
        });
        renderRules(currentRules);
        setHint(translate('advancedPanel.statistics.hint.resetDone'));
    });

    applyBtn.addEventListener('click', () => {
        if (!currentRules.length) {
            setHint(translate('advancedPanel.statistics.hint.needOneRule'), true);
            return;
        }
        if (hasDuplicate(currentRules)) {
            setHint(translate('advancedPanel.statistics.hint.duplicateRule'), true);
            return;
        }
        const rules = currentRules.map(r => ({column: r.column, statType: r.statType}));
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

    return { close: () => closePanel(false), overlay, dialog };
}
