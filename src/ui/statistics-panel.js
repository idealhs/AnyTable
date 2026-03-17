import { closeDropdownPopup, openDropdownPopup, setDropdownButtonValue } from './dropdown-popup.js';
import { createAdvancedPanelShell } from './advanced-panel-shell.js';
import { setInnerHTML, translate } from './panel-utils.js';
import {
    buildStatisticsRuleRowHtml,
    getStatisticsColumnOptionGroups,
    getStatisticsTypeLabel,
    getStatisticsTypeOptionGroups
} from './statistics-panel-renderer.js';
import { createStatisticsRule, normalizeStatisticsRules } from './statistics-panel-state.js';
import { validateStatisticsRules } from './statistics-panel-validation.js';
import { getPanelColumnLabel } from './advanced-panel-common.js';

export function openStatisticsPanel({
    columnIndex,
    columnTitles,
    initialRules,
    onApply,
    onCancel
}) {
    const effectiveColumnIndex = columnIndex ?? 0;
    const currentRules = normalizeStatisticsRules(initialRules, effectiveColumnIndex);
    const shell = createAdvancedPanelShell({
        title: translate('advancedPanel.statistics.title'),
        contentClassName: 'anytable-adv-sort-list',
        actionButtons: [{
            key: 'addRule',
            className: 'anytable-adv-add-stats-rule',
            label: translate('advancedPanel.statistics.addRule')
        }]
    });
    const ruleList = shell.content;
    const addRuleButton = shell.actionButtons.addRule;

    function closePanel(triggerCancel = true) {
        closeDropdownPopup();
        shell.destroy();
        if (triggerCancel && typeof onCancel === 'function') {
            onCancel();
        }
    }

    function bindStatsRow(row, rules, index) {
        const rule = rules[index];
        const columnButton = row.querySelector('.anytable-adv-stats-column');
        const typeButton = row.querySelector('.anytable-adv-stats-type');

        setDropdownButtonValue(columnButton, rule.column, getPanelColumnLabel(columnTitles, rule.column));
        setDropdownButtonValue(typeButton, rule.statType, getStatisticsTypeLabel(rule.statType));

        columnButton.addEventListener('click', () => {
            openDropdownPopup({
                anchorButton: columnButton,
                currentValue: String(rule.column),
                groups: getStatisticsColumnOptionGroups(columnTitles),
                onSelect: (newValue) => {
                    rule.column = Number(newValue);
                    setDropdownButtonValue(columnButton, newValue, getPanelColumnLabel(columnTitles, rule.column));
                }
            });
        });

        typeButton.addEventListener('click', () => {
            openDropdownPopup({
                anchorButton: typeButton,
                currentValue: rule.statType,
                groups: getStatisticsTypeOptionGroups(),
                onSelect: (newValue) => {
                    rule.statType = newValue;
                    setDropdownButtonValue(typeButton, newValue, getStatisticsTypeLabel(newValue));
                }
            });
        });

        row.querySelector('.anytable-adv-remove-sort-rule').addEventListener('click', () => {
            closeDropdownPopup();
            if (rules.length <= 1) {
                shell.setHint(translate('advancedPanel.statistics.hint.keepOneRule'), true);
                return;
            }

            const ruleIndex = rules.indexOf(rule);
            if (ruleIndex >= 0) {
                rules.splice(ruleIndex, 1);
            }
            row.remove();
        });
    }

    function renderRules(rules) {
        const htmlString = rules.map((rule) => buildStatisticsRuleRowHtml(columnTitles, rule)).join('');
        setInnerHTML(ruleList, htmlString);

        Array.from(ruleList.querySelectorAll('.anytable-adv-sort-row')).forEach((row, index) => {
            bindStatsRow(row, rules, index);
        });
    }

    function appendRule(rule, rules) {
        const wrapper = document.createElement('div');
        setInnerHTML(wrapper, buildStatisticsRuleRowHtml(columnTitles, rule));
        const row = wrapper.firstElementChild;
        ruleList.appendChild(row);
        bindStatsRow(row, rules, rules.length - 1);
    }

    renderRules(currentRules);

    addRuleButton.addEventListener('click', () => {
        const newRule = createStatisticsRule(null, effectiveColumnIndex);
        currentRules.push(newRule);
        appendRule(newRule, currentRules);
        shell.setHint('');
    });

    shell.buttons.close.addEventListener('click', () => closePanel(true));
    shell.buttons.cancel.addEventListener('click', () => closePanel(true));
    shell.buttons.reset.addEventListener('click', () => {
        currentRules.length = 0;
        currentRules.push(createStatisticsRule(null, effectiveColumnIndex));
        renderRules(currentRules);
        shell.setHint(translate('advancedPanel.statistics.hint.resetDone'));
    });

    shell.buttons.apply.addEventListener('click', () => {
        const validationError = validateStatisticsRules(currentRules);
        if (validationError) {
            shell.setHint(validationError, true);
            return;
        }

        if (typeof onApply === 'function') {
            onApply(currentRules.map((rule) => ({column: rule.column, statType: rule.statType})));
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
