// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { SortController } from '../../src/controllers/sort-controller.js';
import { TableStateStore } from '../../src/state/table-state.js';

function mountTable(html) {
    document.body.innerHTML = html.trim();
    return document.querySelector('table');
}

function getBodyRowNames(table) {
    return Array.from(table.tBodies[0].rows).map((row) => row.cells[0].textContent.trim());
}

function createSortController(table) {
    const stateStore = new TableStateStore();
    const enhancedTables = new Set([table]);
    const controller = new SortController({
        enhancedTables,
        stateStore,
        controlPanelManager: {
            getHeaderControl() {
                return null;
            }
        },
        toolbar: {
            refreshActiveStates() {}
        },
        isMultiColumnSortEnabled: () => false,
        enableMultiColumnSort() {},
        setSortButtonIcon() {}
    });

    return { controller, stateStore };
}

describe('SortController 真实 DOM 交互', () => {
    it('在动态增删行后恢复无排序时保留当前真实行集合', () => {
        const table = mountTable(`
            <table>
                <tbody>
                    <tr><td>Alice</td><td>30</td></tr>
                    <tr><td>Bob</td><td>10</td></tr>
                    <tr><td>Carol</td><td>20</td></tr>
                </tbody>
            </table>
        `);
        const { controller } = createSortController(table);

        controller.sortTable(table, 1);
        expect(getBodyRowNames(table)).toEqual(['Bob', 'Carol', 'Alice']);

        const tbody = table.tBodies[0];
        const insertedRow = document.createElement('tr');
        insertedRow.innerHTML = '<td>Dana</td><td>25</td>';
        tbody.appendChild(insertedRow);

        const removedRow = Array.from(tbody.rows).find((row) => row.cells[0].textContent.trim() === 'Carol');
        removedRow.remove();

        controller.syncOriginalRowOrder(table);
        controller.applySortRules(table, []);

        expect(getBodyRowNames(table)).toEqual(['Alice', 'Bob', 'Dana']);
        expect(Array.from(tbody.rows).some((row) => row.cells[0].textContent.trim() === 'Carol')).toBe(false);
    });
});
