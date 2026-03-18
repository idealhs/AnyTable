// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
    clearRowFilterHidden,
    isRowHiddenByFilter,
    isRowHiddenByHost,
    isRowVisible,
    markRowAsFilterHidden
} from '../../src/core/row-visibility.js';

describe('row-visibility', () => {
    it('marks and clears plugin-hidden rows without overwriting host inline display', () => {
        const row = document.createElement('tr');

        expect(isRowVisible(row)).toBe(true);

        markRowAsFilterHidden(row);

        expect(isRowHiddenByFilter(row)).toBe(true);
        expect(row.getAttribute('data-anytable-filter-hidden')).toBe('true');
        expect(isRowVisible(row)).toBe(false);
        expect(row.style.display).toBe('');

        clearRowFilterHidden(row);

        expect(isRowHiddenByFilter(row)).toBe(false);
        expect(row.hasAttribute('data-anytable-filter-hidden')).toBe(false);
        expect(isRowVisible(row)).toBe(true);
    });

    it('keeps host-hidden semantics after the plugin clears its own hidden flag', () => {
        const row = document.createElement('tr');
        row.style.display = 'none';

        expect(isRowHiddenByHost(row)).toBe(true);
        expect(isRowVisible(row)).toBe(false);

        markRowAsFilterHidden(row);
        clearRowFilterHidden(row);

        expect(isRowHiddenByFilter(row)).toBe(false);
        expect(isRowHiddenByHost(row)).toBe(true);
        expect(row.style.display).toBe('none');
        expect(isRowVisible(row)).toBe(false);
    });

    it('injects the global row visibility stylesheet only once', () => {
        const firstRow = document.createElement('tr');
        const secondRow = document.createElement('tr');

        markRowAsFilterHidden(firstRow);
        markRowAsFilterHidden(secondRow);

        const styles = document.querySelectorAll('#anytable-row-visibility-style');
        expect(styles).toHaveLength(1);
        expect(styles[0].textContent).toContain('[data-anytable-filter-hidden="true"]');
    });
});
