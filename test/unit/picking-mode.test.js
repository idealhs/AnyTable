import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PickingMode } from '../../src/picking-mode.js';

function createClassList() {
    const classes = new Set();
    return {
        add: (...tokens) => tokens.forEach((token) => classes.add(token)),
        remove: (...tokens) => tokens.forEach((token) => classes.delete(token)),
        contains: (token) => classes.has(token)
    };
}

function createStyle() {
    return {
        cursor: '',
        outline: '',
        outlineOffset: '',
        removeProperty(name) {
            this[name] = '';
        }
    };
}

function createTable() {
    return {
        tagName: 'TABLE',
        parentElement: null,
        classList: createClassList(),
        style: createStyle()
    };
}

describe('PickingMode', () => {
    let eventListeners;
    let tables;

    beforeEach(() => {
        eventListeners = {
            add: [],
            remove: []
        };
        tables = [];

        globalThis.document = {
            addEventListener: vi.fn((type, listener) => {
                eventListeners.add.push({ type, listener });
            }),
            removeEventListener: vi.fn((type, listener) => {
                eventListeners.remove.push({ type, listener });
            }),
            querySelectorAll: vi.fn((selector) => {
                if (selector !== '.anytable-pickable') {
                    return [];
                }
                return tables.filter((table) => table.classList.contains('anytable-pickable'));
            })
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete globalThis.document;
    });

    it('enhances one table and exits picking mode after a single click', () => {
        const table = createTable();
        table.classList.add('anytable-pickable');
        tables.push(table);

        const enhancedTables = new Set();
        const selectedTables = new Set();
        const enhanceTable = vi.fn((tableElement) => {
            enhancedTables.add(tableElement);
            tableElement.classList.add('anytable-enhanced');
        });
        const removeEnhancement = vi.fn();
        const pickingMode = new PickingMode({
            enhancedTables,
            selectedTables,
            enhanceTable,
            removeEnhancement
        });

        pickingMode.startPicking();

        const event = {
            target: table,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        };

        pickingMode.handleClick(event);

        expect(enhanceTable).toHaveBeenCalledWith(table);
        expect(removeEnhancement).not.toHaveBeenCalled();
        expect(selectedTables.has(table)).toBe(true);
        expect(table.classList.contains('anytable-picked')).toBe(true);
        expect(table.classList.contains('anytable-pickable')).toBe(false);
        expect(table.style.outline).toBe('2px solid #4a90e2');
        expect(table.style.cursor).toBe('');
        expect(pickingMode.isPicking).toBe(false);
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(event.stopPropagation).toHaveBeenCalledOnce();
        expect(eventListeners.remove.map(({ type }) => type)).toEqual(['mousemove', 'click', 'keydown']);
    });

    it('removes enhancement for an already enhanced table and exits picking mode', () => {
        const table = createTable();
        table.classList.add('anytable-pickable', 'anytable-picked', 'anytable-enhanced');
        tables.push(table);

        const enhancedTables = new Set([table]);
        const selectedTables = new Set([table]);
        const enhanceTable = vi.fn();
        const removeEnhancement = vi.fn((tableElement) => {
            enhancedTables.delete(tableElement);
            tableElement.classList.remove('anytable-enhanced');
        });
        const pickingMode = new PickingMode({
            enhancedTables,
            selectedTables,
            enhanceTable,
            removeEnhancement
        });

        pickingMode.startPicking();

        const event = {
            target: table,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        };

        pickingMode.handleClick(event);

        expect(removeEnhancement).toHaveBeenCalledWith(table);
        expect(enhanceTable).not.toHaveBeenCalled();
        expect(selectedTables.has(table)).toBe(false);
        expect(table.classList.contains('anytable-picked')).toBe(false);
        expect(table.classList.contains('anytable-pickable')).toBe(false);
        expect(table.classList.contains('anytable-enhanced')).toBe(false);
        expect(table.style.outline).toBe('');
        expect(table.style.cursor).toBe('');
        expect(pickingMode.isPicking).toBe(false);
        expect(eventListeners.remove.map(({ type }) => type)).toEqual(['mousemove', 'click', 'keydown']);
    });

    it('highlights the table under the cursor and clears previous pickable styles', () => {
        const previousTable = createTable();
        previousTable.classList.add('anytable-pickable');

        const currentTable = createTable();
        const nestedCell = {
            tagName: 'TD',
            parentElement: currentTable
        };
        tables.push(previousTable, currentTable);

        const pickingMode = new PickingMode({
            enhancedTables: new Set(),
            selectedTables: new Set(),
            enhanceTable: vi.fn(),
            removeEnhancement: vi.fn()
        });

        pickingMode.startPicking();
        pickingMode.syncHighlightStyles(previousTable);
        pickingMode.handleMouseMove({target: nestedCell});

        expect(previousTable.classList.contains('anytable-pickable')).toBe(false);
        expect(previousTable.style.outline).toBe('');
        expect(currentTable.classList.contains('anytable-pickable')).toBe(true);
        expect(currentTable.style.cursor).toBe('pointer');
        expect(currentTable.style.outline).toBe('2px dashed #4a90e2');
        expect(currentTable.style.outlineOffset).toBe('2px');
    });

    it('does not register duplicate listeners and stops picking on Escape', () => {
        const pickingMode = new PickingMode({
            enhancedTables: new Set(),
            selectedTables: new Set(),
            enhanceTable: vi.fn(),
            removeEnhancement: vi.fn()
        });

        pickingMode.startPicking();
        pickingMode.startPicking();
        expect(eventListeners.add.map(({type}) => type)).toEqual(['mousemove', 'click', 'keydown']);

        pickingMode.handleKeyDown({key: 'Escape'});

        expect(pickingMode.isPicking).toBe(false);
        expect(eventListeners.remove.map(({type}) => type)).toEqual(['mousemove', 'click', 'keydown']);
    });

    it('clears all selected tables and removes their enhancement', () => {
        const firstTable = createTable();
        const secondTable = createTable();
        firstTable.classList.add('anytable-picked');
        secondTable.classList.add('anytable-picked');
        tables.push(firstTable, secondTable);

        const selectedTables = new Set([firstTable, secondTable]);
        const removeEnhancement = vi.fn();
        const pickingMode = new PickingMode({
            enhancedTables: new Set([firstTable, secondTable]),
            selectedTables,
            enhanceTable: vi.fn(),
            removeEnhancement
        });

        pickingMode.startPicking();
        pickingMode.clearSelection();

        expect(removeEnhancement).toHaveBeenCalledTimes(2);
        expect(removeEnhancement).toHaveBeenCalledWith(firstTable);
        expect(removeEnhancement).toHaveBeenCalledWith(secondTable);
        expect(selectedTables.size).toBe(0);
        expect(firstTable.classList.contains('anytable-picked')).toBe(false);
        expect(secondTable.classList.contains('anytable-picked')).toBe(false);
        expect(pickingMode.isPicking).toBe(false);
    });
});
