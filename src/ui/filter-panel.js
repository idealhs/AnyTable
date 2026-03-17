import { closeDropdownPopup } from './dropdown-popup.js';
import { createAdvancedPanelShell } from './advanced-panel-shell.js';
import { translate } from './panel-utils.js';
import { bindFilterTreeEvents } from './filter-panel-events.js';
import { createFilterOptionSets, renderFilterTree } from './filter-panel-renderer.js';
import { collectFilterRuleTree } from './filter-panel-validation.js';
import { createDefaultFilterGroup, createDefaultFilterRule, ensureFilterRules } from './filter-panel-state.js';
import { createPanelNodeId } from './advanced-panel-common.js';

export function openAdvancedFilterPanel({
    columnTitles,
    initialRuleGroup,
    onApply,
    onCancel
}) {
    const optionSets = createFilterOptionSets(columnTitles);
    const currentRules = ensureFilterRules(initialRuleGroup, 0);
    const shell = createAdvancedPanelShell({
        title: translate('advancedPanel.filter.title'),
        contentClassName: 'anytable-adv-rule-list',
        actionButtons: [
            {
                key: 'addRule',
                className: 'anytable-adv-add-rule',
                label: translate('advancedPanel.filter.addRule')
            },
            {
                key: 'addGroup',
                className: 'anytable-adv-add-group',
                label: translate('advancedPanel.filter.addGroup')
            }
        ]
    });
    const ruleList = shell.content;

    function closePanel(triggerCancel = true) {
        closeDropdownPopup();
        shell.destroy();
        if (triggerCancel && typeof onCancel === 'function') {
            onCancel();
        }
    }

    function renderCurrentTree() {
        renderFilterTree(ruleList, currentRules, optionSets);
        bindFilterTreeEvents({
            containerElement: ruleList,
            children: currentRules,
            depth: 0,
            optionSets,
            setHint: shell.setHint,
            reRender: renderCurrentTree
        });
    }

    renderCurrentTree();

    shell.actionButtons.addRule.addEventListener('click', () => {
        closeDropdownPopup();
        const newRule = createDefaultFilterRule(0);
        if (currentRules.length > 0) {
            newRule.operator = 'AND';
        }
        currentRules.push(newRule);
        renderCurrentTree();
        shell.setHint('');
    });

    shell.actionButtons.addGroup.addEventListener('click', () => {
        closeDropdownPopup();
        const newGroup = createDefaultFilterGroup(0);
        if (currentRules.length > 0) {
            newGroup.operator = 'AND';
        }
        currentRules.push(newGroup);
        renderCurrentTree();
        shell.setHint('');
    });

    shell.buttons.close.addEventListener('click', () => closePanel(true));
    shell.buttons.cancel.addEventListener('click', () => closePanel(true));
    shell.buttons.reset.addEventListener('click', () => {
        closeDropdownPopup();
        currentRules.length = 0;
        currentRules.push(createDefaultFilterRule(0));
        renderCurrentTree();
        shell.setHint(translate('advancedPanel.filter.hint.resetDone'));
    });

    shell.buttons.apply.addEventListener('click', () => {
        if (currentRules.length === 0) {
            shell.setHint(translate('advancedPanel.filter.hint.needOneRule'), true);
            return;
        }

        const {rules, error} = collectFilterRuleTree(ruleList, currentRules);
        if (error) {
            shell.setHint(error, true);
            return;
        }

        if (!rules || rules.length === 0) {
            shell.setHint(translate('advancedPanel.filter.hint.needOneRule'), true);
            return;
        }

        if (typeof onApply === 'function') {
            onApply({
                id: createPanelNodeId('group'),
                children: rules
            });
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
