import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('filter panel state helpers', () => {
    let createDefaultFilterGroup;
    let createDefaultFilterRule;
    let ensureFilterRules;
    let findFilterNodeIndex;
    let isFilterGroup;
    let removeLeadingFilterOperator;

    beforeEach(async () => {
        vi.resetModules();
        let sequence = 0;
        vi.doMock('../../src/ui/advanced-panel-common.js', () => ({
            createPanelNodeId(prefix) {
                sequence += 1;
                return `${prefix}-${sequence}`;
            }
        }));

        ({
            createDefaultFilterGroup,
            createDefaultFilterRule,
            ensureFilterRules,
            findFilterNodeIndex,
            isFilterGroup,
            removeLeadingFilterOperator
        } = await import('../../src/ui/filter-panel-state.js'));
    });

    it('creates default rule and group nodes with fallback columns', () => {
        const rule = createDefaultFilterRule(2);
        const group = createDefaultFilterGroup(3);

        expect(rule).toEqual({
            id: 'leaf-1',
            column: 2,
            comparator: 'contains',
            value: '',
            options: {}
        });
        expect(group).toEqual({
            id: 'group-2',
            children: [{
                id: 'leaf-3',
                column: 3,
                comparator: 'contains',
                value: '',
                options: {}
            }]
        });
        expect(isFilterGroup(rule)).toBe(false);
        expect(isFilterGroup(group)).toBe(true);
    });

    it('normalizes empty rule groups into a default root rule', () => {
        const rules = ensureFilterRules(null, 4);

        expect(rules).toEqual([{
            id: 'leaf-1',
            column: 4,
            comparator: 'contains',
            value: '',
            options: {}
        }]);
    });

    it('normalizes nested groups, propagates root OR operators, and preserves explicit metadata', () => {
        const rules = ensureFilterRules({
            operator: 'OR',
            children: [
                {
                    id: 'leaf-a',
                    column: 1,
                    comparator: 'equals',
                    value: 'Alice',
                    negated: true,
                    options: { flags: 'i' }
                },
                {
                    id: 'group-a',
                    negated: true,
                    children: [
                        {
                            id: 'leaf-b',
                            column: 'invalid',
                            comparator: '',
                            value: '',
                            options: null
                        },
                        {
                            id: 'leaf-c',
                            column: 2,
                            comparator: 'regex',
                            value: '^B',
                            operator: 'AND',
                            options: { flags: 'g' }
                        }
                    ]
                }
            ]
        }, 5);

        expect(rules).toEqual([
            {
                id: 'leaf-a',
                column: 1,
                comparator: 'equals',
                negated: true,
                value: 'Alice',
                options: { flags: 'i' },
                operator: undefined
            },
            {
                id: 'group-a',
                negated: true,
                operator: 'OR',
                children: [
                    {
                        id: 'leaf-b',
                        column: 5,
                        comparator: 'contains',
                        negated: false,
                        value: '',
                        options: {},
                        operator: undefined
                    },
                    {
                        id: 'leaf-c',
                        column: 2,
                        comparator: 'regex',
                        negated: false,
                        value: '^B',
                        options: { flags: 'g' },
                        operator: 'AND'
                    }
                ]
            }
        ]);
    });

    it('finds nodes by id and removes the leading operator only when present', () => {
        const children = [
            { id: 'leaf-a', operator: 'AND' },
            { id: 'leaf-b', operator: 'OR' }
        ];

        expect(findFilterNodeIndex(children, 'leaf-b')).toBe(1);
        expect(findFilterNodeIndex(children, 'missing')).toBe(-1);

        removeLeadingFilterOperator(children);
        expect(children).toEqual([
            { id: 'leaf-a' },
            { id: 'leaf-b', operator: 'OR' }
        ]);

        removeLeadingFilterOperator([]);
        expect(children[1].operator).toBe('OR');
    });
});
