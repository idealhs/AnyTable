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

function hasActiveFilterValue(value) {
    return value !== null && value !== undefined && String(value) !== '';
}

function createSeedId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getElementRect(element) {
    if (typeof element?.getBoundingClientRect === 'function') {
        return element.getBoundingClientRect();
    }

    return null;
}

function resolveTableWidth(table) {
    const tableRect = getElementRect(table);
    if (tableRect && Number.isFinite(tableRect.width) && tableRect.width > 0) {
        return tableRect.width;
    }

    const tableWidth = Number(table?.offsetWidth);
    return Number.isFinite(tableWidth) && tableWidth > 0 ? tableWidth : null;
}

function resolveTableLeftOffset(table, parent) {
    const tableRect = getElementRect(table);
    const parentRect = getElementRect(parent);
    if (tableRect && parentRect) {
        const offset = tableRect.left - parentRect.left;
        if (Number.isFinite(offset)) {
            return offset;
        }
    }

    const offsetLeft = Number(table?.offsetLeft);
    return Number.isFinite(offsetLeft) ? offsetLeft : 0;
}

function resolveTableTopOffset(table, parent) {
    const tableRect = getElementRect(table);
    const parentRect = getElementRect(parent);
    if (tableRect && parentRect) {
        const offset = tableRect.top - parentRect.top;
        if (Number.isFinite(offset)) {
            return offset;
        }
    }

    const offsetTop = Number(table?.offsetTop);
    return Number.isFinite(offsetTop) ? offsetTop : 0;
}

function resolveToolbarHeight(toolbar) {
    const toolbarRect = getElementRect(toolbar);
    if (toolbarRect && Number.isFinite(toolbarRect.height) && toolbarRect.height > 0) {
        return toolbarRect.height;
    }

    const height = Number(toolbar?.offsetHeight);
    return Number.isFinite(height) && height > 0 ? height : 26;
}

function getElementPosition(element) {
    const inlinePosition = element?.style?.position;
    if (inlinePosition) {
        return inlinePosition;
    }

    return globalThis.getComputedStyle?.(element)?.position || '';
}

function ensurePositioningContext(element) {
    if (!element?.style) {
        return {restore() {}};
    }

    const originalInlinePosition = element.style.position;
    const currentPosition = getElementPosition(element);
    const shouldUpdate = !currentPosition || currentPosition === 'static';

    if (shouldUpdate) {
        element.style.position = 'relative';
    }

    return {
        restore() {
            if (shouldUpdate) {
                element.style.position = originalInlinePosition;
            }
        }
    };
}

function resolveToolbarTop(table, parent, toolbar) {
    return resolveTableTopOffset(table, parent) - resolveToolbarHeight(toolbar);
}

function resolveToolbarLeft(table, parent) {
    return resolveTableLeftOffset(table, parent);
}

function resolveToolbarWidth(table) {
    const width = resolveTableWidth(table);
    return width !== null ? width : 0;
}

function buildRuleGroupFromBasicFilters(filterValues) {
    const activeEntries = Object.entries(filterValues || {})
        .filter(([, value]) => hasActiveFilterValue(value))
        .sort(([left], [right]) => Number(left) - Number(right));

    if (activeEntries.length === 0) {
        return null;
    }

    return {
        id: createSeedId('group'),
        children: activeEntries.map(([columnIndex, value], index) => ({
            id: createSeedId('leaf'),
            column: Number(columnIndex),
            comparator: 'contains',
            value: String(value),
            options: {},
            operator: index === 0 ? undefined : 'AND'
        }))
    };
}

export class Toolbar {
    constructor({
        stateStore,
        setButtonIcon,
        getToolbarDefaultExpanded,
        forEachEnhancedTable,
        getColumnTitles,
        applyAdvancedSort,
        applyAdvancedFilterRuleGroup,
        applyStatistics
    }) {
        this.stateStore = stateStore;
        this.setButtonIcon = setButtonIcon;
        this.getToolbarDefaultExpanded = getToolbarDefaultExpanded;
        this.forEachEnhancedTable = forEachEnhancedTable;
        this.getColumnTitles = getColumnTitles;
        this.applyAdvancedSort = applyAdvancedSort;
        this.applyAdvancedFilterRuleGroup = applyAdvancedFilterRuleGroup;
        this.applyStatistics = applyStatistics;
    }

    syncToolbarGeometry(table, parent, host, toolbar) {
        if (!toolbar?.style || !host?.style) {
            return;
        }

        host.style.setProperty('left', `${resolveToolbarLeft(table, parent)}px`);
        host.style.setProperty('top', '0px');
        host.style.setProperty('width', `${resolveToolbarWidth(table)}px`);
        toolbar.style.setProperty('top', `${resolveToolbarTop(table, parent, toolbar)}px`);
        toolbar.style.removeProperty?.('margin-right');
    }

    createToolbar(table, { expanded } = {}) {
        if (toolbarMap.has(table)) {
            return;
        }

        const parent = table.parentNode;
        if (!parent) {
            return;
        }

        const parentPositioningContext = ensurePositioningContext(parent);
        const surface = createShadowSurface({
            parent,
            direction: i18n.getDirection?.() || 'ltr',
            hostStyles: {
                position: 'absolute',
                left: '0',
                top: '0',
                width: '0',
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
            if (!toolbarEntry) {
                return;
            }
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
        this.syncToolbarGeometry(table, parent, surface.host, toolbar);

        const geometryObserver = typeof ResizeObserver === 'function'
            ? new ResizeObserver(() => {
                this.syncToolbarGeometry(table, parent, surface.host, toolbar);
            })
            : null;
        geometryObserver?.observe(table);

        toolbarMap.set(table, {
            buttons: actionButtons,
            toggleBtn,
            actions,
            destroy: surface.destroy,
            geometryObserver,
            host: surface.host,
            parentPositioningContext,
            toolbar,
            isExpanded: true
        });

        const initialExpanded = expanded ?? (this.getToolbarDefaultExpanded() !== false);
        this.setExpanded(table, initialExpanded, {skipAnimation: true});
        this.refreshActiveStates(table);
        this.updateTexts(table);
    }

    recreateToolbar(table) {
        const expanded = toolbarMap.get(table)?.isExpanded;
        this.removeToolbar(table);
        this.createToolbar(table, {expanded});
    }

    removeToolbar(table) {
        const toolbarEntry = toolbarMap.get(table);
        if (toolbarEntry) {
            toolbarEntry.geometryObserver?.disconnect?.();
            toolbarEntry.destroy();
            toolbarEntry.parentPositioningContext?.restore?.();
            toolbarMap.delete(table);
        }
    }

    updateTexts(table) {
        const toolbarEntry = toolbarMap.get(table);
        if (!toolbarEntry) {
            return;
        }

        toolbarEntry.host?.setAttribute('dir', i18n.getDirection?.() || 'ltr');

        const [sortBtn, filterBtn, statsBtn, exportBtn] = toolbarEntry.buttons;
        if (sortBtn) {
            sortBtn.title = i18n.t('columnControl.sort.advanced');
        }
        if (filterBtn) {
            filterBtn.title = i18n.t('columnControl.filter.advanced');
        }
        if (statsBtn) {
            statsBtn.title = i18n.t('columnControl.statistics');
        }
        if (exportBtn) {
            exportBtn.title = i18n.t('columnControl.exportCsv');
        }

        const toggleTitle = i18n.t(toolbarEntry.isExpanded ? 'columnControl.toolbar.collapse' : 'columnControl.toolbar.expand');
        if (toolbarEntry.toggleBtn) {
            toolbarEntry.toggleBtn.title = toggleTitle;
            toolbarEntry.toggleBtn.setAttribute('aria-label', toggleTitle);
            this.setButtonIcon(
                toolbarEntry.toggleBtn,
                toolbarEntry.isExpanded ? 'toolbarCollapse' : 'toolbarExpand'
            );
        }
    }

    refreshActiveStates(table) {
        const toolbarEntry = toolbarMap.get(table);
        if (!toolbarEntry) {
            return;
        }

        const [sortBtn, filterBtn, statsBtn] = toolbarEntry.buttons;
        const hasAdvancedSort = this.stateStore.getAdvancedSortRules(table).length > 0;
        const hasAdvancedFilter = this.stateStore.getAdvancedFilterRules(table) !== null;
        const hasStatistics = this.stateStore.getStatisticsRules(table).length > 0;

        if (sortBtn) {
            sortBtn.classList.toggle('toolbar-active', hasAdvancedSort);
        }
        if (filterBtn) {
            filterBtn.classList.toggle('toolbar-active', hasAdvancedFilter);
        }
        if (statsBtn) {
            statsBtn.classList.toggle('toolbar-active', hasStatistics);
        }
    }

    setExpanded(table, expanded, { skipAnimation = false } = {}) {
        const toolbarEntry = toolbarMap.get(table);
        if (!toolbarEntry) {
            return;
        }

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
        this.forEachEnhancedTable((table) => {
            this.setExpanded(table, expanded);
        });
    }

    _createButton(iconKey, title) {
        const button = document.createElement('button');
        button.className = 'anytable-toolbar-control anytable-toolbar-button';
        button.type = 'button';
        button.title = title;
        this.setButtonIcon(button, iconKey);
        return button;
    }

    _createToggleButton() {
        const button = document.createElement('button');
        button.className = 'anytable-toolbar-control anytable-toolbar-toggle-button';
        button.type = 'button';
        return button;
    }

    _openFilter(table) {
        const columnTitles = this.getColumnTitles(table);
        const advancedRuleGroup = this.stateStore.getAdvancedFilterRules(table);
        const filterValues = this.stateStore.getFilterValues(table);
        const initialRuleGroup = advancedRuleGroup || buildRuleGroupFromBasicFilters(filterValues);

        openAdvancedFilterPanel({
            columnTitles,
            initialRuleGroup,
            onApply: (ruleGroup) => {
                this.applyAdvancedFilterRuleGroup(table, ruleGroup);
            }
        });
    }

    _openSort(table) {
        const columnTitles = this.getColumnTitles(table);
        const advancedRules = this.stateStore.getAdvancedSortRules(table);
        const initialRules = advancedRules.length > 0
            ? advancedRules
            : this.stateStore.getSortRules(table);

        openAdvancedSortPanel({
            columnTitles,
            initialRules,
            tableElement: table,
            getColumnValues: (colIdx) => getColumnValues(table, colIdx),
            onApply: (rules) => {
                this.applyAdvancedSort(table, rules);
            }
        });
    }

    _openStatistics(table) {
        const columnTitles = this.getColumnTitles(table);
        const initialRules = this.stateStore.getStatisticsRules(table);

        openStatisticsPanel({
            columnTitles,
            initialRules,
            onApply: (rules) => {
                this.applyStatistics(table, rules);
            }
        });
    }

    _exportCsv(table) {
        downloadTableAsCsv(table);
    }
}
