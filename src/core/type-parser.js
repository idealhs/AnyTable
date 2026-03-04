// ─── Unit Systems Registry ───────────────────────────────────────────────────

const UNIT_SYSTEMS = Object.freeze([
    {
        name: 'duration',
        base: 'ms',
        caseSensitive: false,
        units: {
            ns: 1e-6, us: 1e-3, ms: 1, s: 1000, sec: 1000,
            min: 60000, h: 3600000, hr: 3600000, hour: 3600000,
            day: 86400000, week: 604800000, month: 2592000000, year: 31536000000,
            century: 3153600000000
        }
    },
    {
        name: 'mass',
        base: 'g',
        caseSensitive: false,
        units: {
            ug: 1e-6, mg: 1e-3, g: 1, kg: 1000, t: 1e6,
            oz: 28.3495, lb: 453.592, stone: 6350.29, ton: 907185, ct: 0.2
        }
    },
    {
        name: 'length',
        base: 'm',
        caseSensitive: false,
        units: {
            nm: 1e-9, um: 1e-6, mm: 1e-3, cm: 0.01, m: 1, km: 1000,
            in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852
        }
    },
    {
        name: 'area',
        base: 'm2',
        caseSensitive: false,
        units: {
            mm2: 1e-6, cm2: 1e-4, m2: 1, km2: 1e6,
            ha: 10000, acre: 4046.86, ft2: 0.092903, in2: 0.00064516
        }
    },
    {
        name: 'volume',
        base: 'l',
        caseSensitive: false,
        units: {
            ul: 1e-6, ml: 1e-3, cl: 0.01, dl: 0.1, l: 1, kl: 1000,
            m3: 1000, gal: 3.78541, qt: 0.946353, pt: 0.473176
        }
    },
    {
        name: 'speed',
        base: 'm/s',
        caseSensitive: false,
        units: {
            'mps': 1, 'm/s': 1, 'kmh': 0.277778, 'km/h': 0.277778,
            'mph': 0.44704, 'knot': 0.514444, 'fps': 0.3048, 'mach': 343
        }
    },
    {
        name: 'temperature',
        base: 'K',
        caseSensitive: true,
        convertToBase(value, unit) {
            switch (unit) {
                case 'C': return value + 273.15;
                case 'F': return (value - 32) * 5 / 9 + 273.15;
                case 'K': return value;
                case 'R': return value * 5 / 9;
                default: return NaN;
            }
        },
        units: { C: 1, F: 1, K: 1, R: 1 }
    },
    {
        name: 'pressure',
        base: 'Pa',
        caseSensitive: true,
        units: {
            Pa: 1, kPa: 1000, MPa: 1e6, bar: 100000,
            psi: 6894.76, atm: 101325, mmHg: 133.322, torr: 133.322
        }
    },
    {
        name: 'energy',
        base: 'J',
        caseSensitive: true,
        units: {
            J: 1, kJ: 1000, MJ: 1e6,
            Wh: 3600, kWh: 3600000,
            cal: 4.184, kcal: 4184, eV: 1.602176634e-19, BTU: 1055.06
        }
    },
    {
        name: 'power',
        base: 'W',
        caseSensitive: true,
        units: {
            mW: 0.001, W: 1, kW: 1000, MW: 1e6, GW: 1e9, hp: 745.7
        }
    },
    {
        name: 'voltage',
        base: 'V',
        caseSensitive: true,
        units: { uV: 1e-6, mV: 0.001, V: 1, kV: 1000, MV: 1e6 }
    },
    {
        name: 'current',
        base: 'A',
        caseSensitive: true,
        units: { nA: 1e-9, uA: 1e-6, mA: 0.001, A: 1, kA: 1000 }
    },
    {
        name: 'resistance',
        base: 'ohm',
        caseSensitive: true,
        units: {
            uohm: 1e-6, mohm: 0.001, ohm: 1,
            kohm: 1000, Mohm: 1e6, Gohm: 1e9
        }
    },
    {
        name: 'frequency',
        base: 'Hz',
        caseSensitive: true,
        units: {
            uHz: 1e-6, mHz: 0.001, Hz: 1,
            kHz: 1000, MHz: 1e6, GHz: 1e9, rpm: 1 / 60
        }
    },
    {
        name: 'dataSize',
        base: 'B',
        caseSensitive: true,
        units: {
            B: 1, KB: 1000, MB: 1e6, GB: 1e9, TB: 1e12,
            KiB: 1024, MiB: 1048576, GiB: 1073741824, TiB: 1099511627776
        }
    },
    {
        name: 'bitrate',
        base: 'bps',
        caseSensitive: false,
        units: {
            bps: 1, kbps: 1000, mbps: 1e6, gbps: 1e9, tbps: 1e12,
            kibps: 1024, mibps: 1048576, gibps: 1073741824
        }
    }
]);

// ─── Unicode Aliases ─────────────────────────────────────────────────────────

const UNICODE_ALIASES = Object.freeze({
    '\u03BCs': 'us', '\u00B5s': 'us',   // μs, µs → us
    '\u03BCg': 'ug', '\u00B5g': 'ug',   // μg, µg → ug
    '\u03BCl': 'ul', '\u00B5l': 'ul',   // μl, µl → ul
    '\u03BCm': 'um', '\u00B5m': 'um',   // μm, µm → um
    '\u03BCA': 'uA', '\u00B5A': 'uA',   // μA, µA → uA
    '\u03BCV': 'uV', '\u00B5V': 'uV',   // μV, µV → uV
    '\u03BCHz': 'uHz', '\u00B5Hz': 'uHz',
    '\u2126': 'ohm',                      // Ω → ohm
    'k\u2126': 'kohm', 'M\u2126': 'Mohm', 'G\u2126': 'Gohm',
    'm\u2126': 'mohm', '\u03BC\u2126': 'uohm', '\u00B5\u2126': 'uohm'
});

// ─── Build lookup index ──────────────────────────────────────────────────────

const UNIT_INDEX_CS = new Map();   // case-sensitive lookup
const UNIT_INDEX_CI = new Map();   // case-insensitive lookup (lower-cased keys)
const SYSTEM_BY_NAME = new Map();

for (const sys of UNIT_SYSTEMS) {
    SYSTEM_BY_NAME.set(sys.name, sys);
    for (const unitName of Object.keys(sys.units)) {
        if (sys.caseSensitive) {
            UNIT_INDEX_CS.set(unitName, sys);
        } else {
            UNIT_INDEX_CI.set(unitName.toLowerCase(), sys);
        }
    }
}

// Also index speed units with slash
// (already included above because keys like 'm/s', 'km/h' are in the units map)

function resolveAlias(unitStr) {
    return UNICODE_ALIASES[unitStr] || unitStr;
}

function lookupSystem(unitStr) {
    const alias = resolveAlias(unitStr);
    // Try case-sensitive first
    const csResult = UNIT_INDEX_CS.get(alias);
    if (csResult) return { system: csResult, resolvedUnit: alias };
    // Try case-insensitive
    const ciResult = UNIT_INDEX_CI.get(alias.toLowerCase());
    if (ciResult) return { system: ciResult, resolvedUnit: alias };
    return null;
}

// ─── Date Parsing ────────────────────────────────────────────────────────────

const MONTH_NAMES = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6,
    jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
};

// Optional time suffix: T14:30 or  14:30:00 or T14:30:00.123
const TIME_SUFFIX = /(?:[\sT](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:\s*(?:AM|PM|am|pm))?(?:\s*[+-]\d{2}:?\d{2}|Z)?)?/;

// Unambiguous patterns (tested in order)
const DATE_PATTERNS_UNAMBIGUOUS = [
    {
        // ISO with optional time: 2024-03-15, 2024/03/15, 2024-3-5T14:30:00
        name: 'iso',
        re: new RegExp(
            /^(\d{4})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])/.source +
            TIME_SUFFIX.source + '$'
        ),
        extract(m) { return { y: +m[1], m: +m[2], d: +m[3], h: +m[4] || 0, min: +m[5] || 0, s: +m[6] || 0 }; }
    },
    {
        // Compact: 20240315 (exactly 8 digits)
        name: 'compact',
        re: /^(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/,
        extract(m) { return { y: +m[1], m: +m[2], d: +m[3], h: 0, min: 0, s: 0 }; }
    },
    {
        // Chinese / Japanese: 2024年3月15日 (optional time)
        name: 'cjk',
        re: new RegExp(
            /^(\d{4})\s*[年]\s*(0?[1-9]|1[0-2])\s*[月]\s*(0?[1-9]|[12]\d|3[01])\s*[日号]?/.source +
            TIME_SUFFIX.source + '$'
        ),
        extract(m) { return { y: +m[1], m: +m[2], d: +m[3], h: +m[4] || 0, min: +m[5] || 0, s: +m[6] || 0 }; }
    },
    {
        // Korean: 2024년 3월 15일
        name: 'korean',
        re: /^(\d{4})\s*년\s*(0?[1-9]|1[0-2])\s*월\s*(0?[1-9]|[12]\d|3[01])\s*일$/,
        extract(m) { return { y: +m[1], m: +m[2], d: +m[3], h: 0, min: 0, s: 0 }; }
    },
    {
        // ISO week: 2024-W12-3 (year-week-dayOfWeek)
        name: 'isoWeek',
        re: /^(\d{4})-W(0?[1-9]|[1-4]\d|5[0-3])-([1-7])$/,
        extract(m) {
            const year = +m[1];
            const week = +m[2];
            const dow = +m[3];
            // Approximate: Jan 4 is always in week 1
            const jan4 = new Date(year, 0, 4);
            const weekStart = new Date(jan4);
            weekStart.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (week - 1) * 7);
            weekStart.setDate(weekStart.getDate() + dow - 1);
            return { y: weekStart.getFullYear(), m: weekStart.getMonth() + 1, d: weekStart.getDate(), h: 0, min: 0, s: 0 };
        }
    },
    {
        // Chinese week: 2024年第12周
        name: 'cjkWeek',
        re: /^(\d{4})\s*年第\s*(0?[1-9]|[1-4]\d|5[0-3])\s*周$/,
        extract(m) {
            const year = +m[1];
            const week = +m[2];
            // Approximate: assume week 1 starts on Jan 1
            const jan1 = new Date(year, 0, 1);
            const weekStart = new Date(jan1);
            weekStart.setDate(jan1.getDate() + (week - 1) * 7);
            return { y: weekStart.getFullYear(), m: weekStart.getMonth() + 1, d: weekStart.getDate(), h: 0, min: 0, s: 0 };
        }
    },
    {
        // Month name MDY: Mar 15, 2024 / March 15 2024
        name: 'monthNameMDY',
        re: /^([A-Za-z]+)\s+(0?[1-9]|[12]\d|3[01]),?\s+(\d{4})$/,
        extract(m) {
            const mon = MONTH_NAMES[m[1].toLowerCase()];
            return mon ? { y: +m[3], m: mon, d: +m[2], h: 0, min: 0, s: 0 } : null;
        }
    },
    {
        // Month name DMY: 15 Mar 2024 / 15 March 2024
        name: 'monthNameDMY',
        re: /^(0?[1-9]|[12]\d|3[01])\s+([A-Za-z]+)\s+(\d{4})$/,
        extract(m) {
            const mon = MONTH_NAMES[m[2].toLowerCase()];
            return mon ? { y: +m[3], m: mon, d: +m[1], h: 0, min: 0, s: 0 } : null;
        }
    },
    {
        // Month name with day-of-week: Wed, 15 Mar 2024 / Wednesday, March 15, 2024
        name: 'monthNameWithDow',
        re: /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(.+)$/i,
        extract(m) {
            // Strip day-of-week prefix, then re-parse the remainder
            return tryParseDateInternal(m[1].trim(), null);
        }
    }
];

// Ambiguous numeric pattern: a/b/c or a-b-c or a.b.c (year at end, 2 or 4 digits)
const DATE_NUMERIC_RE = new RegExp(
    /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/.source +
    TIME_SUFFIX.source + '$'
);

function normalizeYear(y) {
    if (y >= 100) return y;
    return y >= 50 ? 1900 + y : 2000 + y;
}

function isValidDate(y, m, d) {
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function buildTimestamp(parts) {
    if (!parts || !isValidDate(parts.y, parts.m, parts.d)) return NaN;
    return new Date(parts.y, parts.m - 1, parts.d, parts.h, parts.min, parts.s).getTime();
}

function tryParseDateInternal(text, dateOrder) {
    // Try unambiguous patterns first
    for (const pat of DATE_PATTERNS_UNAMBIGUOUS) {
        const m = text.match(pat.re);
        if (m) {
            const result = pat.extract(m);
            if (!result) continue;
            // monthNameWithDow returns { timestamp, format } directly
            if (result.timestamp !== undefined) return result;
            const ts = buildTimestamp(result);
            if (!Number.isNaN(ts)) return { timestamp: ts, format: pat.name };
        }
    }

    // Try ambiguous numeric pattern
    const nm = text.match(DATE_NUMERIC_RE);
    if (nm) {
        const a = +nm[1], b = +nm[2], rawY = +nm[3];
        const y = normalizeYear(rawY);
        const h = +nm[4] || 0, min = +nm[5] || 0, s = +nm[6] || 0;

        if (dateOrder === 'dmy') {
            const parts = { y, m: b, d: a, h, min, s };
            const ts = buildTimestamp(parts);
            if (!Number.isNaN(ts)) return { timestamp: ts, format: 'numericDMY' };
        } else if (dateOrder === 'mdy') {
            const parts = { y, m: a, d: b, h, min, s };
            const ts = buildTimestamp(parts);
            if (!Number.isNaN(ts)) return { timestamp: ts, format: 'numericMDY' };
        } else {
            // No hint — try both, prefer whichever is valid
            const mdy = { y, m: a, d: b, h, min, s };
            const dmy = { y, m: b, d: a, h, min, s };
            const mdyOk = isValidDate(y, a, b);
            const dmyOk = isValidDate(y, b, a);
            if (mdyOk && !dmyOk) return { timestamp: buildTimestamp(mdy), format: 'numericMDY' };
            if (dmyOk && !mdyOk) return { timestamp: buildTimestamp(dmy), format: 'numericDMY' };
            if (mdyOk) return { timestamp: buildTimestamp(mdy), format: 'numericAmbiguous' };
        }
    }

    return null;
}

/**
 * Try to parse a date string into a timestamp.
 * @param {string} text - Raw cell text
 * @param {string|null} dateOrder - 'mdy', 'dmy', or null (auto)
 * @returns {{ timestamp: number, format: string } | null}
 */
export function tryParseDate(text, dateOrder) {
    const trimmed = (text ?? '').toString().trim();
    if (!trimmed) return null;
    return tryParseDateInternal(trimmed, dateOrder || null);
}

/**
 * Analyze a column's ambiguous numeric dates to determine MDY vs DMY order.
 * Returns 'mdy', 'dmy', or null if no evidence.
 */
function detectDateOrder(values) {
    let mdyEvidence = 0;
    let dmyEvidence = 0;

    for (const raw of values) {
        const text = (raw ?? '').toString().trim();
        if (!text) continue;

        const nm = text.match(DATE_NUMERIC_RE);
        if (!nm) continue;

        const a = +nm[1], b = +nm[2];
        // If first part > 12, it can't be a month → must be day → DMY
        if (a > 12 && a <= 31 && b >= 1 && b <= 12) dmyEvidence++;
        // If second part > 12, it can't be a month → must be day → MDY
        else if (b > 12 && b <= 31 && a >= 1 && a <= 12) mdyEvidence++;
    }

    if (mdyEvidence > dmyEvidence) return 'mdy';
    if (dmyEvidence > mdyEvidence) return 'dmy';
    return null;
}

// ─── Regex for parsing value + unit ──────────────────────────────────────────

const VALUE_UNIT_RE = /^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*([a-zA-Z\u00B5\u03BC\u2126%/][a-zA-Z\u00B5\u03BC\u2126\d/]*)$/;

// ─── Exported functions ──────────────────────────────────────────────────────

export function parseValueAndUnit(rawText) {
    const text = (rawText ?? '').toString().trim();
    if (!text) {
        return { success: false, value: NaN, unit: '', type: 'empty' };
    }

    const cleaned = text.replace(/,/g, '');

    // Try pure number
    const directNumber = Number(cleaned);
    if (!Number.isNaN(directNumber)) {
        return { success: true, value: directNumber, unit: '', type: 'number' };
    }

    // Try value + unit
    const match = cleaned.match(VALUE_UNIT_RE);
    if (!match) {
        return { success: false, value: NaN, unit: '', type: 'text' };
    }

    const numericValue = Number(match[1]);
    const rawUnit = match[2];

    if (Number.isNaN(numericValue)) {
        return { success: false, value: NaN, unit: rawUnit, type: 'text' };
    }

    // Percent
    if (rawUnit === '%') {
        return { success: true, value: numericValue, unit: '%', type: 'percent' };
    }

    // Lookup unit system
    const lookup = lookupSystem(rawUnit);
    if (lookup) {
        return {
            success: true,
            value: numericValue,
            unit: rawUnit,
            type: lookup.system.name,
            system: lookup.system,
            resolvedUnit: lookup.resolvedUnit
        };
    }

    // Unknown unit — return as generic 'unit' type
    return { success: true, value: numericValue, unit: rawUnit, type: 'unit' };
}

export function convertToBase(numericValue, unitStr, system) {
    if (!system) return NaN;

    const alias = resolveAlias(unitStr);

    // Temperature special handling
    if (typeof system.convertToBase === 'function') {
        const unitKey = system.caseSensitive ? alias : alias;
        // For temperature, try exact case first
        if (system.units[alias] !== undefined) {
            return system.convertToBase(numericValue, alias);
        }
        // Try uppercase first char for single-char units like c→C, f→F
        if (!system.caseSensitive) {
            const upper = alias.toUpperCase();
            if (system.units[upper] !== undefined) {
                return system.convertToBase(numericValue, upper);
            }
        }
        return NaN;
    }

    // Normal factor-based conversion
    let factor;
    if (system.caseSensitive) {
        factor = system.units[alias];
    } else {
        const lower = alias.toLowerCase();
        // Find matching key
        for (const key of Object.keys(system.units)) {
            if (key.toLowerCase() === lower) {
                factor = system.units[key];
                break;
            }
        }
    }

    if (typeof factor !== 'number') return NaN;
    return numericValue * factor;
}

export function getUnitSystemByName(name) {
    return SYSTEM_BY_NAME.get(name) || null;
}

export function detectColumnUnitSystem(values) {
    if (!values || values.length === 0) {
        return { type: 'text', system: null, confidence: 0 };
    }

    let emptyCount = 0;
    let numberCount = 0;
    let percentCount = 0;
    let dateCount = 0;
    let textCount = 0;
    const unitValues = [];          // parsed results with unit info
    const unitStrSet = new Set();    // unique unit strings found

    // First pass: detect date order for the column (MDY vs DMY)
    const dateOrder = detectDateOrder(values);

    for (const raw of values) {
        const text = (raw ?? '').toString().trim();
        if (!text) {
            emptyCount++;
            continue;
        }

        const parsed = parseValueAndUnit(text);

        if (parsed.type === 'empty') {
            emptyCount++;
        } else if (parsed.type === 'number') {
            // Check if 8-digit number could be a compact date (YYYYMMDD)
            if (/^\d{8}$/.test(text)) {
                const dateResult = tryParseDate(text, dateOrder);
                if (dateResult) {
                    dateCount++;
                    continue;
                }
            }
            numberCount++;
        } else if (parsed.type === 'percent') {
            percentCount++;
        } else if (parsed.type === 'text') {
            // Try date
            const dateResult = tryParseDate(text, dateOrder);
            if (dateResult) {
                dateCount++;
            } else {
                textCount++;
            }
        } else if (parsed.success && parsed.unit) {
            // Has a unit (could be known system or generic 'unit')
            unitValues.push(parsed);
            unitStrSet.add(parsed.unit);
        } else {
            textCount++;
        }
    }

    const nonEmpty = values.length - emptyCount;
    if (nonEmpty === 0) return { type: 'text', system: null, confidence: 0 };

    // Quick exits
    if (numberCount === nonEmpty) return { type: 'number', system: null, confidence: 1 };
    if (percentCount === nonEmpty) return { type: 'percent', system: null, confidence: 1 };

    // Date detection: if dates are present and dominant (or clearly more than text)
    if (dateCount > 0 && unitValues.length === 0) {
        // If 50%+ are dates, or dates outnumber text significantly
        if (dateCount >= nonEmpty * 0.5 || (dateCount > textCount && dateCount >= nonEmpty * 0.3)) {
            return { type: 'date', system: null, confidence: dateCount / nonEmpty, dateOrder };
        }
    }

    if (textCount === nonEmpty) return { type: 'text', system: null, confidence: 1 };

    // If no unit values, decide between number and text
    if (unitValues.length === 0) {
        if (numberCount >= textCount && numberCount > 0) {
            return { type: 'number', system: null, confidence: numberCount / nonEmpty };
        }
        return { type: 'text', system: null, confidence: 1 };
    }

    // Score each unit system
    const uniqueUnits = Array.from(unitStrSet);
    let bestSystem = null;
    let bestScore = 0;
    let bestValueScore = 0;

    for (const sys of UNIT_SYSTEMS) {
        let matchedUnits = 0;
        let matchedValues = 0;

        for (const u of uniqueUnits) {
            const alias = resolveAlias(u);
            let found = false;
            if (sys.caseSensitive) {
                found = sys.units[alias] !== undefined;
            } else {
                const lower = alias.toLowerCase();
                found = Object.keys(sys.units).some(k => k.toLowerCase() === lower);
            }
            if (found) matchedUnits++;
        }

        for (const uv of unitValues) {
            const alias = resolveAlias(uv.unit);
            let found = false;
            if (sys.caseSensitive) {
                found = sys.units[alias] !== undefined;
            } else {
                const lower = alias.toLowerCase();
                found = Object.keys(sys.units).some(k => k.toLowerCase() === lower);
            }
            if (found) matchedValues++;
        }

        const unitScore = matchedUnits / uniqueUnits.length;
        const valueScore = matchedValues / unitValues.length;

        if (unitScore > bestScore && valueScore > 0.5) {
            bestScore = unitScore;
            bestValueScore = valueScore;
            bestSystem = sys;
        } else if (unitScore === bestScore && valueScore > bestValueScore) {
            bestValueScore = valueScore;
            bestSystem = sys;
        }
    }

    if (bestSystem && bestScore > 0) {
        return {
            type: bestSystem.name,
            system: bestSystem,
            confidence: bestScore
        };
    }

    // Fallback: mostly numbers with unknown units
    if (numberCount + unitValues.length > textCount) {
        return { type: 'number', system: null, confidence: 0.5 };
    }

    return { type: 'text', system: null, confidence: 0.5 };
}

// Backward-compatible export
export function parseNumberWithUnit(rawText) {
    const result = parseValueAndUnit(rawText);
    // Convert to base value for known unit systems (backward compat)
    if (result.success && result.system) {
        const baseValue = convertToBase(result.value, result.unit, result.system);
        if (!Number.isNaN(baseValue)) {
            return { success: true, value: baseValue, unit: result.unit, type: result.type };
        }
    }
    return { success: result.success, value: result.value, unit: result.unit, type: result.type };
}
