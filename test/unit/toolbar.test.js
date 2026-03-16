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
    let downloadTableAsCsvMock;

    beforeEach(async () => {
        vi.resetModules();
        lastSurface = null;
        downloadTableAsCsvMock = vi.fn();

        globalThis.document = {
            createElement: (tagName) => new FakeElement(tagName)
        };
        globalThis.requestAnimationFrame = (callback) => {
            callback();
            return 1;
        };

        vi.doMock('../../src/ui/filter-panel.js', () => ({
            openAdvancedFilterPanel: vi.fn()
        }));
        vi.doMock('../../src/ui/sort-panel.js', () => ({
            openAdvancedSortPanel: vi.fn()
        }));
        vi.doMock('../../src/ui/statistics-panel.js', () => ({
            openStatisticsPanel: vi.fn()
        }));
        vi.doMock('../../src/core/csv-export.js', () => ({
            downloadTableAsCsv: downloadTableAsCsvMock
        }));
        vi.doMock('../../src/core/table-data.js', () => ({
            getColumnValues: vi.fn(() => [])
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

    function createEnhancer(toolbarDefaultExpanded) {
        return {
            toolbarDefaultExpanded,
            setButtonIcon: vi.fn((button, iconKey) => {
                button.dataset.icon = iconKey;
            }),
            stateStore: {
                getAdvancedSortRules: vi.fn(() => []),
                getAdvancedFilterRules: vi.fn(() => null),
                getStatisticsRules: vi.fn(() => [])
            },
            getColumnTitles: vi.fn(() => []),
            applyAdvancedSort: vi.fn(),
            applyAllFilters: vi.fn(),
            applyStatistics: vi.fn(),
            enhancedTables: new Set()
        };
    }

    it('renders expanded buttons by default and collapses them on toggle', () => {
        const enhancer = createEnhancer(true);
        const toolbar = new Toolbar(enhancer);
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
        const enhancer = createEnhancer(false);
        const toolbar = new Toolbar(enhancer);
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
        const enhancer = createEnhancer(true);
        const toolbar = new Toolbar(enhancer);
        const { table } = createFakeTable();

        toolbar.createToolbar(table);

        const toolbarElement = lastSurface.container.children[0];
        const actions = toolbarElement.children[1];
        const exportButton = actions.children[3];

        exportButton.click();

        expect(downloadTableAsCsvMock).toHaveBeenCalledTimes(1);
        expect(downloadTableAsCsvMock).toHaveBeenCalledWith(table);
    });
});
