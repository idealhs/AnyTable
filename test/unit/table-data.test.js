import { describe, expect, it } from 'vitest';
import { getCellText, getColumnValues } from '../../src/core/table-data.js';
import { buildTableModel } from '../../src/core/table-model.js';
import { mockCell, mockRow, mockTable } from './helpers/mock-table.js';

describe('getColumnValues', () => {
    it('reads column values across multiple tbody sections', () => {
        const table = mockTable({
            bodySections: [
                [mockRow([mockCell('华北'), mockCell('12')])],
                [mockRow([mockCell('华南'), mockCell('20')])]
            ]
        });

        expect(getColumnValues(table, 1)).toEqual(['12', '20']);
    });
});

describe('getCellText', () => {
    it('reads logical columns from the table model when a cell spans multiple columns', () => {
        const table = mockTable({
            bodySections: [[
                mockRow([mockCell('A组'), mockCell('待处理', {colSpan: 2})])
            ]]
        });
        const tableModel = buildTableModel(table);
        const rowModel = tableModel.bodyRows[0];

        expect(getCellText(rowModel, 1, tableModel)).toBe('待处理');
        expect(getCellText(rowModel, 2, tableModel)).toBe('待处理');
    });
});
