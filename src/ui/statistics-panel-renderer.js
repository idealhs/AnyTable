import { buildColumnOptionGroups, buildSelectButtonHtml, getPanelColumnLabel } from './advanced-panel-common.js';
import { translate } from './panel-utils.js';

const STAT_TYPES = ['count', 'sum', 'average', 'median', 'min', 'max', 'range', 'variance', 'stddev'];

export function getStatisticsTypeLabel(type) {
    return translate(`advancedPanel.statistics.type.${type}`) || type;
}

export function getStatisticsColumnOptionGroups(columnTitles) {
    return buildColumnOptionGroups(columnTitles);
}

export function getStatisticsTypeOptionGroups() {
    return [STAT_TYPES.map((type) => ({
        value: type,
        label: getStatisticsTypeLabel(type)
    }))];
}

export function buildStatisticsRuleRowHtml(columnTitles, rule) {
    const column = Number.isInteger(rule?.column) ? rule.column : 0;
    const statType = rule?.statType || 'count';

    return `
        <div class="anytable-adv-sort-row" data-stats-id="${rule.id}">
            <div class="anytable-adv-sort-grid">
                ${buildSelectButtonHtml('anytable-adv-stats-column', column, getPanelColumnLabel(columnTitles, column))}
                ${buildSelectButtonHtml('anytable-adv-stats-type', statType, getStatisticsTypeLabel(statType))}
                <button type="button" class="anytable-adv-remove-sort-rule">${translate('advancedPanel.common.delete')}</button>
            </div>
        </div>
    `;
}
