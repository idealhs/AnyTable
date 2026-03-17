import { sortRowsByRules } from './sort-engine.js';

function removeRow(row) {
    if (!row) {
        return;
    }

    if (typeof row.remove === 'function') {
        row.remove();
        return;
    }

    if (row.parentNode && typeof row.parentNode.removeChild === 'function') {
        row.parentNode.removeChild(row);
    }
}

function appendRows(target, rows) {
    if (!target || typeof target.appendChild !== 'function') {
        return;
    }

    rows.forEach((row) => target.appendChild(row));
}

export function buildTableBodyGroupsFromRows(tableModel, rows) {
    const orderedRows = Array.isArray(rows) ? rows : [];
    let offset = 0;

    return tableModel.tbodyGroups.map((group) => {
        const rowCount = group.rows.length;
        const groupRows = orderedRows.slice(offset, offset + rowCount);
        offset += rowCount;

        return {
            tbody: group.tbody,
            rows: groupRows
        };
    });
}

export function buildGloballySortedTableBodyGroups(tableModel, rules) {
    const sortedRows = sortRowsByRules(
        tableModel.bodyRows.map((rowModel) => rowModel.row),
        rules,
        {tableModel}
    );

    return buildTableBodyGroupsFromRows(tableModel, sortedRows);
}

export function applyTableBodyGroups(tableModel, targetGroups) {
    tableModel.bodyRows.forEach((rowModel) => removeRow(rowModel.row));

    (targetGroups || []).forEach((group, groupIndex) => {
        const currentGroup = tableModel.tbodyGroups[groupIndex];
        const groupRows = Array.isArray(group?.rows) ? group.rows : [];
        appendRows(currentGroup?.tbody || group?.tbody, groupRows);
    });
}
