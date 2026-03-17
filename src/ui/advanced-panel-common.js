import { escapeHtml, translate } from './panel-utils.js';

export function createPanelNodeId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getPanelColumnLabel(columnTitles, columnIndex) {
    return columnTitles[columnIndex]
        || translate('advancedPanel.common.columnFallback', {index: columnIndex + 1});
}

export function buildSelectButtonHtml(className, value, label) {
    return `<button type="button" class="anytable-adv-select-btn ${className}" data-value="${escapeHtml(String(value))}" aria-expanded="false">${escapeHtml(label)}</button>`;
}

export function buildColumnOptionGroups(columnTitles, isDisabled = () => false) {
    return [columnTitles.map((title, index) => ({
        value: String(index),
        label: getPanelColumnLabel(columnTitles, index),
        disabled: Boolean(isDisabled(index))
    }))];
}
