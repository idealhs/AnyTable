// 弹出面板的主要逻辑
document.addEventListener('DOMContentLoaded', () => {
    const pickButton = document.getElementById('pickTable');
    const clearButton = document.getElementById('clearSelection');
    const statusDiv = document.getElementById('status');

    // 获取当前标签页
    async function getCurrentTab() {
        try {
            // 优先使用 browser API，回退到 chrome API
            const browser = window.browser || chrome;
            const tabs = await browser.tabs.query({active: true, currentWindow: true});
            return tabs[0];
        } catch (error) {
            console.error('获取当前标签页失败:', error);
            return null;
        }
    }

    // 发送消息到内容脚本
    async function sendMessageToContentScript(message) {
        try {
            const tab = await getCurrentTab();
            if (!tab) {
                throw new Error('无法获取当前标签页');
            }
            const browser = window.browser || chrome;
            return await browser.tabs.sendMessage(tab.id, message);
        } catch (error) {
            console.error('发送消息失败:', error);
            return null;
        }
    }

    // 更新按钮状态
    async function updateButtonState() {
        try {
            const response = await sendMessageToContentScript({action: 'getSelectionState'});
            clearButton.disabled = !response || !response.hasSelection;
        } catch (error) {
            console.error('更新按钮状态失败:', error);
            clearButton.disabled = true;
        }
    }

    // 显示状态消息
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status active ${type}`;
    }

    // 选择表格按钮点击事件
    pickButton.addEventListener('click', async () => {
        try {
            const response = await sendMessageToContentScript({action: 'startPicking'});
            if (response && response.success) {
                showStatus('请点击要增强的表格...', 'picking');
                window.close(); // 关闭弹出窗口
            } else {
                showStatus('无法启动选择器，请刷新页面后重试', 'error');
            }
        } catch (error) {
            console.error('启动选择器失败:', error);
            showStatus('启动选择器失败，请刷新页面后重试', 'error');
        }
    });

    // 清除选择按钮点击事件
    clearButton.addEventListener('click', async () => {
        try {
            const response = await sendMessageToContentScript({action: 'clearSelection'});
            if (response && response.success) {
                showStatus('已清除所有选择', 'success');
                updateButtonState();
            } else {
                showStatus('清除选择失败，请刷新页面后重试', 'error');
            }
        } catch (error) {
            console.error('清除选择失败:', error);
            showStatus('清除选择失败，请刷新页面后重试', 'error');
        }
    });

    // 初始化时更新按钮状态
    updateButtonState();
}); 