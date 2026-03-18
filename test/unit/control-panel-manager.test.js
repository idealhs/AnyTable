import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCell, mockRow, mockTable } from './helpers/mock-table.js';

describe('ControlPanelManager', () => {
    let ControlPanelManager;

    beforeEach(async () => {
        vi.resetModules();
        vi.doMock('../../src/i18n/i18n.js', () => ({
            default: {
                t: vi.fn((key) => key)
            }
        }));

        ({ ControlPanelManager } = await import('../../src/control-panel-manager.js'));
    });

    it('attaches basic controls only to logically actionable columns under colspan headers', () => {
        const mergedNameHeader = mockCell('姓名', {tagName: 'TH', colSpan: 2});
        const scoreHeader = mockCell('绩效', {tagName: 'TH'});
        const cityHeader = mockCell('城市', {tagName: 'TH'});
        const table = mockTable({
            theadRows: [mockRow([
                mergedNameHeader,
                scoreHeader,
                cityHeader
            ])],
            bodySections: [[
                mockRow([mockCell('张'), mockCell('三'), mockCell('88'), mockCell('上海')])
            ]]
        });
        const manager = new ControlPanelManager({
            stateStore: {
                getAdvancedFilterRules: vi.fn(() => null),
                getFilterValues: vi.fn(() => ({}))
            },
            onSort: vi.fn(),
            onFilterChange: vi.fn(),
            setSortButtonIcon: vi.fn(),
            setFilterToggleButtonIcon: vi.fn()
        });

        const createHeaderControlSpy = vi.spyOn(manager, 'createHeaderControl')
            .mockImplementation((currentTable, header, columnIndex) => ({
                table: currentTable,
                header,
                columnIndex
            }));
        vi.spyOn(manager, 'setFilterInputsDisabledState').mockImplementation(() => {});
        vi.spyOn(manager, 'refreshFilterButtons').mockImplementation(() => {});

        manager.attachTableControls(table);

        expect(createHeaderControlSpy).toHaveBeenCalledTimes(2);
        expect(createHeaderControlSpy).toHaveBeenNthCalledWith(1, table, scoreHeader, 2);
        expect(createHeaderControlSpy).toHaveBeenNthCalledWith(2, table, cityHeader, 3);
        expect(manager.getHeaderControl(table, 0)).toBeNull();
        expect(manager.getHeaderControl(table, 1)).toBeNull();
        expect(manager.getHeaderControl(table, 2)).toEqual(expect.objectContaining({
            header: scoreHeader,
            columnIndex: 2
        }));
        expect(manager.getHeaderControl(table, 3)).toEqual(expect.objectContaining({
            header: cityHeader,
            columnIndex: 3
        }));
    });
});
