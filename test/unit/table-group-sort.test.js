import { describe, expect, it } from 'vitest';
import {
    applyTableBodyGroups,
    buildGloballySortedTableBodyGroups
} from '../../src/core/table-group-sort.js';
import { buildTableModel } from '../../src/core/table-model.js';
import { mockCell, mockRow, mockTable } from './helpers/mock-table.js';

describe('buildGloballySortedTableBodyGroups', () => {
    it('sorts all tbody rows together and re-distributes rows by the original tbody sizes', () => {
        const table = mockTable({
            bodySections: [
                [
                    mockRow([mockCell('A'), mockCell('甲'), mockCell('91')]),
                    mockRow([mockCell('A'), mockCell('乙'), mockCell('80')])
                ],
                [
                    mockRow([mockCell('B'), mockCell('丙'), mockCell('88')]),
                    mockRow([mockCell('B'), mockCell('丁'), mockCell('76')])
                ]
            ]
        });
        const tableModel = buildTableModel(table);

        const sortedGroups = buildGloballySortedTableBodyGroups(tableModel, [
            {column: 2, direction: 'asc', type: 'number'}
        ]);

        expect(sortedGroups).toHaveLength(2);
        expect(sortedGroups[0].rows.map((row) => row.cells[1].textContent)).toEqual(['丁', '乙']);
        expect(sortedGroups[1].rows.map((row) => row.cells[1].textContent)).toEqual(['丙', '甲']);
    });

    it('applies globally sorted groups without removing rows that were already moved', () => {
        const table = mockTable({
            bodySections: [
                [
                    mockRow([mockCell('A'), mockCell('甲'), mockCell('80')]),
                    mockRow([mockCell('A'), mockCell('乙'), mockCell('91')])
                ],
                [
                    mockRow([mockCell('B'), mockCell('丙'), mockCell('76')]),
                    mockRow([mockCell('B'), mockCell('丁'), mockCell('88')])
                ]
            ]
        });
        const tableModel = buildTableModel(table);
        const sortedGroups = buildGloballySortedTableBodyGroups(tableModel, [
            {column: 2, direction: 'asc', type: 'number'}
        ]);

        applyTableBodyGroups(tableModel, sortedGroups);

        expect(Array.from(table.getElementsByTagName('tbody')[0].getElementsByTagName('tr')).map((row) => row.cells[1].textContent)).toEqual(['丙', '甲']);
        expect(Array.from(table.getElementsByTagName('tbody')[1].getElementsByTagName('tr')).map((row) => row.cells[1].textContent)).toEqual(['丁', '乙']);
    });
});
