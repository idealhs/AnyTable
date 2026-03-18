// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { isLikelyDataTable } from '../../src/core/table-detector.js';

function mockCell(text = '', colSpan = 1) {
    return {
        textContent: text,
        colSpan
    };
}

function mockRow(cells) {
    return { cells };
}

function mockHeader(text = '') {
    return {
        textContent: text,
        childNodes: [{textContent: text}]
    };
}

function mockTable({ role = null, captionText = '', headers = [], rows = [] } = {}) {
    return {
        caption: captionText ? { textContent: captionText } : null,
        getAttribute(name) {
            if (name === 'role') {
                return role;
            }
            return null;
        },
        getElementsByTagName(tagName) {
            if (tagName === 'th') {
                return headers;
            }
            if (tagName === 'tr') {
                return rows;
            }
            return [];
        }
    };
}

describe('isLikelyDataTable', () => {
    it('rejects presentation tables', () => {
        const table = mockTable({
            role: 'presentation',
            rows: [
                mockRow([mockCell('名称'), mockCell('数量')]),
                mockRow([mockCell('苹果'), mockCell('12')])
            ]
        });

        expect(isLikelyDataTable(table)).toBe(false);
    });

    it('rejects single-row layout tables without semantic hints', () => {
        const table = mockTable({
            rows: [
                mockRow([
                    mockCell('头像'),
                    mockCell('主题标题和摘要'),
                    mockCell('47')
                ])
            ]
        });

        expect(isLikelyDataTable(table)).toBe(false);
    });

    it('accepts multi-row tables without th when the row shape repeats', () => {
        const table = mockTable({
            rows: [
                mockRow([mockCell('苹果'), mockCell('12'), mockCell('水果')]),
                mockRow([mockCell('白菜'), mockCell('4'), mockCell('蔬菜')]),
                mockRow([mockCell('牛奶'), mockCell('20'), mockCell('饮品')])
            ]
        });

        expect(isLikelyDataTable(table)).toBe(true);
    });

    it('accepts tables with header cells', () => {
        const table = mockTable({
            headers: [mockHeader('名称'), mockHeader('数量')],
            rows: [
                mockRow([mockCell('名称'), mockCell('数量')]),
                mockRow([mockCell('苹果'), mockCell('12')])
            ]
        });

        expect(isLikelyDataTable(table)).toBe(true);
    });

    it('ignores nested table rows and headers when judging the outer table', () => {
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
                                    <tr><th>步骤</th><th>负责人</th><th>耗时</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>安全检查</td><td>张三</td><td>15 min</td></tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr><td>REQ-102</td><td>合同归档</td><td>普通文本</td></tr>
                </tbody>
            </table>
        `;

        expect(isLikelyDataTable(document.getElementById('outer'))).toBe(true);
    });
});
