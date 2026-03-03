// 导入 i18n
import i18n from './i18n/i18n.js';
import { MessageAction } from './constants/messages.js';
import { TableStateStore } from './state/table-state.js';
import { applyCombinedFilters } from './core/filter-engine.js';
import { buildNextSortRules, normalizeAdvancedSortRules, sortRowsByRules } from './core/sort-engine.js';
import { openAdvancedFilterPanel, openAdvancedSortPanel } from './ui/advanced-panel.js';

const MATERIAL_ICON_PATHS = {
    sortAsc: 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12 12 4z',
    sortDesc: 'M4 12l1.41-1.41L11 16.17V4h2v12.17l5.58-5.59L20 12l-8 8z',
    sortNone: 'M12 5.83L15.17 9 16.59 7.59 12 3 7.41 7.59 8.83 9zm0 12.34L8.83 15l-1.42 1.41L12 21l4.59-4.59L15.17 15z',
    expandClosed: 'M7.41 8.59 12 13.17 16.59 8.59 18 10l-6 6-6-6z',
    expandOpened: 'M7.41 15.41 12 10.83 16.59 15.41 18 14l-6-6-6 6z',
    advancedFilter: 'M3 17v2h6v-2H3zm0-12v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zm-4-8H3v2h6v2h2v-6H9v2zm12 2v-2h-6v2h6zm-4-8V5h4V3h-4V1h-2v6h2z',
    advancedSort: 'M16 17.01V10h-2v7.01h-3L15 21l4-3.99zM9 3 5 6.99h3V14h2V6.99h3z'
};

// 表格增强功能的主要实现
class TableEnhancer {
    constructor() {
        this.enhancedTables = new Set();
        this.stateStore = new TableStateStore();
        this.isPicking = false; // 是否处于选择模式
        this.selectedTables = new Set(); // 存储用户选择的表格
        this.autoEnhance = true; // 是否自动增强所有表格
        this.multiColumnSort = false; // 是否启用多列排序
        // 绑定方法到实例
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.sortTable = this.sortTable.bind(this);
        // 初始化 i18n 并设置事件监听
        this.initI18n();
    }

    // 初始化 i18n
    async initI18n() {
        await i18n.init();
        // 监听语言变更事件
        window.addEventListener('localeChanged', () => this.updateAllTexts());
        // 初始化完成后立即更新一次文本
        this.updateAllTexts();
    }

    // 更新所有文本
    updateAllTexts() {
        // 更新所有表格的文本
        this.enhancedTables.forEach(table => {
            const headers = table.getElementsByTagName('th');
            Array.from(headers).forEach((header, index) => {
                const expandButton = header.querySelector('.anytable-expand-button');
                if (expandButton) {
                    expandButton.title = i18n.t('columnControl.title');
                }

                const controlPanel = header.querySelector('.anytable-control-panel');
                if (controlPanel) {
                    const filterInput = controlPanel.querySelector('.filter-input');
                    if (filterInput) {
                        filterInput.placeholder = i18n.t('columnControl.filter.placeholder');
                    }

                    const advancedFilterButton = controlPanel.querySelector('.advanced-buttons .control-button:nth-child(1)');
                    if (advancedFilterButton) {
                        advancedFilterButton.title = i18n.t('columnControl.filter.advanced');
                    }

                    const sortButton = header.querySelector('.anytable-sort-button');
                    if (sortButton) {
                        const rules = this.stateStore.getSortRules(table);
                        const rule = rules.find(r => r.column === index);
                        if (rule) {
                            sortButton.title = rule.direction === 'asc' ? i18n.t('columnControl.sort.ascending') :
                                            rule.direction === 'desc' ? i18n.t('columnControl.sort.descending') :
                                            i18n.t('columnControl.sort.none');
                        } else {
                            sortButton.title = i18n.t('columnControl.sort.none');
                        }
                    }

                    const advancedSortButton = controlPanel.querySelector('.advanced-buttons .control-button:nth-child(2)');
                    if (advancedSortButton) {
                        advancedSortButton.title = i18n.t('columnControl.sort.advanced');
                    }
                }
            });
        });
    }

    createMaterialIconSvg(pathData) {
        return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${pathData}"></path></svg>`;
    }

    setButtonIcon(button, iconKey) {
        const pathData = MATERIAL_ICON_PATHS[iconKey];
        if (!pathData || !button) return;
        button.innerHTML = this.createMaterialIconSvg(pathData);
    }

    setSortButtonIcon(button, direction) {
        if (!button) return;
        const iconKey = direction === 'asc' ? 'sortAsc' :
            direction === 'desc' ? 'sortDesc' : 'sortNone';
        this.setButtonIcon(button, iconKey);
    }

    setExpandButtonIcon(button, expanded) {
        if (!button) return;
        this.setButtonIcon(button, expanded ? 'expandOpened' : 'expandClosed');
    }

    getColumnTitles(table) {
        const headers = table.getElementsByTagName('th');
        return Array.from(headers).map((header, index) => {
            const headerText = header.childNodes[0]?.textContent?.trim() || header.textContent?.trim() || '';
            return headerText || `列${index + 1}`;
        });
    }

    applyAllFilters(table) {
        const filterValues = this.stateStore.getFilterValues(table);
        const advancedRuleGroup = this.stateStore.getAdvancedFilterRules(table);
        applyCombinedFilters(table, filterValues, advancedRuleGroup);
    }

    applySortRules(table, rules) {
        const tbody = table.getElementsByTagName('tbody')[0];
        if (!tbody) return;

        if (!Array.isArray(rules) || rules.length === 0) {
            const originalRows = this.stateStore.getOriginalRows(table);
            if (originalRows) {
                while (tbody.firstChild) {
                    tbody.removeChild(tbody.firstChild);
                }
                originalRows.forEach(row => tbody.appendChild(row));
            }
            return;
        }

        const rows = Array.from(tbody.getElementsByTagName('tr'));
        const sortedRows = sortRowsByRules(rows, rules);
        sortedRows.forEach(row => tbody.appendChild(row));
    }

    applyAdvancedSort(table, advancedRules) {
        const normalizedRules = normalizeAdvancedSortRules(advancedRules);
        if (!this.multiColumnSort && normalizedRules.length > 0) {
            normalizedRules.splice(1);
        }

        this.stateStore.setAdvancedSortRules(table, normalizedRules);
        this.stateStore.setSortRules(table, normalizedRules);

        const headers = table.getElementsByTagName('th');
        Array.from(headers).forEach((header, index) => {
            this.updateSortButton(table, index, 'none');
        });

        normalizedRules.forEach((rule) => {
            this.updateSortButton(table, rule.column, rule.direction);
        });

        this.applySortRules(table, normalizedRules);
    }

    // 初始化表格增强功能
    async init() {
        // 加载设置
        const browser = window.browser || chrome;
        const result = await browser.storage.local.get(['autoEnhance', 'multiColumnSort']);
        this.autoEnhance = result.autoEnhance !== false; // 默认为 true
        this.multiColumnSort = result.multiColumnSort === true; // 默认为 false

        // 监听来自 popup 的消息
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // 使用 Promise 处理异步操作
            const handleMessage = async () => {
                try {
                    switch (request.action) {
                        case MessageAction.START_PICKING:
                            this.startPicking();
                            return {success: true};
                        case MessageAction.CLEAR_SELECTION:
                            this.clearSelection();
                            return {success: true};
                        case MessageAction.GET_SELECTION_STATE:
                            return {hasSelection: this.selectedTables.size > 0};
                        case MessageAction.SET_AUTO_ENHANCE:
                            this.autoEnhance = request.enabled;
                            if (request.enabled) {
                                // 如果启用自动增强，增强所有未增强的表格
                                const tables = document.getElementsByTagName('table');
                                for (const table of tables) {
                                    if (!this.enhancedTables.has(table)) {
                                        this.enhanceTable(table);
                                    }
                                }
                            } else {
                                // 如果禁用自动增强，移除所有未选择的表格的增强
                                this.enhancedTables.forEach(table => {
                                    if (!this.selectedTables.has(table)) {
                                        this.removeEnhancement(table);
                                    }
                                });
                            }
                            return {success: true};
                        case MessageAction.SET_MULTI_COLUMN_SORT:
                            this.multiColumnSort = request.enabled;
                            return {success: true};
                        default:
                            return {success: false, error: '未知的操作'};
                    }
                } catch (error) {
                    console.error('处理消息失败:', error);
                    return {success: false, error: error.message};
                }
            };

            // 处理异步响应
            handleMessage().then(sendResponse);
            return true; // 保持消息通道开放
        });

        // 如果启用了自动增强，查找页面中的所有表格
        if (this.autoEnhance) {
            const tables = document.getElementsByTagName('table');
            for (const table of tables) {
                if (!this.enhancedTables.has(table)) {
                    this.enhanceTable(table);
                }
            }
        }

        // 监听 DOM 变化，处理动态加载的表格
        this.observeDOMChanges();
    }

    // 开始选择模式
    startPicking() {
        this.isPicking = true;
        this.addPickingStyles();
        
        // 添加鼠标移动事件监听
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('click', this.handleClick);
        
        // 添加 ESC 键退出选择模式
        document.addEventListener('keydown', this.handleKeyDown);
    }

    // 添加选择模式的样式
    addPickingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .anytable-pickable {
                cursor: pointer !important;
                outline: 2px dashed #4a90e2 !important;
                outline-offset: 2px !important;
            }
            .anytable-picked {
                outline: 2px solid #4a90e2 !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 处理鼠标移动
    handleMouseMove(e) {
        if (!this.isPicking) return;
        
        const table = this.findTableUnderCursor(e);
        if (table) {
            // 移除其他表格的高亮
            document.querySelectorAll('.anytable-pickable').forEach(t => {
                if (t !== table) t.classList.remove('anytable-pickable');
            });
            // 高亮当前表格
            table.classList.add('anytable-pickable');
        }
    }

    // 处理点击事件
    handleClick(e) {
        if (!this.isPicking) return;
        
        const table = this.findTableUnderCursor(e);
        if (table) {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.selectedTables.has(table)) {
                // 取消选择
                this.selectedTables.delete(table);
                table.classList.remove('anytable-picked');
            } else {
                // 选择表格
                this.selectedTables.add(table);
                table.classList.add('anytable-picked');
                this.enhanceTable(table);
            }
        }
    }

    // 处理按键事件
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.isPicking) {
            this.stopPicking();
        }
    }

    // 停止选择模式
    stopPicking() {
        this.isPicking = false;
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('click', this.handleClick);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // 移除选择模式样式
        document.querySelectorAll('.anytable-pickable').forEach(table => {
            if (!this.selectedTables.has(table)) {
                table.classList.remove('anytable-pickable');
            }
        });
    }

    // 清除所有选择
    clearSelection() {
        this.selectedTables.forEach(table => {
            table.classList.remove('anytable-picked');
            this.removeEnhancement(table);
        });
        this.selectedTables.clear();
        this.stopPicking();
    }

    // 查找鼠标下的表格
    findTableUnderCursor(e) {
        let element = e.target;
        while (element && element.tagName !== 'TABLE') {
            element = element.parentElement;
        }
        return element;
    }

    // 移除表格增强功能
    removeEnhancement(table) {
        // 移除展开按钮
        const expandButtons = table.querySelectorAll('.anytable-expand');
        expandButtons.forEach(button => button.remove());

        // 移除控制面板
        const controlPanels = table.querySelectorAll('.anytable-control-panel');
        controlPanels.forEach(panel => panel.remove());

        // 移除其他样式和数据
        table.classList.remove('anytable-enhanced');
        this.enhancedTables.delete(table);
        this.stateStore.clearTable(table);
    }

    // 添加排序和筛选功能
    addSortingAndFiltering(table) {
        const headers = table.getElementsByTagName('th');
        if (!headers.length) return;

        // 初始化排序规则
        this.stateStore.setSortRules(table, []);

        // 为每个表头添加展开按钮
        Array.from(headers).forEach((header, index) => {
            // 创建展开按钮容器
            const expandContainer = document.createElement('div');
            expandContainer.className = 'anytable-expand';
            
            // 创建排序按钮
            const sortButton = document.createElement('button');
            sortButton.className = 'anytable-sort-button';
            this.setSortButtonIcon(sortButton, 'none');
            sortButton.title = i18n.t('columnControl.sort.none');
            
            // 创建展开按钮
            const expandButton = document.createElement('button');
            expandButton.className = 'anytable-expand-button';
            this.setExpandButtonIcon(expandButton, false);
            expandButton.title = i18n.t('columnControl.title');
            
            expandContainer.appendChild(sortButton);
            expandContainer.appendChild(expandButton);

            // 添加展开按钮到表头
            header.appendChild(expandContainer);

            // 添加点击事件
            sortButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.sortTable(table, index);
            });

            expandButton.addEventListener('click', (e) => {
                e.stopPropagation();
                // 检查是否已经存在控制面板
                const existingPanel = header.querySelector('.anytable-control-panel');
                if (existingPanel) {
                    // 如果存在，则移除它
                    existingPanel.remove();
                    // 更新按钮图标
                    this.setExpandButtonIcon(expandButton, false);
                } else {
                    // 如果不存在，则显示它
                    this.showControlPanel(table, index);
                    // 更新按钮图标
                    this.setExpandButtonIcon(expandButton, true);
                }
            });
        });
    }

    // 显示控制面板
    showControlPanel(table, columnIndex) {
        // 检查是否已经存在控制面板
        const header = table.getElementsByTagName('th')[columnIndex];
        const existingPanel = header.querySelector('.anytable-control-panel');
        if (existingPanel) {
            return; // 如果已存在，则不创建新的
        }

        // 获取列标题，排除展开按钮的文本
        const actualTitle = header.childNodes[0]?.textContent.trim() || '';

        // 创建控制面板容器
        const controlPanel = document.createElement('div');
        controlPanel.className = 'anytable-control-panel';
        
        // 创建标题和高级按钮容器
        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'column-title';
        titleElement.textContent = actualTitle;
        
        const advancedButtons = document.createElement('div');
        advancedButtons.className = 'advanced-buttons';
        
        const advancedFilterButton = document.createElement('button');
        advancedFilterButton.className = 'control-button';
        this.setButtonIcon(advancedFilterButton, 'advancedFilter');
        advancedFilterButton.title = i18n.t('columnControl.filter.advanced');
        
        const advancedSortButton = document.createElement('button');
        advancedSortButton.className = 'control-button';
        this.setButtonIcon(advancedSortButton, 'advancedSort');
        advancedSortButton.title = i18n.t('columnControl.sort.advanced');
        
        advancedButtons.appendChild(advancedFilterButton);
        advancedButtons.appendChild(advancedSortButton);
        panelHeader.appendChild(titleElement);
        panelHeader.appendChild(advancedButtons);
        
        // 创建控制行
        const filterRow = document.createElement('div');
        filterRow.className = 'control-row';
        
        const filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.className = 'filter-input';
        filterInput.placeholder = i18n.t('columnControl.filter.placeholder');
        
        // 恢复之前保存的筛选值
        const filterValues = this.stateStore.getFilterValues(table);
        if (filterValues[columnIndex]) {
            filterInput.value = filterValues[columnIndex];
        }
        
        filterRow.appendChild(filterInput);
        
        // 组装控制面板
        controlPanel.appendChild(panelHeader);
        controlPanel.appendChild(filterRow);
        
        // 添加控制面板到表头
        header.appendChild(controlPanel);
        
        // 检查控制面板位置并添加相应的类
        const checkPosition = () => {
            const rect = controlPanel.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const headerRect = header.getBoundingClientRect();
            
            // 计算控制面板需要的空间
            const panelWidth = Math.max(headerRect.width, 200);
            const panelRight = headerRect.left + panelWidth;
            const panelLeft = headerRect.right - panelWidth;
            
            // 移除所有对齐类
            controlPanel.classList.remove('right-aligned', 'left-aligned', 'center-aligned');
            
            // 根据位置决定延伸方向
            if (panelRight > viewportWidth && panelLeft < 0) {
                // 如果向两边延伸都会超出视口，则居中显示
                controlPanel.classList.add('center-aligned');
            } else if (panelRight > viewportWidth) {
                // 如果向右延伸会超出视口，则向左延伸
                controlPanel.classList.add('right-aligned');
            } else if (panelLeft < 0) {
                // 如果向左延伸会超出视口，则向右延伸
                controlPanel.classList.add('left-aligned');
            }
        };
        
        // 显示控制面板
        controlPanel.classList.add('active');
        
        // 等待下一帧以确保面板已渲染
        requestAnimationFrame(checkPosition);
        
        // 监听窗口大小变化
        const resizeObserver = new ResizeObserver(() => {
            checkPosition();
        });
        resizeObserver.observe(header);
        
        // 设置事件监听器
        filterInput.addEventListener('input', (e) => {
            e.stopPropagation();
            // 保存筛选值
            this.stateStore.setFilterValue(table, columnIndex, e.target.value);
            this.filterTable(table, columnIndex, e.target.value);
        });

        // 添加键盘事件
        filterInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                filterInput.value = '';
                // 清除筛选值
                this.stateStore.setFilterValue(table, columnIndex, '');
                this.filterTable(table, columnIndex, '');
            }
        });
        
        advancedFilterButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const columnTitles = this.getColumnTitles(table);
            const initialRuleGroup = this.stateStore.getAdvancedFilterRules(table) || {
                id: `group-${Date.now()}`,
                operator: 'AND',
                children: [{
                    id: `leaf-${Date.now()}`,
                    column: columnIndex,
                    comparator: 'contains',
                    value: '',
                    options: {}
                }]
            };

            openAdvancedFilterPanel({
                columnIndex,
                columnTitles,
                initialRuleGroup,
                onApply: (ruleGroup) => {
                    this.stateStore.setAdvancedFilterRules(table, ruleGroup);
                    this.applyAllFilters(table);
                }
            });
        });
        
        advancedSortButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const columnTitles = this.getColumnTitles(table);
            const initialRules = this.stateStore.getAdvancedSortRules(table);

            openAdvancedSortPanel({
                columnIndex,
                columnTitles,
                initialRules,
                onApply: (rules) => {
                    this.applyAdvancedSort(table, rules);
                }
            });
        });
        
        // 点击其他地方关闭控制面板
        const closePanel = (e) => {
            if (!controlPanel.contains(e.target) && !e.target.closest('.anytable-expand-button')) {
                // 移除控制面板
                controlPanel.remove();
                resizeObserver.disconnect(); // 清理观察器
                
                // 更新按钮图标
                const expandButton = header.querySelector('.anytable-expand-button');
                if (expandButton) {
                    this.setExpandButtonIcon(expandButton, false);
                }
            }
        };
        
        document.addEventListener('click', closePanel);
        
        // 阻止控制面板内的点击事件冒泡
        controlPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // 增强单个表格
    enhanceTable(table) {
        if (this.enhancedTables.has(table)) return;
        
        // 保存原始顺序
        const tbody = table.getElementsByTagName('tbody')[0];
        if (tbody) {
            const rows = Array.from(tbody.getElementsByTagName('tr'));
            this.stateStore.setOriginalRows(table, rows);
        }
        
        // 设置表头样式
        const headers = table.getElementsByTagName('th');
        Array.from(headers).forEach(header => {
            header.style.position = 'relative';
            header.style.paddingRight = '56px'; // 为两个按钮留出空间
        });
        
        // 添加排序和筛选功能
        this.addSortingAndFiltering(table);
        this.enhancedTables.add(table);
        table.classList.add('anytable-enhanced');
    }

    // 排序表格
    sortTable(table, columnIndex) {
        const tbody = table.getElementsByTagName('tbody')[0];
        if (!tbody) return;

        const currentRules = this.stateStore.getSortRules(table);
        const {rules, direction} = buildNextSortRules(currentRules, columnIndex, this.multiColumnSort);
        this.stateStore.setSortRules(table, rules);
        this.stateStore.setAdvancedSortRules(table, []);

        // 更新排序按钮样式和图标
        this.updateSortButton(table, columnIndex, direction);

        // 单列模式下，同步重置其他列的按钮
        if (!this.multiColumnSort) {
            const headers = table.getElementsByTagName('th');
            Array.from(headers).forEach((header, index) => {
                if (index !== columnIndex) {
                    this.updateSortButton(table, index, 'none');
                }
            });
        }

        this.applySortRules(table, rules);
    }

    // 更新排序按钮样式和图标
    updateSortButton(table, columnIndex, direction) {
        const header = table.getElementsByTagName('th')[columnIndex];
        const sortButton = header.querySelector('.anytable-sort-button');
        if (sortButton) {
            // 更新按钮图标
            this.setSortButtonIcon(sortButton, direction);
            // 更新按钮样式
            sortButton.classList.remove('sort-asc', 'sort-desc', 'sort-none');
            sortButton.classList.add(`sort-${direction}`);
            // 更新按钮标题
            sortButton.title = direction === 'asc' ? i18n.t('columnControl.sort.ascending') :
                             direction === 'desc' ? i18n.t('columnControl.sort.descending') :
                             i18n.t('columnControl.sort.none');
        }
    }

    // 筛选表格
    filterTable(table, columnIndex, filterText) {
        const tbody = table.getElementsByTagName('tbody')[0];
        if (!tbody) return;

        this.stateStore.setFilterValue(table, columnIndex, filterText);
        this.applyAllFilters(table);
    }

    // 监听 DOM 变化
    observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            if (!this.autoEnhance) return; // 如果禁用了自动增强，不处理新表格

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeName === 'TABLE') {
                        this.enhanceTable(node);
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// 初始化表格增强功能
const enhancer = new TableEnhancer();
enhancer.init(); 
