import { openAdvancedFilterPanel } from './filter-panel.js';
import { openAdvancedSortPanel } from './sort-panel.js';
import { openStatisticsPanel } from './statistics-panel.js';
import { getColumnValues } from '../core/table-data.js';
import i18n from '../i18n/i18n.js';

const toolbarMap = new WeakMap();

export class Toolbar {
    constructor(enhancer) {
        this.enhancer = enhancer;
    }

    createToolbar(table) {
        if (toolbarMap.has(table)) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'anytable-toolbar';

        const filterBtn = this._createButton('advancedFilter', i18n.t('columnControl.filter.advanced'));
        filterBtn.addEventListener('click', () => this._openFilter(table));

        const sortBtn = this._createButton('advancedSort', i18n.t('columnControl.sort.advanced'));
        sortBtn.addEventListener('click', () => this._openSort(table));

        const statsBtn = this._createButton('statistics', i18n.t('columnControl.statistics'));
        statsBtn.addEventListener('click', () => this._openStatistics(table));

        toolbar.appendChild(filterBtn);
        toolbar.appendChild(sortBtn);
        toolbar.appendChild(statsBtn);

        table.parentNode.insertBefore(toolbar, table);
        toolbarMap.set(table, toolbar);
    }

    removeToolbar(table) {
        const toolbar = toolbarMap.get(table);
        if (toolbar) {
            toolbar.remove();
            toolbarMap.delete(table);
        }
    }

    updateTexts(table) {
        const toolbar = toolbarMap.get(table);
        if (!toolbar) return;

        const buttons = toolbar.querySelectorAll('.anytable-toolbar-button');
        if (buttons[0]) buttons[0].title = i18n.t('columnControl.filter.advanced');
        if (buttons[1]) buttons[1].title = i18n.t('columnControl.sort.advanced');
        if (buttons[2]) buttons[2].title = i18n.t('columnControl.statistics');
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
