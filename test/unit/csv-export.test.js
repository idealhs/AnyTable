import { describe, expect, it, vi } from 'vitest';
import {
    buildTableCsvFilename,
    collectVisibleTableRows,
    downloadTableAsCsv,
    serializeRowsToCsv
} from '../../src/core/csv-export.js';

function mockCell(text = '', colSpan = 1) {
    return {
        textContent: text,
        colSpan
    };
}

function mockRow(cells, {hidden = false, isStats = false} = {}) {
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

function mockTable(rows, captionText = '') {
    return {
        caption: captionText ? {textContent: captionText} : null,
        getElementsByTagName(tagName) {
            if (tagName === 'tr') {
                return rows;
            }
            return [];
        }
    };
}

describe('collectVisibleTableRows', () => {
    it('collects visible rows, skips stats rows, and expands colSpan', () => {
        const table = mockTable([
            mockRow([mockCell('名称'), mockCell('数量'), mockCell('类别')]),
            mockRow([mockCell('苹果'), mockCell('12'), mockCell('水果')]),
            mockRow([mockCell('香蕉'), mockCell('9'), mockCell('水果')], {hidden: true}),
            mockRow([mockCell('合计', 2), mockCell('完成')]),
            mockRow([mockCell('统计'), mockCell('2'), mockCell('')], {isStats: true})
        ]);

        expect(collectVisibleTableRows(table)).toEqual([
            ['名称', '数量', '类别'],
            ['苹果', '12', '水果'],
            ['合计', '合计', '完成']
        ]);
    });
});

describe('serializeRowsToCsv', () => {
    it('keeps simple fields unquoted and only quotes fields with special characters', () => {
        const csv = serializeRowsToCsv([
            ['Name', 'Notes'],
            ['Alice', 'He said "Hi", then left\nlater'],
            ['Bob', 'plain text']
        ]);

        expect(csv).toBe(
            'Name,Notes\r\nAlice,"He said ""Hi"", then left\nlater"\r\nBob,plain text'
        );
    });
});

describe('buildTableCsvFilename', () => {
    it('uses the table caption when available and appends the table index', () => {
        const firstTable = {};
        const targetTable = {
            caption: {
                textContent: '月度/销售:汇总'
            }
        };

        const filename = buildTableCsvFilename(targetTable, {
            documentRef: {
                title: '忽略这个标题',
                querySelectorAll: () => [firstTable, targetTable]
            }
        });

        expect(filename).toBe('月度 销售 汇总-table-2.csv');
    });
});

describe('downloadTableAsCsv', () => {
    it('creates a csv blob and triggers a download link click', () => {
        const table = mockTable([
            mockRow([mockCell('名称'), mockCell('数量')]),
            mockRow([mockCell('苹果'), mockCell('12')])
        ], '库存报表');

        const link = {
            style: {},
            click: vi.fn(),
            remove: vi.fn()
        };

        const documentRef = {
            title: '页面标题',
            body: {
                appendChild(node) {
                    node.parentNode = this;
                    return node;
                }
            },
            createElement(tagName) {
                if (tagName !== 'a') {
                    throw new Error(`Unexpected tag: ${tagName}`);
                }
                return link;
            },
            querySelectorAll: () => [table]
        };

        const urlRef = {
            createObjectURL: vi.fn(() => 'blob:anytable'),
            revokeObjectURL: vi.fn()
        };

        class FakeBlob {
            constructor(parts, options) {
                this.parts = parts;
                this.options = options;
            }
        }

        const filename = downloadTableAsCsv(table, {
            documentRef,
            urlRef,
            blobCtor: FakeBlob
        });

        expect(filename).toBe('库存报表-table-1.csv');
        expect(urlRef.createObjectURL).toHaveBeenCalledTimes(1);
        const blob = urlRef.createObjectURL.mock.calls[0][0];
        expect(blob.options).toEqual({type: 'text/csv;charset=utf-8;'});
        expect(blob.parts[0]).toBe('名称,数量\r\n苹果,12');
        expect(link.href).toBe('blob:anytable');
        expect(link.download).toBe('库存报表-table-1.csv');
        expect(link.rel).toBe('noopener');
        expect(link.click).toHaveBeenCalledTimes(1);
        expect(link.remove).toHaveBeenCalledTimes(1);
        expect(urlRef.revokeObjectURL).toHaveBeenCalledWith('blob:anytable');
    });
});
