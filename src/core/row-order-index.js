const ORDER_STEP = 1024;

// 统计行不会进入 tableModel.bodyRows；隐藏行仍在 DOM 中，因此继续参与原始顺序。
// 新增行会在检测到 DOM 变化时，按当前 DOM 相对位置补入顺序索引。

function getBodyRows(tableModel) {
    return Array.isArray(tableModel?.bodyRows)
        ? tableModel.bodyRows.map((rowModel) => rowModel.row)
        : [];
}

function readRowOrder(rowOrderState, row) {
    if (!rowOrderState?.rowOrder || !rowOrderState.rowOrder.has(row)) {
        return null;
    }

    const order = rowOrderState.rowOrder.get(row);
    return Number.isFinite(order) ? order : null;
}

function writeSequentialOrders(rowOrderState, rows, startOrder = rowOrderState?.nextOrder || 0) {
    const normalizedRows = Array.isArray(rows) ? rows : [];
    normalizedRows.forEach((row, index) => {
        rowOrderState.rowOrder.set(row, startOrder + (index * ORDER_STEP));
    });

    const nextOrder = startOrder + (normalizedRows.length * ORDER_STEP);
    rowOrderState.nextOrder = Math.max(rowOrderState.nextOrder || 0, nextOrder);
}

function writeRowsBeforeKnownOrder(rowOrderState, rows, nextOrder) {
    for (let index = rows.length - 1; index >= 0; index -= 1) {
        const distance = rows.length - index;
        rowOrderState.rowOrder.set(rows[index], nextOrder - (distance * ORDER_STEP));
    }
}

function writeRowsBetweenKnownOrders(rowOrderState, rows, previousOrder, nextOrder) {
    const gap = (nextOrder - previousOrder) / (rows.length + 1);
    if (!Number.isFinite(gap) || gap <= 0) {
        return false;
    }

    rows.forEach((row, index) => {
        rowOrderState.rowOrder.set(row, previousOrder + (gap * (index + 1)));
    });
    return true;
}

function writeRowsAfterKnownOrder(rowOrderState, rows, previousOrder) {
    const startOrder = Math.max(rowOrderState.nextOrder || 0, previousOrder + ORDER_STEP);
    writeSequentialOrders(rowOrderState, rows, startOrder);
}

export function createOriginalRowOrderState(tableModel) {
    const rowOrderState = {
        rowOrder: new WeakMap(),
        nextOrder: 0
    };

    writeSequentialOrders(rowOrderState, getBodyRows(tableModel), 0);
    return rowOrderState;
}

export function syncOriginalRowOrderState(rowOrderState, tableModel) {
    const state = rowOrderState || createOriginalRowOrderState(tableModel);
    const rows = getBodyRows(tableModel);

    if (rows.length === 0) {
        return state;
    }

    const hasKnownRow = rows.some((row) => readRowOrder(state, row) !== null);
    if (!hasKnownRow) {
        writeSequentialOrders(state, rows, state.nextOrder || 0);
        return state;
    }

    let index = 0;
    while (index < rows.length) {
        if (readRowOrder(state, rows[index]) !== null) {
            index += 1;
            continue;
        }

        const segmentStart = index;
        while (index < rows.length && readRowOrder(state, rows[index]) === null) {
            index += 1;
        }

        const segmentRows = rows.slice(segmentStart, index);
        const previousOrder = segmentStart > 0 ? readRowOrder(state, rows[segmentStart - 1]) : null;
        const nextOrder = index < rows.length ? readRowOrder(state, rows[index]) : null;

        if (previousOrder !== null && nextOrder !== null) {
            const insertedBetweenKnownRows = writeRowsBetweenKnownOrders(state, segmentRows, previousOrder, nextOrder);
            if (insertedBetweenKnownRows) {
                continue;
            }
        }

        if (previousOrder !== null) {
            writeRowsAfterKnownOrder(state, segmentRows, previousOrder);
            continue;
        }

        if (nextOrder !== null) {
            writeRowsBeforeKnownOrder(state, segmentRows, nextOrder);
            continue;
        }

        writeSequentialOrders(state, segmentRows, state.nextOrder || 0);
    }

    return state;
}

export function getRowsInOriginalOrder(tableModel, rowOrderState) {
    const rows = getBodyRows(tableModel);
    const domIndexByRow = new Map(rows.map((row, index) => [row, index]));

    return [...rows].sort((rowA, rowB) => {
        const orderA = readRowOrder(rowOrderState, rowA);
        const orderB = readRowOrder(rowOrderState, rowB);

        if (orderA === orderB) {
            return (domIndexByRow.get(rowA) || 0) - (domIndexByRow.get(rowB) || 0);
        }

        if (orderA === null) {
            return 1;
        }

        if (orderB === null) {
            return -1;
        }

        return orderA - orderB;
    });
}
