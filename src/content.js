// 导入 i18n
import i18n from './i18n/i18n.js';

// 表格增强功能的主要实现
class TableEnhancer {
    constructor() {
        this.enhancedTables = new Set();
        this.sortRules = new Map(); // 存储每个表格的排序规则集合
        this.originalOrders = new Map(); // 存储每个表格的原始行顺序
        this.isPicking = false; // 是否处于选择模式
        this.selectedTables = new Set(); // 存储用户选择的表格
        this.filterValues = new Map(); // 存储每个表格的筛选值
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

                    const advancedFilterButton = controlPanel.querySelector('.control-button');
                    if (advancedFilterButton) {
                        advancedFilterButton.title = i18n.t('columnControl.filter.advanced');
                    }

                    const sortButton = controlPanel.querySelector('.control-button:nth-child(2)');
                    if (sortButton) {
                        const rules = this.sortRules.get(table) || [];
                        const rule = rules.find(r => r.column === index);
                        if (rule) {
                            sortButton.title = rule.direction === 'asc' ? i18n.t('columnControl.sort.ascending') :
                                            rule.direction === 'desc' ? i18n.t('columnControl.sort.descending') :
                                            i18n.t('columnControl.sort.none');
                        } else {
                            sortButton.title = i18n.t('columnControl.sort.none');
                        }
                    }

                    const advancedSortButton = controlPanel.querySelector('.control-button:nth-child(3)');
                    if (advancedSortButton) {
                        advancedSortButton.title = i18n.t('columnControl.sort.advanced');
                    }
                }
            });
        });
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
                        case 'startPicking':
                            this.startPicking();
                            return {success: true};
                        case 'clearSelection':
                            this.clearSelection();
                            return {success: true};
                        case 'getSelectionState':
                            return {hasSelection: this.selectedTables.size > 0};
                        case 'setAutoEnhance':
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
                        case 'setMultiColumnSort':
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
        this.sortRules.delete(table);
        this.originalOrders.delete(table);
        this.filterValues.delete(table); // 清除筛选值
    }

    // 添加排序和筛选功能
    addSortingAndFiltering(table) {
        const headers = table.getElementsByTagName('th');
        if (!headers.length) return;

        // 初始化排序规则
        this.sortRules.set(table, []);

        // 为每个表头添加展开按钮
        Array.from(headers).forEach((header, index) => {
            // 创建展开按钮容器
            const expandContainer = document.createElement('div');
            expandContainer.className = 'anytable-expand';
            
            // 创建排序按钮
            const sortButton = document.createElement('button');
            sortButton.className = 'anytable-sort-button';
            sortButton.textContent = '↕️';
            sortButton.title = i18n.t('columnControl.sort.none');
            
            // 创建展开按钮
            const expandButton = document.createElement('button');
            expandButton.className = 'anytable-expand-button';
            expandButton.textContent = '🔽';
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
                    expandButton.textContent = '🔽';
                } else {
                    // 如果不存在，则显示它
                    this.showControlPanel(table, index, header.textContent.trim());
                    // 更新按钮图标
                    expandButton.textContent = '🔼';
                }
            });
        });
    }

    // 显示控制面板
    showControlPanel(table, columnIndex, columnTitle) {
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
        advancedFilterButton.textContent = '⚡⚙️';
        advancedFilterButton.title = i18n.t('columnControl.filter.advanced');
        
        const advancedSortButton = document.createElement('button');
        advancedSortButton.className = 'control-button';
        advancedSortButton.textContent = '↕️⚙️';
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
        const filterValues = this.filterValues.get(table) || {};
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
            const filterValues = this.filterValues.get(table) || {};
            filterValues[columnIndex] = e.target.value;
            this.filterValues.set(table, filterValues);
            this.filterTable(table, columnIndex, e.target.value);
        });

        // 添加键盘事件
        filterInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                filterInput.value = '';
                // 清除筛选值
                const filterValues = this.filterValues.get(table) || {};
                filterValues[columnIndex] = '';
                this.filterValues.set(table, filterValues);
                this.filterTable(table, columnIndex, '');
            }
        });
        
        advancedFilterButton.addEventListener('click', () => {
            // TODO: 实现高级筛选功能
            console.log('高级筛选按钮被点击');
        });
        
        advancedSortButton.addEventListener('click', () => {
            // TODO: 实现高级排序功能
            console.log('高级排序按钮被点击');
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
                    expandButton.textContent = '🔽';
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
            this.originalOrders.set(table, rows);
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

        const rows = Array.from(tbody.getElementsByTagName('tr'));
        let rules = this.sortRules.get(table) || [];

        // 确定排序方向
        let direction;
        const existingRule = rules.find(rule => rule.column === columnIndex);
        if (!existingRule) {
            // 新列，默认升序
            direction = 'asc';
        } else {
            switch (existingRule.direction) {
                case 'none':
                    direction = 'asc';
                    break;
                case 'asc':
                    direction = 'desc';
                    break;
                case 'desc':
                    direction = 'none';
                    break;
                default:
                    direction = 'asc';
            }
        }

        // 更新排序规则
        if (!this.multiColumnSort) {
            // 单列排序模式：清空所有规则，但保留当前列的规则
            rules = [];
            // 重置所有排序按钮状态
            const headers = table.getElementsByTagName('th');
            Array.from(headers).forEach((header, index) => {
                if (index !== columnIndex) {
                    this.updateSortButton(table, index, 'none');
                }
            });
            // 如果当前列不是取消排序，则添加当前列的规则
            if (direction !== 'none') {
                rules.push({
                    column: columnIndex,
                    direction: direction,
                    type: 'text'
                });
            }
        } else {
            // 多列排序模式
            if (direction === 'none') {
                // 移除该列的排序规则
                rules = rules.filter(rule => rule.column !== columnIndex);
            } else {
                // 更新或添加排序规则
                if (existingRule) {
                    existingRule.direction = direction;
                } else {
                    rules.push({
                        column: columnIndex,
                        direction: direction,
                        type: 'text'
                    });
                }
            }
        }

        // 保存更新后的规则
        this.sortRules.set(table, rules);

        // 更新排序按钮样式和图标
        this.updateSortButton(table, columnIndex, direction);

        // 如果没有排序规则，恢复原始顺序
        if (rules.length === 0) {
            const originalRows = this.originalOrders.get(table);
            if (originalRows) {
                // 清空当前tbody
                while (tbody.firstChild) {
                    tbody.removeChild(tbody.firstChild);
                }
                // 按原始顺序重新添加行
                originalRows.forEach(row => tbody.appendChild(row));
            }
            return;
        }

        // 排序行
        rows.sort((a, b) => {
            for (const rule of rules) {
                const aValue = a.cells[rule.column]?.textContent.trim() || '';
                const bValue = b.cells[rule.column]?.textContent.trim() || '';
                
                // 尝试数字排序
                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    const result = rule.direction === 'asc' ? aNum - bNum : bNum - aNum;
                    if (result !== 0) return result;
                } else {
                    // 文本排序
                    const result = rule.direction === 'asc' 
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                    if (result !== 0) return result;
                }
            }
            return 0;
        });

        // 重新插入排序后的行
        rows.forEach(row => tbody.appendChild(row));
    }

    // 更新排序按钮样式和图标
    updateSortButton(table, columnIndex, direction) {
        const header = table.getElementsByTagName('th')[columnIndex];
        const sortButton = header.querySelector('.anytable-sort-button');
        if (sortButton) {
            // 更新按钮图标
            sortButton.textContent = direction === 'asc' ? '🔼' : 
                                   direction === 'desc' ? '🔽' : '↕️';
            // 更新按钮样式
            sortButton.classList.remove('sort-asc', 'sort-desc', 'sort-none');
            sortButton.classList.add(`sort-${direction}`);
            // 更新按钮标题
            sortButton.title = direction === 'asc' ? i18n.t('columnControl.sort.ascending') :
                             direction === 'desc' ? i18n.t('columnControl.sort.descending') :
                             i18n.t('columnControl.sort.none');
        }
    }

    // 添加筛选功能
    addFiltering(table) {
        const headers = table.getElementsByTagName('th');
        if (!headers.length) return;

        // 创建筛选行
        const filterRow = document.createElement('tr');
        filterRow.className = 'anytable-filters';
        
        // 为每个表头添加筛选输入框
        Array.from(headers).forEach((header, index) => {
            const cell = document.createElement('td');
            cell.className = 'anytable-filter-cell';
            
            const filterContainer = document.createElement('div');
            filterContainer.className = 'anytable-filter';
            
            const filterInput = document.createElement('input');
            filterInput.type = 'text';
            filterInput.className = 'anytable-filter-input';
            filterInput.placeholder = '筛选...';
            
            filterContainer.appendChild(filterInput);
            cell.appendChild(filterContainer);

            // 阻止事件冒泡
            filterContainer.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            filterInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // 添加筛选事件
            filterInput.addEventListener('input', (e) => {
                e.stopPropagation();
                this.filterTable(table, index, e.target.value);
            });

            // 添加键盘事件
            filterInput.addEventListener('keydown', (e) => {
                e.stopPropagation();
                if (e.key === 'Escape') {
                    filterInput.value = '';
                    this.filterTable(table, index, '');
                }
            });

            filterRow.appendChild(cell);
        });

        // 将筛选行插入到控件行之后
        const controlRow = table.querySelector('.anytable-controls');
        if (controlRow) {
            controlRow.parentElement.insertBefore(filterRow, controlRow.nextSibling);
        } else {
            // 如果没有控件行，则插入到表头行之后
            const headerRow = headers[0].parentElement;
            headerRow.parentElement.insertBefore(filterRow, headerRow.nextSibling);
        }
    }

    // 筛选表格
    filterTable(table, columnIndex, filterText) {
        const tbody = table.getElementsByTagName('tbody')[0];
        if (!tbody) return;

        const rows = tbody.getElementsByTagName('tr');
        const filterValues = this.filterValues.get(table) || {};
        filterValues[columnIndex] = filterText;
        this.filterValues.set(table, filterValues);

        Array.from(rows).forEach(row => {
            let shouldShow = true;
            
            // 检查每一列的筛选条件
            for (let i = 0; i < row.cells.length; i++) {
                const filterValue = filterValues[i]?.toLowerCase() || '';
                if (filterValue) {
                    const cellText = row.cells[i]?.textContent.toLowerCase() || '';
                    if (!cellText.includes(filterValue)) {
                        shouldShow = false;
                        break;
                    }
                }
            }
            
            row.style.display = shouldShow ? '' : 'none';
        });
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