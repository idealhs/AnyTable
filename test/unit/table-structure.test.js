import { describe, expect, it } from 'vitest';
import { getTableColumnCount, getTableColumnTitles } from '../../src/core/table-structure.js';

function mockCell(text = '', colSpan = 1) {
    return {
        textContent: text,
        colSpan
    };
}

function mockRow(cells) {
    return { cells };
}

function mockHeader(text) {
    return {
        childNodes: [{textContent: text}],
        textContent: text
    };
}

function mockTable({headers = [], rows = []}) {
    return {
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

describe('getTableColumnCount', () => {
    it('uses the widest row when headers are missing', () => {
        const table = mockTable({
            rows: [
                mockRow([mockCell('苹果'), mockCell('12'), mockCell('水果')]),
                mockRow([mockCell('牛奶'), mockCell('20'), mockCell('饮品')])
            ]
        });

        expect(getTableColumnCount(table)).toBe(3);
    });

    it('counts colSpan when inferring table width', () => {
        const table = mockTable({
            rows: [
                mockRow([mockCell('部门'), mockCell('姓名'), mockCell('产值')]),
                mockRow([mockCell('运营'), mockCell('暂无数据', 2)])
            ]
        });

        expect(getTableColumnCount(table)).toBe(3);
    });
});

describe('getTableColumnTitles', () => {
    it('falls back to generated titles when the table has no th', () => {
        const table = mockTable({
            rows: [
                mockRow([mockCell('苹果'), mockCell('12'), mockCell('水果')])
            ]
        });

        expect(getTableColumnTitles(table, (index) => `列${index + 1}`)).toEqual(['列1', '列2', '列3']);
    });

    it('keeps header text and fills missing columns with fallback titles', () => {
        const table = mockTable({
            headers: [mockHeader('名称')],
            rows: [
                mockRow([mockCell('苹果'), mockCell('12'), mockCell('水果')])
            ]
        });

        expect(getTableColumnTitles(table, (index) => `列${index + 1}`)).toEqual(['名称', '列2', '列3']);
    });
});
