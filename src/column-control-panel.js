// 弹出框的JavaScript逻辑
document.addEventListener('DOMContentLoaded', () => {
    // 获取当前列的信息
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'getColumnInfo'
        }, (response) => {
            if (response) {
                updateColumnTitle(response.title);
                setupEventListeners(response.columnIndex);
            }
        });
    });
});

// 更新列标题
function updateColumnTitle(title) {
    const titleElement = document.querySelector('.column-title');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

// 设置事件监听器
function setupEventListeners(columnIndex) {
    const filterInput = document.querySelector('.filter-input');
    const sortButton = document.querySelector('.control-button[title="排序"]');
    const advancedFilterButton = document.querySelector('.control-button[title="高级筛选"]');
    const advancedSortButton = document.querySelector('.control-button[title="高级排序"]');

    // 筛选输入事件
    filterInput.addEventListener('input', (e) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'filter',
                columnIndex: columnIndex,
                value: e.target.value
            });
        });
    });

    // 排序按钮事件
    sortButton.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'sort',
                columnIndex: columnIndex
            });
        });
    });

    // 高级筛选按钮事件
    advancedFilterButton.addEventListener('click', () => {
        // TODO: 实现高级筛选功能
        console.log('高级筛选按钮被点击');
    });

    // 高级排序按钮事件
    advancedSortButton.addEventListener('click', () => {
        // TODO: 实现高级排序功能
        console.log('高级排序按钮被点击');
    });
} 