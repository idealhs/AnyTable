function normalizeCollection(collection) {
    return Array.from(collection || []);
}

function detachRow(row) {
    if (!row?.parentNode || typeof row.parentNode.removeChild !== 'function') {
        return;
    }

    row.parentNode.removeChild(row);
}

export function mockCell(text = '', {tagName = 'TD', colSpan = 1, rowSpan = 1} = {}) {
    return {
        textContent: text,
        tagName,
        nodeName: tagName,
        colSpan,
        rowSpan
    };
}

export function mockRow(cells, {hidden = false, isStats = false} = {}) {
    return {
        cells,
        style: {
            display: hidden ? 'none' : ''
        },
        hasAttribute(name) {
            return name === 'data-anytable-stats-row' ? isStats : false;
        }
    };
}

export function mockSection(rows = []) {
    const section = {
        _rows: rows,
        getElementsByTagName(tagName) {
            if (tagName === 'tr') {
                return this._rows;
            }
            return [];
        },
        querySelectorAll(selector) {
            if (selector === 'tr[data-anytable-stats-row]') {
                return this._rows.filter((row) => row.hasAttribute('data-anytable-stats-row'));
            }
            return [];
        },
        querySelector(selector) {
            if (selector === 'tr:not([data-anytable-stats-row])') {
                return this._rows.find((row) => !row.hasAttribute('data-anytable-stats-row')) || null;
            }
            return null;
        },
        appendChild(row) {
            detachRow(row);
            this._rows.push(row);
            row.parentNode = this;
            return row;
        },
        insertBefore(row, referenceRow) {
            detachRow(row);
            const referenceIndex = this._rows.indexOf(referenceRow);
            const targetIndex = referenceIndex >= 0 ? referenceIndex : this._rows.length;
            this._rows.splice(targetIndex, 0, row);
            row.parentNode = this;
            return row;
        },
        removeChild(row) {
            const rowIndex = this._rows.indexOf(row);
            if (rowIndex >= 0) {
                this._rows.splice(rowIndex, 1);
                row.parentNode = null;
            }
            return row;
        }
    };

    Object.defineProperty(section, 'firstChild', {
        get() {
            return this._rows[0] || null;
        }
    });

    rows.forEach((row) => {
        row.parentNode = section;
    });

    return section;
}

export function mockTable({theadRows = [], bodySections = [], tfootRows = [], captionText = ''} = {}) {
    const theadSections = theadRows.length > 0 ? [mockSection(theadRows)] : [];
    const tbodySections = bodySections.map((rows) => mockSection(rows));
    const tfootSections = tfootRows.length > 0 ? [mockSection(tfootRows)] : [];

    function getAllRows() {
        return [
            ...theadSections.flatMap((section) => normalizeCollection(section.getElementsByTagName('tr'))),
            ...tbodySections.flatMap((section) => normalizeCollection(section.getElementsByTagName('tr'))),
            ...tfootSections.flatMap((section) => normalizeCollection(section.getElementsByTagName('tr')))
        ];
    }

    return {
        caption: captionText ? {textContent: captionText} : null,
        getElementsByTagName(tagName) {
            if (tagName === 'thead') {
                return theadSections;
            }
            if (tagName === 'tbody') {
                return tbodySections;
            }
            if (tagName === 'tfoot') {
                return tfootSections;
            }
            if (tagName === 'tr') {
                return getAllRows();
            }
            if (tagName === 'th') {
                return getAllRows().flatMap((row) => row.cells.filter((cell) => {
                    const cellTagName = cell.tagName || cell.nodeName;
                    return typeof cellTagName === 'string' && cellTagName.toUpperCase() === 'TH';
                }));
            }
            return [];
        }
    };
}
