import { getTableColumnCount } from './table-structure.js';

function normalizeCollection(collection) {
    return Array.from(collection || []);
}

function getCellSpan(cell) {
    const span = Number(cell?.colSpan);
    return Number.isInteger(span) && span > 0 ? span : 1;
}

function getCellText(cell) {
    return cell?.textContent?.trim() ?? '';
}

function isExportableRow(row) {
    if (!row) return false;
    if (typeof row.hasAttribute === 'function' && row.hasAttribute('data-anytable-stats-row')) {
        return false;
    }
    return row.style?.display !== 'none';
}

function expandRowCells(row, totalColumns) {
    const values = [];

    normalizeCollection(row?.cells).forEach((cell) => {
        const text = getCellText(cell);
        const span = getCellSpan(cell);
        for (let index = 0; index < span; index++) {
            values.push(text);
        }
    });

    while (totalColumns > 0 && values.length < totalColumns) {
        values.push('');
    }

    return values;
}

function escapeCsvField(value) {
    const normalized = (value ?? '').toString();
    const needsQuotes = /[",\r\n]/.test(normalized);
    if (!needsQuotes) {
        return normalized;
    }

    return `"${normalized.replace(/"/g, '""')}"`;
}

function sanitizeFilenameSegment(value) {
    const sanitized = (value ?? '')
        .toString()
        .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return sanitized || 'table';
}

function getTableIndex(table, documentRef) {
    if (typeof documentRef?.querySelectorAll !== 'function') {
        return 1;
    }

    const tables = Array.from(documentRef.querySelectorAll('table'));
    const index = tables.indexOf(table);
    return index >= 0 ? index + 1 : 1;
}

function removeNode(node) {
    if (!node) return;
    if (typeof node.remove === 'function') {
        node.remove();
        return;
    }
    if (node.parentNode && typeof node.parentNode.removeChild === 'function') {
        node.parentNode.removeChild(node);
    }
}

export function collectVisibleTableRows(table) {
    if (!table || typeof table.getElementsByTagName !== 'function') {
        return [];
    }

    const totalColumns = getTableColumnCount(table);
    return normalizeCollection(table.getElementsByTagName('tr'))
        .filter((row) => isExportableRow(row))
        .map((row) => expandRowCells(row, totalColumns));
}

export function serializeRowsToCsv(rows) {
    return normalizeCollection(rows)
        .map((row) => normalizeCollection(row).map((value) => escapeCsvField(value)).join(','))
        .join('\r\n');
}

export function buildTableCsvFilename(table, {documentRef = globalThis.document} = {}) {
    const captionText = table?.caption?.textContent?.trim();
    const baseName = sanitizeFilenameSegment(captionText || documentRef?.title || 'table');
    const tableIndex = getTableIndex(table, documentRef);
    return `${baseName}-table-${tableIndex}.csv`;
}

export function downloadTableAsCsv(
    table,
    {
        documentRef = globalThis.document,
        urlRef = globalThis.URL,
        blobCtor = globalThis.Blob,
        filename
    } = {}
) {
    if (!documentRef?.createElement || typeof urlRef?.createObjectURL !== 'function' || !blobCtor) {
        return null;
    }

    const csvText = serializeRowsToCsv(collectVisibleTableRows(table));
    const outputName = filename || buildTableCsvFilename(table, {documentRef});
    const blob = new blobCtor([csvText], {type: 'text/csv;charset=utf-8;'});
    const objectUrl = urlRef.createObjectURL(blob);
    const link = documentRef.createElement('a');

    link.href = objectUrl;
    link.download = outputName;
    link.rel = 'noopener';
    if (link.style) {
        link.style.display = 'none';
    }

    const mountTarget = documentRef.body || documentRef.documentElement;
    if (mountTarget && typeof mountTarget.appendChild === 'function') {
        mountTarget.appendChild(link);
    }

    if (typeof link.click === 'function') {
        link.click();
    }

    removeNode(link);

    if (typeof urlRef.revokeObjectURL === 'function') {
        urlRef.revokeObjectURL(objectUrl);
    }

    return outputName;
}
