// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { SortController } from '../../src/controllers/sort-controller.js';
import { TableStateStore } from '../../src/state/table-state.js';

function mountTable(html) {
    document.body.innerHTML = html.trim();
    return document.querySelector('table');
}

function getBodyRowNames(table) {
    return Array.from(table.tBodies[0].rows).map((row) => row.cells[0].textContent.trim());
}

function createSortController(table) {
    const stateStore = new TableStateStore();
    const enhancedTables = new Set([table]);
    const controller = new SortController({
        enhancedTables,
        stateStore,
        controlPanelManager: {
            getHeaderControl() {
                return null;
            }
        },
        toolbar: {
            refreshActiveStates() {}
        },
        isMultiColumnSortEnabled: () => false,
        enableMultiColumnSort() {},
        setSortButtonIcon() {}
    });

    return { controller, stateStore };
}

describe('SortController 真实 DOM 交互', () => {
    it('在动态增删行后恢复无排序时保留当前真实行集合', () => {
        const table = mountTable(`
            <table>
                <tbody>
                    <tr><td>Alice</td><td>30</td></tr>
                    <tr><td>Bob</td><td>10</td></tr>
                    <tr><td>Carol</td><td>20</td></tr>
                </tbody>
            </table>
        `);
        const { controller } = createSortController(table);

        controller.sortTable(table, 1);
        expect(getBodyRowNames(table)).toEqual(['Bob', 'Carol', 'Alice']);

        const tbody = table.tBodies[0];
        const insertedRow = document.createElement('tr');
        insertedRow.innerHTML = '<td>Dana</td><td>25</td>';
        tbody.appendChild(insertedRow);

        const removedRow = Array.from(tbody.rows).find((row) => row.cells[0].textContent.trim() === 'Carol');
        removedRow.remove();

        controller.syncOriginalRowOrder(table);
        controller.applySortRules(table, []);

        expect(getBodyRowNames(table)).toEqual(['Alice', 'Bob', 'Dana']);
        expect(Array.from(tbody.rows).some((row) => row.cells[0].textContent.trim() === 'Carol')).toBe(false);
    });

    it('在外层排序时不会搬走内嵌表自己的统计行', () => {
        const table = mountTable(`
            <table id="outer">
                <thead>
                    <tr><th>工单号</th><th>概要</th><th>明细</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>REQ-085</td>
                        <td>上线审批</td>
                        <td>
                            <table class="nested-demo">
                                <tbody>
                                    <tr data-anytable-stats-row="sum"><td>内层统计</td></tr>
                                    <tr><td>子步骤 A</td></tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr><td>REQ-121</td><td>数据回补</td><td>回补说明</td></tr>
                    <tr><td>REQ-102</td><td>合同归档</td><td>普通文本</td></tr>
                </tbody>
            </table>
        `);
        const { controller } = createSortController(table);

        controller.applySortRules(table, [
            {column: 0, direction: 'desc', type: 'text'}
        ]);

        expect(getBodyRowNames(table)).toEqual(['REQ-121', 'REQ-102', 'REQ-085']);
        expect(Array.from(table.querySelectorAll('.nested-demo tbody > tr')).map((row) => row.textContent.trim())).toEqual([
            '内层统计',
            '子步骤 A'
        ]);
        expect(table.tBodies[0].querySelectorAll(':scope > tr[data-anytable-stats-row]').length).toBe(0);
    });
});
