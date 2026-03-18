import { getOwnCellText } from './cell-text.js';
import { buildTableModel } from './table-model.js';

function resolveTableModel(tableOrModel) {
    if (tableOrModel?.rowModelByElement instanceof Map && Array.isArray(tableOrModel?.bodyRows)) {
        return tableOrModel;
    }

    return buildTableModel(tableOrModel);
}

function resolveRowModel(rowOrModel, tableModel) {
    if (Array.isArray(rowOrModel?.cellMap)) {
        return rowOrModel;
    }

    if (tableModel?.rowModelByElement instanceof Map) {
        return tableModel.rowModelByElement.get(rowOrModel) || null;
    }

    return null;
}

function getPhysicalCellText(row, columnIndex) {
    return getOwnCellText(row?.cells?.[columnIndex]);
}

export function getCellText(rowOrModel, columnIndex, tableModel = null) {
    const normalizedIndex = Number(columnIndex);
    if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0) {
        return '';
    }

    const rowModel = resolveRowModel(rowOrModel, tableModel);
    if (rowModel) {
        return rowModel.cellMap[normalizedIndex]?.text ?? '';
    }

    return getPhysicalCellText(rowOrModel, normalizedIndex);
}

export function getColumnValues(tableOrModel, columnIndex) {
    const normalizedIndex = Number(columnIndex);
    if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0) {
        return [];
    }

    const tableModel = resolveTableModel(tableOrModel);
    return tableModel.bodyRows
        .map((rowModel) => getCellText(rowModel, normalizedIndex, tableModel))
        .filter(Boolean);
}
