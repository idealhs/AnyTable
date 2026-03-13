export function getCellText(row, columnIndex) {
    return row.cells[columnIndex]?.textContent?.trim() ?? '';
}

export function getColumnValues(table, columnIndex) {
    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) return [];
    return Array.from(tbody.getElementsByTagName('tr'))
        .filter(row => !row.hasAttribute('data-anytable-stats-row'))
        .map(row => getCellText(row, columnIndex))
        .filter(Boolean);
}
