// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
    getOwnedHeaderCells,
    getOwnedRowsInSection,
    getOwnedTableRows,
    getOwnedTableSections
} from '../../src/core/table-boundary.js';

function mountOuterTable() {
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
            </tbody>
        </table>
    `;
    return document.getElementById('outer');
}

describe('table-boundary', () => {
    it('keeps nested table sections and rows out of the outer table scope', () => {
        const outerTable = mountOuterTable();
        const outerBody = outerTable.tBodies[0];

        expect(getOwnedTableSections(outerTable, 'thead')).toHaveLength(1);
        expect(getOwnedTableSections(outerTable, 'tbody')).toHaveLength(1);
        expect(getOwnedHeaderCells(outerTable).map((cell) => cell.textContent.trim())).toEqual(['工单号', '概要', '明细']);
        expect(getOwnedTableRows(outerTable).map((row) => row.cells[0]?.textContent.trim() || '')).toEqual([
            '工单号',
            'REQ-085',
            'REQ-102'
        ]);
        expect(getOwnedRowsInSection(outerTable, outerBody).map((row) => row.cells[0]?.textContent.trim() || '')).toEqual([
            'REQ-085',
            'REQ-102'
        ]);
    });
});
