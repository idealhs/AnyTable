// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadPanelModules() {
    vi.resetModules();
    document.body.innerHTML = '';

    globalThis.chrome = {
        runtime: {
            getURL: vi.fn((path) => `chrome-extension://anytable/${path}`)
        }
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('')
    });

    vi.doMock('../../src/i18n/i18n.js', () => ({
        default: {
            t: (key) => {
                if (key === 'advancedPanel.common.columnFallback') {
                    return '列{index}';
                }
                if (key === 'advancedPanel.common.duplicateColumnFormat') {
                    return '{label}（第{index}列）';
                }
                return key;
            }
        }
    }));

    const shadowUi = await import('../../src/ui/shadow-ui.js');
    await shadowUi.preloadShadowStyles();

    const { openAdvancedFilterPanel } = await import('../../src/ui/filter-panel.js');
    const { openAdvancedSortPanel } = await import('../../src/ui/sort-panel.js');

    return {
        openAdvancedFilterPanel,
        openAdvancedSortPanel
    };
}

function getShadowHosts() {
    return Array.from(document.querySelectorAll('anytable-shadow-host'));
}

function findOpenDropdownOption(label) {
    const hosts = getShadowHosts().slice().reverse();
    for (const host of hosts) {
        const options = Array.from(host.shadowRoot?.querySelectorAll('.anytable-adv-select-option') || []);
        const option = options.find((item) => item.textContent === label);
        if (option) {
            return option;
        }
    }

    return null;
}

function setInputValue(element, value) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

function getLastFilterGroup(dialog) {
    const groups = Array.from(dialog.querySelectorAll('.anytable-adv-rule-group'));
    return groups[groups.length - 1] || null;
}

describe('高级面板真实 DOM 交互', () => {
    let openAdvancedFilterPanel;
    let openAdvancedSortPanel;

    beforeEach(async () => {
        ({ openAdvancedFilterPanel, openAdvancedSortPanel } = await loadPanelModules());
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete globalThis.chrome;
        delete globalThis.fetch;
        document.body.innerHTML = '';
    });

    it('高级筛选面板会根据比较器切换输入形态并拦截无效区间', () => {
        const onApply = vi.fn();
        const panel = openAdvancedFilterPanel({
            columnTitles: ['部门', '分数'],
            initialRuleGroup: null,
            onApply,
            onCancel: vi.fn()
        });

        const comparatorButton = panel.dialog.querySelector('.anytable-adv-comparator');
        comparatorButton.click();
        findOpenDropdownOption('advancedPanel.filter.comparator.between').click();

        const rangeBox = panel.dialog.querySelector('.anytable-adv-range');
        const valueInput = panel.dialog.querySelector('.anytable-adv-value');
        expect(rangeBox.style.display).toBe('');
        expect(valueInput.style.display).toBe('none');

        setInputValue(panel.dialog.querySelector('.anytable-adv-min'), '20');
        setInputValue(panel.dialog.querySelector('.anytable-adv-max'), '10');
        panel.dialog.parentElement.querySelector('.anytable-advanced-apply').click();

        expect(onApply).not.toHaveBeenCalled();
        expect(panel.dialog.parentElement.querySelector('[data-role="hint"]').textContent).toBe(
            'advancedPanel.filter.errors.betweenOrder'
        );

        setInputValue(panel.dialog.querySelector('.anytable-adv-min'), '10');
        setInputValue(panel.dialog.querySelector('.anytable-adv-max'), '20');
        panel.dialog.parentElement.querySelector('.anytable-advanced-apply').click();

        expect(onApply).toHaveBeenCalledTimes(1);
        expect(onApply.mock.calls[0][0].children[0]).toMatchObject({
            column: 0,
            comparator: 'between',
            options: {
                min: 10,
                max: 20
            }
        });
    }, 15000);

    it('高级排序面板支持新增规则、调整方向和类型后统一提交', () => {
        const onApply = vi.fn();
        const panel = openAdvancedSortPanel({
            columnIndex: 0,
            columnTitles: ['姓名', '分数', '城市'],
            initialRules: [{
                column: 0,
                direction: 'asc',
                type: 'auto'
            }],
            tableElement: document.createElement('table'),
            getColumnValues: (columnIndex) => {
                if (columnIndex === 1) {
                    return ['10', '20', '30'];
                }
                return ['Alice', 'Bob', 'Carol'];
            },
            onApply,
            onCancel: vi.fn()
        });

        panel.dialog.querySelector('.anytable-adv-add-sort-rule').click();

        const rows = Array.from(panel.dialog.querySelectorAll('.anytable-adv-sort-row'));
        expect(rows).toHaveLength(2);
        expect(rows[1].querySelector('.anytable-adv-sort-column').getAttribute('data-value')).toBe('1');

        rows[1].querySelector('.anytable-adv-sort-direction').click();
        rows[1].querySelector('.anytable-adv-sort-type-btn').click();
        findOpenDropdownOption('advancedPanel.sort.type.number').click();

        panel.dialog.parentElement.querySelector('.anytable-advanced-apply').click();

        expect(onApply).toHaveBeenCalledTimes(1);
        expect(onApply.mock.calls[0][0]).toEqual([
            {
                column: 0,
                direction: 'asc',
                type: 'auto'
            },
            {
                column: 1,
                direction: 'desc',
                type: 'number'
            }
        ]);
    }, 15000);

    it('高级面板会为重复列名追加逻辑列序号以区分同名列', () => {
        const panel = openAdvancedSortPanel({
            columnIndex: 0,
            columnTitles: ['姓名', '姓名', '绩效'],
            initialRules: [
                { column: 0, direction: 'asc', type: 'auto' },
                { column: 1, direction: 'desc', type: 'auto' }
            ],
            tableElement: document.createElement('table'),
            getColumnValues: vi.fn(() => ['张三', '李四']),
            onApply: vi.fn(),
            onCancel: vi.fn()
        });

        const columnButtons = Array.from(panel.dialog.querySelectorAll('.anytable-adv-sort-column'));
        expect(columnButtons.map((button) => button.textContent)).toEqual([
            '姓名（第1列）',
            '姓名（第2列）'
        ]);

        columnButtons[0].click();
        expect(findOpenDropdownOption('姓名（第1列）')).not.toBeNull();
        expect(findOpenDropdownOption('姓名（第2列）')).not.toBeNull();
        expect(findOpenDropdownOption('绩效')).not.toBeNull();
    }, 15000);

    it('高级排序面板切换列时会刷新列值推断，并在减少到单列后清空多列提示', () => {
        const getColumnValues = vi.fn((columnIndex) => {
            if (columnIndex === 1) {
                return ['10', '20', '30'];
            }
            if (columnIndex === 2) {
                return ['上海', '北京', '深圳'];
            }
            return ['Alice', 'Bob', 'Carol'];
        });
        const panel = openAdvancedSortPanel({
            columnIndex: 0,
            columnTitles: ['姓名', '分数', '城市'],
            initialRules: [
                { column: 0, direction: 'asc', type: 'auto' },
                { column: 1, direction: 'desc', type: 'auto' }
            ],
            tableElement: document.createElement('table'),
            getColumnValues,
            onApply: vi.fn(),
            onCancel: vi.fn()
        });

        expect(panel.dialog.querySelector('[data-role="hint"]').textContent).toBe(
            'advancedPanel.sort.hint.multiColumnAuto'
        );
        expect(getColumnValues).toHaveBeenCalledWith(0);
        expect(getColumnValues).toHaveBeenCalledWith(1);

        const firstRowColumnButton = panel.dialog.querySelector('.anytable-adv-sort-row .anytable-adv-sort-column');
        firstRowColumnButton.click();
        findOpenDropdownOption('城市').click();

        expect(firstRowColumnButton.getAttribute('data-value')).toBe('2');
        expect(getColumnValues).toHaveBeenLastCalledWith(2);

        const rows = Array.from(panel.dialog.querySelectorAll('.anytable-adv-sort-row'));
        rows[1].querySelector('.anytable-adv-remove-sort-rule').click();

        expect(panel.dialog.querySelectorAll('.anytable-adv-sort-row')).toHaveLength(1);
        expect(panel.dialog.querySelector('[data-role="hint"]').textContent).toBe('');
    }, 15000);

    it('高级排序面板会保护最后一条规则，并在列都已使用时阻止继续新增', () => {
        const panel = openAdvancedSortPanel({
            columnIndex: 1,
            columnTitles: ['姓名', '分数'],
            initialRules: [{ column: 1, direction: 'asc', type: 'auto' }],
            tableElement: document.createElement('table'),
            getColumnValues: vi.fn(() => ['10', '20']),
            onApply: vi.fn(),
            onCancel: vi.fn()
        });

        panel.dialog.querySelector('.anytable-adv-remove-sort-rule').click();

        expect(panel.dialog.querySelectorAll('.anytable-adv-sort-row')).toHaveLength(1);
        expect(panel.dialog.querySelector('[data-role="hint"]').textContent).toBe(
            'advancedPanel.sort.hint.keepOneRule'
        );

        panel.dialog.querySelector('.anytable-adv-add-sort-rule').click();
        panel.dialog.querySelector('.anytable-adv-add-sort-rule').click();

        expect(panel.dialog.querySelectorAll('.anytable-adv-sort-row')).toHaveLength(2);
        expect(panel.dialog.querySelector('[data-role="hint"]').textContent).toBe(
            'advancedPanel.sort.hint.allColumnsUsed'
        );

        panel.dialog.querySelector('.anytable-advanced-reset').click();

        const rowsAfterReset = panel.dialog.querySelectorAll('.anytable-adv-sort-row');
        expect(rowsAfterReset).toHaveLength(1);
        expect(rowsAfterReset[0].querySelector('.anytable-adv-sort-column').getAttribute('data-value')).toBe('1');
        expect(panel.dialog.querySelector('[data-role="hint"]').textContent).toBe(
            'advancedPanel.sort.hint.resetDone'
        );
    });

    it('高级排序面板会拦截无效规则并支持取消、关闭和遮罩层关闭', () => {
        const onApply = vi.fn();
        const invalidPanel = openAdvancedSortPanel({
            columnIndex: 0,
            columnTitles: ['姓名', '分数'],
            initialRules: [{ column: 0, direction: 'asc', type: 'auto' }],
            tableElement: document.createElement('table'),
            getColumnValues: vi.fn(() => ['Alice', 'Bob']),
            onApply,
            onCancel: vi.fn()
        });

        invalidPanel.dialog.querySelector('.anytable-adv-sort-column').setAttribute('data-value', 'NaN');
        invalidPanel.dialog.querySelector('.anytable-advanced-apply').click();

        expect(onApply).not.toHaveBeenCalled();
        expect(invalidPanel.dialog.querySelector('[data-role="hint"]').textContent).toBe(
            'advancedPanel.sort.errors.invalidColumn'
        );
        invalidPanel.close();

        const onCancel = vi.fn();
        const cancelPanel = openAdvancedSortPanel({
            columnIndex: 0,
            columnTitles: ['姓名'],
            initialRules: null,
            tableElement: document.createElement('table'),
            getColumnValues: vi.fn(() => ['Alice']),
            onApply: vi.fn(),
            onCancel
        });

        cancelPanel.dialog.querySelector('.anytable-advanced-cancel').click();

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(getShadowHosts()).toHaveLength(0);

        const onCloseCancel = vi.fn();
        const closePanel = openAdvancedSortPanel({
            columnIndex: 0,
            columnTitles: ['姓名'],
            initialRules: null,
            tableElement: document.createElement('table'),
            getColumnValues: vi.fn(() => ['Alice']),
            onApply: vi.fn(),
            onCancel: onCloseCancel
        });

        closePanel.dialog.querySelector('.anytable-advanced-close').click();

        expect(onCloseCancel).toHaveBeenCalledTimes(1);
        expect(getShadowHosts()).toHaveLength(0);

        const overlayCancel = vi.fn();
        const overlayPanel = openAdvancedSortPanel({
            columnIndex: 0,
            columnTitles: ['姓名'],
            initialRules: null,
            tableElement: document.createElement('table'),
            getColumnValues: vi.fn(() => ['Alice']),
            onApply: vi.fn(),
            onCancel: overlayCancel
        });

        overlayPanel.dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(overlayCancel).not.toHaveBeenCalled();
        expect(getShadowHosts()).toHaveLength(1);

        overlayPanel.overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(overlayCancel).toHaveBeenCalledTimes(1);
        expect(getShadowHosts()).toHaveLength(0);

        const manualOnCancel = vi.fn();
        const manualPanel = openAdvancedSortPanel({
            columnIndex: 0,
            columnTitles: ['姓名'],
            initialRules: null,
            tableElement: document.createElement('table'),
            getColumnValues: vi.fn(() => ['Alice']),
            onApply: vi.fn(),
            onCancel: manualOnCancel
        });

        manualPanel.close();

        expect(manualOnCancel).not.toHaveBeenCalled();
        expect(getShadowHosts()).toHaveLength(0);
    });

    it('高级筛选面板支持嵌套分组编辑并保护最后一条根规则', () => {
        const onApply = vi.fn();
        const panel = openAdvancedFilterPanel({
            columnTitles: ['部门', '姓名', '城市'],
            initialRuleGroup: null,
            onApply,
            onCancel: vi.fn()
        });

        panel.dialog.querySelector('.anytable-adv-remove-rule').click();
        expect(panel.dialog.parentElement.querySelector('[data-role="hint"]').textContent).toBe(
            'advancedPanel.filter.hint.keepOneRule'
        );

        panel.dialog.querySelector('.anytable-advanced-body > .anytable-adv-group-actions > .anytable-adv-add-group').click();

        const group = panel.dialog.querySelector('.anytable-adv-rule-group');
        expect(group).not.toBeNull();

        group.querySelector('.anytable-adv-group-header .anytable-adv-negate').click();

        panel.dialog.parentElement.querySelector('.anytable-advanced-apply').click();

        expect(onApply).toHaveBeenCalledTimes(1);
        expect(onApply.mock.calls[0][0].children[1]).toMatchObject({
            negated: true,
            operator: 'AND',
            children: [
                {
                    column: 0,
                    comparator: 'contains',
                    value: ''
                }
            ]
        });
    });

    it('高级筛选面板支持组内新增规则、切换组内运算符并保留组取反状态', () => {
        const onApply = vi.fn();
        const panel = openAdvancedFilterPanel({
            columnTitles: ['部门', '姓名', '城市'],
            initialRuleGroup: null,
            onApply,
            onCancel: vi.fn()
        });

        panel.dialog.querySelector('.anytable-advanced-body > .anytable-adv-group-actions > .anytable-adv-add-group').click();

        let group = panel.dialog.querySelector('.anytable-adv-rule-group');
        group.querySelector('.anytable-adv-group-header .anytable-adv-negate').click();
        group.querySelector('.anytable-adv-group-actions .anytable-adv-add-rule').click();

        group = panel.dialog.querySelector('.anytable-adv-rule-group');
        expect(group.querySelectorAll('.anytable-adv-group-children > .anytable-adv-rule-row')).toHaveLength(2);

        const operatorButton = group.querySelector('.anytable-adv-group-children > .anytable-adv-rule-operator .anytable-adv-inline-operator');
        operatorButton.click();
        findOpenDropdownOption('advancedPanel.filter.operator.or').click();

        panel.dialog.parentElement.querySelector('.anytable-advanced-apply').click();

        expect(onApply).toHaveBeenCalledTimes(1);
        expect(onApply.mock.calls[0][0].children[1]).toMatchObject({
            negated: true,
            operator: 'AND',
            children: [
                {
                    column: 0,
                    comparator: 'contains',
                    value: ''
                },
                {
                    column: 0,
                    comparator: 'contains',
                    value: '',
                    operator: 'OR'
                }
            ]
        });
    }, 15000);

    it('高级筛选面板支持删除分组并回退到剩余根规则', () => {
        const onApply = vi.fn();
        const panel = openAdvancedFilterPanel({
            columnTitles: ['部门', '姓名'],
            initialRuleGroup: null,
            onApply,
            onCancel: vi.fn()
        });

        panel.dialog.querySelector('.anytable-advanced-body > .anytable-adv-group-actions > .anytable-adv-add-group').click();
        expect(panel.dialog.querySelectorAll('.anytable-adv-rule-group')).toHaveLength(1);

        panel.dialog.querySelector('.anytable-adv-group-header .anytable-adv-remove-group').click();

        expect(panel.dialog.querySelectorAll('.anytable-adv-rule-group')).toHaveLength(0);
        expect(panel.dialog.querySelectorAll('.anytable-adv-rule-row')).toHaveLength(1);

        panel.dialog.parentElement.querySelector('.anytable-advanced-apply').click();

        expect(onApply).toHaveBeenCalledTimes(1);
        expect(onApply.mock.calls[0][0].children).toHaveLength(1);
    });

    it('高级筛选面板支持组内嵌套分组，并在达到最大深度时给出提示', () => {
        const panel = openAdvancedFilterPanel({
            columnTitles: ['部门', '姓名', '城市'],
            initialRuleGroup: null,
            onApply: vi.fn(),
            onCancel: vi.fn()
        });

        panel.dialog.querySelector('.anytable-advanced-body > .anytable-adv-group-actions > .anytable-adv-add-group').click();

        for (let index = 0; index < 3; index += 1) {
            const group = getLastFilterGroup(panel.dialog);
            group.querySelector('.anytable-adv-group-actions .anytable-adv-add-group').click();
        }

        expect(panel.dialog.querySelectorAll('.anytable-adv-rule-group')).toHaveLength(4);

        const deepestGroup = getLastFilterGroup(panel.dialog);
        deepestGroup.querySelector('.anytable-adv-group-actions .anytable-adv-add-group').click();

        expect(panel.dialog.querySelectorAll('.anytable-adv-rule-group')).toHaveLength(4);
        expect(panel.dialog.querySelector('[data-role="hint"]').textContent).toBe(
            'advancedPanel.filter.hint.maxDepth'
        );
    }, 15000);

    it('高级筛选面板重置后会恢复为单条默认规则并显示提示', () => {
        const onApply = vi.fn();
        const panel = openAdvancedFilterPanel({
            columnTitles: ['部门', '姓名', '城市'],
            initialRuleGroup: null,
            onApply,
            onCancel: vi.fn()
        });

        panel.dialog.querySelector('.anytable-advanced-body > .anytable-adv-group-actions > .anytable-adv-add-rule').click();
        expect(panel.dialog.querySelectorAll('.anytable-adv-rule-row')).toHaveLength(2);

        panel.dialog.querySelector('.anytable-advanced-reset').click();

        expect(panel.dialog.querySelectorAll('.anytable-adv-rule-row')).toHaveLength(1);
        expect(panel.dialog.querySelector('[data-role="hint"]').textContent).toBe(
            'advancedPanel.filter.hint.resetDone'
        );

        panel.dialog.querySelector('.anytable-advanced-apply').click();

        expect(onApply).toHaveBeenCalledTimes(1);
        expect(onApply.mock.calls[0][0].children[0]).toMatchObject({
            column: 0,
            comparator: 'contains',
            value: ''
        });
    });

    it('高级筛选面板的取消和关闭按钮会触发取消回调并销毁弹层', () => {
        const onCancel = vi.fn();
        const cancelPanel = openAdvancedFilterPanel({
            columnTitles: ['部门'],
            initialRuleGroup: null,
            onApply: vi.fn(),
            onCancel
        });

        cancelPanel.dialog.querySelector('.anytable-advanced-cancel').click();

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(getShadowHosts()).toHaveLength(0);

        const onCloseCancel = vi.fn();
        const closePanel = openAdvancedFilterPanel({
            columnTitles: ['部门'],
            initialRuleGroup: null,
            onApply: vi.fn(),
            onCancel: onCloseCancel
        });

        closePanel.dialog.querySelector('.anytable-advanced-close').click();

        expect(onCloseCancel).toHaveBeenCalledTimes(1);
        expect(getShadowHosts()).toHaveLength(0);
    });

    it('高级筛选面板只在点击遮罩层时关闭，直接调用 close 不触发取消回调', () => {
        const onCancel = vi.fn();
        const overlayPanel = openAdvancedFilterPanel({
            columnTitles: ['部门'],
            initialRuleGroup: null,
            onApply: vi.fn(),
            onCancel
        });

        overlayPanel.dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(onCancel).not.toHaveBeenCalled();
        expect(getShadowHosts()).toHaveLength(1);

        overlayPanel.overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(getShadowHosts()).toHaveLength(0);

        const manualOnCancel = vi.fn();
        const manualPanel = openAdvancedFilterPanel({
            columnTitles: ['部门'],
            initialRuleGroup: null,
            onApply: vi.fn(),
            onCancel: manualOnCancel
        });

        manualPanel.close();

        expect(manualOnCancel).not.toHaveBeenCalled();
        expect(getShadowHosts()).toHaveLength(0);
    });
});
