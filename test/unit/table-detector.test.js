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
});
