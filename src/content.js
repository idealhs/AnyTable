// 表格增强功能的主要实现
class TableEnhancer {
    constructor() {
        this.enhancedTables = new Set();
        this.sortStates = new Map(); // 存储每个表格的排序状态
        this.originalOrders = new Map(); // 存储每个表格的原始行顺序
        this.isPicking = false; // 是否处于选择模式
        this.selectedTables = new Set(); // 存储用户选择的表格
        this.filterValues = new Map(); // 存储每个表格的筛选值
        // 绑定方法到实例
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.sortTable = this.sortTable.bind(this);
    }

    // 初始化表格增强功能
    init() {
        // 监听来自 popup 的消息
        const browser = window.browser || chrome;
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

        // 查找页面中的所有表格
        const tables = document.getElementsByTagName('table');
        for (const table of tables) {
            if (!this.enhancedTables.has(table)) {
                this.enhanceTable(table);
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
        this.sortStates.delete(table);
        this.originalOrders.delete(table);
        this.filterValues.delete(table); // 清除筛选值
    }

    // 添加排序和筛选功能
    addSortingAndFiltering(table) {
        const headers = table.getElementsByTagName('th');
        if (!headers.length) return;

        // 初始化排序状态
        this.sortStates.set(table, {
            column: -1,
            direction: 'none'
        });

        // 为每个表头添加展开按钮
        Array.from(headers).forEach((header, index) => {
            // 创建展开按钮容器
            const expandContainer = document.createElement('div');
            expandContainer.className = 'anytable-expand';
            
            // 创建展开按钮
            const expandButton = document.createElement('button');
            expandButton.className = 'anytable-expand-button';
            expandButton.innerHTML = '🔽'; // 修改为向下箭头
            expandButton.title = '展开控制面板';
            
            expandContainer.appendChild(expandButton);

            // 添加展开按钮到表头
            header.appendChild(expandContainer);

            // 添加点击事件
            expandButton.addEventListener('click', (e) => {
                e.stopPropagation();
                // 检查是否已经存在控制面板
                const existingPanel = header.querySelector('.anytable-control-panel');
                if (existingPanel) {
                    // 如果存在，则移除它
                    existingPanel.remove();
                    // 更新按钮图标
                    expandButton.innerHTML = '🔽';
                } else {
                    // 如果不存在，则显示它
                    this.showControlPanel(table, index, header.textContent.trim());
                    // 更新按钮图标
                    expandButton.innerHTML = '🔼';
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
        const headerText = header.textContent.trim();
        const expandButton = header.querySelector('.anytable-expand-button');
        // 使用正则表达式匹配emoji并移除
        const actualTitle = expandButton ? headerText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() : headerText;

        // 创建控制面板容器
        const controlPanel = document.createElement('div');
        controlPanel.className = 'anytable-control-panel';
        
        // 创建标题
        const titleElement = document.createElement('div');
        titleElement.className = 'column-title';
        titleElement.textContent = actualTitle;
        
        // 创建控制行
        const filterRow = document.createElement('div');
        filterRow.className = 'control-row';
        
        const filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.className = 'filter-input';
        filterInput.placeholder = '筛选...';
        
        // 恢复之前保存的筛选值
        const filterValues = this.filterValues.get(table) || {};
        if (filterValues[columnIndex]) {
            filterInput.value = filterValues[columnIndex];
        }
        
        const advancedFilterButton = document.createElement('button');
        advancedFilterButton.className = 'control-button';
        advancedFilterButton.innerHTML = '⚙️';
        advancedFilterButton.title = '高级筛选';
        
        filterRow.appendChild(filterInput);
        filterRow.appendChild(advancedFilterButton);
        
        const sortRow = document.createElement('div');
        sortRow.className = 'control-row';
        
        const sortButton = document.createElement('button');
        sortButton.className = 'control-button';
        sortButton.innerHTML = '↕️';
        sortButton.title = '排序';
        
        const advancedSortButton = document.createElement('button');
        advancedSortButton.className = 'control-button';
        advancedSortButton.innerHTML = '⚙️';
        advancedSortButton.title = '高级排序';
        
        sortRow.appendChild(sortButton);
        sortRow.appendChild(advancedSortButton);
        
        // 组装控制面板
        controlPanel.appendChild(titleElement);
        controlPanel.appendChild(filterRow);
        controlPanel.appendChild(sortRow);
        
        // 添加控制面板到表头
        header.appendChild(controlPanel);
        
        // 检查控制面板位置并添加相应的类
        const checkPosition = () => {
            const rect = controlPanel.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const headerRect = header.getBoundingClientRect();
            
            // 计算控制面板需要的空间
            const panelWidth = Math.max(headerRect.width, 100); // 至少100px
            const panelRight = headerRect.left + panelWidth;
            
            // 如果控制面板会超出屏幕右边界，添加right-aligned类
            if (panelRight > viewportWidth) {
                controlPanel.classList.add('right-aligned');
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
        
        sortButton.addEventListener('click', () => {
            this.sortTable(table, columnIndex);
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
                    expandButton.innerHTML = '🔽';
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
            header.style.paddingRight = '32px'; // 为展开按钮留出空间
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
        const currentState = this.sortStates.get(table);

        // 确定排序方向
        let direction;
        if (currentState.column !== columnIndex) {
            // 新列，默认升序
            direction = 'asc';
        } else {
            switch (currentState.direction) {
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

        // 更新排序状态
        this.sortStates.set(table, { column: columnIndex, direction });

        // 更新排序按钮样式
        const controlRow = table.querySelector('.anytable-controls');
        if (controlRow) {
            const cells = controlRow.getElementsByClassName('anytable-control-cell');
            Array.from(cells).forEach((cell, index) => {
                const sortButton = cell.querySelector('.anytable-sort-button');
                if (sortButton) {
                    if (index === columnIndex) {
                        sortButton.innerHTML = direction === 'asc' ? '↑' : 
                                           direction === 'desc' ? '↓' : '↕️';
                    } else {
                        sortButton.innerHTML = '↕️';
                    }
                }
            });
        }

        // 如果方向为 none，恢复原始顺序
        if (direction === 'none') {
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
            const aValue = a.cells[columnIndex]?.textContent.trim() || '';
            const bValue = b.cells[columnIndex]?.textContent.trim() || '';
            
            // 尝试数字排序
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return direction === 'asc' ? aNum - bNum : bNum - aNum;
            }
            
            // 文本排序
            return direction === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        });

        // 重新插入排序后的行
        rows.forEach(row => tbody.appendChild(row));
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
        filterText = filterText.toLowerCase();

        Array.from(rows).forEach(row => {
            const cell = row.cells[columnIndex];
            if (!cell) return;

            const text = cell.textContent.toLowerCase();
            row.style.display = text.includes(filterText) ? '' : 'none';
        });
    }

    // 监听 DOM 变化
    observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
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