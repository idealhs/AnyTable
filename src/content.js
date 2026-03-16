import i18n from './i18n/i18n.js';
import { TableStateStore } from './state/table-state.js';
import { applyCombinedFilters } from './core/filter-engine.js';
import { buildNextSortRules, normalizeAdvancedSortRules, sortRowsByRules } from './core/sort-engine.js';
import { computeStatisticsData } from './core/statistics-engine.js';
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
    toolbarCollapse: 'M10 6l-1.41 1.41L13.17 12l-4.58 4.59L10 18l6-6z',
    toolbarExpand: 'M14 6l1.41 1.41L10.83 12l4.58 4.59L14 18l-6-6z'
};

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
        const tbody = table.getElementsByTagName('tbody')[0];
        if (!tbody) return;

        // Remove stats rows before sorting, re-insert after
        const statsRows = Array.from(tbody.querySelectorAll('tr[data-anytable-stats-row]'));
        statsRows.forEach(row => row.remove());

        if (!Array.isArray(rules) || rules.length === 0) {
            const originalRows = this.stateStore.getOriginalRows(table);
            if (originalRows) {
                while (tbody.firstChild) {
                    tbody.removeChild(tbody.firstChild);
                }
                originalRows.forEach(row => tbody.appendChild(row));
            }
        } else {
            const rows = Array.from(tbody.getElementsByTagName('tr'));
            const sortedRows = sortRowsByRules(rows, rules);
            sortedRows.forEach(row => tbody.appendChild(row));
        }

        // Re-insert stats rows at top
        const firstDataRow = tbody.querySelector('tr:not([data-anytable-stats-row])');
        for (const statsRow of statsRows) {
            if (firstDataRow) {
                tbody.insertBefore(statsRow, firstDataRow);
            } else {
                tbody.appendChild(statsRow);
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
            const tables = document.getElementsByTagName('table');
            for (const table of tables) {
                if (!this.enhancedTables.has(table)) {
                    this.enhanceTable(table);
                }
            }
        }

        this.observeDOMChanges();
    }

    removeEnhancement(table) {
        this.toolbar.removeToolbar(table);
        this.controlPanelManager.removeTableControls(table);
        removeStatisticsRows(table);

        table.classList.remove('anytable-enhanced');
        this.enhancedTables.delete(table);
        this.stateStore.clearTable(table);
    }

    enhanceTable(table) {
        if (this.enhancedTables.has(table)) return;

        const tbody = table.getElementsByTagName('tbody')[0];
        if (tbody) {
            const rows = Array.from(tbody.getElementsByTagName('tr'));
            this.stateStore.setOriginalRows(table, rows);
        }

        this.stateStore.setSortRules(table, []);
        this.controlPanelManager.attachTableControls(table);
        this.enhancedTables.add(table);
        table.classList.add('anytable-enhanced');
        this.toolbar.createToolbar(table);
    }

    sortTable(table, columnIndex) {
        const tbody = table.getElementsByTagName('tbody')[0];
        if (!tbody) return;

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
        const tbody = table.getElementsByTagName('tbody')[0];
        if (!tbody) return;

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
            for (const mutation of mutations) {
                for (const node of mutation.removedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    const tables = node.nodeName === 'TABLE' ? [node] : [];
                    if (node.querySelectorAll) {
                        tables.push(...node.querySelectorAll('table'));
                    }
                    for (const table of tables) {
                        this.removeEnhancement(table);
                        this.selectedTables.delete(table);
                    }
                }

                if (!this.autoEnhance) continue;

                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    if (node.nodeName === 'TABLE') {
                        if (!this.enhancedTables.has(node)) this.enhanceTable(node);
                    }
                    if (node.querySelectorAll) {
                        for (const table of node.querySelectorAll('table')) {
                            if (!this.enhancedTables.has(table)) this.enhanceTable(table);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

const enhancer = new TableEnhancer();
enhancer.init();
