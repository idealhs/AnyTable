import { getDropdownButtonValue } from './dropdown-popup.js';
import { translate } from './panel-utils.js';

export function parseSortRuleRow(rowElement) {
    const column = Number(getDropdownButtonValue(rowElement.querySelector('.anytable-adv-sort-column')));
    if (Number.isNaN(column)) {
        return {error: translate('advancedPanel.sort.errors.invalidColumn')};
    }

    const directionButton = rowElement.querySelector('.anytable-adv-sort-direction');
    const typeButton = rowElement.querySelector('.anytable-adv-sort-type-btn');

    return {
        rule: {
            column,
            direction: directionButton.getAttribute('data-sort-direction') === 'desc' ? 'desc' : 'asc',
            type: getDropdownButtonValue(typeButton) || 'auto',
            unitConfig: null
        }
    };
}
