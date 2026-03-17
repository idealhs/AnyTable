import { describe, expect, it } from 'vitest';
import { getTableColumnCount, getTableColumnTitles } from '../../src/core/table-structure.js';
import { mockCell, mockRow, mockTable } from './helpers/mock-table.js';

describe('getTableColumnCount', () => {
    it('uses the widest row when headers are missing', () => {
        const table = mockTable({
            bodySections: [[
                mockRow([mockCell('苹果'), mockCell('12'), mockCell('水果')]),
                mockRow([mockCell('牛奶'), mockCell('20'), mockCell('饮品')])
            ]]
        });

        expect(getTableColumnCount(table)).toBe(3);
    });

    it('counts colSpan across multiple tbody sections', () => {
        const table = mockTable({
            bodySections: [
                [mockRow([mockCell('部门'), mockCell('姓名'), mockCell('产值')])],
                [mockRow([mockCell('运营'), mockCell('暂无数据', {colSpan: 2})])]
            ]
        });

        expect(getTableColumnCount(table)).toBe(3);
    });
});

describe('getTableColumnTitles', () => {
    it('falls back to generated titles when the table has no th', () => {
        const table = mockTable({
            bodySections: [[
                mockRow([mockCell('苹果'), mockCell('12'), mockCell('水果')])
            ]]
        });

        expect(getTableColumnTitles(table, (index) => `列${index + 1}`)).toEqual(['列1', '列2', '列3']);
    });

    it('expands header colspan into logical column titles', () => {
        const table = mockTable({
            theadRows: [
                mockRow([
                    mockCell('名称', {tagName: 'TH'}),
                    mockCell('状态', {tagName: 'TH', colSpan: 2})
                ])
            ],
            bodySections: [[
                mockRow([mockCell('苹果'), mockCell('待处理'), mockCell('已完成')])
            ]]
        });

        expect(getTableColumnTitles(table, (index) => `列${index + 1}`)).toEqual(['名称', '状态', '状态']);
    });

    it('keeps explicit header text and fills missing logical columns with fallback titles', () => {
        const table = mockTable({
            theadRows: [
                mockRow([mockCell('名称', {tagName: 'TH'})])
            ],
            bodySections: [[
                mockRow([mockCell('苹果'), mockCell('12'), mockCell('水果')])
            ]]
        });

        expect(getTableColumnTitles(table, (index) => `列${index + 1}`)).toEqual(['名称', '列2', '列3']);
    });
});
