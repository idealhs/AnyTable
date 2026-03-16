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
});
