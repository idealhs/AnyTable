import { openAdvancedFilterPanel } from './filter-panel.js';
import { openAdvancedSortPanel } from './sort-panel.js';
import { openStatisticsPanel } from './statistics-panel.js';
import { downloadTableAsCsv } from '../core/csv-export.js';
import { getColumnValues } from '../core/table-data.js';
import i18n from '../i18n/i18n.js';
import { createShadowSurface } from './shadow-ui.js';

const toolbarMap = new WeakMap();
const BUTTON_WIDTH = 48;

function queueNextFrame(callback) {
    const raf = globalThis.requestAnimationFrame || ((cb) => setTimeout(cb, 0));
    return raf(callback);
}

export class Toolbar {
    constructor(enhancer) {
        this.enhancer = enhancer;
    }

    createToolbar(table) {
        if (toolbarMap.has(table)) return;

        const parent = table.parentNode;
        if (!parent) return;

        const surface = createShadowSurface({
            parent,
            hostStyles: {
                position: 'relative',
                height: '0',
                overflow: 'visible',
                'z-index': '2'
            },
            containerClassName: 'anytable-toolbar-surface'
        });

        const toolbar = document.createElement('div');
        toolbar.className = 'anytable-toolbar';

        const toggleBtn = this._createToggleButton();
        toggleBtn.addEventListener('click', () => {
            const toolbarEntry = toolbarMap.get(table);
            if (!toolbarEntry) return;
            this.setExpanded(table, !toolbarEntry.isExpanded);
        });

        const actions = document.createElement('div');
        actions.className = 'anytable-toolbar-actions';

        const sortBtn = this._createButton('advancedSort', i18n.t('columnControl.sort.advanced'));
        sortBtn.addEventListener('click', () => this._openSort(table));

        const filterBtn = this._createButton('advancedFilter', i18n.t('columnControl.filter.advanced'));
        filterBtn.addEventListener('click', () => this._openFilter(table));

        const statsBtn = this._createButton('statistics', i18n.t('columnControl.statistics'));
        statsBtn.addEventListener('click', () => this._openStatistics(table));

        const exportBtn = this._createButton('download', i18n.t('columnControl.exportCsv'));
        exportBtn.addEventListener('click', () => this._exportCsv(table));

        const actionButtons = [sortBtn, filterBtn, statsBtn, exportBtn];
        actions.style.width = `${BUTTON_WIDTH * actionButtons.length}px`;

        actions.appendChild(sortBtn);
        actions.appendChild(filterBtn);
        actions.appendChild(statsBtn);
        actions.appendChild(exportBtn);
        toolbar.appendChild(toggleBtn);
        toolbar.appendChild(actions);

        surface.container.appendChild(toolbar);
        parent.insertBefore(surface.host, table);

        toolbarMap.set(table, {
            buttons: actionButtons,
            toggleBtn,
            actions,
            destroy: surface.destroy,
            toolbar,
            isExpanded: true
        });

        this.setExpanded(table, this.enhancer.toolbarDefaultExpanded !== false, { skipAnimation: true });
        this.refreshActiveStates(table);
        this.updateTexts(table);
    }

    removeToolbar(table) {
        const toolbarEntry = toolbarMap.get(table);
        if (toolbarEntry) {
            toolbarEntry.destroy();
            toolbarMap.delete(table);
        }
    }

    updateTexts(table) {
        const toolbarEntry = toolbarMap.get(table);
        if (!toolbarEntry) return;

        const [sortBtn, filterBtn, statsBtn, exportBtn] = toolbarEntry.buttons;
        if (sortBtn) sortBtn.title = i18n.t('columnControl.sort.advanced');
        if (filterBtn) filterBtn.title = i18n.t('columnControl.filter.advanced');
        if (statsBtn) statsBtn.title = i18n.t('columnControl.statistics');
        if (exportBtn) exportBtn.title = i18n.t('columnControl.exportCsv');

        const toggleTitle = i18n.t(toolbarEntry.isExpanded ? 'columnControl.toolbar.collapse' : 'columnControl.toolbar.expand');
        if (toolbarEntry.toggleBtn) {
            toolbarEntry.toggleBtn.title = toggleTitle;
            toolbarEntry.toggleBtn.setAttribute('aria-label', toggleTitle);
            this.enhancer.setButtonIcon(
                toolbarEntry.toggleBtn,
                toolbarEntry.isExpanded ? 'toolbarCollapse' : 'toolbarExpand'
            );
        }
    }

    refreshActiveStates(table) {
        const toolbarEntry = toolbarMap.get(table);
        if (!toolbarEntry) return;

        const [sortBtn, filterBtn, statsBtn] = toolbarEntry.buttons;
        const hasAdvancedSort = this.enhancer.stateStore.getAdvancedSortRules(table).length > 0;
        const hasAdvancedFilter = this.enhancer.stateStore.getAdvancedFilterRules(table) !== null;
        const hasStatistics = this.enhancer.stateStore.getStatisticsRules(table).length > 0;

        if (sortBtn) sortBtn.classList.toggle('toolbar-active', hasAdvancedSort);
        if (filterBtn) filterBtn.classList.toggle('toolbar-active', hasAdvancedFilter);
        if (statsBtn) statsBtn.classList.toggle('toolbar-active', hasStatistics);
    }

    setExpanded(table, expanded, { skipAnimation = false } = {}) {
        const toolbarEntry = toolbarMap.get(table);
        if (!toolbarEntry) return;

        if (skipAnimation) {
            toolbarEntry.toolbar.classList.add('toolbar-no-transition');
        }

        toolbarEntry.isExpanded = expanded;
        toolbarEntry.toolbar.classList.toggle('toolbar-collapsed', !expanded);
        toolbarEntry.actions.style.width = expanded ? `${toolbarEntry.buttons.length * BUTTON_WIDTH}px` : '0px';
        toolbarEntry.actions.setAttribute('aria-hidden', String(!expanded));
        toolbarEntry.toggleBtn.setAttribute('aria-expanded', String(expanded));
        toolbarEntry.buttons.forEach((button) => {
            button.tabIndex = expanded ? 0 : -1;
        });

        if (skipAnimation) {
            queueNextFrame(() => {
                toolbarEntry.toolbar.classList.remove('toolbar-no-transition');
            });
        }

        this.updateTexts(table);
    }

    setAllExpanded(expanded) {
        this.enhancer.enhancedTables.forEach((table) => {
            this.setExpanded(table, expanded);
        });
    }

    _createButton(iconKey, title) {
        const button = document.createElement('button');
        button.className = 'anytable-toolbar-control anytable-toolbar-button';
        button.type = 'button';
        button.title = title;
        this.enhancer.setButtonIcon(button, iconKey);
        return button;
    }

    _createToggleButton() {
        const button = document.createElement('button');
        button.className = 'anytable-toolbar-control anytable-toolbar-toggle-button';
        button.type = 'button';
        return button;
    }

    _openFilter(table) {
        const columnTitles = this.enhancer.getColumnTitles(table);
        const initialRuleGroup = this.enhancer.stateStore.getAdvancedFilterRules(table) || {
            id: `group-${Date.now()}`,
            operator: 'AND',
            children: [{
                id: `leaf-${Date.now()}`,
                column: 0,
                comparator: 'contains',
                value: '',
                options: {}
            }]
        };

        openAdvancedFilterPanel({
            columnTitles,
            initialRuleGroup,
            onApply: (ruleGroup) => {
                this.enhancer.stateStore.setAdvancedFilterRules(table, ruleGroup);
                this.enhancer.applyAllFilters(table);
            }
        });
    }

    _openSort(table) {
        const columnTitles = this.enhancer.getColumnTitles(table);
        const initialRules = this.enhancer.stateStore.getAdvancedSortRules(table);

        openAdvancedSortPanel({
            columnTitles,
            initialRules,
            tableElement: table,
            getColumnValues: (colIdx) => getColumnValues(table, colIdx),
            onApply: (rules) => {
                this.enhancer.applyAdvancedSort(table, rules);
            }
        });
    }

    _openStatistics(table) {
        const columnTitles = this.enhancer.getColumnTitles(table);
        const initialRules = this.enhancer.stateStore.getStatisticsRules(table);

        openStatisticsPanel({
            columnTitles,
            initialRules,
            onApply: (rules) => {
                this.enhancer.applyStatistics(table, rules);
            }
        });
    }

    _exportCsv(table) {
        downloadTableAsCsv(table);
    }
}
