import i18n from '../i18n/i18n.js';
import {
    getOwnedDataRowsInSection,
    getOwnedStatsRowsInSection,
    getOwnedTableBodySections
} from '../core/table-boundary.js';

function removeRow(row) {
    if (!row) return;
    if (typeof row.remove === 'function') {
        row.remove();
        return;
    }
    if (row.parentNode && typeof row.parentNode.removeChild === 'function') {
        row.parentNode.removeChild(row);
    }
}

function formatStatValue(value) {
    if (value === null || value === undefined) return '-';
    if (Number.isInteger(value)) return String(value);
    // Keep up to 4 significant decimals
    const str = value.toPrecision(Math.max(1, Math.floor(Math.log10(Math.abs(value))) + 5));
    return String(parseFloat(str));
}

function getStatTypeLabel(statType) {
    return i18n.t(`advancedPanel.statistics.type.${statType}`) || statType;
}

function applyStatisticsRowStyles(row) {
    row.style.background = '#f0f7ff';
    row.style.borderBottom = '1px solid #d0e3f7';
    row.style.fontSize = '12px';
    row.style.fontWeight = '500';
}

function applyStatisticsCellStyles(cell) {
    cell.style.padding = '4px 8px';
    cell.style.color = '#1a5276';
    cell.style.whiteSpace = 'nowrap';
}

export function renderStatisticsRows(table, statsData, totalColumns) {
    removeStatisticsRows(table);

    const tbody = getOwnedTableBodySections(table)[0];
    if (!tbody || statsData.size === 0) return;

    const firstDataRow = getOwnedDataRowsInSection(table, tbody)[0] || null;

    for (const [statType, columnMap] of statsData) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-anytable-stats-row', statType);
        tr.className = 'anytable-stats-row';
        applyStatisticsRowStyles(tr);

        for (let i = 0; i < totalColumns; i++) {
            const td = document.createElement('td');
            td.className = 'anytable-stats-cell';
            applyStatisticsCellStyles(td);
            if (columnMap.has(i)) {
                const label = getStatTypeLabel(statType);
                const val = formatStatValue(columnMap.get(i));
                td.textContent = `${label}：${val}`;
            }
            tr.appendChild(td);
        }

        if (firstDataRow) {
            tbody.insertBefore(tr, firstDataRow);
        } else {
            tbody.appendChild(tr);
        }
    }
}

export function removeStatisticsRows(table) {
    getOwnedTableBodySections(table).forEach((tbody) => {
        const statsRows = getOwnedStatsRowsInSection(table, tbody);
        for (const row of statsRows) {
            removeRow(row);
        }
    });
}
