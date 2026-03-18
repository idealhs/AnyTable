// @vitest-environment jsdom

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

    it('keeps nested table structure out of the outer table model', () => {
        document.body.innerHTML = `
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
                                    <tr>
                                        <th>步骤</th>
                                        <th>负责人</th>
                                        <th>耗时</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>安全检查</td><td>张三</td><td>15 min</td></tr>
                                    <tr><td>灰度发布</td><td>Alice</td><td>30 min</td></tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr><td>REQ-102</td><td>合同归档</td><td>普通文本</td></tr>
                    <tr><td>REQ-121</td><td>数据回补</td><td>回补说明</td></tr>
                </tbody>
            </table>
        `;

        const tableModel = buildTableModel(document.getElementById('outer'));

        expect(tableModel.columnCount).toBe(3);
        expect(tableModel.columnTitles).toEqual(['工单号', '概要', '明细']);
        expect(tableModel.bodyRows).toHaveLength(3);
        expect(tableModel.bodyRows.map((rowModel) => rowModel.cellMap[0]?.text)).toEqual(['REQ-085', 'REQ-102', 'REQ-121']);
    });

    it('marks colspan headers as non-actionable and keeps uniquely mapped leaf headers actionable', () => {
        const mergedNameHeader = mockCell('姓名', {tagName: 'TH', colSpan: 2});
        const scoreHeader = mockCell('绩效', {tagName: 'TH'});
        const cityHeader = mockCell('城市', {tagName: 'TH'});
        const table = mockTable({
            theadRows: [mockRow([
                mergedNameHeader,
                scoreHeader,
                cityHeader
            ])],
            bodySections: [[
                mockRow([mockCell('张'), mockCell('三'), mockCell('88'), mockCell('上海')])
            ]]
        });

        const tableModel = buildTableModel(table);

        expect(tableModel.columnTitles).toEqual(['姓名', '姓名', '绩效', '城市']);
        expect(tableModel.columnDescriptors.map((descriptor) => ({
            columnIndex: descriptor.columnIndex,
            headerCell: descriptor.headerCell,
            headerSpan: descriptor.headerSpan,
            isActionable: descriptor.isActionable,
            controlAnchor: descriptor.controlAnchor
        }))).toEqual([
            {
                columnIndex: 0,
                headerCell: mergedNameHeader,
                headerSpan: {colSpan: 2, rowSpan: 1},
                isActionable: false,
                controlAnchor: null
            },
            {
                columnIndex: 1,
                headerCell: mergedNameHeader,
                headerSpan: {colSpan: 2, rowSpan: 1},
                isActionable: false,
                controlAnchor: null
            },
            {
                columnIndex: 2,
                headerCell: scoreHeader,
                headerSpan: {colSpan: 1, rowSpan: 1},
                isActionable: true,
                controlAnchor: scoreHeader
            },
            {
                columnIndex: 3,
                headerCell: cityHeader,
                headerSpan: {colSpan: 1, rowSpan: 1},
                isActionable: true,
                controlAnchor: cityHeader
            }
        ]);
        expect(tableModel.complexityFlags).toEqual({
            hasColSpan: true,
            hasRowSpan: false,
            hasAmbiguousHeaders: true
        });
    });

    it('keeps a single-column header actionable even when it spans multiple header rows', () => {
        const nameHeader = mockCell('姓名', {tagName: 'TH', rowSpan: 2});
        const scoreGroupHeader = mockCell('成绩', {tagName: 'TH', colSpan: 2});
        const chineseHeader = mockCell('语文', {tagName: 'TH'});
        const mathHeader = mockCell('数学', {tagName: 'TH'});
        const table = mockTable({
            theadRows: [
                mockRow([nameHeader, scoreGroupHeader]),
                mockRow([chineseHeader, mathHeader])
            ],
            bodySections: [[
                mockRow([mockCell('张三'), mockCell('91'), mockCell('95')])
            ]]
        });

        const tableModel = buildTableModel(table);

        expect(tableModel.columnTitles).toEqual(['姓名', '语文', '数学']);
        expect(tableModel.columnDescriptors.map((descriptor) => ({
            columnIndex: descriptor.columnIndex,
            headerCell: descriptor.headerCell,
            headerRowIndex: descriptor.headerRowIndex,
            headerSpan: descriptor.headerSpan,
            isActionable: descriptor.isActionable
        }))).toEqual([
            {
                columnIndex: 0,
                headerCell: nameHeader,
                headerRowIndex: 0,
                headerSpan: {colSpan: 1, rowSpan: 2},
                isActionable: true
            },
            {
                columnIndex: 1,
                headerCell: chineseHeader,
                headerRowIndex: 1,
                headerSpan: {colSpan: 1, rowSpan: 1},
                isActionable: true
            },
            {
                columnIndex: 2,
                headerCell: mathHeader,
                headerRowIndex: 1,
                headerSpan: {colSpan: 1, rowSpan: 1},
                isActionable: true
            }
        ]);
    });
});
