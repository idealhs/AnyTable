import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeStyle {
    setProperty(name, value) {
        this[name] = value;
    }

    removeProperty(name) {
        delete this[name];
    }
}

class FakeClassList {
    constructor(owner) {
        this.owner = owner;
        this.classes = new Set();
    }

    add(...tokens) {
        tokens.forEach((token) => this.classes.add(token));
        this._sync();
    }

    remove(...tokens) {
        tokens.forEach((token) => this.classes.delete(token));
        this._sync();
    }

    toggle(token, force) {
        if (force === true) {
            this.classes.add(token);
            this._sync();
            return true;
        }
        if (force === false) {
            this.classes.delete(token);
            this._sync();
            return false;
        }
        if (this.classes.has(token)) {
            this.classes.delete(token);
            this._sync();
            return false;
        }
        this.classes.add(token);
        this._sync();
        return true;
    }

    contains(token) {
        return this.classes.has(token);
    }

    setFromString(value) {
        this.classes = new Set(String(value || '').split(/\s+/).filter(Boolean));
        this._sync();
    }

    _sync() {
        this.owner._className = Array.from(this.classes).join(' ');
    }
}

class FakeElement {
    constructor(tagName) {
        this.tagName = String(tagName).toUpperCase();
        this.children = [];
        this.parentNode = null;
        this.style = new FakeStyle();
        this.classList = new FakeClassList(this);
        this._className = '';
        this.attributes = new Map();
        this.listeners = new Map();
        this.dataset = {};
        this.title = '';
        this.textContent = '';
        this.tabIndex = 0;
    }

    get className() {
        return this._className;
    }

    set className(value) {
        this.classList.setFromString(value);
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    insertBefore(child, referenceNode) {
        child.parentNode = this;
        const index = this.children.indexOf(referenceNode);
        if (index === -1) {
            this.children.push(child);
        } else {
            this.children.splice(index, 0, child);
        }
        return child;
    }

    remove() {
        if (!this.parentNode) return;
        const index = this.parentNode.children.indexOf(this);
        if (index >= 0) {
            this.parentNode.children.splice(index, 1);
        }
        this.parentNode = null;
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
    }

    getAttribute(name) {
        return this.attributes.get(name) || null;
    }

    addEventListener(type, listener) {
        const listeners = this.listeners.get(type) || [];
        listeners.push(listener);
        this.listeners.set(type, listeners);
    }

    click() {
        const listeners = this.listeners.get('click') || [];
        listeners.forEach((listener) => listener({ currentTarget: this, target: this }));
    }
}

function createFakeTable() {
    const parent = new FakeElement('div');
    const table = new FakeElement('table');
    parent.appendChild(table);
    return { table, parent };
}

describe('Toolbar', () => {
    let Toolbar;
    let lastSurface;
    let surfaces;
    let downloadTableAsCsvMock;
    let openAdvancedFilterPanelMock;
    let openAdvancedSortPanelMock;
    let openStatisticsPanelMock;
    let getColumnValuesMock;

    beforeEach(async () => {
        vi.resetModules();
        lastSurface = null;
        surfaces = [];
        downloadTableAsCsvMock = vi.fn();
        openAdvancedFilterPanelMock = vi.fn();
        openAdvancedSortPanelMock = vi.fn();
        openStatisticsPanelMock = vi.fn();
        getColumnValuesMock = vi.fn(() => []);

        globalThis.document = {
            createElement: (tagName) => new FakeElement(tagName)
        };
        globalThis.requestAnimationFrame = (callback) => {
            callback();
            return 1;
        };

        vi.doMock('../../src/ui/filter-panel.js', () => ({
            openAdvancedFilterPanel: openAdvancedFilterPanelMock
        }));
        vi.doMock('../../src/ui/sort-panel.js', () => ({
            openAdvancedSortPanel: openAdvancedSortPanelMock
        }));
        vi.doMock('../../src/ui/statistics-panel.js', () => ({
            openStatisticsPanel: openStatisticsPanelMock
        }));
        vi.doMock('../../src/core/csv-export.js', () => ({
            downloadTableAsCsv: downloadTableAsCsvMock
        }));
        vi.doMock('../../src/core/table-data.js', () => ({
            getColumnValues: getColumnValuesMock
        }));
        vi.doMock('../../src/i18n/i18n.js', () => ({
            default: {
                t: vi.fn((key) => key)
            }
        }));
        vi.doMock('../../src/ui/shadow-ui.js', () => ({
            createShadowSurface: vi.fn(() => {
                const host = new FakeElement('anytable-shadow-host');
                const container = new FakeElement('div');
                lastSurface = {
                    host,
                    container,
                    destroy: vi.fn()
                };
                surfaces.push(lastSurface);
                return lastSurface;
            })
        }));

        ({ Toolbar } = await import('../../src/ui/toolbar.js'));
    });

    afterEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
        delete globalThis.document;
        delete globalThis.requestAnimationFrame;
    });

    function createToolbarDependencies(toolbarDefaultExpanded) {
        return {
            getToolbarDefaultExpanded: vi.fn(() => toolbarDefaultExpanded),
            forEachEnhancedTable: vi.fn(),
            setButtonIcon: vi.fn((button, iconKey) => {
                button.dataset.icon = iconKey;
            }),
            stateStore: {
                getAdvancedSortRules: vi.fn(() => []),
                getAdvancedFilterRules: vi.fn(() => null),
                getStatisticsRules: vi.fn(() => []),
                getFilterValues: vi.fn(() => ({})),
                getSortRules: vi.fn(() => [])
            },
            getColumnTitles: vi.fn(() => []),
            applyAdvancedSort: vi.fn(),
            applyAdvancedFilterRuleGroup: vi.fn(),
            applyStatistics: vi.fn(),
        };
    }

    it('renders expanded buttons by default and collapses them on toggle', () => {
        const dependencies = createToolbarDependencies(true);
        const toolbar = new Toolbar(dependencies);
        const { table } = createFakeTable();

        toolbar.createToolbar(table);

        const toolbarElement = lastSurface.container.children[0];
        const toggleButton = toolbarElement.children[0];
        const actions = toolbarElement.children[1];
        const buttons = actions.children;

        expect(toolbarElement.classList.contains('toolbar-collapsed')).toBe(false);
        expect(actions.style.width).toBe('192px');
        expect(actions.getAttribute('aria-hidden')).toBe('false');
        expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
        expect(Array.from(buttons, (button) => button.tabIndex)).toEqual([0, 0, 0, 0]);
        expect(Array.from(buttons, (button) => button.title)).toEqual([
            'columnControl.sort.advanced',
            'columnControl.filter.advanced',
            'columnControl.statistics',
            'columnControl.exportCsv'
        ]);

        toggleButton.click();

        expect(toolbarElement.classList.contains('toolbar-collapsed')).toBe(true);
        expect(actions.style.width).toBe('0px');
        expect(actions.getAttribute('aria-hidden')).toBe('true');
        expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
        expect(toggleButton.dataset.icon).toBe('toolbarExpand');
        expect(Array.from(buttons, (button) => button.tabIndex)).toEqual([-1, -1, -1, -1]);
    });

    it('respects a collapsed default and expands buttons after clicking toggle', () => {
        const dependencies = createToolbarDependencies(false);
        const toolbar = new Toolbar(dependencies);
        const { table } = createFakeTable();

        toolbar.createToolbar(table);

        const toolbarElement = lastSurface.container.children[0];
        const toggleButton = toolbarElement.children[0];
        const actions = toolbarElement.children[1];
        const buttons = actions.children;

        expect(toolbarElement.classList.contains('toolbar-collapsed')).toBe(true);
        expect(actions.style.width).toBe('0px');
        expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
        expect(toggleButton.dataset.icon).toBe('toolbarExpand');
        expect(Array.from(buttons, (button) => button.tabIndex)).toEqual([-1, -1, -1, -1]);

        toggleButton.click();

        expect(toolbarElement.classList.contains('toolbar-collapsed')).toBe(false);
        expect(actions.style.width).toBe('192px');
        expect(actions.getAttribute('aria-hidden')).toBe('false');
        expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
        expect(toggleButton.dataset.icon).toBe('toolbarCollapse');
        expect(Array.from(buttons, (button) => button.tabIndex)).toEqual([0, 0, 0, 0]);
    });

    it('exports the current table as csv when clicking the export button', () => {
        const dependencies = createToolbarDependencies(true);
        const toolbar = new Toolbar(dependencies);
        const { table } = createFakeTable();

        toolbar.createToolbar(table);

        const toolbarElement = lastSurface.container.children[0];
        const actions = toolbarElement.children[1];
        const exportButton = actions.children[3];

        exportButton.click();

        expect(downloadTableAsCsvMock).toHaveBeenCalledTimes(1);
        expect(downloadTableAsCsvMock).toHaveBeenCalledWith(table);
    });

    it('updates active button states when advanced rules and statistics change', () => {
        const dependencies = createToolbarDependencies(true);
        dependencies.stateStore.getAdvancedSortRules.mockReturnValue([{ column: 0, direction: 'asc', type: 'auto' }]);
        dependencies.stateStore.getAdvancedFilterRules.mockReturnValue({ id: 'group-1', children: [] });
        dependencies.stateStore.getStatisticsRules.mockReturnValue([{ column: 1, operation: 'sum' }]);
        const toolbar = new Toolbar(dependencies);
        const { table } = createFakeTable();

        toolbar.createToolbar(table);

        const toolbarElement = lastSurface.container.children[0];
        const actions = toolbarElement.children[1];
        const [sortButton, filterButton, statisticsButton] = actions.children;

        expect(sortButton.classList.contains('toolbar-active')).toBe(true);
        expect(filterButton.classList.contains('toolbar-active')).toBe(true);
        expect(statisticsButton.classList.contains('toolbar-active')).toBe(true);

        dependencies.stateStore.getAdvancedSortRules.mockReturnValue([]);
        dependencies.stateStore.getAdvancedFilterRules.mockReturnValue(null);
        dependencies.stateStore.getStatisticsRules.mockReturnValue([]);

        toolbar.refreshActiveStates(table);

        expect(sortButton.classList.contains('toolbar-active')).toBe(false);
        expect(filterButton.classList.contains('toolbar-active')).toBe(false);
        expect(statisticsButton.classList.contains('toolbar-active')).toBe(false);
    });

    it('opens the filter panel from basic filters and forwards the apply callback', () => {
        const dependencies = createToolbarDependencies(true);
        dependencies.getColumnTitles.mockReturnValue(['姓名', '部门', '城市']);
        dependencies.stateStore.getFilterValues.mockReturnValue({
            2: '上海',
            0: 'Alice',
            1: '',
            4: null
        });
        const toolbar = new Toolbar(dependencies);
        const { table } = createFakeTable();
        const appliedRuleGroup = { id: 'group-applied', children: [{ id: 'leaf-1' }] };

        toolbar.createToolbar(table);

        const filterButton = lastSurface.container.children[0].children[1].children[1];
        filterButton.click();

        expect(openAdvancedFilterPanelMock).toHaveBeenCalledTimes(1);
        expect(openAdvancedFilterPanelMock).toHaveBeenCalledWith(expect.objectContaining({
            columnTitles: ['姓名', '部门', '城市'],
            initialRuleGroup: expect.objectContaining({
                children: [
                    expect.objectContaining({
                        column: 0,
                        comparator: 'contains',
                        value: 'Alice',
                        operator: undefined
                    }),
                    expect.objectContaining({
                        column: 2,
                        comparator: 'contains',
                        value: '上海',
                        operator: 'AND'
                    })
                ]
            }),
            onApply: expect.any(Function)
        }));

        const [{ onApply }] = openAdvancedFilterPanelMock.mock.calls[0];
        onApply(appliedRuleGroup);

        expect(dependencies.applyAdvancedFilterRuleGroup).toHaveBeenCalledTimes(1);
        expect(dependencies.applyAdvancedFilterRuleGroup).toHaveBeenCalledWith(table, appliedRuleGroup);

        const advancedRuleGroup = { id: 'group-existing', children: [{ id: 'leaf-existing' }] };
        dependencies.stateStore.getAdvancedFilterRules.mockReturnValue(advancedRuleGroup);

        filterButton.click();

        expect(openAdvancedFilterPanelMock).toHaveBeenCalledTimes(2);
        expect(openAdvancedFilterPanelMock.mock.calls[1][0].initialRuleGroup).toBe(advancedRuleGroup);
    });

    it('opens the filter panel with a null initial rule group when no basic filters are active', () => {
        const dependencies = createToolbarDependencies(true);
        dependencies.getColumnTitles.mockReturnValue(['姓名', '部门', '城市']);
        dependencies.stateStore.getFilterValues.mockReturnValue({
            0: '',
            1: null,
            2: undefined
        });
        const toolbar = new Toolbar(dependencies);
        const { table } = createFakeTable();

        toolbar.createToolbar(table);

        const filterButton = lastSurface.container.children[0].children[1].children[1];
        filterButton.click();

        expect(openAdvancedFilterPanelMock).toHaveBeenCalledTimes(1);
        expect(openAdvancedFilterPanelMock.mock.calls[0][0]).toEqual(expect.objectContaining({
            initialRuleGroup: null
        }));
    });

    it('opens sort and statistics panels and forwards their callbacks', () => {
        const dependencies = createToolbarDependencies(true);
        dependencies.getColumnTitles.mockReturnValue(['姓名', '分数', '城市']);
        dependencies.stateStore.getSortRules.mockReturnValue([{ column: 1, direction: 'desc', type: 'number' }]);
        dependencies.stateStore.getStatisticsRules.mockReturnValue([{ column: 2, operation: 'sum' }]);
        getColumnValuesMock.mockReturnValue(['10', '20']);
        const toolbar = new Toolbar(dependencies);
        const { table } = createFakeTable();
        const nextSortRules = [{ column: 2, direction: 'asc', type: 'text' }];
        const nextStatisticsRules = [{ column: 1, operation: 'avg' }];

        toolbar.createToolbar(table);

        const actions = lastSurface.container.children[0].children[1];
        const sortButton = actions.children[0];
        const statisticsButton = actions.children[2];

        sortButton.click();

        expect(openAdvancedSortPanelMock).toHaveBeenCalledTimes(1);
        expect(openAdvancedSortPanelMock).toHaveBeenCalledWith(expect.objectContaining({
            columnTitles: ['姓名', '分数', '城市'],
            initialRules: [{ column: 1, direction: 'desc', type: 'number' }],
            tableElement: table,
            getColumnValues: expect.any(Function),
            onApply: expect.any(Function)
        }));

        const [{ getColumnValues, onApply: onSortApply }] = openAdvancedSortPanelMock.mock.calls[0];
        expect(getColumnValues(2)).toEqual(['10', '20']);
        expect(getColumnValuesMock).toHaveBeenCalledWith(table, 2);

        onSortApply(nextSortRules);

        expect(dependencies.applyAdvancedSort).toHaveBeenCalledTimes(1);
        expect(dependencies.applyAdvancedSort).toHaveBeenCalledWith(table, nextSortRules);

        dependencies.stateStore.getAdvancedSortRules.mockReturnValue([{ column: 0, direction: 'asc', type: 'auto' }]);
        sortButton.click();
        expect(openAdvancedSortPanelMock.mock.calls[1][0].initialRules).toEqual([
            { column: 0, direction: 'asc', type: 'auto' }
        ]);

        statisticsButton.click();

        expect(openStatisticsPanelMock).toHaveBeenCalledTimes(1);
        expect(openStatisticsPanelMock).toHaveBeenCalledWith(expect.objectContaining({
            columnTitles: ['姓名', '分数', '城市'],
            initialRules: [{ column: 2, operation: 'sum' }],
            onApply: expect.any(Function)
        }));

        const [{ onApply: onStatisticsApply }] = openStatisticsPanelMock.mock.calls[0];
        onStatisticsApply(nextStatisticsRules);

        expect(dependencies.applyStatistics).toHaveBeenCalledTimes(1);
        expect(dependencies.applyStatistics).toHaveBeenCalledWith(table, nextStatisticsRules);
    });

    it('supports bulk expand collapse, ignores duplicate creation, and destroys removed toolbars', () => {
        const dependencies = createToolbarDependencies(true);
        const toolbar = new Toolbar(dependencies);
        const first = createFakeTable();
        const second = createFakeTable();
        dependencies.forEachEnhancedTable.mockImplementation((callback) => {
            callback(first.table);
            callback(second.table);
        });

        toolbar.removeToolbar(first.table);
        toolbar.createToolbar(new FakeElement('table'));
        expect(surfaces).toHaveLength(0);

        toolbar.createToolbar(first.table);
        toolbar.createToolbar(second.table);
        toolbar.createToolbar(first.table);

        expect(surfaces).toHaveLength(2);
        expect(first.parent.children).toHaveLength(2);
        expect(second.parent.children).toHaveLength(2);

        toolbar.setAllExpanded(false);

        const firstToolbarElement = surfaces[0].container.children[0];
        const secondToolbarElement = surfaces[1].container.children[0];
        expect(firstToolbarElement.classList.contains('toolbar-collapsed')).toBe(true);
        expect(secondToolbarElement.classList.contains('toolbar-collapsed')).toBe(true);

        toolbar.setAllExpanded(true);

        expect(firstToolbarElement.classList.contains('toolbar-collapsed')).toBe(false);
        expect(secondToolbarElement.classList.contains('toolbar-collapsed')).toBe(false);

        toolbar.removeToolbar(first.table);
        toolbar.removeToolbar(first.table);

        expect(surfaces[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('recreates a toolbar while preserving the current expanded state', () => {
        const dependencies = createToolbarDependencies(true);
        const toolbar = new Toolbar(dependencies);
        const { table } = createFakeTable();

        toolbar.createToolbar(table);

        const firstToolbarElement = lastSurface.container.children[0];
        const firstToggleButton = firstToolbarElement.children[0];
        firstToggleButton.click();

        const firstSurface = lastSurface;
        toolbar.recreateToolbar(table);

        expect(firstSurface.destroy).toHaveBeenCalledTimes(1);
        const recreatedToolbarElement = lastSurface.container.children[0];
        const recreatedToggleButton = recreatedToolbarElement.children[0];
        const recreatedActions = recreatedToolbarElement.children[1];

        expect(recreatedToolbarElement.classList.contains('toolbar-collapsed')).toBe(true);
        expect(recreatedActions.style.width).toBe('0px');
        expect(recreatedToggleButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('ignores stale toggle clicks after removal and treats unknown tables as safe no-ops', () => {
        const dependencies = createToolbarDependencies(true);
        const toolbar = new Toolbar(dependencies);
        const { table } = createFakeTable();
        const unknownTable = createFakeTable().table;

        toolbar.createToolbar(table);

        const toolbarElement = lastSurface.container.children[0];
        const toggleButton = toolbarElement.children[0];

        toolbar.removeToolbar(table);

        expect(() => toggleButton.click()).not.toThrow();
        expect(surfaces[0].destroy).toHaveBeenCalledTimes(1);

        dependencies.stateStore.getAdvancedSortRules.mockClear();
        dependencies.stateStore.getAdvancedFilterRules.mockClear();
        dependencies.stateStore.getStatisticsRules.mockClear();

        expect(() => toolbar.updateTexts(unknownTable)).not.toThrow();
        expect(() => toolbar.refreshActiveStates(unknownTable)).not.toThrow();
        expect(() => toolbar.setExpanded(unknownTable, false)).not.toThrow();

        expect(dependencies.stateStore.getAdvancedSortRules).not.toHaveBeenCalled();
        expect(dependencies.stateStore.getAdvancedFilterRules).not.toHaveBeenCalled();
        expect(dependencies.stateStore.getStatisticsRules).not.toHaveBeenCalled();
    });
});
