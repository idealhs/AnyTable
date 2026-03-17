import { afterEach, describe, expect, it, vi } from 'vitest';
import { TableObserver } from '../../src/controllers/table-observer.js';

function createElement(nodeName, options = {}) {
    return {
        nodeName,
        nodeType: 1,
        parentNode: options.parentNode || null,
        querySelectorAll: options.querySelectorAll || (() => []),
        ...options
    };
}

function createTableDescendant(table, nodeName = 'TD') {
    const tbody = createElement('TBODY', { parentNode: table });
    const tr = createElement('TR', { parentNode: tbody });
    return createElement(nodeName, { parentNode: tr });
}

function createObserver(overrides = {}) {
    const dependencies = {
        isAutoEnhanceEnabled: vi.fn(() => true),
        isEnhancedTable: vi.fn(() => false),
        autoEnhanceTables: vi.fn(),
        removeEnhancement: vi.fn(),
        syncOriginalRowOrder: vi.fn(),
        onTableRemoved: vi.fn(),
        ...overrides
    };

    return {
        observer: new TableObserver(dependencies),
        dependencies
    };
}

describe('TableObserver', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        delete globalThis.MutationObserver;
    });

    it('auto-enhances added tables and syncs row order for affected enhanced tables', () => {
        const existingTable = createElement('TABLE');
        const addedTable = createElement('TABLE');
        const enhancedTables = new Set([existingTable]);
        const autoEnhanceTables = vi.fn((tables) => {
            Array.from(tables || []).forEach((table) => enhancedTables.add(table));
        });
        const syncOriginalRowOrder = vi.fn();
        const observer = new TableObserver({
            isAutoEnhanceEnabled: () => true,
            isEnhancedTable: (table) => enhancedTables.has(table),
            autoEnhanceTables,
            removeEnhancement: vi.fn(),
            syncOriginalRowOrder,
            onTableRemoved: vi.fn()
        });

        observer.handleMutations([{
            target: existingTable,
            addedNodes: [addedTable],
            removedNodes: []
        }]);

        expect(autoEnhanceTables).toHaveBeenCalledTimes(2);
        expect(autoEnhanceTables.mock.calls[0][0]).toEqual([addedTable]);
        expect(autoEnhanceTables.mock.calls[1][0]).toEqual([]);
        expect(syncOriginalRowOrder).toHaveBeenCalledWith(existingTable);
        expect(syncOriginalRowOrder).toHaveBeenCalledWith(addedTable);
    });

    it('removes enhancement for deleted tables and notifies selection cleanup', () => {
        const removedTable = createElement('TABLE');
        const removedContainer = createElement('DIV', {
            querySelectorAll: () => [removedTable]
        });
        const removeEnhancement = vi.fn();
        const onTableRemoved = vi.fn();
        const observer = new TableObserver({
            isAutoEnhanceEnabled: () => false,
            isEnhancedTable: () => false,
            autoEnhanceTables: vi.fn(),
            removeEnhancement,
            syncOriginalRowOrder: vi.fn(),
            onTableRemoved
        });

        observer.handleMutations([{
            target: createElement('DIV'),
            addedNodes: [],
            removedNodes: [removedContainer]
        }]);

        expect(removeEnhancement).toHaveBeenCalledWith(removedTable);
        expect(onTableRemoved).toHaveBeenCalledWith(removedTable);
    });

    it('creates and starts a MutationObserver when observe is called', () => {
        const target = createElement('DIV');
        const observeSpy = vi.fn();
        const disconnectSpy = vi.fn();
        let mutationCallback = null;
        const { observer } = createObserver();
        const handleMutationsSpy = vi.spyOn(observer, 'handleMutations');

        globalThis.MutationObserver = vi.fn(function MutationObserver(callback) {
            mutationCallback = callback;
            this.observe = observeSpy;
            this.disconnect = disconnectSpy;
        });

        const instance = observer.observe(target);

        expect(globalThis.MutationObserver).toHaveBeenCalledTimes(1);
        expect(observeSpy).toHaveBeenCalledWith(target, {
            childList: true,
            subtree: true
        });
        expect(instance).toBe(observer.observer);
        expect(typeof mutationCallback).toBe('function');

        mutationCallback([]);

        expect(handleMutationsSpy).toHaveBeenCalledWith([]);
        expect(disconnectSpy).not.toHaveBeenCalled();
    });

    it('disconnects the active observer and clears the reference safely', () => {
        const target = createElement('DIV');
        const observeSpy = vi.fn();
        const disconnectSpy = vi.fn();
        const { observer } = createObserver();

        globalThis.MutationObserver = vi.fn(function MutationObserver() {
            this.observe = observeSpy;
            this.disconnect = disconnectSpy;
        });

        expect(() => observer.disconnect()).not.toThrow();

        observer.observe(target);
        observer.disconnect();

        expect(observeSpy).toHaveBeenCalledTimes(1);
        expect(disconnectSpy).toHaveBeenCalledTimes(1);
        expect(observer.observer).toBeNull();
    });

    it('skips non-element added nodes without enhancing or syncing tables', () => {
        const textNode = {
            nodeType: 3,
            parentNode: null
        };
        const { observer, dependencies } = createObserver();

        expect(() => observer.handleMutations([{
            target: createElement('DIV'),
            addedNodes: [textNode],
            removedNodes: []
        }])).not.toThrow();

        expect(dependencies.autoEnhanceTables).not.toHaveBeenCalled();
        expect(dependencies.syncOriginalRowOrder).not.toHaveBeenCalled();
    });

    it('does not auto-enhance added tables when auto enhance is disabled, but still syncs affected enhanced tables', () => {
        const enhancedTable = createElement('TABLE');
        const nestedTable = createElement('TABLE');
        const directAddedTable = createElement('TABLE');
        const addedCell = createTableDescendant(enhancedTable);
        const container = createElement('DIV', {
            querySelectorAll: () => [nestedTable]
        });
        const { observer, dependencies } = createObserver({
            isAutoEnhanceEnabled: vi.fn(() => false),
            isEnhancedTable: vi.fn((table) => table === enhancedTable)
        });

        observer.handleMutations([{
            target: createElement('DIV'),
            addedNodes: [directAddedTable, container, addedCell],
            removedNodes: []
        }]);

        expect(dependencies.autoEnhanceTables).not.toHaveBeenCalled();
        expect(dependencies.syncOriginalRowOrder).toHaveBeenCalledTimes(1);
        expect(dependencies.syncOriginalRowOrder).toHaveBeenCalledWith(enhancedTable);
    });

    it('auto-enhances nested tables inside non-table containers and syncs already enhanced nested tables', () => {
        const enhancedNestedTable = createElement('TABLE');
        const newNestedTable = createElement('TABLE');
        const nestedTables = [newNestedTable, enhancedNestedTable];
        const container = createElement('DIV', {
            querySelectorAll: () => nestedTables
        });
        const { observer, dependencies } = createObserver({
            isEnhancedTable: vi.fn((table) => table === enhancedNestedTable)
        });

        observer.handleMutations([{
            target: createElement('DIV'),
            addedNodes: [container],
            removedNodes: []
        }]);

        expect(dependencies.autoEnhanceTables).toHaveBeenCalledTimes(1);
        expect(dependencies.autoEnhanceTables).toHaveBeenCalledWith(nestedTables);
        expect(dependencies.syncOriginalRowOrder).toHaveBeenCalledTimes(1);
        expect(dependencies.syncOriginalRowOrder).toHaveBeenCalledWith(enhancedNestedTable);
    });

    it('syncs the closest enhanced table when the mutation target is a nested table descendant', () => {
        const enhancedTable = createElement('TABLE');
        const mutationTarget = createTableDescendant(enhancedTable);
        const { observer, dependencies } = createObserver({
            isAutoEnhanceEnabled: vi.fn(() => false),
            isEnhancedTable: vi.fn((table) => table === enhancedTable)
        });

        observer.handleMutations([{
            target: mutationTarget,
            addedNodes: [],
            removedNodes: []
        }]);

        expect(dependencies.syncOriginalRowOrder).toHaveBeenCalledTimes(1);
        expect(dependencies.syncOriginalRowOrder).toHaveBeenCalledWith(enhancedTable);
    });

    it('removes enhancement when a removed node is directly a table', () => {
        const removedTable = createElement('TABLE');
        const { observer, dependencies } = createObserver();

        observer.handleMutations([{
            target: createElement('DIV'),
            addedNodes: [],
            removedNodes: [removedTable]
        }]);

        expect(dependencies.removeEnhancement).toHaveBeenCalledTimes(1);
        expect(dependencies.removeEnhancement).toHaveBeenCalledWith(removedTable);
        expect(dependencies.onTableRemoved).toHaveBeenCalledTimes(1);
        expect(dependencies.onTableRemoved).toHaveBeenCalledWith(removedTable);
    });

    it('removes enhancement safely even when onTableRemoved is not provided', () => {
        const removedTable = createElement('TABLE');
        const { observer, dependencies } = createObserver({
            onTableRemoved: undefined
        });

        expect(() => observer.handleMutations([{
            target: createElement('DIV'),
            addedNodes: [],
            removedNodes: [removedTable]
        }])).not.toThrow();

        expect(dependencies.removeEnhancement).toHaveBeenCalledTimes(1);
        expect(dependencies.removeEnhancement).toHaveBeenCalledWith(removedTable);
    });

    it('syncs the same enhanced table only once across multiple matching mutations', () => {
        const enhancedTable = createElement('TABLE');
        const firstCell = createTableDescendant(enhancedTable);
        const secondCell = createTableDescendant(enhancedTable);
        const { observer, dependencies } = createObserver({
            isAutoEnhanceEnabled: vi.fn(() => false),
            isEnhancedTable: vi.fn((table) => table === enhancedTable)
        });

        observer.handleMutations([
            {
                target: firstCell,
                addedNodes: [secondCell],
                removedNodes: []
            },
            {
                target: enhancedTable,
                addedNodes: [firstCell],
                removedNodes: []
            }
        ]);

        expect(dependencies.syncOriginalRowOrder).toHaveBeenCalledTimes(1);
        expect(dependencies.syncOriginalRowOrder).toHaveBeenCalledWith(enhancedTable);
    });
});
