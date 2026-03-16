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

export function getTableColumnCount(table) {
    if (!table || typeof table.getElementsByTagName !== 'function') {
        return 0;
    }

    const rows = normalizeCollection(table.getElementsByTagName('tr'));
    return rows.reduce((maxColumns, row) => Math.max(maxColumns, getRowColumnCount(row)), 0);
}

function getHeaderText(header) {
    return header?.childNodes?.[0]?.textContent?.trim() || header?.textContent?.trim() || '';
}

export function getTableColumnTitles(table, buildFallbackLabel) {
    if (!table || typeof buildFallbackLabel !== 'function') {
        return [];
    }

    const headers = typeof table.getElementsByTagName === 'function'
        ? normalizeCollection(table.getElementsByTagName('th'))
        : [];
    const totalColumns = Math.max(headers.length, getTableColumnCount(table));

    return Array.from({length: totalColumns}, (_, index) => {
        const headerText = getHeaderText(headers[index]);
        return headerText || buildFallbackLabel(index);
    });
}
