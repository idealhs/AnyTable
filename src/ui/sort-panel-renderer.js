import { detectColumnUnitSystem } from '../core/type-parser.js';
import { fitDropdownButtonWidth, getDropdownButtonValue, setDropdownButtonValue } from './dropdown-popup.js';
import { buildColumnOptionGroups, buildSelectButtonHtml, getPanelColumnLabel } from './advanced-panel-common.js';
import { translate } from './panel-utils.js';

const SORT_TYPE_GROUPS = [
    ['auto'],
    ['number', 'text', 'date', 'percent'],
    ['duration', 'mass', 'length', 'area', 'volume', 'speed',
        'temperature', 'pressure', 'energy', 'power', 'voltage',
        'current', 'resistance', 'frequency', 'dataSize', 'bitrate']
];

function detectColumnType(values) {
    if (!values || values.length === 0) {
        return 'text';
    }

    return detectColumnUnitSystem(values).type;
}

export function getSortTypeLabel(type) {
    return translate(`advancedPanel.sort.type.${type}`) || type;
}

export function getSortDirectionLabel(direction) {
    const text = direction === 'desc'
        ? translate('advancedPanel.sort.direction.desc')
        : translate('advancedPanel.sort.direction.asc');
    const arrow = direction === 'desc' ? ' \u2193' : ' \u2191';
    return text + arrow;
}

export function getSortTypeOptionGroups() {
    return SORT_TYPE_GROUPS.map((group) => group.map((type) => ({
        value: type,
        label: getSortTypeLabel(type)
    })));
}

export function getSortColumnOptionGroups(columnTitles, usedColumns, currentColumn) {
    return buildColumnOptionGroups(
        columnTitles,
        (columnIndex) => columnIndex !== currentColumn && usedColumns.has(columnIndex)
    );
}

export function getSortTypeButtonLabel(type, getColumnValues, columnIndex) {
    if (type === 'auto') {
        let detectedLabel = '';
        if (typeof getColumnValues === 'function') {
            const values = getColumnValues(columnIndex);
            detectedLabel = getSortTypeLabel(detectColumnType(values));
        }

        return translate('advancedPanel.sort.typeButton.autoFormat', {type: detectedLabel || '...'});
    }

    return getSortTypeLabel(type);
}

export function updateSortTypeButtonLabel(rowElement, getColumnValues, minWidth = 0) {
    const typeButton = rowElement.querySelector('.anytable-adv-sort-type-btn');
    const columnButton = rowElement.querySelector('.anytable-adv-sort-column');
    if (!typeButton) {
        return;
    }

    const type = getDropdownButtonValue(typeButton) || 'auto';
    const columnIndex = Number(getDropdownButtonValue(columnButton));
    setDropdownButtonValue(typeButton, type, getSortTypeButtonLabel(type, getColumnValues, columnIndex), {minWidth});
}

export function fitSortColumnButton(columnButton, minWidth) {
    fitDropdownButtonWidth(columnButton, minWidth);
}

export function buildSortRuleRowHtml(columnTitles, rule) {
    const column = Number.isInteger(rule?.column) ? rule.column : 0;
    const direction = rule?.direction === 'desc' ? 'desc' : 'asc';
    const type = rule?.type || 'auto';

    return `
        <div class="anytable-adv-sort-row" data-sort-id="${rule.id}">
            <div class="anytable-adv-sort-grid">
                ${buildSelectButtonHtml('anytable-adv-sort-column', column, getPanelColumnLabel(columnTitles, column))}
                <button type="button" class="anytable-adv-sort-direction" data-sort-direction="${direction}">${getSortDirectionLabel(direction)}</button>
                ${buildSelectButtonHtml('anytable-adv-sort-type-btn', type, getSortTypeLabel(type))}
                <button type="button" class="anytable-adv-remove-sort-rule">${translate('advancedPanel.common.delete')}</button>
            </div>
        </div>
    `;
}
