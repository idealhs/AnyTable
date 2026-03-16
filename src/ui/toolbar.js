import { openAdvancedFilterPanel } from './filter-panel.js';
import { openAdvancedSortPanel } from './sort-panel.js';
import { openStatisticsPanel } from './statistics-panel.js';
import { getColumnValues } from '../core/table-data.js';
import i18n from '../i18n/i18n.js';
import { createShadowSurface } from './shadow-ui.js';

const toolbarMap = new WeakMap();

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

        const sortBtn = this._createButton('advancedSort', i18n.t('columnControl.sort.advanced'));
        sortBtn.addEventListener('click', () => this._openSort(table));

        const filterBtn = this._createButton('advancedFilter', i18n.t('columnControl.filter.advanced'));
        filterBtn.addEventListener('click', () => this._openFilter(table));

        const statsBtn = this._createButton('statistics', i18n.t('columnControl.statistics'));
        statsBtn.addEventListener('click', () => this._openStatistics(table));

        toolbar.appendChild(sortBtn);
        toolbar.appendChild(filterBtn);
        toolbar.appendChild(statsBtn);

        surface.container.appendChild(toolbar);
        parent.insertBefore(surface.host, table);

        toolbarMap.set(table, {
            buttons: [sortBtn, filterBtn, statsBtn],
            destroy: surface.destroy,
            toolbar
        });

        this.refreshActiveStates(table);
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

        const [sortBtn, filterBtn, statsBtn] = toolbarEntry.buttons;
        if (sortBtn) sortBtn.title = i18n.t('columnControl.sort.advanced');
        if (filterBtn) filterBtn.title = i18n.t('columnControl.filter.advanced');
        if (statsBtn) statsBtn.title = i18n.t('columnControl.statistics');
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

    _createButton(iconKey, title) {
        const button = document.createElement('button');
        button.className = 'anytable-toolbar-button';
        button.title = title;
        this.enhancer.setButtonIcon(button, iconKey);
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
}
