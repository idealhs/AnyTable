function normalizeCollection(collection) {
    return Array.from(collection || []);
}

function findClosestTable(node) {
    if (!node) {
        return null;
    }

    if (typeof node.closest === 'function') {
        return node.closest('table');
    }

    let currentNode = node;
    while (currentNode) {
        if (currentNode.nodeName === 'TABLE') {
            return currentNode;
        }
        currentNode = currentNode.parentNode || null;
    }

    return null;
}

export function isNodeOwnedByTable(table, node) {
    if (!table || !node) {
        return false;
    }

    const closestTable = findClosestTable(node);
    if (closestTable) {
        return closestTable === table;
    }

    // 测试替身通常没有完整的 parentNode/closest 链，此时默认把直接返回的节点视为当前表所有。
    return true;
}

export function getOwnedTableSections(table, sectionTagName) {
    return normalizeCollection(table?.getElementsByTagName?.(sectionTagName))
        .filter((section) => isNodeOwnedByTable(table, section));
}

export function getOwnedRowsInSection(table, section) {
    return normalizeCollection(section?.getElementsByTagName?.('tr'))
        .filter((row) => isNodeOwnedByTable(table, row));
}

export function getOwnedTableRows(table) {
    return normalizeCollection(table?.getElementsByTagName?.('tr'))
        .filter((row) => isNodeOwnedByTable(table, row));
}

export function getOwnedHeaderCells(table) {
    return normalizeCollection(table?.getElementsByTagName?.('th'))
        .filter((cell) => isNodeOwnedByTable(table, cell));
}
