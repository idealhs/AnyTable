// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createOptionSets() {
    return {
        operatorOptions: [[
            { value: 'AND', label: 'AND' },
            { value: 'OR', label: 'OR' }
        ]],
        columnOptions: [[
            { value: '0', label: '姓名' }
        ]],
        comparatorOptions: [[
            { value: 'contains', label: '包含' }
        ]],
        columnTitles: ['姓名']
    };
}

function createOperatorElement() {
    const element = document.createElement('div');
    element.className = 'anytable-adv-rule-operator';

    const button = document.createElement('button');
    button.className = 'anytable-adv-inline-operator';
    element.appendChild(button);

    return {
        element,
        button
    };
}

function createRuleElement(ruleId) {
    const element = document.createElement('div');
    element.setAttribute('data-rule-id', ruleId);

    const columnButton = document.createElement('button');
    columnButton.className = 'anytable-adv-filter-column';

    const comparatorButton = document.createElement('button');
    comparatorButton.className = 'anytable-adv-comparator';
    comparatorButton.setAttribute('data-value', 'contains');

    const negateButton = document.createElement('button');
    negateButton.className = 'anytable-adv-negate';

    const valueInput = document.createElement('input');
    valueInput.className = 'anytable-adv-value';

    const rangeBox = document.createElement('div');
    rangeBox.className = 'anytable-adv-range';

    const minInput = document.createElement('input');
    minInput.className = 'anytable-adv-min';
    rangeBox.appendChild(minInput);

    const maxInput = document.createElement('input');
    maxInput.className = 'anytable-adv-max';
    rangeBox.appendChild(maxInput);

    const flagsInput = document.createElement('input');
    flagsInput.className = 'anytable-adv-flags';

    const removeButton = document.createElement('button');
    removeButton.className = 'anytable-adv-remove-rule';

    element.appendChild(columnButton);
    element.appendChild(comparatorButton);
    element.appendChild(negateButton);
    element.appendChild(valueInput);
    element.appendChild(rangeBox);
    element.appendChild(flagsInput);
    element.appendChild(removeButton);

    return {
        element,
        columnButton,
        comparatorButton,
        negateButton,
        valueInput,
        flagsInput,
        removeButton
    };
}

function createGroupElement(groupId) {
    const element = document.createElement('div');
    element.setAttribute('data-group-id', groupId);

    const header = document.createElement('div');
    header.className = 'anytable-adv-group-header';

    const negateButton = document.createElement('button');
    negateButton.className = 'anytable-adv-negate';

    const removeGroupButton = document.createElement('button');
    removeGroupButton.className = 'anytable-adv-remove-group';

    header.appendChild(negateButton);
    header.appendChild(removeGroupButton);

    const actions = document.createElement('div');
    actions.className = 'anytable-adv-group-actions';

    const addRuleButton = document.createElement('button');
    addRuleButton.className = 'anytable-adv-add-rule';

    const addGroupButton = document.createElement('button');
    addGroupButton.className = 'anytable-adv-add-group';

    actions.appendChild(addRuleButton);
    actions.appendChild(addGroupButton);

    const childContainer = document.createElement('div');
    childContainer.className = 'anytable-adv-group-children';

    element.appendChild(header);
    element.appendChild(actions);
    element.appendChild(childContainer);

    return {
        element,
        negateButton,
        removeGroupButton,
        addRuleButton,
        addGroupButton,
        childContainer
    };
}

describe('filter-panel-events', () => {
    let bindFilterTreeEvents;
    let closeDropdownPopupMock;
    let openDropdownPopupMock;
    let setDropdownButtonValueMock;
    let translateMock;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = '';

        closeDropdownPopupMock = vi.fn();
        openDropdownPopupMock = vi.fn();
        setDropdownButtonValueMock = vi.fn();
        translateMock = vi.fn((key) => `translated:${key}`);

        vi.doMock('../../src/ui/dropdown-popup.js', () => ({
            closeDropdownPopup: closeDropdownPopupMock,
            getDropdownOptionLabel: vi.fn((groups, value, fallback = '') => {
                for (const group of groups || []) {
                    const match = group.find((option) => String(option.value) === String(value));
                    if (match) {
                        return match.label;
                    }
                }
                return fallback;
            }),
            openDropdownPopup: openDropdownPopupMock,
            setDropdownButtonValue: setDropdownButtonValueMock
        }));
        vi.doMock('../../src/ui/panel-utils.js', () => ({
            translate: translateMock
        }));

        ({ bindFilterTreeEvents } = await import('../../src/ui/filter-panel-events.js'));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        document.body.innerHTML = '';
    });

    it('skips stale operator and rule rows whose ids are no longer present in the filter tree', () => {
        const containerElement = document.createElement('div');
        const operator = createOperatorElement();
        const rule = createRuleElement('missing-rule');
        const children = [{
            id: 'active-rule',
            column: 0,
            comparator: 'contains',
            negated: false,
            value: 'Alice',
            options: {}
        }];
        const setHint = vi.fn();
        const reRender = vi.fn();

        containerElement.appendChild(operator.element);
        containerElement.appendChild(rule.element);

        bindFilterTreeEvents({
            containerElement,
            children,
            depth: 0,
            optionSets: createOptionSets(),
            setHint,
            reRender
        });

        operator.button.click();
        rule.columnButton.click();
        rule.removeButton.click();

        expect(setDropdownButtonValueMock).not.toHaveBeenCalled();
        expect(openDropdownPopupMock).not.toHaveBeenCalled();
        expect(closeDropdownPopupMock).not.toHaveBeenCalled();
        expect(setHint).not.toHaveBeenCalled();
        expect(reRender).not.toHaveBeenCalled();
        expect(children).toHaveLength(1);
        expect(children[0].id).toBe('active-rule');
    });

    it('ignores operator rows when no rule or group sibling can be resolved', () => {
        const containerElement = document.createElement('div');
        const operator = createOperatorElement();
        const unrelatedElement = document.createElement('div');

        containerElement.appendChild(operator.element);
        containerElement.appendChild(unrelatedElement);

        bindFilterTreeEvents({
            containerElement,
            children: [{
                id: 'rule-1',
                operator: 'AND',
                column: 0,
                comparator: 'contains',
                value: '',
                options: {}
            }],
            depth: 0,
            optionSets: createOptionSets(),
            setHint: vi.fn(),
            reRender: vi.fn()
        });

        operator.button.click();

        expect(setDropdownButtonValueMock).not.toHaveBeenCalled();
        expect(openDropdownPopupMock).not.toHaveBeenCalled();
    });

    it('skips stale group containers and nodes whose ids resolve to non-group filter entries', () => {
        const containerElement = document.createElement('div');
        const missingGroup = createGroupElement('missing-group');
        const nonGroupNode = createGroupElement('leaf-node');
        const children = [{
            id: 'leaf-node',
            column: 0,
            comparator: 'contains',
            negated: false,
            value: 'Alice',
            options: {}
        }];
        const setHint = vi.fn();
        const reRender = vi.fn();

        containerElement.appendChild(missingGroup.element);
        containerElement.appendChild(nonGroupNode.element);

        bindFilterTreeEvents({
            containerElement,
            children,
            depth: 0,
            optionSets: createOptionSets(),
            setHint,
            reRender
        });

        missingGroup.removeGroupButton.click();
        missingGroup.addRuleButton.click();
        nonGroupNode.addGroupButton.click();
        nonGroupNode.negateButton.click();

        expect(closeDropdownPopupMock).not.toHaveBeenCalled();
        expect(setHint).not.toHaveBeenCalled();
        expect(reRender).not.toHaveBeenCalled();
        expect(children).toEqual([{
            id: 'leaf-node',
            column: 0,
            comparator: 'contains',
            negated: false,
            value: 'Alice',
            options: {}
        }]);
    });

    it('keeps the last remaining rule and shows a hint instead of deleting it', () => {
        const containerElement = document.createElement('div');
        const rule = createRuleElement('rule-1');
        const children = [{
            id: 'rule-1',
            column: 0,
            comparator: 'contains',
            negated: false,
            value: 'Alice',
            options: {}
        }];
        const setHint = vi.fn();
        const reRender = vi.fn();

        containerElement.appendChild(rule.element);

        bindFilterTreeEvents({
            containerElement,
            children,
            depth: 0,
            optionSets: createOptionSets(),
            setHint,
            reRender
        });

        rule.removeButton.click();

        expect(closeDropdownPopupMock).toHaveBeenCalledTimes(1);
        expect(setHint).toHaveBeenCalledWith('translated:advancedPanel.filter.hint.keepOneRule', true);
        expect(reRender).not.toHaveBeenCalled();
        expect(children).toHaveLength(1);
        expect(children[0].id).toBe('rule-1');
    });

    it('keeps the last remaining group and shows a hint instead of deleting it', () => {
        const containerElement = document.createElement('div');
        const group = createGroupElement('group-1');
        const children = [{
            id: 'group-1',
            negated: false,
            children: [{
                id: 'leaf-1',
                column: 0,
                comparator: 'contains',
                value: '',
                options: {}
            }]
        }];
        const setHint = vi.fn();
        const reRender = vi.fn();

        containerElement.appendChild(group.element);

        bindFilterTreeEvents({
            containerElement,
            children,
            depth: 0,
            optionSets: createOptionSets(),
            setHint,
            reRender
        });

        group.removeGroupButton.click();

        expect(closeDropdownPopupMock).toHaveBeenCalledTimes(1);
        expect(translateMock).toHaveBeenCalledWith('advancedPanel.filter.hint.keepOneRule');
        expect(setHint).toHaveBeenCalledWith('translated:advancedPanel.filter.hint.keepOneRule', true);
        expect(reRender).not.toHaveBeenCalled();
        expect(children).toHaveLength(1);
        expect(children[0].id).toBe('group-1');
    });

    it('removes a rule from a multi-rule group, clears the new leading operator, and re-renders', () => {
        const containerElement = document.createElement('div');
        const firstRule = createRuleElement('rule-1');
        const secondRule = {
            id: 'rule-2',
            operator: 'AND',
            column: 0,
            comparator: 'contains',
            negated: false,
            value: 'Bob',
            options: {}
        };
        const children = [
            {
                id: 'rule-1',
                column: 0,
                comparator: 'contains',
                negated: false,
                value: 'Alice',
                options: {}
            },
            secondRule
        ];
        const setHint = vi.fn();
        const reRender = vi.fn();

        containerElement.appendChild(firstRule.element);

        bindFilterTreeEvents({
            containerElement,
            children,
            depth: 0,
            optionSets: createOptionSets(),
            setHint,
            reRender
        });

        firstRule.removeButton.click();

        expect(closeDropdownPopupMock).toHaveBeenCalledTimes(1);
        expect(reRender).toHaveBeenCalledTimes(1);
        expect(setHint).not.toHaveBeenCalled();
        expect(children).toHaveLength(1);
        expect(children[0]).toBe(secondRule);
        expect(children[0].operator).toBeUndefined();
    });

    it('toggles the operator button and writes the selected operator back to the matching child node', () => {
        const containerElement = document.createElement('div');
        const operator = createOperatorElement();
        const targetRule = createRuleElement('rule-1');
        const children = [{
            id: 'rule-1',
            operator: 'OR',
            column: 0,
            comparator: 'contains',
            negated: false,
            value: '',
            options: {}
        }];

        containerElement.appendChild(operator.element);
        containerElement.appendChild(targetRule.element);

        bindFilterTreeEvents({
            containerElement,
            children,
            depth: 0,
            optionSets: createOptionSets(),
            setHint: vi.fn(),
            reRender: vi.fn()
        });

        expect(operator.button.textContent).toBe('OR');
        expect(operator.button.title).toBe('translated:advancedPanel.filter.operatorTooltip.or');
        expect(operator.button.getAttribute('data-filter-operator')).toBe('OR');

        operator.button.click();

        expect(closeDropdownPopupMock).toHaveBeenCalledTimes(1);
        expect(openDropdownPopupMock).not.toHaveBeenCalled();
        expect(children[0].operator).toBe('AND');
        expect(operator.button.textContent).toBe('AND');
        expect(operator.button.title).toBe('translated:advancedPanel.filter.operatorTooltip.and');
        expect(operator.button.getAttribute('data-filter-operator')).toBe('AND');
    });

    it('updates rule flags, value, range inputs, and negate state through bound DOM events', () => {
        const containerElement = document.createElement('div');
        const ruleElement = createRuleElement('rule-1');
        const children = [{
            id: 'rule-1',
            column: 0,
            comparator: 'contains',
            negated: false,
            value: '',
            options: {}
        }];

        containerElement.appendChild(ruleElement.element);

        bindFilterTreeEvents({
            containerElement,
            children,
            depth: 0,
            optionSets: createOptionSets(),
            setHint: vi.fn(),
            reRender: vi.fn()
        });

        ruleElement.negateButton.click();
        ruleElement.valueInput.value = 'Alice';
        ruleElement.valueInput.dispatchEvent(new Event('input', { bubbles: true }));
        ruleElement.element.querySelector('.anytable-adv-min').value = '10';
        ruleElement.element.querySelector('.anytable-adv-min').dispatchEvent(new Event('input', { bubbles: true }));
        ruleElement.element.querySelector('.anytable-adv-max').value = '20';
        ruleElement.element.querySelector('.anytable-adv-max').dispatchEvent(new Event('input', { bubbles: true }));
        ruleElement.flagsInput.value = 'gi';
        ruleElement.flagsInput.dispatchEvent(new Event('input', { bubbles: true }));

        expect(children[0].negated).toBe(true);
        expect(ruleElement.negateButton.classList.contains('active')).toBe(true);
        expect(children[0].value).toBe('Alice');
        expect(children[0].options).toEqual({
            min: '10',
            max: '20',
            flags: 'gi'
        });
    });
});
