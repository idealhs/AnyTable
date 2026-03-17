import { describe, expect, it } from 'vitest';
import {
    applyTableBodyGroups,
    buildGloballySortedTableBodyGroups,
    buildTableBodyGroupsFromRows
} from '../../src/core/table-group-sort.js';
import {
    createOriginalRowOrderState,
    getRowsInOriginalOrder,
    syncOriginalRowOrderState
} from '../../src/core/row-order-index.js';
import { buildTableModel } from '../../src/core/table-model.js';
import { mockCell, mockRow, mockTable } from './helpers/mock-table.js';

function getBodyRowLabels(table) {
    return Array.from(table.getElementsByTagName('tbody')[0].getElementsByTagName('tr'))
        .map((row) => row.cells[0].textContent);
}

function restoreOriginalOrder(table, rowOrderState) {
    const tableModel = buildTableModel(table);
    const originalRows = getRowsInOriginalOrder(tableModel, rowOrderState);
    const originalGroups = buildTableBodyGroupsFromRows(tableModel, originalRows);
    applyTableBodyGroups(tableModel, originalGroups);
}

describe('row-order-index', () => {
    it('inserts rows added in unsorted mode between their current DOM neighbours', () => {
        const table = mockTable({
            bodySections: [[
                mockRow([mockCell('A'), mockCell('10')]),
                mockRow([mockCell('C'), mockCell('30')])
            ]]
        });
        const tbody = table.getElementsByTagName('tbody')[0];
        const rowOrderState = createOriginalRowOrderState(buildTableModel(table));
        const insertedRow = mockRow([mockCell('B'), mockCell('20')]);

        tbody.insertBefore(insertedRow, tbody.getElementsByTagName('tr')[1]);

        syncOriginalRowOrderState(rowOrderState, buildTableModel(table));

        expect(getRowsInOriginalOrder(buildTableModel(table), rowOrderState).map((row) => row.cells[0].textContent))
            .toEqual(['A', 'B', 'C']);
    });

    it('keeps dynamically appended rows when clearing sort state', () => {
        const table = mockTable({
            bodySections: [[
                mockRow([mockCell('A'), mockCell('20')]),
                mockRow([mockCell('B'), mockCell('10')]),
                mockRow([mockCell('C'), mockCell('30')])
            ]]
        });
        const tbody = table.getElementsByTagName('tbody')[0];
        const rowOrderState = createOriginalRowOrderState(buildTableModel(table));
        const sortedGroups = buildGloballySortedTableBodyGroups(buildTableModel(table), [
            {column: 1, direction: 'asc', type: 'number'}
        ]);

        applyTableBodyGroups(buildTableModel(table), sortedGroups);
        tbody.appendChild(mockRow([mockCell('D'), mockCell('05')]));

        syncOriginalRowOrderState(rowOrderState, buildTableModel(table));
        restoreOriginalOrder(table, rowOrderState);

        expect(getBodyRowLabels(table)).toEqual(['A', 'B', 'C', 'D']);
    });

    it('does not resurrect rows removed after sorting when clearing sort state', () => {
        const table = mockTable({
            bodySections: [[
                mockRow([mockCell('A'), mockCell('20')]),
                mockRow([mockCell('B'), mockCell('10')]),
                mockRow([mockCell('C'), mockCell('30')])
            ]]
        });
        const tbody = table.getElementsByTagName('tbody')[0];
        const rowOrderState = createOriginalRowOrderState(buildTableModel(table));
        const sortedGroups = buildGloballySortedTableBodyGroups(buildTableModel(table), [
            {column: 1, direction: 'asc', type: 'number'}
        ]);

        applyTableBodyGroups(buildTableModel(table), sortedGroups);
        tbody.removeChild(tbody.getElementsByTagName('tr')[0]);

        syncOriginalRowOrderState(rowOrderState, buildTableModel(table));
        restoreOriginalOrder(table, rowOrderState);

        expect(getBodyRowLabels(table)).toEqual(['A', 'C']);
    });
});
