import i18n from './i18n/i18n.js';
import { TableStateStore } from './state/table-state.js';
import { applyCombinedFilters } from './core/filter-engine.js';
import { buildNextSortRules, normalizeAdvancedSortRules } from './core/sort-engine.js';
import { computeStatisticsData } from './core/statistics-engine.js';
import { isLikelyDataTable } from './core/table-detector.js';
import { applyTableBodyGroups, buildGloballySortedTableBodyGroups, buildTableBodyGroupsFromRows } from './core/table-group-sort.js';
import { createOriginalRowOrderState, getRowsInOriginalOrder, syncOriginalRowOrderState } from './core/row-order-index.js';
import { buildTableModel } from './core/table-model.js';
import { getTableColumnCount, getTableColumnTitles } from './core/table-structure.js';
import { renderStatisticsRows, removeStatisticsRows } from './ui/statistics-renderer.js';
import { PickingMode } from './picking-mode.js';
import { ControlPanelManager } from './control-panel-manager.js';
import { preloadShadowStyles } from './ui/shadow-ui.js';
import { Toolbar } from './ui/toolbar.js';
import { setupMessageHandler } from './message-handler.js';

const MATERIAL_ICON_PATHS = {
    sortAsc: 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12 12 4z',
    sortDesc: 'M4 12l1.41-1.41L11 16.17V4h2v12.17l5.58-5.59L20 12l-8 8z',
    sortNone: 'M12 5.83L15.17 9 16.59 7.59 12 3 7.41 7.59 8.83 9zm0 12.34L8.83 15l-1.42 1.41L12 21l4.59-4.59L15.17 15z',
    filterToggleClosed: 'M7.41 8.59 12 13.17 16.59 8.59 18 10l-6 6-6-6z',
    filterToggleOpened: 'M7.41 15.41 12 10.83 16.59 15.41 18 14l-6-6-6 6z',
    advancedFilter: 'M3 17v2h6v-2H3zm0-12v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zm-4-8H3v2h6v2h2v-6H9v2zm12 2v-2h-6v2h6zm-4-8V5h4V3h-4V1h-2v6h2z',
    advancedSort: 'M16 17.01V10h-2v7.01h-3L15 21l4-3.99zM9 3 5 6.99h3V14h2V6.99h3z',
    statistics: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
    download: 'M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h5.66V9h3.84L12 2z',
    toolbarCollapse: 'M10 6l-1.41 1.41L13.17 12l-4.58 4.59L10 18l6-6z',
    toolbarExpand: 'M14 6l1.41 1.41L10.83 12l4.58 4.59L14 18l-6-6z'
};

function normalizeCollection(collection) {
    return Array.from(collection || []);
}

function isElementNode(node) {
    const elementNodeType = typeof Node === 'undefined' ? 1 : Node.ELEMENT_NODE;
    return node?.nodeType === elementNodeType;
}

function getTableBodyElements(table) {
    return typeof table?.getElementsByTagName === 'function'
        ? normalizeCollection(table.getElementsByTagName('tbody'))
        : [];
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

function hasProcessableRows(table) {
    return buildTableModel(table).bodyRows.length > 0;
}

class TableEnhancer {
    constructor() {
        this.enhancedTables = new Set();
        this.stateStore = new TableStateStore();
        this.selectedTables = new Set();
        this.autoEnhance = true;
        this.multiColumnSort = false;
        this.toolbarDefaultExpanded = true;
        this.sortTable = this.sortTable.bind(this);

        this.pickingMode = new PickingMode({
            enhancedTables: this.enhancedTables,
            selectedTables: this.selectedTables,
            enhanceTable: (table) => this.enhanceTable(table),
            removeEnhancement: (table) => this.removeEnhancement(table)
        });

        this.controlPanelManager = new ControlPanelManager(this);
        this.toolbar = new Toolbar(this);

        this.initI18n();
    }

    async initI18n() {
        await i18n.init();
        window.addEventListener('localeChanged', () => this.updateAllTexts());
        this.updateAllTexts();
    }

    updateAllTexts() {
        this.enhancedTables.forEach(table => {
            this.controlPanelManager.updateTexts(table);
            this.toolbar.updateTexts(table);
        });
    }

    createMaterialIconSvg(pathData) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        svg.appendChild(path);
        return svg;
    }

    setButtonIcon(button, iconKey) {
        const pathData = MATERIAL_ICON_PATHS[iconKey];
        if (!pathData || !button) return;
        button.textContent = '';
        button.appendChild(this.createMaterialIconSvg(pathData));
    }

    setSortButtonIcon(button, direction, priority = null) {
        if (!button) return;
        const iconKey = direction === 'asc' ? 'sortAsc' :
            direction === 'desc' ? 'sortDesc' : 'sortNone';
        const pathData = MATERIAL_ICON_PATHS[iconKey];
        if (!pathData) return;

        const showPriority = Number.isInteger(priority) && priority > 0;

        button.textContent = '';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'anytable-sort-icon';
        iconSpan.appendChild(this.createMaterialIconSvg(pathData));
        button.appendChild(iconSpan);

        if (showPriority) {
            const prioritySpan = document.createElement('span');
            prioritySpan.className = 'anytable-sort-priority';
            prioritySpan.textContent = priority;
            button.appendChild(prioritySpan);
            button.style.setProperty('--anytable-sort-priority-digits', String(String(priority).length));
        } else {
            button.style.removeProperty('--anytable-sort-priority-digits');
        }

        button.classList.toggle('has-priority', showPriority);
    }

    setFilterToggleButtonIcon(button, expanded) {
        if (!button) return;
        this.setButtonIcon(button, expanded ? 'filterToggleOpened' : 'filterToggleClosed');
    }

    refreshSortButtons(table) {
        const headers = table.getElementsByTagName('th');
        const rules = this.stateStore.getSortRules(table);
        const showPriority = this.multiColumnSort && rules.length > 1;

        const directionByColumn = new Map();
        const priorityByColumn = new Map();
        rules.forEach((rule, index) => {
            directionByColumn.set(rule.column, rule.direction);
            if (showPriority) {
                priorityByColumn.set(rule.column, index + 1);
            }
        });

        Array.from(headers).forEach((header, index) => {
            const direction = directionByColumn.get(index) || 'none';
            const priority = priorityByColumn.get(index) || null;
            this.updateSortButton(table, index, direction, priority);
        });
    }

    getColumnTitles(table) {
        return getTableColumnTitles(
            table,
            (index) => i18n.t('advancedPanel.common.columnFallback').replace('{index}', String(index + 1))
        );
    }

    applyAllFilters(table) {
        const filterValues = this.stateStore.getFilterValues(table);
        const advancedRuleGroup = this.stateStore.getAdvancedFilterRules(table);
        applyCombinedFilters(table, filterValues, advancedRuleGroup);
        this.updateFilterInputsDisabledState(table);
        this.controlPanelManager.refreshFilterButtons(table);
        this.toolbar.refreshActiveStates(table);
        this.refreshStatistics(table);
    }

    updateFilterInputsDisabledState(table) {
        const hasAdvanced = this.stateStore.getAdvancedFilterRules(table) !== null;
        this.controlPanelManager.setFilterInputsDisabledState(table, hasAdvanced);
    }

    applySortRules(table, rules) {
        const tableModel = buildTableModel(table);
        if (tableModel.bodyRows.length === 0) return;

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

        // Re-insert stats rows at top
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

        if (!this.multiColumnSort && normalizedRules.length > 1) {
            this.multiColumnSort = true;
            const browser = window.browser || chrome;
            browser.storage.local.set({ multiColumnSort: true });
        }

        this.stateStore.setAdvancedSortRules(table, normalizedRules);
        this.syncOriginalRowOrder(table);
        this.stateStore.setSortRules(table, normalizedRules);
        this.refreshSortButtons(table);
        this.toolbar.refreshActiveStates(table);

        this.applySortRules(table, normalizedRules);
    }

    async init() {
        const browser = window.browser || chrome;
        const result = await browser.storage.local.get(['autoEnhance', 'multiColumnSort', 'toolbarDefaultExpanded']);
        this.autoEnhance = result.autoEnhance !== false;
        this.multiColumnSort = result.multiColumnSort === true;
        this.toolbarDefaultExpanded = result.toolbarDefaultExpanded !== false;

        await preloadShadowStyles();
        setupMessageHandler(this);

        if (this.autoEnhance) {
            this.autoEnhanceTables(document.getElementsByTagName('table'));
        }

        this.observeDOMChanges();
    }

    shouldAutoEnhanceTable(table) {
        return isLikelyDataTable(table);
    }

    autoEnhanceTables(tables) {
        for (const table of tables) {
            if (!this.enhancedTables.has(table) && this.shouldAutoEnhanceTable(table)) {
                this.enhanceTable(table);
            }
        }
    }

    removeEnhancement(table) {
        this.toolbar.removeToolbar(table);
        this.controlPanelManager.removeTableControls(table);
        removeStatisticsRows(table);

        table.classList.remove('anytable-enhanced');
        this.enhancedTables.delete(table);
        this.stateStore.clearTable(table);
    }

    syncOriginalRowOrder(table) {
        if (!this.enhancedTables.has(table)) return;

        const tableModel = buildTableModel(table);
        const originalRowOrder = this.stateStore.getOriginalRowOrder(table)
            || createOriginalRowOrderState(tableModel);
        syncOriginalRowOrderState(originalRowOrder, tableModel);
        this.stateStore.setOriginalRowOrder(table, originalRowOrder);
    }

    enhanceTable(table) {
        if (this.enhancedTables.has(table)) return;

        this.stateStore.setOriginalRowOrder(table, createOriginalRowOrderState(buildTableModel(table)));

        this.stateStore.setSortRules(table, []);
        this.controlPanelManager.attachTableControls(table);
        this.enhancedTables.add(table);
        table.classList.add('anytable-enhanced');
        this.toolbar.createToolbar(table);
    }

    sortTable(table, columnIndex) {
        if (!hasProcessableRows(table)) return;

        this.syncOriginalRowOrder(table);
        const currentRules = this.stateStore.getSortRules(table);
        const {rules} = buildNextSortRules(currentRules, columnIndex, this.multiColumnSort);
        this.stateStore.setSortRules(table, rules);
        this.stateStore.setAdvancedSortRules(table, []);

        this.refreshSortButtons(table);
        this.toolbar.refreshActiveStates(table);

        this.applySortRules(table, rules);
    }

    updateSortButton(table, columnIndex, direction, priority = null) {
        const control = this.controlPanelManager.getHeaderControl(table, columnIndex);
        const sortButton = control?.sortButton;
        if (sortButton) {
            this.setSortButtonIcon(sortButton, direction, priority);
            sortButton.classList.remove('sort-asc', 'sort-desc', 'sort-none');
            sortButton.classList.add(`sort-${direction}`);
            sortButton.title = direction === 'asc' ? i18n.t('columnControl.sort.ascending') :
                             direction === 'desc' ? i18n.t('columnControl.sort.descending') :
                             i18n.t('columnControl.sort.none');
        }
    }

    filterTable(table, columnIndex, filterText) {
        if (!hasProcessableRows(table)) return;

        this.stateStore.setFilterValue(table, columnIndex, filterText);
        this.applyAllFilters(table);
    }

    applyStatistics(table, rules) {
        this.stateStore.setStatisticsRules(table, rules);
        this.toolbar.refreshActiveStates(table);
        this.refreshStatistics(table);
    }

    refreshStatistics(table) {
        const rules = this.stateStore.getStatisticsRules(table);
        if (!rules || rules.length === 0) {
            removeStatisticsRows(table);
            return;
        }
        const statsData = computeStatisticsData(rules, table);
        renderStatisticsRows(table, statsData, getTableColumnCount(table));
    }

    observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            const tablesToSync = new Set();

            for (const mutation of mutations) {
                const mutationTable = findClosestTableElement(mutation.target);
                if (this.enhancedTables.has(mutationTable)) {
                    tablesToSync.add(mutationTable);
                }

                for (const node of mutation.removedNodes) {
                    const tables = collectNestedTableElements(node);
                    for (const table of tables) {
                        this.removeEnhancement(table);
                        this.selectedTables.delete(table);
                    }
                }

                for (const node of mutation.addedNodes) {
                    if (!isElementNode(node)) continue;

                    if (this.autoEnhance) {
                        if (node.nodeName === 'TABLE') {
                            this.autoEnhanceTables([node]);
                        }
                        if (node.querySelectorAll) {
                            this.autoEnhanceTables(node.querySelectorAll('table'));
                        }
                    }

                    const table = findClosestTableElement(node);
                    if (this.enhancedTables.has(table)) {
                        tablesToSync.add(table);
                    }

                    collectNestedTableElements(node).forEach((nestedTable) => {
                        if (this.enhancedTables.has(nestedTable)) {
                            tablesToSync.add(nestedTable);
                        }
                    });
                }
            }

            tablesToSync.forEach((table) => this.syncOriginalRowOrder(table));
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

const enhancer = new TableEnhancer();
enhancer.init();
