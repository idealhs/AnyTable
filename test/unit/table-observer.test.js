import { describe, expect, it, vi } from 'vitest';
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

describe('TableObserver', () => {
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
});
