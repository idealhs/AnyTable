import { describe, expect, it } from 'vitest';
import { computeStatisticsData, getVisibleNumericValues } from '../../src/core/statistics-engine.js';
import { mockCell, mockRow, mockTable } from './helpers/mock-table.js';

describe('getVisibleNumericValues', () => {
    it('collects numeric values across multiple tbody sections', () => {
        const table = mockTable({
            bodySections: [
                [
                    mockRow([mockCell('华北'), mockCell('12')]),
                    mockRow([mockCell('华东'), mockCell('18')], {hidden: true})
                ],
                [
                    mockRow([mockCell('华南'), mockCell('20')])
                ]
            ]
        });

        expect(getVisibleNumericValues(table, 1)).toEqual([12, 20]);
    });
});

describe('computeStatisticsData', () => {
    it('computes count and sum from the same logical column model', () => {
        const table = mockTable({
            bodySections: [
                [mockRow([mockCell('华北'), mockCell('12')])],
                [
                    mockRow([mockCell('华南'), mockCell('20')]),
                    mockRow([mockCell('合计'), mockCell('')], {hidden: true})
                ]
            ]
        });

        const statsData = computeStatisticsData([
            {column: 1, statType: 'count'},
            {column: 1, statType: 'sum'}
        ], table);

        expect(statsData.get('count').get(1)).toBe(2);
        expect(statsData.get('sum').get(1)).toBe(32);
    });
});
