import { beforeEach, describe, expect, it, vi } from 'vitest';

function createDropdownButton(value) {
    return {
        getAttribute(name) {
            if (name === 'data-value') {
                return String(value);
            }

            return null;
        }
    };
}

function createInput(value) {
    return { value };
}

function createRuleRow({
    comparator = 'contains',
    column = '0',
    value = '',
    flags = '',
    min = '',
    max = '',
    negated = false
} = {}) {
    const selectors = new Map([
        ['.anytable-adv-comparator', createDropdownButton(comparator)],
        ['.anytable-adv-filter-column', createDropdownButton(column)],
        ['.anytable-adv-value', createInput(value)],
        ['.anytable-adv-flags', createInput(flags)],
        ['.anytable-adv-min', createInput(min)],
        ['.anytable-adv-max', createInput(max)],
        ['.anytable-adv-negate', {
            classList: {
                contains(token) {
                    return token === 'active' && negated;
                }
            }
        }]
    ]);

    return {
        querySelector(selector) {
            return selectors.get(selector) || null;
        }
    };
}

describe('panel validation helpers', () => {
    let parseFilterRuleRow;
    let validateStatisticsRules;

    beforeEach(async () => {
        vi.resetModules();
        vi.doMock('../../src/i18n/i18n.js', () => ({
            default: {
                t: vi.fn((key) => key)
            }
        }));

        ({ parseFilterRuleRow } = await import('../../src/ui/filter-panel-validation.js'));
        ({ validateStatisticsRules } = await import('../../src/ui/statistics-panel-validation.js'));
    });

    it('rejects invalid between ranges in filter rules', () => {
        const result = parseFilterRuleRow(createRuleRow({
            comparator: 'between',
            min: '9',
            max: '3'
        }));

        expect(result).toEqual({
            error: 'advancedPanel.filter.errors.betweenOrder'
        });
    });

    it('parses numeric comparator values as numbers', () => {
        const result = parseFilterRuleRow(createRuleRow({
            comparator: '>=',
            column: '2',
            value: '1,024'
        }));

        expect(result.error).toBeUndefined();
        expect(result.rule.column).toBe(2);
        expect(result.rule.value).toBe(1024);
    });

    it('flags duplicate statistics rules before apply', () => {
        const error = validateStatisticsRules([
            {column: 1, statType: 'sum'},
            {column: 1, statType: 'sum'}
        ]);

        expect(error).toBe('advancedPanel.statistics.hint.duplicateRule');
    });
});
