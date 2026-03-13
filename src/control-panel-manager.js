import i18n from './i18n/i18n.js';

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

        const controlPanel = document.createElement('div');
        controlPanel.className = 'anytable-control-panel';

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
