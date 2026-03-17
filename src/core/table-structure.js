import { buildTableModel } from './table-model.js';

export function getTableColumnCount(table) {
    return buildTableModel(table).columnCount;
}

export function getTableColumnTitles(table, buildFallbackLabel) {
    const tableModel = buildTableModel(table);

    return Array.from({length: tableModel.columnCount}, (_, index) => {
        const title = tableModel.columnTitles[index];
        if (title) {
            return title;
        }

        return typeof buildFallbackLabel === 'function'
            ? buildFallbackLabel(index)
            : '';
    });
}
