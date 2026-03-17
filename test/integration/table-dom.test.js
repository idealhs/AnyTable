// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { collectVisibleTableRows } from '../../src/core/csv-export.js';
import { buildTableModel } from '../../src/core/table-model.js';

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
});
