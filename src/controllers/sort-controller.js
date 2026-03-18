import i18n from '../i18n/i18n.js';
import { buildNextSortRules, normalizeAdvancedSortRules } from '../core/sort-engine.js';
import { getOwnedTableSections } from '../core/table-boundary.js';
import { applyTableBodyGroups, buildGloballySortedTableBodyGroups, buildTableBodyGroupsFromRows } from '../core/table-group-sort.js';
import { createOriginalRowOrderState, getRowsInOriginalOrder, syncOriginalRowOrderState } from '../core/row-order-index.js';
import { buildTableModel } from '../core/table-model.js';

function normalizeCollection(collection) {
    return Array.from(collection || []);
}

function getTableBodyElements(table) {
    return normalizeCollection(getOwnedTableSections(table, 'tbody'));
}

function getStatsRows(tbody) {
    if (!tbody) {
        return [];
    }

    if (typeof tbody.querySelectorAll === 'function') {
        return normalizeCollection(tbody.querySelectorAll('tr[data-anytable-stats-row]'));
    }

    return normalizeCollection(tbody.getElementsByTagName?.('tr')).filter((row) => (
        typeof row?.hasAttribute === 'function' && row.hasAttribute('data-anytable-stats-row')
    ));
}

function removeRow(row) {
    if (!row) {
        return;
    }

    if (typeof row.remove === 'function') {
        row.remove();
        return;
    }

    if (row.parentNode && typeof row.parentNode.removeChild === 'function') {
        row.parentNode.removeChild(row);
    }
}

function removeRows(rows) {
    rows.forEach((row) => removeRow(row));
}

function appendRows(target, rows) {
    if (!target || typeof target.appendChild !== 'function') {
        return;
    }

    rows.forEach((row) => target.appendChild(row));
}

function hasProcessableRows(table) {
    return buildTableModel(table).bodyRows.length > 0;
}

export class SortController {
    constructor({
        enhancedTables,
        stateStore,
        controlPanelManager,
        toolbar,
        isMultiColumnSortEnabled,
        enableMultiColumnSort,
        setSortButtonIcon
    }) {
        this.enhancedTables = enhancedTables;
        this.stateStore = stateStore;
        this.controlPanelManager = controlPanelManager;
        this.toolbar = toolbar;
        this.isMultiColumnSortEnabled = isMultiColumnSortEnabled;
        this.enableMultiColumnSort = enableMultiColumnSort;
        this.setSortButtonIcon = setSortButtonIcon;
    }

    refreshSortButtons(table) {
        const {columnCount} = buildTableModel(table);
        const rules = this.stateStore.getSortRules(table);
        const showPriority = this.isMultiColumnSortEnabled() && rules.length > 1;

        const directionByColumn = new Map();
        const priorityByColumn = new Map();
        rules.forEach((rule, index) => {
            directionByColumn.set(rule.column, rule.direction);
            if (showPriority) {
                priorityByColumn.set(rule.column, index + 1);
            }
        });

        Array.from({length: columnCount}, (_, index) => index).forEach((index) => {
            const direction = directionByColumn.get(index) || 'none';
            const priority = priorityByColumn.get(index) || null;
            this.updateSortButton(table, index, direction, priority);
        });
    }

    updateSortButton(table, columnIndex, direction, priority = null) {
        const control = this.controlPanelManager.getHeaderControl(table, columnIndex);
        const sortButton = control?.sortButton;
        if (!sortButton) {
            return;
        }

        this.setSortButtonIcon(sortButton, direction, priority);
        sortButton.classList.remove('sort-asc', 'sort-desc', 'sort-none');
        sortButton.classList.add(`sort-${direction}`);
        sortButton.title = direction === 'asc' ? i18n.t('columnControl.sort.ascending') :
            direction === 'desc' ? i18n.t('columnControl.sort.descending') :
                i18n.t('columnControl.sort.none');
    }

    syncOriginalRowOrder(table) {
        if (!this.enhancedTables.has(table)) {
            return;
        }

        const tableModel = buildTableModel(table);
        const originalRowOrder = this.stateStore.getOriginalRowOrder(table)
            || createOriginalRowOrderState(tableModel);
        syncOriginalRowOrderState(originalRowOrder, tableModel);
        this.stateStore.setOriginalRowOrder(table, originalRowOrder);
    }

    applySortRules(table, rules) {
        const tableModel = buildTableModel(table);
        if (tableModel.bodyRows.length === 0) {
            return;
        }

        const tbodyElements = getTableBodyElements(table);
        const statsRows = tbodyElements.flatMap((tbody) => getStatsRows(tbody));
        removeRows(statsRows);

        if (!Array.isArray(rules) || rules.length === 0) {
            const originalRowOrder = this.stateStore.getOriginalRowOrder(table)
                || createOriginalRowOrderState(tableModel);
            this.stateStore.setOriginalRowOrder(table, originalRowOrder);
            syncOriginalRowOrderState(originalRowOrder, tableModel);

            const originalRows = getRowsInOriginalOrder(tableModel, originalRowOrder);
            const originalRowGroups = buildTableBodyGroupsFromRows(tableModel, originalRows);
            applyTableBodyGroups(tableModel, originalRowGroups);
        } else {
            const sortedGroups = buildGloballySortedTableBodyGroups(tableModel, rules);
            applyTableBodyGroups(tableModel, sortedGroups);
        }

        const primaryTbody = tbodyElements[0];
        const firstDataRow = primaryTbody?.querySelector?.('tr:not([data-anytable-stats-row])') || null;
        for (const statsRow of statsRows) {
            if (firstDataRow && primaryTbody) {
                primaryTbody.insertBefore(statsRow, firstDataRow);
            } else {
                appendRows(primaryTbody, [statsRow]);
            }
        }
    }

    applyAdvancedSort(table, advancedRules) {
        const normalizedRules = normalizeAdvancedSortRules(advancedRules);

        if (!this.isMultiColumnSortEnabled() && normalizedRules.length > 1) {
            this.enableMultiColumnSort();
        }

        this.stateStore.setAdvancedSortRules(table, normalizedRules);
        this.syncOriginalRowOrder(table);
        this.stateStore.setSortRules(table, normalizedRules);
        this.refreshSortButtons(table);
        this.toolbar.refreshActiveStates(table);

        this.applySortRules(table, normalizedRules);
    }

    sortTable(table, columnIndex) {
        if (!hasProcessableRows(table)) {
            return;
        }

        this.syncOriginalRowOrder(table);
        const currentRules = this.stateStore.getSortRules(table);
        const {rules} = buildNextSortRules(currentRules, columnIndex, this.isMultiColumnSortEnabled());
        this.stateStore.setSortRules(table, rules);
        this.stateStore.setAdvancedSortRules(table, []);

        this.refreshSortButtons(table);
        this.toolbar.refreshActiveStates(table);

        this.applySortRules(table, rules);
    }
}
