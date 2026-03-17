import { closeDropdownPopup, openDropdownPopup, setDropdownButtonValue } from './dropdown-popup.js';
import { createAdvancedPanelShell } from './advanced-panel-shell.js';
import { translate, setInnerHTML } from './panel-utils.js';
import {
    buildSortRuleRowHtml,
    fitSortColumnButton,
    getSortColumnOptionGroups,
    getSortDirectionLabel,
    getSortTypeLabel,
    getSortTypeOptionGroups,
    updateSortTypeButtonLabel
} from './sort-panel-renderer.js';
import { createSortRule, getFirstUnusedSortColumn, getUsedSortColumns, normalizeSortRules } from './sort-panel-state.js';
import { parseSortRuleRow } from './sort-panel-validation.js';
import { getPanelColumnLabel } from './advanced-panel-common.js';

export function openAdvancedSortPanel({
    columnIndex,
    columnTitles,
    initialRules,
    tableElement,
    getColumnValues,
    onApply,
    onCancel
}) {
    void tableElement;

    const effectiveColumnIndex = columnIndex ?? 0;
    const currentRules = normalizeSortRules(initialRules, effectiveColumnIndex);
    const shell = createAdvancedPanelShell({
        title: translate('advancedPanel.sort.title'),
        contentClassName: 'anytable-adv-sort-list',
        actionButtons: [{
            key: 'addRule',
            className: 'anytable-adv-add-sort-rule',
            label: translate('advancedPanel.sort.addRule')
        }]
    });
    const sortList = shell.content;
    const addRuleButton = shell.actionButtons.addRule;
    const selectMinWidth = addRuleButton ? addRuleButton.offsetWidth || 120 : 120;

    function updateMultiColumnHint(rules) {
        const multiColumnHint = translate('advancedPanel.sort.hint.multiColumnAuto');
        if (rules.length > 1) {
            shell.setHint(multiColumnHint);
        } else if (sortList.parentElement?.querySelector('[data-role="hint"]')?.textContent === multiColumnHint) {
            shell.setHint('');
        }
    }

    function closePanel(triggerCancel = true) {
        closeDropdownPopup();
        shell.destroy();
        if (triggerCancel && typeof onCancel === 'function') {
            onCancel();
        }
    }

    function bindSortRow(row, rules, index) {
        const rule = rules[index];
        const columnButton = row.querySelector('.anytable-adv-sort-column');
        const directionButton = row.querySelector('.anytable-adv-sort-direction');
        const typeButton = row.querySelector('.anytable-adv-sort-type-btn');

        setDropdownButtonValue(columnButton, rule.column, getPanelColumnLabel(columnTitles, rule.column), {minWidth: selectMinWidth});
        directionButton.setAttribute('data-sort-direction', rule.direction);
        directionButton.textContent = getSortDirectionLabel(rule.direction);
        setDropdownButtonValue(typeButton, rule.type, getSortTypeLabel(rule.type), {minWidth: selectMinWidth});

        columnButton.addEventListener('click', () => {
            openDropdownPopup({
                anchorButton: columnButton,
                currentValue: String(rule.column),
                groups: getSortColumnOptionGroups(columnTitles, getUsedSortColumns(rules), rule.column),
                onSelect: (newValue) => {
                    rule.column = Number(newValue);
                    setDropdownButtonValue(columnButton, newValue, getPanelColumnLabel(columnTitles, rule.column), {minWidth: selectMinWidth});
                    updateSortTypeButtonLabel(row, getColumnValues, selectMinWidth);
                }
            });
        });

        directionButton.addEventListener('click', () => {
            closeDropdownPopup();
            rule.direction = rule.direction === 'asc' ? 'desc' : 'asc';
            directionButton.setAttribute('data-sort-direction', rule.direction);
            directionButton.textContent = getSortDirectionLabel(rule.direction);
        });

        typeButton.addEventListener('click', () => {
            openDropdownPopup({
                anchorButton: typeButton,
                currentValue: rule.type,
                groups: getSortTypeOptionGroups(),
                searchable: true,
                searchPlaceholder: translate('advancedPanel.sort.typePopup.searchPlaceholder'),
                onSelect: (newType) => {
                    rule.type = newType;
                    updateSortTypeButtonLabel(row, getColumnValues, selectMinWidth, newType);
                }
            });
        });

        fitSortColumnButton(columnButton, selectMinWidth);
        updateSortTypeButtonLabel(row, getColumnValues, selectMinWidth);

        row.querySelector('.anytable-adv-remove-sort-rule').addEventListener('click', () => {
            closeDropdownPopup();
            if (rules.length <= 1) {
                shell.setHint(translate('advancedPanel.sort.hint.keepOneRule'), true);
                return;
            }

            const ruleIndex = rules.indexOf(rule);
            if (ruleIndex >= 0) {
                rules.splice(ruleIndex, 1);
            }
            row.remove();
            updateMultiColumnHint(rules);
        });
    }

    function renderSortRules(rules) {
        const htmlString = rules.map((rule) => buildSortRuleRowHtml(columnTitles, rule)).join('');
        setInnerHTML(sortList, htmlString);

        Array.from(sortList.querySelectorAll('.anytable-adv-sort-row')).forEach((row, index) => {
            bindSortRow(row, rules, index);
        });
        updateMultiColumnHint(rules);
    }

    function appendSortRule(rule, rules) {
        const wrapper = document.createElement('div');
        setInnerHTML(wrapper, buildSortRuleRowHtml(columnTitles, rule));
        const row = wrapper.firstElementChild;
        sortList.appendChild(row);
        bindSortRow(row, rules, rules.length - 1);
        updateMultiColumnHint(rules);
    }

    renderSortRules(currentRules);

    addRuleButton.addEventListener('click', () => {
        if (currentRules.length >= columnTitles.length) {
            shell.setHint(translate('advancedPanel.sort.hint.allColumnsUsed'), true);
            return;
        }

        const newRule = createSortRule({
            column: getFirstUnusedSortColumn(currentRules, columnTitles.length, effectiveColumnIndex)
        }, effectiveColumnIndex);
        currentRules.push(newRule);
        appendSortRule(newRule, currentRules);
        shell.setHint('');
    });

    shell.buttons.close.addEventListener('click', () => closePanel(true));
    shell.buttons.cancel.addEventListener('click', () => closePanel(true));
    shell.buttons.reset.addEventListener('click', () => {
        currentRules.length = 0;
        currentRules.push(createSortRule(null, effectiveColumnIndex));
        renderSortRules(currentRules);
        shell.setHint(translate('advancedPanel.sort.hint.resetDone'));
    });

    shell.buttons.apply.addEventListener('click', () => {
        const rows = Array.from(sortList.querySelectorAll('.anytable-adv-sort-row'));
        if (rows.length === 0) {
            shell.setHint(translate('advancedPanel.sort.hint.needOneRule'), true);
            return;
        }

        const rules = [];
        for (const row of rows) {
            const {rule, error} = parseSortRuleRow(row);
            if (error) {
                shell.setHint(error, true);
                return;
            }
            rules.push(rule);
        }

        if (typeof onApply === 'function') {
            onApply(rules);
        }
        closePanel(false);
    });

    shell.overlay.addEventListener('click', (event) => {
        if (event.target === shell.overlay) {
            closePanel(true);
        }
    });

    return {
        close: () => closePanel(false),
        overlay: shell.overlay,
        dialog: shell.dialog
    };
}
