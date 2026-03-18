import { getOwnedHeaderCells, getOwnedTableRows } from './table-boundary.js';

function normalizeCollection(collection) {
    return Array.from(collection || []);
}

function getCellSpan(cell) {
    const span = Number(cell?.colSpan);
    return Number.isInteger(span) && span > 0 ? span : 1;
}

function getRowColumnCount(row) {
    return normalizeCollection(row?.cells).reduce((total, cell) => total + getCellSpan(cell), 0);
}

function getTableRole(table) {
    if (!table || typeof table.getAttribute !== 'function') {
        return '';
    }

    return (table.getAttribute('role') || '').trim().toLowerCase();
}

function hasSemanticHints(table) {
    const headers = normalizeCollection(getOwnedHeaderCells(table));
    if (headers.length > 0) {
        return true;
    }

    return Boolean(table?.caption?.textContent?.trim());
}

export function isLikelyDataTable(table) {
    if (!table || typeof table.getElementsByTagName !== 'function') {
        return false;
    }

    const role = getTableRole(table);
    if (role === 'presentation' || role === 'none') {
        return false;
    }

    const rows = normalizeCollection(getOwnedTableRows(table));
    if (rows.length === 0) {
        return false;
    }

    const columnCounts = rows
        .map(getRowColumnCount)
        .filter((count) => count > 0);

    if (columnCounts.length === 0) {
        return false;
    }

    const maxColumns = Math.max(...columnCounts);
    const repeatedMaxColumns = columnCounts.filter((count) => count === maxColumns).length;

    if (hasSemanticHints(table)) {
        return rows.length >= 2;
    }

    return maxColumns >= 2 && repeatedMaxColumns >= 3;
}
