function safeToLowerCase(value) {
    return (value ?? '').toString().toLowerCase();
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return NaN;
    const normalized = value.toString().replace(/,/g, '').trim();
    return Number(normalized);
}

function evaluateLeafRule(cellText, rule) {
    const comparator = rule?.comparator;
    const rawValue = rule?.value ?? '';
    const options = rule?.options || {};

    const normalizedCellText = (cellText ?? '').toString();
    const lowerCellText = safeToLowerCase(normalizedCellText);
    const lowerRuleValue = safeToLowerCase(rawValue);

    switch (comparator) {
        case 'contains':
            return lowerCellText.includes(lowerRuleValue);
        case 'startsWith':
            return lowerCellText.startsWith(lowerRuleValue);
        case 'endsWith':
            return lowerCellText.endsWith(lowerRuleValue);
        case 'equals':
            return lowerCellText === lowerRuleValue;
        case 'regex': {
            try {
                const pattern = rawValue.toString();
                const flags = options.flags || '';
                const regex = new RegExp(pattern, flags);
                return regex.test(normalizedCellText);
            } catch (error) {
                return false;
            }
        }
        case 'isEmpty':
            return normalizedCellText.trim() === '';
        case 'isNotEmpty':
            return normalizedCellText.trim() !== '';
        case '>':
        case '>=':
        case '<':
        case '<=':
        case 'between': {
            const cellNumber = toNumber(normalizedCellText);
            if (Number.isNaN(cellNumber)) return false;

            if (comparator === 'between') {
                const min = toNumber(options.min);
                const max = toNumber(options.max);
                if (Number.isNaN(min) || Number.isNaN(max)) return false;
                return cellNumber >= min && cellNumber <= max;
            }

            const targetNumber = toNumber(rawValue);
            if (Number.isNaN(targetNumber)) return false;

            if (comparator === '>') return cellNumber > targetNumber;
            if (comparator === '>=') return cellNumber >= targetNumber;
            if (comparator === '<') return cellNumber < targetNumber;
            return cellNumber <= targetNumber;
        }
        default:
            return lowerCellText.includes(lowerRuleValue);
    }
}

function evaluateRuleTree(row, ruleNode) {
    if (!ruleNode) return true;

    if (Array.isArray(ruleNode.children)) {
        const children = ruleNode.children;
        if (children.length === 0) return true;

        let result;
        const hasPerRuleOperator = children.some((child) => child.operator);
        if (hasPerRuleOperator || !ruleNode.operator) {
            result = evaluateRuleTree(row, children[0]);
            for (let i = 1; i < children.length; i++) {
                const childResult = evaluateRuleTree(row, children[i]);
                if (children[i].operator === 'OR') {
                    result = result || childResult;
                } else {
                    result = result && childResult;
                }
            }
        } else {
            const operator = ruleNode.operator === 'OR' ? 'OR' : 'AND';
            if (operator === 'OR') {
                result = children.some((child) => evaluateRuleTree(row, child));
            } else {
                result = children.every((child) => evaluateRuleTree(row, child));
            }
        }

        if (ruleNode.negated) {
            result = !result;
        }
        return result;
    }

    const columnIndex = Number(ruleNode.column);
    const cellText = row.cells[columnIndex]?.textContent ?? '';
    let result = evaluateLeafRule(cellText, ruleNode);
    if (ruleNode.negated) {
        result = !result;
    }
    return result;
}

export function matchesBasicFilters(row, filterValues) {
    for (let index = 0; index < row.cells.length; index++) {
        const filterValue = safeToLowerCase(filterValues[index]);
        if (!filterValue) continue;

        const cellText = safeToLowerCase(row.cells[index]?.textContent);
        if (!cellText.includes(filterValue)) {
            return false;
        }
    }
    return true;
}

export function matchesRuleTree(row, ruleGroup) {
    if (!ruleGroup || !Array.isArray(ruleGroup.children) || ruleGroup.children.length === 0) {
        return true;
    }

    return evaluateRuleTree(row, ruleGroup);
}

export function applyCombinedFilters(table, filterValues = {}, advancedRuleGroup = null) {
    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    const rows = Array.from(tbody.getElementsByTagName('tr'));
    rows.forEach((row) => {
        const basicMatched = matchesBasicFilters(row, filterValues || {});
        const advancedMatched = matchesRuleTree(row, advancedRuleGroup);
        row.style.display = basicMatched && advancedMatched ? '' : 'none';
    });
}

export function applyBasicFilters(table, filterValues) {
    applyCombinedFilters(table, filterValues, null);
}

export function applyAdvancedFilterTree(table, ruleGroup) {
    applyCombinedFilters(table, {}, ruleGroup);
}

export function compileRuleTree(ruleGroup) {
    return (row) => evaluateRuleTree(row, ruleGroup);
}
