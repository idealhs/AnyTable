import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('advanced-panel-common', () => {
    let buildColumnOptionGroups;
    let getPanelColumnLabel;

    beforeEach(async () => {
        vi.resetModules();
        vi.doMock('../../src/i18n/i18n.js', () => ({
            default: {
                t: (key) => {
                    if (key === 'advancedPanel.common.columnFallback') {
                        return '列{index}';
                    }
                    if (key === 'advancedPanel.common.duplicateColumnFormat') {
                        return '{label}（第{index}列）';
                    }
                    return key;
                }
            }
        }));

        ({ buildColumnOptionGroups, getPanelColumnLabel } = await import('../../src/ui/advanced-panel-common.js'));
    });

    it('disambiguates duplicated logical column titles with their logical index', () => {
        expect(getPanelColumnLabel(['姓名', '姓名', '绩效'], 0)).toBe('姓名（第1列）');
        expect(getPanelColumnLabel(['姓名', '姓名', '绩效'], 1)).toBe('姓名（第2列）');
        expect(getPanelColumnLabel(['姓名', '姓名', '绩效'], 2)).toBe('绩效');
    });

    it('keeps unique labels unchanged and still supports fallback labels', () => {
        expect(getPanelColumnLabel(['部门', '', '城市'], 0)).toBe('部门');
        expect(getPanelColumnLabel(['部门', '', '城市'], 1)).toBe('列2');
        expect(buildColumnOptionGroups(['姓名', '姓名'])[0]).toEqual([
            { value: '0', label: '姓名（第1列）', disabled: false },
            { value: '1', label: '姓名（第2列）', disabled: false }
        ]);
    });
});
