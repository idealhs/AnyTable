import i18n from './i18n/i18n.js';
import { getColumnValues } from './core/table-data.js';
import { openAdvancedFilterPanel } from './ui/filter-panel.js';
import { openAdvancedSortPanel } from './ui/sort-panel.js';
import { openStatisticsPanel } from './ui/statistics-panel.js';

export class ControlPanelManager {
    constructor(enhancer) {
        this.enhancer = enhancer;
    }

    showControlPanel(table, columnIndex) {
        const header = table.getElementsByTagName('th')[columnIndex];
        const existingPanel = header.querySelector('.anytable-control-panel');
        if (existingPanel) {
            return;
        }

        const actualTitle = header.childNodes[0]?.textContent.trim() || '';

        const controlPanel = document.createElement('div');
        controlPanel.className = 'anytable-control-panel';

        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';

        const advancedButtons = document.createElement('div');
        advancedButtons.className = 'advanced-buttons';

        const advancedFilterButton = document.createElement('button');
        advancedFilterButton.className = 'control-button';
        this.enhancer.setButtonIcon(advancedFilterButton, 'advancedFilter');
        advancedFilterButton.title = i18n.t('columnControl.filter.advanced');

        const advancedSortButton = document.createElement('button');
        advancedSortButton.className = 'control-button';
        this.enhancer.setButtonIcon(advancedSortButton, 'advancedSort');
        advancedSortButton.title = i18n.t('columnControl.sort.advanced');

        const statisticsButton = document.createElement('button');
        statisticsButton.className = 'control-button';
        this.enhancer.setButtonIcon(statisticsButton, 'statistics');
        statisticsButton.title = i18n.t('columnControl.statistics');

        advancedButtons.appendChild(advancedFilterButton);
        advancedButtons.appendChild(advancedSortButton);
        advancedButtons.appendChild(statisticsButton);
        panelHeader.appendChild(advancedButtons);

        const filterRow = document.createElement('div');
        filterRow.className = 'control-row';

        const filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.className = 'filter-input';
        filterInput.placeholder = i18n.t('columnControl.filter.placeholder');

        const filterValues = this.enhancer.stateStore.getFilterValues(table);
        if (filterValues[columnIndex]) {
            filterInput.value = filterValues[columnIndex];
        }

        if (this.enhancer.stateStore.getAdvancedFilterRules(table) !== null) {
            filterInput.disabled = true;
        }

        filterRow.appendChild(filterInput);

        controlPanel.appendChild(panelHeader);
        controlPanel.appendChild(filterRow);

        header.appendChild(controlPanel);

        const checkPosition = () => {
            const rect = controlPanel.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const headerRect = header.getBoundingClientRect();

            const panelWidth = Math.max(headerRect.width, 200);
            const panelRight = headerRect.left + panelWidth;
            const panelLeft = headerRect.right - panelWidth;

            controlPanel.classList.remove('right-aligned', 'left-aligned', 'center-aligned');

            if (panelRight > viewportWidth && panelLeft < 0) {
                controlPanel.classList.add('center-aligned');
            } else if (panelRight > viewportWidth) {
                controlPanel.classList.add('right-aligned');
            } else if (panelLeft < 0) {
                controlPanel.classList.add('left-aligned');
            }
        };

        controlPanel.classList.add('active');

        requestAnimationFrame(checkPosition);

        const resizeObserver = new ResizeObserver(() => {
            checkPosition();
        });
        resizeObserver.observe(header);

        filterInput.addEventListener('input', (e) => {
            e.stopPropagation();
            this.enhancer.stateStore.setFilterValue(table, columnIndex, e.target.value);
            this.enhancer.filterTable(table, columnIndex, e.target.value);
        });

        filterInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                filterInput.value = '';
                this.enhancer.stateStore.setFilterValue(table, columnIndex, '');
                this.enhancer.filterTable(table, columnIndex, '');
            }
        });

        advancedFilterButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const columnTitles = this.enhancer.getColumnTitles(table);
            const initialRuleGroup = this.enhancer.stateStore.getAdvancedFilterRules(table) || {
                id: `group-${Date.now()}`,
                operator: 'AND',
                children: [{
                    id: `leaf-${Date.now()}`,
                    column: columnIndex,
                    comparator: 'contains',
                    value: '',
                    options: {}
                }]
            };

            openAdvancedFilterPanel({
                columnIndex,
                columnTitles,
                initialRuleGroup,
                onApply: (ruleGroup) => {
                    this.enhancer.stateStore.setAdvancedFilterRules(table, ruleGroup);
                    this.enhancer.applyAllFilters(table);
                }
            });
        });

        advancedSortButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const columnTitles = this.enhancer.getColumnTitles(table);
            const initialRules = this.enhancer.stateStore.getAdvancedSortRules(table);

            openAdvancedSortPanel({
                columnIndex,
                columnTitles,
                initialRules,
                tableElement: table,
                getColumnValues: (colIdx) => getColumnValues(table, colIdx),
                onApply: (rules) => {
                    this.enhancer.applyAdvancedSort(table, rules);
                }
            });
        });

        statisticsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const columnTitles = this.enhancer.getColumnTitles(table);
            const initialRules = this.enhancer.stateStore.getStatisticsRules(table);

            openStatisticsPanel({
                columnIndex,
                columnTitles,
                initialRules,
                onApply: (rules) => {
                    this.enhancer.applyStatistics(table, rules);
                }
            });
        });

        const closePanel = (e) => {
            if (!controlPanel.contains(e.target) && !e.target.closest('.anytable-expand-button')) {
                controlPanel.remove();
                resizeObserver.disconnect();
                document.removeEventListener('click', closePanel);

                const expandButton = header.querySelector('.anytable-expand-button');
                if (expandButton) {
                    this.enhancer.setExpandButtonIcon(expandButton, false);
                }
            }
        };

        controlPanel._closePanelHandler = closePanel;
        document.addEventListener('click', closePanel);

        controlPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}
