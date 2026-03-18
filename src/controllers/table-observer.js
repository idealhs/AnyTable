function normalizeCollection(collection) {
    return Array.from(collection || []);
}

function isElementNode(node) {
    const elementNodeType = typeof Node === 'undefined' ? 1 : Node.ELEMENT_NODE;
    return node?.nodeType === elementNodeType;
}

function findClosestTableElement(node) {
    let currentNode = node;
    while (currentNode) {
        if (currentNode.nodeName === 'TABLE') {
            return currentNode;
        }
        currentNode = currentNode.parentNode;
    }

    return null;
}

function collectNestedTableElements(node) {
    if (!isElementNode(node)) {
        return [];
    }

    const tables = node.nodeName === 'TABLE' ? [node] : [];
    if (typeof node.querySelectorAll === 'function') {
        tables.push(...node.querySelectorAll('table'));
    }

    return tables;
}

export class TableObserver {
    constructor({
        isAutoEnhanceEnabled,
        isEnhancedTable,
        autoEnhanceTables,
        removeEnhancement,
        rehydrateTableUi,
        syncOriginalRowOrder,
        onTableRemoved
    }) {
        this.isAutoEnhanceEnabled = isAutoEnhanceEnabled;
        this.isEnhancedTable = isEnhancedTable;
        this.autoEnhanceTables = autoEnhanceTables;
        this.removeEnhancement = removeEnhancement;
        this.rehydrateTableUi = rehydrateTableUi;
        this.syncOriginalRowOrder = syncOriginalRowOrder;
        this.onTableRemoved = onTableRemoved;
        this.observer = null;
    }

    observe(target = document.body) {
        this.observer = new MutationObserver((mutations) => {
            this.handleMutations(mutations);
        });

        this.observer.observe(target, {
            childList: true,
            subtree: true
        });

        return this.observer;
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    handleMutations(mutations) {
        const tablesToSync = new Set();
        const removedTables = new Set();
        const addedTables = new Set();

        for (const mutation of mutations || []) {
            const mutationTable = findClosestTableElement(mutation.target);
            if (this.isEnhancedTable(mutationTable)) {
                tablesToSync.add(mutationTable);
            }

            for (const node of normalizeCollection(mutation.removedNodes)) {
                const tables = collectNestedTableElements(node);
                for (const table of tables) {
                    removedTables.add(table);
                }
            }

            for (const node of normalizeCollection(mutation.addedNodes)) {
                if (!isElementNode(node)) {
                    continue;
                }

                if (this.isAutoEnhanceEnabled()) {
                    if (node.nodeName === 'TABLE') {
                        this.autoEnhanceTables([node]);
                    }
                    if (typeof node.querySelectorAll === 'function') {
                        this.autoEnhanceTables(node.querySelectorAll('table'));
                    }
                }

                const table = findClosestTableElement(node);
                if (this.isEnhancedTable(table)) {
                    tablesToSync.add(table);
                }

                collectNestedTableElements(node).forEach((nestedTable) => {
                    addedTables.add(nestedTable);
                    if (this.isEnhancedTable(nestedTable)) {
                        tablesToSync.add(nestedTable);
                    }
                });
            }
        }

        const rehydratedTables = new Set();
        removedTables.forEach((table) => {
            if (addedTables.has(table)) {
                rehydratedTables.add(table);
                tablesToSync.add(table);
                return;
            }

            tablesToSync.delete(table);
            this.removeEnhancement(table);
            this.onTableRemoved?.(table);
        });

        tablesToSync.forEach((table) => this.syncOriginalRowOrder(table));
        rehydratedTables.forEach((table) => this.rehydrateTableUi?.(table));
    }
}
