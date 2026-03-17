import i18n from './i18n/i18n.js';
import { getRuleTreeColumns } from './core/filter-engine.js';
import { createShadowSurface, eventPathIncludes } from './ui/shadow-ui.js';

export class ControlPanelManager {
    constructor(enhancer) {
        this.enhancer = enhancer;
        this.tableControls = new WeakMap();
    }

    attachTableControls(table) {
        if (this.tableControls.has(table)) {
            return;
        }

        const headers = Array.from(table.getElementsByTagName('th'));
        const controls = headers.map((header, columnIndex) => this.createHeaderControl(table, header, columnIndex));
        this.tableControls.set(table, controls);
        this.setFilterInputsDisabledState(table, this.enhancer.stateStore.getAdvancedFilterRules(table) !== null);
        this.refreshFilterButtons(table);
    }

    getTableControls(table) {
        return this.tableControls.get(table) || [];
    }

    getHeaderControl(table, columnIndex) {
        return this.getTableControls(table)[columnIndex] || null;
    }

    syncFilterInputValues(table, filterValues = {}) {
        this.getTableControls(table).forEach((control) => {
            if (!control) {
                return;
            }

            const value = filterValues[control.columnIndex];
            control.filterInput.value = value === null || value === undefined ? '' : String(value);
        });
    }

    updateTexts(table) {
        this.getTableControls(table).forEach((control) => {
            if (!control) {
                return;
            }

            control.filterInput.placeholder = i18n.t('columnControl.filter.placeholder');
            this.updateFilterToggleButtonTitle(table, control);

            const rules = this.enhancer.stateStore.getSortRules(table);
            const rule = rules.find((item) => item.column === control.columnIndex);
            control.sortButton.title = rule
                ? (rule.direction === 'asc'
                    ? i18n.t('columnControl.sort.ascending')
                    : i18n.t('columnControl.sort.descending'))
                : i18n.t('columnControl.sort.none');
        });
    }

    setFilterInputsDisabledState(table, disabled) {
        this.getTableControls(table).forEach((control) => {
            if (!control) {
                return;
            }

            if (disabled && control.isOpen) {
                this.hideControlPanel(table, control.columnIndex);
            }

            control.filterInput.disabled = disabled;
            control.filterToggleButton.setAttribute('aria-disabled', String(disabled));
            control.filterToggleButton.tabIndex = disabled ? -1 : 0;
            this.updateFilterToggleButtonTitle(table, control);
        });
    }

    refreshFilterButtons(table) {
        const advancedRuleGroup = this.enhancer.stateStore.getAdvancedFilterRules(table);
        const advancedFilterColumns = getRuleTreeColumns(advancedRuleGroup);
        const filterValues = this.enhancer.stateStore.getFilterValues(table);

        this.getTableControls(table).forEach((control) => {
            if (!control) {
                return;
            }

            const hasBasicFilter = this.hasActiveFilterValue(filterValues[control.columnIndex]);
            const hasAdvancedFilter = advancedFilterColumns.has(control.columnIndex);
            control.filterToggleButton.classList.toggle('filter-active', hasBasicFilter || hasAdvancedFilter);
            this.updateFilterToggleButtonTitle(table, control);
        });
    }

    showControlPanel(table, columnIndex) {
        const control = this.getHeaderControl(table, columnIndex);
        if (!control || control.isOpen || control.filterToggleButton.getAttribute('aria-disabled') === 'true') {
            return;
        }

        control.isOpen = true;
        control.panel.classList.add('active');
        this.enhancer.setFilterToggleButtonIcon(control.filterToggleButton, true);
        this.updateFilterToggleButtonTitle(table, control);
        this.updatePanelPosition(control);

        control.documentClickHandler = (event) => {
            if (eventPathIncludes(event, control.panel, control.filterToggleButton)) {
                return;
            }
            this.hideControlPanel(table, columnIndex);
        };

        document.addEventListener('click', control.documentClickHandler, true);
    }

    hideControlPanel(table, columnIndex) {
        const control = this.getHeaderControl(table, columnIndex);
        if (!control || !control.isOpen) {
            return;
        }

        control.isOpen = false;
        control.panel.classList.remove('active', 'right-aligned', 'left-aligned', 'center-aligned');
        this.enhancer.setFilterToggleButtonIcon(control.filterToggleButton, false);
        this.updateFilterToggleButtonTitle(table, control);

        if (control.documentClickHandler) {
            document.removeEventListener('click', control.documentClickHandler, true);
            control.documentClickHandler = null;
        }
    }

    toggleControlPanel(table, columnIndex) {
        const control = this.getHeaderControl(table, columnIndex);
        if (!control || control.filterToggleButton.getAttribute('aria-disabled') === 'true') {
            return;
        }

        if (control.isOpen) {
            this.hideControlPanel(table, columnIndex);
            return;
        }

        this.getTableControls(table).forEach((item, index) => {
            if (index !== columnIndex && item?.isOpen) {
                this.hideControlPanel(table, index);
            }
        });

        this.showControlPanel(table, columnIndex);
    }

    removeTableControls(table) {
        const controls = this.tableControls.get(table);
        if (!controls) {
            return;
        }

        controls.forEach((control) => {
            if (!control) {
                return;
            }

            if (control.documentClickHandler) {
                document.removeEventListener('click', control.documentClickHandler, true);
            }
            control.resizeObserver.disconnect();
            control.destroy();

            control.header.style.position = control.originalHeaderPosition;
            control.header.style.paddingRight = control.originalHeaderPaddingRight;
        });

        this.tableControls.delete(table);
    }

    createHeaderControl(table, header, columnIndex) {
        const originalHeaderPosition = header.style.position;
        const originalHeaderPaddingRight = header.style.paddingRight;

        header.style.position = 'relative';
        header.style.paddingRight = '72px';

        const surface = createShadowSurface({
            parent: header,
            hostStyles: {
                position: 'absolute',
                inset: '0',
                overflow: 'visible',
                'z-index': '1',
                'pointer-events': 'none'
            },
            containerClassName: 'anytable-header-surface'
        });

        const actionContainer = document.createElement('div');
        actionContainer.className = 'anytable-expand';

        const sortButton = document.createElement('button');
        sortButton.type = 'button';
        sortButton.className = 'anytable-sort-button';
        sortButton.title = i18n.t('columnControl.sort.none');
        this.enhancer.setSortButtonIcon(sortButton, 'none');

        const filterToggleButton = document.createElement('button');
        filterToggleButton.type = 'button';
        filterToggleButton.className = 'anytable-filter-toggle-button';
        this.enhancer.setFilterToggleButtonIcon(filterToggleButton, false);

        actionContainer.appendChild(sortButton);
        actionContainer.appendChild(filterToggleButton);

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

        const hasAdvancedFilter = this.enhancer.stateStore.getAdvancedFilterRules(table) !== null;
        filterInput.disabled = hasAdvancedFilter;
        filterToggleButton.setAttribute('aria-disabled', String(hasAdvancedFilter));
        filterToggleButton.tabIndex = hasAdvancedFilter ? -1 : 0;

        filterRow.appendChild(filterInput);
        controlPanel.appendChild(filterRow);

        surface.container.appendChild(actionContainer);
        surface.container.appendChild(controlPanel);

        sortButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.enhancer.sortTable(table, columnIndex);
        });

        filterToggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            if (filterToggleButton.getAttribute('aria-disabled') === 'true') {
                event.preventDefault();
                return;
            }
            this.toggleControlPanel(table, columnIndex);
        });

        filterInput.addEventListener('input', (event) => {
            event.stopPropagation();
            this.enhancer.stateStore.setFilterValue(table, columnIndex, event.target.value);
            this.enhancer.filterTable(table, columnIndex, event.target.value);
        });

        filterInput.addEventListener('keydown', (event) => {
            event.stopPropagation();
            if (event.key === 'Escape') {
                filterInput.value = '';
                this.enhancer.stateStore.setFilterValue(table, columnIndex, '');
                this.enhancer.filterTable(table, columnIndex, '');
            }
        });

        const control = {
            columnIndex,
            destroy: surface.destroy,
            documentClickHandler: null,
            filterToggleButton,
            filterInput,
            header,
            host: surface.host,
            isOpen: false,
            originalHeaderPaddingRight,
            originalHeaderPosition,
            panel: controlPanel,
            resizeObserver: new ResizeObserver(() => {
                if (control.isOpen) {
                    this.updatePanelPosition(control);
                }
            }),
            sortButton
        };

        control.resizeObserver.observe(header);
        this.updateFilterToggleButtonTitle(table, control);

        return control;
    }

    updateFilterToggleButtonTitle(table, control) {
        if (!control?.filterToggleButton) {
            return;
        }

        const title = this.enhancer.stateStore.getAdvancedFilterRules(table) !== null
            ? i18n.t('columnControl.filter.locked')
            : (control.isOpen
                ? i18n.t('columnControl.filter.hidePanel')
                : i18n.t('columnControl.filter.showPanel'));

        control.filterToggleButton.title = title;
        control.filterToggleButton.setAttribute('aria-label', title);
    }

    hasActiveFilterValue(value) {
        return value !== null && value !== undefined && String(value) !== '';
    }

    updatePanelPosition(control) {
        const {header, panel} = control;
        const viewportWidth = window.innerWidth;
        const headerRect = header.getBoundingClientRect();
        const panelWidth = Math.max(headerRect.width, 200);
        const panelRight = headerRect.left + panelWidth;
        const panelLeft = headerRect.right - panelWidth;

        panel.classList.remove('right-aligned', 'left-aligned', 'center-aligned');

        if (panelRight > viewportWidth && panelLeft < 0) {
            panel.classList.add('center-aligned');
        } else if (panelRight > viewportWidth) {
            panel.classList.add('right-aligned');
        } else if (panelLeft < 0) {
            panel.classList.add('left-aligned');
        }
    }
}
