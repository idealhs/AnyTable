import { isLikelyDataTable } from '../core/table-detector.js';
import { createOriginalRowOrderState } from '../core/row-order-index.js';
import { buildTableModel } from '../core/table-model.js';
import { removeStatisticsRows } from '../ui/statistics-renderer.js';

export class TableEnhancementController {
    constructor({ enhancedTables, stateStore, controlPanelManager, toolbar, syncTablePresentation }) {
        this.enhancedTables = enhancedTables;
        this.stateStore = stateStore;
        this.controlPanelManager = controlPanelManager;
        this.toolbar = toolbar;
        this.syncTablePresentation = syncTablePresentation;
    }

    shouldAutoEnhanceTable(table) {
        return isLikelyDataTable(table);
    }

    autoEnhanceTables(tables) {
        for (const table of tables || []) {
            if (!this.enhancedTables.has(table) && this.shouldAutoEnhanceTable(table)) {
                this.enhanceTable(table);
            }
        }
    }

    enhanceTable(table) {
        if (this.enhancedTables.has(table)) {
            return;
        }

        this.stateStore.setOriginalRowOrder(table, createOriginalRowOrderState(buildTableModel(table)));
        this.stateStore.setSortRules(table, []);
        this.controlPanelManager.attachTableControls(table);
        this.enhancedTables.add(table);
        table.classList?.add('anytable-enhanced');
        this.toolbar.createToolbar(table);
    }

    removeEnhancement(table) {
        this.toolbar.removeToolbar(table);
        this.controlPanelManager.removeTableControls(table);
        removeStatisticsRows(table);

        table.classList?.remove('anytable-enhanced');
        this.enhancedTables.delete(table);
        this.stateStore.clearTable(table);
    }

    rehydrateTableUi(table) {
        if (!this.enhancedTables.has(table)) {
            return;
        }

        if (typeof this.toolbar.recreateToolbar === 'function') {
            this.toolbar.recreateToolbar(table);
        } else {
            this.toolbar.removeToolbar(table);
            this.toolbar.createToolbar(table);
        }

        this.syncTablePresentation?.(table);
    }
}
