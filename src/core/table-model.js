function normalizeCollection(collection) {
    return Array.from(collection || []);
}

function getCellColSpan(cell) {
    const span = Number(cell?.colSpan);
    return Number.isInteger(span) && span > 0 ? span : 1;
}

function getCellRowSpan(cell) {
    const span = Number(cell?.rowSpan);
    return Number.isInteger(span) && span > 0 ? span : 1;
}

function getCellText(cell) {
    return cell?.textContent?.trim() ?? '';
}

function isHeaderCell(cell) {
    const tagName = cell?.tagName || cell?.nodeName;
    return typeof tagName === 'string' && tagName.toUpperCase() === 'TH';
}

function rowHasHeaderCell(row) {
    return normalizeCollection(row?.cells).some((cell) => isHeaderCell(cell));
}

function isStatsRow(row) {
    return typeof row?.hasAttribute === 'function' && row.hasAttribute('data-anytable-stats-row');
}

function createLogicalCellEntry(cell, columnIndex, startColumnIndex, cellIndex, options = {}) {
    return {
        cell,
        text: getCellText(cell),
        columnIndex,
        startColumnIndex,
        cellIndex,
        isColSpanContinuation: options.isColSpanContinuation === true,
        isRowSpanContinuation: options.isRowSpanContinuation === true
    };
}

function buildSectionRowModels(rows, {section, sectionIndex, sectionType}) {
    const pendingRowSpans = [];
    const rowModels = [];
    let columnCount = 0;
    let hasColSpan = false;
    let hasRowSpan = false;

    normalizeCollection(rows).forEach((row, rowIndex) => {
        const cellMap = [];
        let logicalColumnIndex = 0;

        const fillPendingCells = () => {
            while (pendingRowSpans[logicalColumnIndex]) {
                const pending = pendingRowSpans[logicalColumnIndex];
                cellMap[logicalColumnIndex] = createLogicalCellEntry(
                    pending.cell,
                    logicalColumnIndex,
                    pending.startColumnIndex,
                    pending.cellIndex,
                    {
                        isColSpanContinuation: pending.isColSpanContinuation,
                        isRowSpanContinuation: true
                    }
                );

                pending.remainingRows -= 1;
                if (pending.remainingRows <= 0) {
                    pendingRowSpans[logicalColumnIndex] = null;
                }

                logicalColumnIndex += 1;
            }
        };

        fillPendingCells();

        normalizeCollection(row?.cells).forEach((cell, cellIndex) => {
            fillPendingCells();

            const startColumnIndex = logicalColumnIndex;
            const colSpan = getCellColSpan(cell);
            const rowSpan = getCellRowSpan(cell);

            if (colSpan > 1) {
                hasColSpan = true;
            }
            if (rowSpan > 1) {
                hasRowSpan = true;
            }

            for (let spanIndex = 0; spanIndex < colSpan; spanIndex += 1) {
                const columnIndex = logicalColumnIndex;

                cellMap[columnIndex] = createLogicalCellEntry(
                    cell,
                    columnIndex,
                    startColumnIndex,
                    cellIndex,
                    {isColSpanContinuation: spanIndex > 0}
                );

                if (rowSpan > 1) {
                    pendingRowSpans[columnIndex] = {
                        cell,
                        startColumnIndex,
                        cellIndex,
                        isColSpanContinuation: spanIndex > 0,
                        remainingRows: rowSpan - 1
                    };
                }

                logicalColumnIndex += 1;
            }
        });

        fillPendingCells();

        columnCount = Math.max(columnCount, cellMap.length);
        rowModels.push({
            row,
            section,
            sectionIndex,
            sectionType,
            rowIndex,
            cellMap
        });
    });

    return {
        rowModels,
        columnCount,
        hasColSpan,
        hasRowSpan
    };
}

function buildSectionGroups(sections, sectionType, rowFilter) {
    const groups = [];
    let columnCount = 0;
    let hasColSpan = false;
    let hasRowSpan = false;

    normalizeCollection(sections).forEach((section, sectionIndex) => {
        const rows = normalizeCollection(section?.getElementsByTagName?.('tr')).filter((row) => (
            typeof rowFilter === 'function' ? rowFilter(row) : true
        ));
        const sectionModel = buildSectionRowModels(rows, {section, sectionIndex, sectionType});

        columnCount = Math.max(columnCount, sectionModel.columnCount);
        hasColSpan = hasColSpan || sectionModel.hasColSpan;
        hasRowSpan = hasRowSpan || sectionModel.hasRowSpan;
        groups.push({
            section,
            sectionIndex,
            rows: sectionModel.rowModels
        });
    });

    return {
        groups,
        columnCount,
        hasColSpan,
        hasRowSpan
    };
}

function buildFallbackBodyGroup(table) {
    const rows = normalizeCollection(table?.getElementsByTagName?.('tr')).filter((row) => !isStatsRow(row));
    if (rows.length === 0) {
        return {
            groups: [],
            columnCount: 0,
            hasColSpan: false,
            hasRowSpan: false
        };
    }

    const sectionModel = buildSectionRowModels(rows, {
        section: table,
        sectionIndex: 0,
        sectionType: 'table'
    });

    return {
        groups: [{
            section: table,
            sectionIndex: 0,
            rows: sectionModel.rowModels
        }],
        columnCount: sectionModel.columnCount,
        hasColSpan: sectionModel.hasColSpan,
        hasRowSpan: sectionModel.hasRowSpan
    };
}

function buildColumnTitles(headerRows, columnCount) {
    const titles = Array.from({length: columnCount}, () => '');

    headerRows.forEach((rowModel) => {
        rowModel.cellMap.forEach((entry, columnIndex) => {
            if (!entry) {
                return;
            }

            const text = entry.text;
            if (text) {
                titles[columnIndex] = text;
            }
        });
    });

    return titles;
}

export function buildTableModel(table) {
    if (!table || typeof table.getElementsByTagName !== 'function') {
        return {
            table,
            columnCount: 0,
            columnTitles: [],
            headerRows: [],
            bodyRows: [],
            tbodyGroups: [],
            footerRows: [],
            allRows: [],
            rowModelByElement: new Map(),
            hasColSpan: false,
            hasRowSpan: false,
            rowSpanStrategy: 'repeat-source-cell'
        };
    }

    const rowModelByElement = new Map();

    const tbodySections = normalizeCollection(table.getElementsByTagName('tbody'));
    const bodyResult = tbodySections.length > 0
        ? buildSectionGroups(tbodySections, 'tbody', (row) => !isStatsRow(row))
        : buildFallbackBodyGroup(table);

    const tbodyGroups = bodyResult.groups.map((group) => ({
        tbody: group.section,
        sectionIndex: group.sectionIndex,
        rows: group.rows
    }));
    const bodyRows = tbodyGroups.flatMap((group) => group.rows);
    bodyRows.forEach((rowModel) => rowModelByElement.set(rowModel.row, rowModel));

    const theadSections = normalizeCollection(table.getElementsByTagName('thead'));
    const headerResult = theadSections.length > 0
        ? buildSectionGroups(theadSections, 'thead')
        : {
            groups: [],
            columnCount: 0,
            hasColSpan: false,
            hasRowSpan: false
        };
    const headerRows = theadSections.length > 0
        ? headerResult.groups.flatMap((group) => group.rows)
        : bodyRows.filter((rowModel) => rowHasHeaderCell(rowModel.row));
    headerRows.forEach((rowModel) => rowModelByElement.set(rowModel.row, rowModel));

    const tfootSections = normalizeCollection(table.getElementsByTagName('tfoot'));
    const footerResult = buildSectionGroups(tfootSections, 'tfoot');
    const footerRows = footerResult.groups.flatMap((group) => group.rows);
    footerRows.forEach((rowModel) => rowModelByElement.set(rowModel.row, rowModel));

    const columnCount = Math.max(
        headerResult.columnCount,
        bodyResult.columnCount,
        footerResult.columnCount
    );
    const columnTitles = buildColumnTitles(headerRows, columnCount);

    const allRows = normalizeCollection(table.getElementsByTagName('tr'))
        .map((row) => rowModelByElement.get(row))
        .filter(Boolean)
        .filter((rowModel) => !isStatsRow(rowModel.row));

    return {
        table,
        columnCount,
        columnTitles,
        headerRows,
        bodyRows,
        tbodyGroups,
        footerRows,
        allRows,
        rowModelByElement,
        hasColSpan: bodyResult.hasColSpan || headerResult.hasColSpan || footerResult.hasColSpan,
        hasRowSpan: bodyResult.hasRowSpan || headerResult.hasRowSpan || footerResult.hasRowSpan,
        // 当前阶段对 rowspan 采用“复用源单元格文本”的逻辑列展开策略，
        // 让排序、筛选、统计、导出至少基于同一套可预测的数据视图。
        rowSpanStrategy: 'repeat-source-cell'
    };
}
