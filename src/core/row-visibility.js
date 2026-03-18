const FILTER_HIDDEN_ATTRIBUTE = 'data-anytable-filter-hidden';
const FILTER_HIDDEN_FALLBACK_KEY = '__anytableFilterHidden';
const GLOBAL_ROW_VISIBILITY_STYLE_ID = 'anytable-row-visibility-style';
const GLOBAL_ROW_VISIBILITY_STYLE = `[${FILTER_HIDDEN_ATTRIBUTE}="true"] { display: none !important; }`;

function readFilterHiddenFallback(row) {
    return row?.[FILTER_HIDDEN_FALLBACK_KEY] === true;
}

function ensureGlobalRowVisibilityStyle(documentRef) {
    if (!documentRef?.createElement) {
        return;
    }

    if (typeof documentRef.getElementById === 'function'
        && documentRef.getElementById(GLOBAL_ROW_VISIBILITY_STYLE_ID)) {
        return;
    }

    const mountTarget = documentRef.head || documentRef.documentElement || documentRef.body;
    if (!mountTarget || typeof mountTarget.appendChild !== 'function') {
        return;
    }

    const style = documentRef.createElement('style');
    style.id = GLOBAL_ROW_VISIBILITY_STYLE_ID;
    style.textContent = GLOBAL_ROW_VISIBILITY_STYLE;
    mountTarget.appendChild(style);
}

export function markRowAsFilterHidden(row) {
    if (!row) {
        return;
    }

    ensureGlobalRowVisibilityStyle(row.ownerDocument || globalThis.document);

    if (typeof row.setAttribute === 'function') {
        row.setAttribute(FILTER_HIDDEN_ATTRIBUTE, 'true');
        return;
    }

    row[FILTER_HIDDEN_FALLBACK_KEY] = true;
}

export function clearRowFilterHidden(row) {
    if (!row) {
        return;
    }

    if (typeof row.removeAttribute === 'function') {
        row.removeAttribute(FILTER_HIDDEN_ATTRIBUTE);
    }

    delete row[FILTER_HIDDEN_FALLBACK_KEY];
}

export function isRowHiddenByFilter(row) {
    if (!row) {
        return false;
    }

    if (typeof row.getAttribute === 'function') {
        return row.getAttribute(FILTER_HIDDEN_ATTRIBUTE) === 'true';
    }

    if (typeof row.hasAttribute === 'function' && row.hasAttribute(FILTER_HIDDEN_ATTRIBUTE)) {
        return true;
    }

    return readFilterHiddenFallback(row);
}

export function isRowHiddenByHost(row) {
    if (!row) {
        return false;
    }

    if (row.hidden === true) {
        return true;
    }

    if (row.style?.display === 'none') {
        return true;
    }

    if (isRowHiddenByFilter(row)) {
        return false;
    }

    if (typeof getComputedStyle === 'function' && row.nodeType === 1) {
        return getComputedStyle(row).display === 'none';
    }

    return false;
}

export function isRowVisible(row) {
    return Boolean(row) && !isRowHiddenByFilter(row) && !isRowHiddenByHost(row);
}
