// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { applyCombinedFilters } from '../../src/core/filter-engine.js';
import { collectVisibleTableRows } from '../../src/core/csv-export.js';
import { computeStatisticsData } from '../../src/core/statistics-engine.js';
import { applyTableBodyGroups, buildGloballySortedTableBodyGroups } from '../../src/core/table-group-sort.js';
import { buildTableModel } from '../../src/core/table-model.js';
import { renderStatisticsRows } from '../../src/ui/statistics-renderer.js';

function mountTable(html) {
    document.body.innerHTML = html.trim();
    return document.querySelector('table');
}

describe('真实 DOM 表格夹具', () => {
    it('在多 tbody 和合并单元格场景下输出统一的逻辑行视图', () => {
        const table = mountTable(`
            <table>
                <thead>
                    <tr>
                        <th>部门</th>
                        <th>姓名</th>
                        <th>分数</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td rowspan="2">研发</td>
                        <td>Alice</td>
                        <td>98</td>
                    </tr>
                    <tr>
                        <td>Bob</td>
                        <td>95</td>
                    </tr>
                </tbody>
                <tbody>
                    <tr>
                        <td>运营</td>
                        <td colspan="2">暂无数据</td>
                    </tr>
                </tbody>
            </table>
        `);

        const tableModel = buildTableModel(table);

        expect(tableModel.columnTitles).toEqual(['部门', '姓名', '分数']);
        expect(tableModel.tbodyGroups.map((group) => group.rows.length)).toEqual([2, 1]);
        expect(tableModel.rowSpanStrategy).toBe('repeat-source-cell');
        expect(tableModel.bodyRows[1].cellMap[0].text).toBe('研发');
        expect(tableModel.bodyRows[1].cellMap[0].isRowSpanContinuation).toBe(true);
        expect(tableModel.bodyRows[2].cellMap[1].text).toBe('暂无数据');
        expect(tableModel.bodyRows[2].cellMap[2].isColSpanContinuation).toBe(true);
        expect(collectVisibleTableRows(table)).toEqual([
            ['部门', '姓名', '分数'],
            ['研发', 'Alice', '98'],
            ['研发', 'Bob', '95'],
            ['运营', '暂无数据', '暂无数据']
        ]);
    });

    it('在清空筛选后保留宿主页面原本隐藏的行，并让统计与导出共享同一可见性语义', () => {
        const table = mountTable(`
            <table>
                <thead>
                    <tr>
                        <th>订单号</th>
                        <th>金额</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>ORD-001</td><td>12</td></tr>
                    <tr id="host-hidden-row" style="display: none;"><td>ORD-002</td><td>20</td></tr>
                    <tr><td>ORD-003</td><td>8</td></tr>
                </tbody>
            </table>
        `);
        const hostHiddenRow = document.getElementById('host-hidden-row');

        applyCombinedFilters(table, {0: 'ORD-001'});
        expect(hostHiddenRow.getAttribute('data-anytable-filter-hidden')).toBe('true');

        applyCombinedFilters(table, {});

        expect(hostHiddenRow.hasAttribute('data-anytable-filter-hidden')).toBe(false);
        expect(hostHiddenRow.style.display).toBe('none');
        expect(collectVisibleTableRows(table)).toEqual([
            ['订单号', '金额'],
            ['ORD-001', '12'],
            ['ORD-003', '8']
        ]);

        const stats = computeStatisticsData([{column: 1, statType: 'sum'}], table);
        expect(stats.get('sum').get(1)).toBe(20);
    });

    it('在嵌套表格场景下只排序外层行，不污染内层结构', () => {
        const table = mountTable(`
            <table id="outer">
                <thead>
                    <tr>
                        <th>工单号</th>
                        <th>概要</th>
                        <th>明细</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>REQ-085</td>
                        <td>上线审批</td>
                        <td>
                            <table class="nested-demo">
                                <thead>
                                    <tr><th>步骤</th><th>负责人</th><th>耗时</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>安全检查</td><td>张三</td><td>15 min</td></tr>
                                    <tr><td>灰度发布</td><td>Alice</td><td>30 min</td></tr>
                                    <tr><td>验收确认</td><td>李四</td><td>12 min</td></tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr><td>REQ-102</td><td>合同归档</td><td>普通文本</td></tr>
                    <tr><td>REQ-121</td><td>数据回补</td><td>回补说明</td></tr>
                </tbody>
            </table>
        `);
        const tableModel = buildTableModel(table);

        expect(tableModel.columnTitles).toEqual(['工单号', '概要', '明细']);
        expect(tableModel.bodyRows).toHaveLength(3);

        const sortedGroups = buildGloballySortedTableBodyGroups(tableModel, [
            {column: 0, direction: 'desc', type: 'text'}
        ]);

        expect(() => applyTableBodyGroups(tableModel, sortedGroups)).not.toThrow();
        expect(Array.from(table.tBodies[0].rows).map((row) => row.cells[0].textContent.trim())).toEqual([
            'REQ-121',
            'REQ-102',
            'REQ-085'
        ]);
        expect(table.querySelectorAll('.nested-demo tbody tr')).toHaveLength(3);
    });

    it('在外层统计渲染时不会删除或重挂内嵌表自己的统计行', () => {
        const table = mountTable(`
            <table id="outer">
                <thead>
                    <tr><th>工单号</th><th>金额</th><th>明细</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>REQ-085</td>
                        <td>12</td>
                        <td>
                            <table class="nested-demo">
                                <tbody>
                                    <tr data-anytable-stats-row="sum"><td>内层统计</td></tr>
                                    <tr><td>子步骤 A</td></tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr><td>REQ-102</td><td>20</td><td>普通文本</td></tr>
                </tbody>
            </table>
        `);

        const statsData = new Map([
            ['sum', new Map([[1, 32]])]
        ]);

        renderStatisticsRows(table, statsData, 3);

        expect(Array.from(table.tBodies[0].rows).map((row) => row.cells[0].textContent.trim())).toEqual([
            '',
            'REQ-085',
            'REQ-102'
        ]);
        expect(Array.from(table.querySelectorAll('.nested-demo tbody > tr')).map((row) => row.textContent.trim())).toEqual([
            '内层统计',
            '子步骤 A'
        ]);
        expect(table.tBodies[0].rows[0].getAttribute('data-anytable-stats-row')).toBe('sum');
    });
});
