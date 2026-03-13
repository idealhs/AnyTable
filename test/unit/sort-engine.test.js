import { describe, it, expect } from 'vitest';
import {
    getNextSortDirection,
    buildNextSortRules,
    normalizeAdvancedSortRules,
    sortRowsByRules
} from '../../src/core/sort-engine.js';

function mockRow(...values) {
    return { cells: values.map(v => ({ textContent: String(v) })) };
}

// ─── getNextSortDirection ───────────────────────────────────────────────────

describe('getNextSortDirection', () => {
    it('cycles none → asc', () => {
        expect(getNextSortDirection('none')).toBe('asc');
    });

    it('cycles asc → desc', () => {
        expect(getNextSortDirection('asc')).toBe('desc');
    });

    it('cycles desc → none', () => {
        expect(getNextSortDirection('desc')).toBe('none');
    });

    it('defaults to asc for unknown direction', () => {
        expect(getNextSortDirection(undefined)).toBe('asc');
        expect(getNextSortDirection('invalid')).toBe('asc');
    });
});

// ─── buildNextSortRules ─────────────────────────────────────────────────────

describe('buildNextSortRules', () => {
    describe('single-column mode', () => {
        it('creates new asc rule for fresh column', () => {
            const result = buildNextSortRules([], 0, false);
            expect(result.direction).toBe('asc');
            expect(result.rules).toHaveLength(1);
            expect(result.rules[0]).toMatchObject({ column: 0, direction: 'asc', type: 'auto' });
        });

        it('toggles asc → desc for existing column', () => {
            const existing = [{ column: 0, direction: 'asc', type: 'auto', unitConfig: null }];
            const result = buildNextSortRules(existing, 0, false);
            expect(result.direction).toBe('desc');
            expect(result.rules[0].direction).toBe('desc');
        });

        it('clears rules when cycling to none', () => {
            const existing = [{ column: 0, direction: 'desc', type: 'auto', unitConfig: null }];
            const result = buildNextSortRules(existing, 0, false);
            expect(result.direction).toBe('none');
            expect(result.rules).toHaveLength(0);
        });

        it('replaces all rules in single-column mode', () => {
            const existing = [{ column: 1, direction: 'asc', type: 'auto', unitConfig: null }];
            const result = buildNextSortRules(existing, 0, false);
            expect(result.rules).toHaveLength(1);
            expect(result.rules[0].column).toBe(0);
        });
    });

    describe('multi-column mode', () => {
        it('adds new column to existing rules', () => {
            const existing = [{ column: 0, direction: 'asc', type: 'auto', unitConfig: null }];
            const result = buildNextSortRules(existing, 1, true);
            expect(result.rules).toHaveLength(2);
            expect(result.rules[1]).toMatchObject({ column: 1, direction: 'asc' });
        });

        it('toggles direction for existing column in multi-column', () => {
            const existing = [
                { column: 0, direction: 'asc', type: 'auto', unitConfig: null },
                { column: 1, direction: 'asc', type: 'auto', unitConfig: null }
            ];
            const result = buildNextSortRules(existing, 1, true);
            expect(result.rules).toHaveLength(2);
            expect(result.rules[1].direction).toBe('desc');
        });

        it('removes column when cycling to none in multi-column', () => {
            const existing = [
                { column: 0, direction: 'asc', type: 'auto', unitConfig: null },
                { column: 1, direction: 'desc', type: 'auto', unitConfig: null }
            ];
            const result = buildNextSortRules(existing, 1, true);
            expect(result.rules).toHaveLength(1);
            expect(result.rules[0].column).toBe(0);
        });
    });

    it('does not mutate input rules array', () => {
        const existing = [{ column: 0, direction: 'asc', type: 'auto', unitConfig: null }];
        const copy = [...existing];
        buildNextSortRules(existing, 1, true);
        expect(existing).toEqual(copy);
    });
});

// ─── normalizeAdvancedSortRules ─────────────────────────────────────────────

describe('normalizeAdvancedSortRules', () => {
    it('normalizes valid rules', () => {
        const rules = [
            { column: 0, direction: 'asc', type: 'number' },
            { column: 1, direction: 'desc', type: 'text' }
        ];
        const result = normalizeAdvancedSortRules(rules);
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ column: 0, direction: 'asc', type: 'number' });
        expect(result[1]).toMatchObject({ column: 1, direction: 'desc', type: 'text' });
    });

    it('migrates legacy type names', () => {
        const rules = [
            { column: 0, direction: 'asc', type: 'time' },
            { column: 1, direction: 'asc', type: 'weight' },
            { column: 2, direction: 'asc', type: 'unit' }
        ];
        const result = normalizeAdvancedSortRules(rules);
        expect(result[0].type).toBe('duration');
        expect(result[1].type).toBe('mass');
        expect(result[2].type).toBe('auto');
    });

    it('filters out invalid column indices', () => {
        const rules = [
            { column: 'abc', direction: 'asc' },
            { column: 0, direction: 'asc' }
        ];
        const result = normalizeAdvancedSortRules(rules);
        expect(result).toHaveLength(1);
        expect(result[0].column).toBe(0);
    });

    it('defaults direction to asc', () => {
        const rules = [{ column: 0 }];
        const result = normalizeAdvancedSortRules(rules);
        expect(result[0].direction).toBe('asc');
    });

    it('defaults type to auto', () => {
        const rules = [{ column: 0, direction: 'asc' }];
        const result = normalizeAdvancedSortRules(rules);
        expect(result[0].type).toBe('auto');
    });

    it('returns empty array for non-array input', () => {
        expect(normalizeAdvancedSortRules(null)).toEqual([]);
        expect(normalizeAdvancedSortRules(undefined)).toEqual([]);
        expect(normalizeAdvancedSortRules('string')).toEqual([]);
    });

    it('returns empty array for empty input', () => {
        expect(normalizeAdvancedSortRules([])).toEqual([]);
    });
});

// ─── sortRowsByRules ────────────────────────────────────────────────────────

describe('sortRowsByRules', () => {
    it('sorts numbers in ascending order', () => {
        const rows = [mockRow('c', '30'), mockRow('a', '10'), mockRow('b', '20')];
        const rules = [{ column: 1, direction: 'asc', type: 'number' }];
        const sorted = sortRowsByRules(rows, rules);
        expect(sorted.map(r => r.cells[1].textContent)).toEqual(['10', '20', '30']);
    });

    it('sorts numbers in descending order', () => {
        const rows = [mockRow('a', '10'), mockRow('b', '20'), mockRow('c', '30')];
        const rules = [{ column: 1, direction: 'desc', type: 'number' }];
        const sorted = sortRowsByRules(rows, rules);
        expect(sorted.map(r => r.cells[1].textContent)).toEqual(['30', '20', '10']);
    });

    it('sorts text alphabetically', () => {
        const rows = [mockRow('Charlie'), mockRow('Alice'), mockRow('Bob')];
        const rules = [{ column: 0, direction: 'asc', type: 'text' }];
        const sorted = sortRowsByRules(rows, rules);
        expect(sorted.map(r => r.cells[0].textContent)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('sorts dates', () => {
        const rows = [
            mockRow('2024-03-15'),
            mockRow('2024-01-01'),
            mockRow('2024-02-10')
        ];
        const rules = [{ column: 0, direction: 'asc', type: 'date' }];
        const sorted = sortRowsByRules(rows, rules);
        expect(sorted.map(r => r.cells[0].textContent)).toEqual([
            '2024-01-01', '2024-02-10', '2024-03-15'
        ]);
    });

    it('sorts by multiple rules (secondary sort)', () => {
        const rows = [
            mockRow('B', '2'),
            mockRow('A', '2'),
            mockRow('A', '1'),
            mockRow('B', '1')
        ];
        const rules = [
            { column: 0, direction: 'asc', type: 'text' },
            { column: 1, direction: 'asc', type: 'number' }
        ];
        const sorted = sortRowsByRules(rows, rules);
        expect(sorted.map(r => `${r.cells[0].textContent}${r.cells[1].textContent}`)).toEqual([
            'A1', 'A2', 'B1', 'B2'
        ]);
    });

    it('handles auto type detection', () => {
        const rows = [mockRow('30'), mockRow('10'), mockRow('20')];
        const rules = [{ column: 0, direction: 'asc', type: 'auto' }];
        const sorted = sortRowsByRules(rows, rules);
        expect(sorted.map(r => r.cells[0].textContent)).toEqual(['10', '20', '30']);
    });

    it('handles empty values gracefully', () => {
        const rows = [mockRow('30'), mockRow(''), mockRow('10')];
        const rules = [{ column: 0, direction: 'asc', type: 'number' }];
        const sorted = sortRowsByRules(rows, rules);
        // Empty strings should still be sorted without crashing
        expect(sorted).toHaveLength(3);
    });

    it('does not mutate the original rows array', () => {
        const rows = [mockRow('c'), mockRow('a'), mockRow('b')];
        const originalLength = rows.length;
        const originalFirst = rows[0];
        sortRowsByRules(rows, [{ column: 0, direction: 'asc', type: 'text' }]);
        expect(rows).toHaveLength(originalLength);
        expect(rows[0]).toBe(originalFirst);
    });

    it('does not mutate the input rules', () => {
        const rows = [mockRow('30'), mockRow('10'), mockRow('20')];
        const rules = [{ column: 0, direction: 'asc', type: 'auto' }];
        const rulesCopy = JSON.parse(JSON.stringify(rules));
        sortRowsByRules(rows, rules);
        // _resolvedType and _unitSystem are added to internal copies, not to the originals
        expect(rules[0]).toEqual(rulesCopy[0]);
    });

    it('returns empty array for empty input', () => {
        expect(sortRowsByRules([], [])).toEqual([]);
    });

    it('handles null/undefined inputs gracefully', () => {
        expect(sortRowsByRules(null, null)).toEqual([]);
        expect(sortRowsByRules(undefined, undefined)).toEqual([]);
    });

    it('sorts with unit-based comparison', () => {
        const rows = [
            mockRow('2kg'),
            mockRow('500g'),
            mockRow('1kg')
        ];
        const rules = [{ column: 0, direction: 'asc', type: 'auto' }];
        const sorted = sortRowsByRules(rows, rules);
        expect(sorted.map(r => r.cells[0].textContent)).toEqual(['500g', '1kg', '2kg']);
    });

    it('sorts percentages', () => {
        const rows = [mockRow('50%'), mockRow('10%'), mockRow('75%')];
        const rules = [{ column: 0, direction: 'asc', type: 'percent' }];
        const sorted = sortRowsByRules(rows, rules);
        expect(sorted.map(r => r.cells[0].textContent)).toEqual(['10%', '50%', '75%']);
    });
});
