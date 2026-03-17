import i18n from './i18n/i18n.js';
import { TableStateStore } from './state/table-state.js';
import { getTableColumnTitles } from './core/table-structure.js';
import { PickingMode } from './picking-mode.js';
import { ControlPanelManager } from './control-panel-manager.js';
import { preloadShadowStyles } from './ui/shadow-ui.js';
import { Toolbar } from './ui/toolbar.js';
import { setupMessageHandler } from './message-handler.js';
import { createCommandService } from './services/command-service.js';
import { SortController } from './controllers/sort-controller.js';
import { FilterController } from './controllers/filter-controller.js';
import { TableEnhancementController } from './controllers/table-enhancement-controller.js';
import { TableObserver } from './controllers/table-observer.js';

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

class TableEnhancer {
    constructor() {
        this.enhancedTables = new Set();
        this.selectedTables = new Set();
        this.stateStore = new TableStateStore();
        this.autoEnhance = true;
        this.multiColumnSort = false;
        this.toolbarDefaultExpanded = true;

        this.controlPanelManager = new ControlPanelManager({
            stateStore: this.stateStore,
            onSort: (table, columnIndex) => this.sortController.sortTable(table, columnIndex),
            onFilterChange: (table, columnIndex, filterText) => this.filterController.filterTable(table, columnIndex, filterText),
            setSortButtonIcon: (button, direction, priority) => this.setSortButtonIcon(button, direction, priority),
            setFilterToggleButtonIcon: (button, expanded) => this.setFilterToggleButtonIcon(button, expanded)
        });

        this.toolbar = new Toolbar({
            stateStore: this.stateStore,
            setButtonIcon: (button, iconKey) => this.setButtonIcon(button, iconKey),
            getToolbarDefaultExpanded: () => this.toolbarDefaultExpanded,
            forEachEnhancedTable: (callback) => this.enhancedTables.forEach(callback),
            getColumnTitles: (table) => this.getColumnTitles(table),
            applyAdvancedSort: (table, rules) => this.sortController.applyAdvancedSort(table, rules),
            applyAdvancedFilterRuleGroup: (table, ruleGroup) => this.filterController.applyAdvancedFilterRuleGroup(table, ruleGroup),
            applyStatistics: (table, rules) => this.filterController.applyStatistics(table, rules)
        });

        this.sortController = new SortController({
            enhancedTables: this.enhancedTables,
            stateStore: this.stateStore,
            controlPanelManager: this.controlPanelManager,
            toolbar: this.toolbar,
            isMultiColumnSortEnabled: () => this.multiColumnSort,
            enableMultiColumnSort: () => this.enableMultiColumnSort(),
            setSortButtonIcon: (button, direction, priority) => this.setSortButtonIcon(button, direction, priority)
        });

        this.filterController = new FilterController({
            stateStore: this.stateStore,
            controlPanelManager: this.controlPanelManager,
            toolbar: this.toolbar
        });

        this.tableEnhancementController = new TableEnhancementController({
            enhancedTables: this.enhancedTables,
            stateStore: this.stateStore,
            controlPanelManager: this.controlPanelManager,
            toolbar: this.toolbar
        });

        this.tableObserver = new TableObserver({
            isAutoEnhanceEnabled: () => this.autoEnhance,
            isEnhancedTable: (table) => this.enhancedTables.has(table),
            autoEnhanceTables: (tables) => this.tableEnhancementController.autoEnhanceTables(tables),
            removeEnhancement: (table) => this.tableEnhancementController.removeEnhancement(table),
            syncOriginalRowOrder: (table) => this.sortController.syncOriginalRowOrder(table),
            onTableRemoved: (table) => this.selectedTables.delete(table)
        });

        this.pickingMode = new PickingMode({
            enhancedTables: this.enhancedTables,
            selectedTables: this.selectedTables,
            enhanceTable: (table) => this.tableEnhancementController.enhanceTable(table),
            removeEnhancement: (table) => this.tableEnhancementController.removeEnhancement(table)
        });

        this.initI18n();
    }

    async initI18n() {
        await i18n.init();
        window.addEventListener('localeChanged', () => this.updateAllTexts());
        this.updateAllTexts();
    }

    updateAllTexts() {
        this.enhancedTables.forEach((table) => {
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
        if (!pathData || !button) {
            return;
        }

        button.textContent = '';
        button.appendChild(this.createMaterialIconSvg(pathData));
    }

    setSortButtonIcon(button, direction, priority = null) {
        if (!button) {
            return;
        }

        const iconKey = direction === 'asc' ? 'sortAsc' :
            direction === 'desc' ? 'sortDesc' : 'sortNone';
        const pathData = MATERIAL_ICON_PATHS[iconKey];
        if (!pathData) {
            return;
        }

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
        if (!button) {
            return;
        }

        this.setButtonIcon(button, expanded ? 'filterToggleOpened' : 'filterToggleClosed');
    }

    getColumnTitles(table) {
        return getTableColumnTitles(
            table,
            (index) => i18n.t('advancedPanel.common.columnFallback').replace('{index}', String(index + 1))
        );
    }

    refreshSortButtons(table) {
        this.sortController.refreshSortButtons(table);
    }

    applyAdvancedSort(table, advancedRules) {
        this.sortController.applyAdvancedSort(table, advancedRules);
    }

    applyAllFilters(table) {
        this.filterController.applyAllFilters(table);
    }

    updateFilterInputsDisabledState(table) {
        this.filterController.updateFilterInputsDisabledState(table);
    }

    sortTable(table, columnIndex) {
        this.sortController.sortTable(table, columnIndex);
    }

    filterTable(table, columnIndex, filterText) {
        this.filterController.filterTable(table, columnIndex, filterText);
    }

    applyStatistics(table, rules) {
        this.filterController.applyStatistics(table, rules);
    }

    refreshStatistics(table) {
        this.filterController.refreshStatistics(table);
    }

    autoEnhanceTables(tables) {
        this.tableEnhancementController.autoEnhanceTables(tables);
    }

    shouldAutoEnhanceTable(table) {
        return this.tableEnhancementController.shouldAutoEnhanceTable(table);
    }

    enhanceTable(table) {
        this.tableEnhancementController.enhanceTable(table);
    }

    removeEnhancement(table) {
        this.tableEnhancementController.removeEnhancement(table);
    }

    syncOriginalRowOrder(table) {
        this.sortController.syncOriginalRowOrder(table);
    }

    observeDOMChanges() {
        this.tableObserver.observe(document.body);
    }

    async init() {
        const browser = window.browser || chrome;
        const result = await browser.storage.local.get(['autoEnhance', 'multiColumnSort', 'toolbarDefaultExpanded']);
        this.autoEnhance = result.autoEnhance !== false;
        this.multiColumnSort = result.multiColumnSort === true;
        this.toolbarDefaultExpanded = result.toolbarDefaultExpanded !== false;

        await preloadShadowStyles();
        setupMessageHandler(createCommandService(this));

        if (this.autoEnhance) {
            this.tableEnhancementController.autoEnhanceTables(document.getElementsByTagName('table'));
        }

        this.observeDOMChanges();
    }

    getSelectionState() {
        return {
            hasSelection: this.selectedTables.size > 0,
            enhancedCount: this.enhancedTables.size
        };
    }

    startPicking() {
        this.pickingMode.startPicking();
        return {
            picking: true
        };
    }

    clearSelection() {
        this.pickingMode.clearSelection();
        return this.getSelectionState();
    }

    setAutoEnhanceEnabled(enabled) {
        this.autoEnhance = enabled;

        if (enabled) {
            this.tableEnhancementController.autoEnhanceTables(document.getElementsByTagName('table'));
        } else {
            this.enhancedTables.forEach((table) => {
                if (!this.selectedTables.has(table)) {
                    this.tableEnhancementController.removeEnhancement(table);
                }
            });
        }

        return {
            autoEnhance: this.autoEnhance,
            ...this.getSelectionState()
        };
    }

    enableMultiColumnSort() {
        if (this.multiColumnSort) {
            return;
        }

        this.multiColumnSort = true;
        const browser = window.browser || chrome;
        browser.storage.local.set({multiColumnSort: true});
    }

    setMultiColumnSortEnabled(enabled) {
        this.multiColumnSort = enabled;
        this.enhancedTables.forEach((table) => {
            this.sortController.refreshSortButtons(table);
        });

        return {
            multiColumnSort: this.multiColumnSort
        };
    }

    setToolbarDefaultExpanded(enabled) {
        this.toolbarDefaultExpanded = enabled;
        this.toolbar.setAllExpanded(this.toolbarDefaultExpanded);

        return {
            toolbarDefaultExpanded: this.toolbarDefaultExpanded
        };
    }
}

const enhancer = new TableEnhancer();
enhancer.init();
