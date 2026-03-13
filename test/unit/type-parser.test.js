import { describe, it, expect } from 'vitest';
import {
    parseValueAndUnit,
    convertToBase,
    tryParseDate,
    detectColumnUnitSystem,
    getUnitSystemByName
} from '../../src/core/type-parser.js';

// ─── parseValueAndUnit ──────────────────────────────────────────────────────

describe('parseValueAndUnit', () => {
    it('parses pure integers', () => {
        const result = parseValueAndUnit('42');
        expect(result).toMatchObject({ success: true, value: 42, unit: '', type: 'number' });
    });

    it('parses negative numbers', () => {
        const result = parseValueAndUnit('-3.14');
        expect(result).toMatchObject({ success: true, value: -3.14, type: 'number' });
    });

    it('parses numbers with commas', () => {
        const result = parseValueAndUnit('1,234,567');
        expect(result).toMatchObject({ success: true, value: 1234567, type: 'number' });
    });

    it('parses scientific notation', () => {
        const result = parseValueAndUnit('1.5e3');
        expect(result).toMatchObject({ success: true, value: 1500, type: 'number' });
    });

    it('parses number with unit (kg)', () => {
        const result = parseValueAndUnit('10kg');
        expect(result).toMatchObject({ success: true, value: 10, unit: 'kg', type: 'mass' });
        expect(result.system).toBeDefined();
    });

    it('parses number with space before unit', () => {
        const result = parseValueAndUnit('5 km');
        expect(result).toMatchObject({ success: true, value: 5, unit: 'km', type: 'length' });
    });

    it('parses percentage', () => {
        const result = parseValueAndUnit('85%');
        expect(result).toMatchObject({ success: true, value: 85, unit: '%', type: 'percent' });
    });

    it('returns empty type for empty/null input', () => {
        expect(parseValueAndUnit('')).toMatchObject({ success: false, type: 'empty' });
        expect(parseValueAndUnit(null)).toMatchObject({ success: false, type: 'empty' });
        expect(parseValueAndUnit(undefined)).toMatchObject({ success: false, type: 'empty' });
    });

    it('returns text type for non-numeric strings', () => {
        expect(parseValueAndUnit('hello')).toMatchObject({ success: false, type: 'text' });
        expect(parseValueAndUnit('abc123def')).toMatchObject({ success: false, type: 'text' });
    });

    it('parses duration units', () => {
        const result = parseValueAndUnit('500ms');
        expect(result).toMatchObject({ success: true, value: 500, unit: 'ms', type: 'duration' });
    });

    it('parses temperature units (case-sensitive)', () => {
        const result = parseValueAndUnit('100C');
        expect(result).toMatchObject({ success: true, value: 100, unit: 'C', type: 'temperature' });
    });

    it('parses data size units', () => {
        const result = parseValueAndUnit('512MB');
        expect(result).toMatchObject({ success: true, value: 512, unit: 'MB', type: 'dataSize' });
    });

    it('parses unknown unit as generic unit type', () => {
        const result = parseValueAndUnit('10xyz');
        expect(result).toMatchObject({ success: true, value: 10, unit: 'xyz', type: 'unit' });
    });
});

// ─── convertToBase ──────────────────────────────────────────────────────────

describe('convertToBase', () => {
    it('converts duration (seconds to ms)', () => {
        const system = getUnitSystemByName('duration');
        expect(convertToBase(1, 's', system)).toBe(1000);
    });

    it('converts duration (hours to ms)', () => {
        const system = getUnitSystemByName('duration');
        expect(convertToBase(1, 'h', system)).toBe(3600000);
    });

    it('converts mass (kg to g)', () => {
        const system = getUnitSystemByName('mass');
        expect(convertToBase(1, 'kg', system)).toBe(1000);
    });

    it('converts length (km to m)', () => {
        const system = getUnitSystemByName('length');
        expect(convertToBase(1, 'km', system)).toBe(1000);
    });

    it('converts temperature C to K', () => {
        const system = getUnitSystemByName('temperature');
        expect(convertToBase(0, 'C', system)).toBeCloseTo(273.15);
    });

    it('converts temperature F to K', () => {
        const system = getUnitSystemByName('temperature');
        expect(convertToBase(32, 'F', system)).toBeCloseTo(273.15);
    });

    it('converts temperature K to K (identity)', () => {
        const system = getUnitSystemByName('temperature');
        expect(convertToBase(100, 'K', system)).toBe(100);
    });

    it('handles Unicode aliases (μs → us)', () => {
        const system = getUnitSystemByName('duration');
        expect(convertToBase(1, '\u03BCs', system)).toBeCloseTo(0.001);
    });

    it('returns NaN for unknown unit', () => {
        const system = getUnitSystemByName('mass');
        expect(convertToBase(1, 'xyz', system)).toBeNaN();
    });

    it('returns NaN for null system', () => {
        expect(convertToBase(1, 'kg', null)).toBeNaN();
    });

    it('converts data size (GB to B)', () => {
        const system = getUnitSystemByName('dataSize');
        expect(convertToBase(1, 'GB', system)).toBe(1e9);
    });

    it('converts data size (GiB to B)', () => {
        const system = getUnitSystemByName('dataSize');
        expect(convertToBase(1, 'GiB', system)).toBe(1073741824);
    });
});

// ─── tryParseDate ───────────────────────────────────────────────────────────

describe('tryParseDate', () => {
    it('parses ISO format (YYYY-MM-DD)', () => {
        const result = tryParseDate('2024-03-15');
        expect(result).not.toBeNull();
        expect(result.format).toBe('iso');
        const date = new Date(result.timestamp);
        expect(date.getFullYear()).toBe(2024);
        expect(date.getMonth()).toBe(2); // 0-indexed
        expect(date.getDate()).toBe(15);
    });

    it('parses ISO format with slashes', () => {
        const result = tryParseDate('2024/03/15');
        expect(result).not.toBeNull();
        expect(result.format).toBe('iso');
    });

    it('parses CJK format (2024年3月15日)', () => {
        const result = tryParseDate('2024年3月15日');
        expect(result).not.toBeNull();
        expect(result.format).toBe('cjk');
    });

    it('parses compact format (20240315)', () => {
        const result = tryParseDate('20240315');
        expect(result).not.toBeNull();
        expect(result.format).toBe('compact');
    });

    it('parses month name MDY (Mar 15, 2024)', () => {
        const result = tryParseDate('Mar 15, 2024');
        expect(result).not.toBeNull();
        expect(result.format).toBe('monthNameMDY');
    });

    it('parses month name DMY (15 March 2024)', () => {
        const result = tryParseDate('15 March 2024');
        expect(result).not.toBeNull();
        expect(result.format).toBe('monthNameDMY');
    });

    it('parses ambiguous numeric with MDY hint', () => {
        const result = tryParseDate('03/15/2024', 'mdy');
        expect(result).not.toBeNull();
        expect(result.format).toBe('numericMDY');
    });

    it('parses ambiguous numeric with DMY hint', () => {
        const result = tryParseDate('15/03/2024', 'dmy');
        expect(result).not.toBeNull();
        expect(result.format).toBe('numericDMY');
    });

    it('resolves unambiguous numeric (day > 12 → DMY)', () => {
        const result = tryParseDate('25/03/2024');
        expect(result).not.toBeNull();
        // 25 can't be month, so must be DMY
        expect(result.format).toBe('numericDMY');
    });

    it('returns null for invalid date', () => {
        expect(tryParseDate('not a date')).toBeNull();
    });

    it('returns null for empty input', () => {
        expect(tryParseDate('')).toBeNull();
        expect(tryParseDate(null)).toBeNull();
    });

    it('parses ISO format with time', () => {
        const result = tryParseDate('2024-03-15T14:30:00');
        expect(result).not.toBeNull();
        expect(result.format).toBe('iso');
    });

    it('parses Korean format (2024년 3월 15일)', () => {
        const result = tryParseDate('2024년 3월 15일');
        expect(result).not.toBeNull();
        expect(result.format).toBe('korean');
    });
});

// ─── detectColumnUnitSystem ─────────────────────────────────────────────────

describe('detectColumnUnitSystem', () => {
    it('detects pure number column', () => {
        const result = detectColumnUnitSystem(['1', '2', '3', '4', '5']);
        expect(result.type).toBe('number');
        expect(result.confidence).toBe(1);
    });

    it('detects percentage column', () => {
        const result = detectColumnUnitSystem(['10%', '20%', '30%', '40%']);
        expect(result.type).toBe('percent');
        expect(result.confidence).toBe(1);
    });

    it('detects date column', () => {
        const result = detectColumnUnitSystem([
            '2024-01-01', '2024-02-15', '2024-03-20', '2024-04-10'
        ]);
        expect(result.type).toBe('date');
    });

    it('detects mass unit system', () => {
        const result = detectColumnUnitSystem(['10kg', '500g', '2.5kg', '100g']);
        expect(result.type).toBe('mass');
        expect(result.system).toBeDefined();
    });

    it('detects duration unit system', () => {
        const result = detectColumnUnitSystem(['100ms', '2s', '500ms', '1.5s']);
        expect(result.type).toBe('duration');
    });

    it('detects text column', () => {
        const result = detectColumnUnitSystem(['hello', 'world', 'foo', 'bar']);
        expect(result.type).toBe('text');
    });

    it('handles empty values array', () => {
        const result = detectColumnUnitSystem([]);
        expect(result.type).toBe('text');
        expect(result.confidence).toBe(0);
    });

    it('handles null input', () => {
        const result = detectColumnUnitSystem(null);
        expect(result.type).toBe('text');
        expect(result.confidence).toBe(0);
    });

    it('handles mixed empty and number values', () => {
        const result = detectColumnUnitSystem(['1', '', '3', '', '5']);
        expect(result.type).toBe('number');
    });

    it('detects data size column', () => {
        const result = detectColumnUnitSystem(['100MB', '2GB', '500KB', '1TB']);
        expect(result.type).toBe('dataSize');
    });

    it('detects length unit system', () => {
        const result = detectColumnUnitSystem(['10km', '5m', '200cm', '1.5km']);
        expect(result.type).toBe('length');
    });
});

// ─── getUnitSystemByName ────────────────────────────────────────────────────

describe('getUnitSystemByName', () => {
    it('returns duration system', () => {
        const sys = getUnitSystemByName('duration');
        expect(sys).not.toBeNull();
        expect(sys.name).toBe('duration');
        expect(sys.base).toBe('ms');
    });

    it('returns mass system', () => {
        const sys = getUnitSystemByName('mass');
        expect(sys).not.toBeNull();
        expect(sys.name).toBe('mass');
    });

    it('returns temperature system', () => {
        const sys = getUnitSystemByName('temperature');
        expect(sys).not.toBeNull();
        expect(sys.caseSensitive).toBe(true);
    });

    it('returns null for unknown system', () => {
        expect(getUnitSystemByName('nonexistent')).toBeNull();
    });

    it('returns null for empty name', () => {
        expect(getUnitSystemByName('')).toBeNull();
    });
});
