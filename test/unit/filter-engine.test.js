import { describe, it, expect } from 'vitest';
import { matchesBasicFilters, matchesRuleTree } from '../../src/core/filter-engine.js';

function mockRow(...values) {
    return { cells: values.map(v => ({ textContent: String(v) })) };
}

// ─── matchesBasicFilters ────────────────────────────────────────────────────

describe('matchesBasicFilters', () => {
    it('matches when no filters are set', () => {
        const row = mockRow('Alice', '30', 'Engineer');
        expect(matchesBasicFilters(row, {})).toBe(true);
    });

    it('matches case-insensitively', () => {
        const row = mockRow('Alice', '30', 'Engineer');
        expect(matchesBasicFilters(row, { 0: 'alice' })).toBe(true);
        expect(matchesBasicFilters(row, { 0: 'ALICE' })).toBe(true);
    });

    it('filters by substring match', () => {
        const row = mockRow('Alice', '30', 'Engineer');
        expect(matchesBasicFilters(row, { 0: 'lic' })).toBe(true);
        expect(matchesBasicFilters(row, { 0: 'bob' })).toBe(false);
    });

    it('supports multi-column filters (AND logic)', () => {
        const row = mockRow('Alice', '30', 'Engineer');
        expect(matchesBasicFilters(row, { 0: 'alice', 2: 'engineer' })).toBe(true);
        expect(matchesBasicFilters(row, { 0: 'alice', 2: 'doctor' })).toBe(false);
    });

    it('treats empty filter value as no filter', () => {
        const row = mockRow('Alice', '30');
        expect(matchesBasicFilters(row, { 0: '' })).toBe(true);
    });

    it('handles undefined filter values', () => {
        const row = mockRow('Alice', '30');
        expect(matchesBasicFilters(row, { 0: undefined })).toBe(true);
    });
});

// ─── matchesRuleTree ────────────────────────────────────────────────────────

describe('matchesRuleTree', () => {
    it('returns true for null/empty rule group', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, null)).toBe(true);
        expect(matchesRuleTree(row, {})).toBe(true);
        expect(matchesRuleTree(row, { children: [] })).toBe(true);
    });

    // ─── contains comparator ────────────────────────────────────────────

    it('evaluates contains comparator', () => {
        const row = mockRow('Alice', '30');
        const rule = {
            children: [{ column: 0, comparator: 'contains', value: 'lic' }]
        };
        expect(matchesRuleTree(row, rule)).toBe(true);
    });

    it('contains is case-insensitive', () => {
        const row = mockRow('Alice', '30');
        const rule = {
            children: [{ column: 0, comparator: 'contains', value: 'ALICE' }]
        };
        expect(matchesRuleTree(row, rule)).toBe(true);
    });

    // ─── startsWith comparator ──────────────────────────────────────────

    it('evaluates startsWith comparator', () => {
        const row = mockRow('Alice', '30');
        const ruleMatch = {
            children: [{ column: 0, comparator: 'startsWith', value: 'ali' }]
        };
        const ruleNoMatch = {
            children: [{ column: 0, comparator: 'startsWith', value: 'ice' }]
        };
        expect(matchesRuleTree(row, ruleMatch)).toBe(true);
        expect(matchesRuleTree(row, ruleNoMatch)).toBe(false);
    });

    // ─── endsWith comparator ────────────────────────────────────────────

    it('evaluates endsWith comparator', () => {
        const row = mockRow('Alice', '30');
        const rule = {
            children: [{ column: 0, comparator: 'endsWith', value: 'ice' }]
        };
        expect(matchesRuleTree(row, rule)).toBe(true);
    });

    // ─── equals comparator ──────────────────────────────────────────────

    it('evaluates equals comparator (case-insensitive)', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 0, comparator: 'equals', value: 'alice' }]
        })).toBe(true);
        expect(matchesRuleTree(row, {
            children: [{ column: 0, comparator: 'equals', value: 'bob' }]
        })).toBe(false);
    });

    // ─── regex comparator ───────────────────────────────────────────────

    it('evaluates regex comparator', () => {
        const row = mockRow('Alice123', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 0, comparator: 'regex', value: '\\d+', options: {} }]
        })).toBe(true);
    });

    it('regex with flags', () => {
        const row = mockRow('ALICE', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 0, comparator: 'regex', value: 'alice', options: { flags: 'i' } }]
        })).toBe(true);
    });

    it('invalid regex returns false', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 0, comparator: 'regex', value: '[invalid', options: {} }]
        })).toBe(false);
    });

    // ─── isEmpty / isNotEmpty ───────────────────────────────────────────

    it('evaluates isEmpty comparator', () => {
        const emptyRow = mockRow('', '30');
        const nonEmptyRow = mockRow('Alice', '30');
        expect(matchesRuleTree(emptyRow, {
            children: [{ column: 0, comparator: 'isEmpty' }]
        })).toBe(true);
        expect(matchesRuleTree(nonEmptyRow, {
            children: [{ column: 0, comparator: 'isEmpty' }]
        })).toBe(false);
    });

    it('evaluates isNotEmpty comparator', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 0, comparator: 'isNotEmpty' }]
        })).toBe(true);
    });

    // ─── numeric comparators ────────────────────────────────────────────

    it('evaluates > comparator', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 1, comparator: '>', value: '25' }]
        })).toBe(true);
        expect(matchesRuleTree(row, {
            children: [{ column: 1, comparator: '>', value: '35' }]
        })).toBe(false);
    });

    it('evaluates >= comparator', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 1, comparator: '>=', value: '30' }]
        })).toBe(true);
    });

    it('evaluates < comparator', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 1, comparator: '<', value: '35' }]
        })).toBe(true);
    });

    it('evaluates <= comparator', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 1, comparator: '<=', value: '30' }]
        })).toBe(true);
    });

    it('numeric comparator returns false for non-numeric cell', () => {
        const row = mockRow('Alice', 'abc');
        expect(matchesRuleTree(row, {
            children: [{ column: 1, comparator: '>', value: '10' }]
        })).toBe(false);
    });

    // ─── between comparator ────────────────────────────────────────────

    it('evaluates between comparator', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 1, comparator: 'between', options: { min: '20', max: '40' } }]
        })).toBe(true);
        expect(matchesRuleTree(row, {
            children: [{ column: 1, comparator: 'between', options: { min: '35', max: '40' } }]
        })).toBe(false);
    });

    it('between returns false for invalid range', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 1, comparator: 'between', options: { min: 'abc', max: '40' } }]
        })).toBe(false);
    });

    // ─── AND / OR combinations ──────────────────────────────────────────

    it('AND combination: all must match', () => {
        const row = mockRow('Alice', '30');
        const rule = {
            operator: 'AND',
            children: [
                { column: 0, comparator: 'contains', value: 'alice' },
                { column: 1, comparator: '>', value: '25' }
            ]
        };
        expect(matchesRuleTree(row, rule)).toBe(true);
    });

    it('AND combination: fails if one doesnt match', () => {
        const row = mockRow('Alice', '30');
        const rule = {
            operator: 'AND',
            children: [
                { column: 0, comparator: 'contains', value: 'alice' },
                { column: 1, comparator: '>', value: '35' }
            ]
        };
        expect(matchesRuleTree(row, rule)).toBe(false);
    });

    it('OR combination: passes if any matches', () => {
        const row = mockRow('Alice', '30');
        const rule = {
            operator: 'OR',
            children: [
                { column: 0, comparator: 'contains', value: 'bob' },
                { column: 1, comparator: '>', value: '25' }
            ]
        };
        expect(matchesRuleTree(row, rule)).toBe(true);
    });

    it('OR combination: fails if none match', () => {
        const row = mockRow('Alice', '30');
        const rule = {
            operator: 'OR',
            children: [
                { column: 0, comparator: 'contains', value: 'bob' },
                { column: 1, comparator: '>', value: '35' }
            ]
        };
        expect(matchesRuleTree(row, rule)).toBe(false);
    });

    // ─── per-rule operators ─────────────────────────────────────────────

    it('supports per-rule operators (mixed AND/OR)', () => {
        const row = mockRow('Alice', '30', 'Engineer');
        const rule = {
            children: [
                { column: 0, comparator: 'contains', value: 'bob' },
                { column: 1, comparator: '>', value: '25', operator: 'OR' },
                { column: 2, comparator: 'contains', value: 'engineer', operator: 'AND' }
            ]
        };
        // (false OR true) AND true = true
        expect(matchesRuleTree(row, rule)).toBe(true);
    });

    // ─── nested groups ──────────────────────────────────────────────────

    it('evaluates nested groups', () => {
        const row = mockRow('Alice', '30', 'Engineer');
        const rule = {
            operator: 'AND',
            children: [
                { column: 0, comparator: 'contains', value: 'alice' },
                {
                    operator: 'OR',
                    children: [
                        { column: 1, comparator: '>', value: '50' },
                        { column: 2, comparator: 'equals', value: 'engineer' }
                    ]
                }
            ]
        };
        // alice AND (30>50 OR engineer==engineer) = true AND (false OR true) = true
        expect(matchesRuleTree(row, rule)).toBe(true);
    });

    // ─── negated rules ──────────────────────────────────────────────────

    it('evaluates negated leaf rule', () => {
        const row = mockRow('Alice', '30');
        expect(matchesRuleTree(row, {
            children: [{ column: 0, comparator: 'contains', value: 'bob', negated: true }]
        })).toBe(true);
        expect(matchesRuleTree(row, {
            children: [{ column: 0, comparator: 'contains', value: 'alice', negated: true }]
        })).toBe(false);
    });

    it('evaluates negated group', () => {
        const row = mockRow('Alice', '30');
        const rule = {
            children: [{
                negated: true,
                operator: 'AND',
                children: [
                    { column: 0, comparator: 'contains', value: 'bob' },
                    { column: 1, comparator: '>', value: '25' }
                ]
            }]
        };
        // NOT (bob AND >25) = NOT (false AND true) = NOT false = true
        expect(matchesRuleTree(row, rule)).toBe(true);
    });
});
