import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createClassList() {
    const classes = new Set();
    return {
        add: (...tokens) => tokens.forEach((token) => classes.add(token)),
        remove: (...tokens) => tokens.forEach((token) => classes.delete(token)),
        contains: (token) => classes.has(token)
    };
}

function createMockTable() {
    const rows = [{ id: 'row-1' }, { id: 'row-2' }];
    const tbody = {
        getElementsByTagName: vi.fn((tagName) => (tagName === 'tr' ? rows : []))
    };

    return {
        classList: createClassList(),
        getElementsByTagName: vi.fn((tagName) => {
            if (tagName === 'tbody') {
                return [tbody];
            }
            return [];
        })
    };
}

describe('content init', () => {
    let toolbarCalls;
    let storageGetMock;
    let setupMessageHandlerMock;
    let preloadShadowStylesMock;

    beforeEach(() => {
        vi.resetModules();
        toolbarCalls = [];
        storageGetMock = vi.fn();
        setupMessageHandlerMock = vi.fn();
        preloadShadowStylesMock = vi.fn().mockResolvedValue('');
    });

    afterEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
        delete globalThis.chrome;
        delete globalThis.window;
        delete globalThis.document;
        delete globalThis.MutationObserver;
    });

    it('reads toolbarDefaultExpanded before auto-enhancing tables', async () => {
        const table = createMockTable();

        storageGetMock.mockResolvedValue({
            autoEnhance: true,
            multiColumnSort: false,
            toolbarDefaultExpanded: false
        });

        globalThis.chrome = {
            storage: {
                local: {
                    get: storageGetMock,
                    set: vi.fn()
                }
            }
        };
        globalThis.window = {
            addEventListener: vi.fn()
        };
        globalThis.document = {
            body: {},
            getElementsByTagName: vi.fn((tagName) => (tagName === 'table' ? [table] : []))
        };
        globalThis.MutationObserver = class {
            observe() {}
        };

        vi.doMock('../../src/i18n/i18n.js', () => ({
            default: {
                init: vi.fn().mockResolvedValue(),
                t: vi.fn((key) => key)
            }
        }));
        vi.doMock('../../src/state/table-state.js', () => ({
            TableStateStore: class {
                constructor() {
                    this.originalRowOrderByTable = new Map();
                    this.sortRulesByTable = new Map();
                }

                setOriginalRowOrder(tableElement, rowOrderState) {
                    this.originalRowOrderByTable.set(tableElement, rowOrderState);
                }

                getOriginalRowOrder(tableElement) {
                    return this.originalRowOrderByTable.get(tableElement) || null;
                }

                setSortRules(tableElement, rules) {
                    this.sortRulesByTable.set(tableElement, rules);
                }

                getSortRules(tableElement) {
                    return this.sortRulesByTable.get(tableElement) || [];
                }

                getAdvancedSortRules() {
                    return [];
                }

                getAdvancedFilterRules() {
                    return null;
                }

                getStatisticsRules() {
                    return [];
                }

                getFilterValues() {
                    return {};
                }

                clearTable() {}
            }
        }));
        vi.doMock('../../src/core/filter-engine.js', () => ({
            applyCombinedFilters: vi.fn()
        }));
        vi.doMock('../../src/core/sort-engine.js', () => ({
            buildNextSortRules: vi.fn(() => ({ rules: [], direction: 'none' })),
            normalizeAdvancedSortRules: vi.fn((rules) => rules),
            sortRowsByRules: vi.fn((rows) => rows)
        }));
        vi.doMock('../../src/core/statistics-engine.js', () => ({
            computeStatisticsData: vi.fn(() => [])
        }));
        vi.doMock('../../src/core/table-detector.js', () => ({
            isLikelyDataTable: vi.fn(() => true)
        }));
        vi.doMock('../../src/core/table-structure.js', () => ({
            getTableColumnCount: vi.fn(() => 0),
            getTableColumnTitles: vi.fn(() => [])
        }));
        vi.doMock('../../src/ui/statistics-renderer.js', () => ({
            renderStatisticsRows: vi.fn(),
            removeStatisticsRows: vi.fn()
        }));
        vi.doMock('../../src/picking-mode.js', () => ({
            PickingMode: class {
                startPicking() {}
                clearSelection() {}
            }
        }));
        vi.doMock('../../src/control-panel-manager.js', () => ({
            ControlPanelManager: class {
                attachTableControls() {}
                updateTexts() {}
                removeTableControls() {}
                refreshFilterButtons() {}
                setFilterInputsDisabledState() {}
                getHeaderControl() {
                    return null;
                }
            }
        }));
        vi.doMock('../../src/ui/shadow-ui.js', () => ({
            preloadShadowStyles: preloadShadowStylesMock
        }));
        vi.doMock('../../src/ui/toolbar.js', () => ({
            Toolbar: class {
                constructor(enhancer) {
                    this.enhancer = enhancer;
                }

                createToolbar(tableElement) {
                    toolbarCalls.push({
                        table: tableElement,
                        toolbarDefaultExpanded: this.enhancer.toolbarDefaultExpanded
                    });
                }

                updateTexts() {}
                refreshActiveStates() {}
                removeToolbar() {}
                setAllExpanded() {}
            }
        }));
        vi.doMock('../../src/message-handler.js', () => ({
            setupMessageHandler: setupMessageHandlerMock
        }));

        await import('../../src/content.js');
        await Promise.resolve();
        await Promise.resolve();

        expect(storageGetMock).toHaveBeenCalledWith(['autoEnhance', 'multiColumnSort', 'toolbarDefaultExpanded']);
        expect(preloadShadowStylesMock).toHaveBeenCalledOnce();
        expect(setupMessageHandlerMock).toHaveBeenCalledOnce();
        expect(toolbarCalls).toEqual([{
            table,
            toolbarDefaultExpanded: false
        }]);
        expect(table.classList.contains('anytable-enhanced')).toBe(true);
    });
});
