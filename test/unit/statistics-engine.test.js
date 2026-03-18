import { describe, expect, it } from 'vitest';
import { buildTableModel } from '../../src/core/table-model.js';
import {
    calculateStatistic,
    computeStatisticsData,
    getVisibleNumericValues
} from '../../src/core/statistics-engine.js';
import { markRowAsFilterHidden } from '../../src/core/row-visibility.js';
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

    it('accepts a pre-built table model and ignores hidden plus non-numeric rows', () => {
        const filterHiddenRow = mockRow([mockCell('C'), mockCell('18')]);
        markRowAsFilterHidden(filterHiddenRow);
        const table = mockTable({
            bodySections: [[
                mockRow([mockCell('A'), mockCell('12')]),
                mockRow([mockCell('B'), mockCell('invalid')]),
                filterHiddenRow,
                mockRow([mockCell('D'), mockCell('20kg')])
            ]]
        });
        const tableModel = buildTableModel(table);

        expect(getVisibleNumericValues(tableModel, 1)).toEqual([12, 20]);
    });
});

describe('calculateStatistic', () => {
    it('computes median, min, max, range, variance, and stddev for numeric samples', () => {
        expect(calculateStatistic([1, 3, 5], 'median')).toBe(3);
        expect(calculateStatistic([1, 2, 3, 4], 'median')).toBe(2.5);
        expect(calculateStatistic([2, 4, 6], 'min')).toBe(2);
        expect(calculateStatistic([2, 4, 6], 'max')).toBe(6);
        expect(calculateStatistic([2, 4, 6], 'range')).toBe(4);
        expect(calculateStatistic([2, 4, 6], 'variance')).toBeCloseTo(8 / 3);
        expect(calculateStatistic([2, 4, 6], 'stddev')).toBeCloseTo(Math.sqrt(8 / 3));
    });

    it('returns null for empty samples and unsupported statistic types', () => {
        expect(calculateStatistic([], 'sum')).toBeNull();
        expect(calculateStatistic([1, 2, 3], 'unknown')).toBeNull();
    });
});

describe('computeStatisticsData', () => {
    it('returns an empty result when no statistics rules are provided', () => {
        expect(computeStatisticsData([], mockTable())).toEqual(new Map());
        expect(computeStatisticsData(null, mockTable())).toEqual(new Map());
    });

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

    it('aggregates multiple statistic types and columns while skipping hidden and empty cells', () => {
        const filterHiddenRow = mockRow([mockCell('华南'), mockCell('30'), mockCell('9')]);
        markRowAsFilterHidden(filterHiddenRow);
        const table = mockTable({
            bodySections: [[
                mockRow([mockCell('华北'), mockCell('12'), mockCell('3')]),
                mockRow([mockCell('华东'), mockCell('18'), mockCell('')]),
                filterHiddenRow,
                mockRow([mockCell('西南'), mockCell('24'), mockCell('6')])
            ]]
        });

        const statsData = computeStatisticsData([
            {column: 1, statType: 'average'},
            {column: 1, statType: 'max'},
            {column: 2, statType: 'count'},
            {column: 2, statType: 'range'}
        ], table);

        expect(statsData.get('average').get(1)).toBe(18);
        expect(statsData.get('max').get(1)).toBe(24);
        expect(statsData.get('count').get(2)).toBe(2);
        expect(statsData.get('range').get(2)).toBe(3);
    });
});
