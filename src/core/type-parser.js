const TIME_UNIT_FACTORS = Object.freeze({
    ms: 1,
    s: 1000,
    sec: 1000,
    second: 1000,
    seconds: 1000,
    m: 60000,
    min: 60000,
    minute: 60000,
    minutes: 60000,
    h: 3600000,
    hr: 3600000,
    hour: 3600000,
    hours: 3600000
});

const WEIGHT_UNIT_FACTORS = Object.freeze({
    mg: 0.001,
    g: 1,
    kg: 1000,
    t: 1000000
});

function normalizeUnit(unit) {
    return (unit || '').toString().trim().toLowerCase();
}

export function parseNumberWithUnit(rawText) {
    const text = (rawText || '').toString().trim();
    if (!text) {
        return {
            success: false,
            value: NaN,
            unit: '',
            type: 'empty'
        };
    }

    const cleaned = text.replace(/,/g, '');
    const directNumber = Number(cleaned);
    if (!Number.isNaN(directNumber)) {
        return {
            success: true,
            value: directNumber,
            unit: '',
            type: 'number'
        };
    }

    const match = cleaned.match(/^([-+]?\d*\.?\d+)\s*([a-zA-Z%]+)$/);
    if (!match) {
        return {
            success: false,
            value: NaN,
            unit: '',
            type: 'text'
        };
    }

    const numericValue = Number(match[1]);
    const unit = normalizeUnit(match[2]);

    if (Number.isNaN(numericValue)) {
        return {
            success: false,
            value: NaN,
            unit,
            type: 'text'
        };
    }

    if (unit === '%') {
        return {
            success: true,
            value: numericValue,
            unit,
            type: 'percent'
        };
    }

    if (TIME_UNIT_FACTORS[unit]) {
        return {
            success: true,
            value: numericValue * TIME_UNIT_FACTORS[unit],
            unit,
            type: 'time'
        };
    }

    if (WEIGHT_UNIT_FACTORS[unit]) {
        return {
            success: true,
            value: numericValue * WEIGHT_UNIT_FACTORS[unit],
            unit,
            type: 'weight'
        };
    }

    return {
        success: true,
        value: numericValue,
        unit,
        type: 'unit'
    };
}

