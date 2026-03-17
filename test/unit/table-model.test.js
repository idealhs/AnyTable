import { describe, expect, it } from 'vitest';
import { buildTableModel } from '../../src/core/table-model.js';
import { mockCell, mockRow, mockTable } from './helpers/mock-table.js';

describe('buildTableModel', () => {
    it('flattens rows from multiple tbody sections while preserving tbody groups', () => {
        const table = mockTable({
            bodySections: [
                [
                    mockRow([mockCell('华北'), mockCell('12')]),
                    mockRow([mockCell('华东'), mockCell('9')])
                ],
                [
                    mockRow([mockCell('华南'), mockCell('15')])
                ]
            ]
        });

        const tableModel = buildTableModel(table);

        expect(tableModel.bodyRows).toHaveLength(3);
        expect(tableModel.tbodyGroups).toHaveLength(2);
        expect(tableModel.tbodyGroups.map((group) => group.rows.length)).toEqual([2, 1]);
        expect(tableModel.bodyRows.map((rowModel) => rowModel.cellMap[0]?.text)).toEqual(['华北', '华东', '华南']);
    });

    it('expands colspan and reuses source text for rowspan continuation cells', () => {
        const table = mockTable({
            bodySections: [[
                mockRow([
                    mockCell('研发', {rowSpan: 2}),
                    mockCell('Alice'),
                    mockCell('98')
                ]),
                mockRow([
                    mockCell('Bob'),
                    mockCell('95')
                ]),
                mockRow([
                    mockCell('运营'),
                    mockCell('暂无数据', {colSpan: 2})
                ])
            ]]
        });

        const tableModel = buildTableModel(table);

        expect(tableModel.columnCount).toBe(3);
        expect(tableModel.rowSpanStrategy).toBe('repeat-source-cell');
        expect(tableModel.bodyRows[1].cellMap[0]?.text).toBe('研发');
        expect(tableModel.bodyRows[1].cellMap[0]?.isRowSpanContinuation).toBe(true);
        expect(tableModel.bodyRows[2].cellMap[1]?.text).toBe('暂无数据');
        expect(tableModel.bodyRows[2].cellMap[2]?.text).toBe('暂无数据');
        expect(tableModel.bodyRows[2].cellMap[2]?.isColSpanContinuation).toBe(true);
    });
});
