// 导入 i18n
import i18n from './src/i18n/i18n.js';

// 弹出面板的主要逻辑
document.addEventListener('DOMContentLoaded', async () => {
    const pickButton = document.getElementById('pickTable');
    const clearButton = document.getElementById('clearSelection');
    const statusDiv = document.getElementById('status');
    const languageSelect = document.getElementById('languageSelect');
    const autoEnhanceSwitch = document.getElementById('autoEnhance');
    const multiColumnSortSwitch = document.getElementById('multiColumnSort');

    // 初始化 i18n
    await i18n.init();

    // 更新语言选择器
    languageSelect.value = i18n.getCurrentLocale();

    // 加载设置
    const browser = window.browser || chrome;
    const result = await browser.storage.local.get(['autoEnhance', 'multiColumnSort']);
    autoEnhanceSwitch.checked = result.autoEnhance !== false;
    multiColumnSortSwitch.checked = result.multiColumnSort === true;

    // 更新所有带有 data-i18n 属性的元素
    function updateI18nElements() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = i18n.t(key);
        });
    }

    // 监听语言变更事件
    window.addEventListener('localeChanged', updateI18nElements);

    // 语言选择器变更事件
    languageSelect.addEventListener('change', async (e) => {
        await i18n.setLocale(e.target.value);
    });

    // 自动增强开关变更事件
    autoEnhanceSwitch.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        await browser.storage.local.set({ autoEnhance: enabled });
        
        // 通知内容脚本
        const tab = await getCurrentTab();
        if (tab) {
            browser.tabs.sendMessage(tab.id, {
                action: 'setAutoEnhance',
                enabled: enabled
            });
        }
        
        // 更新状态
        statusDiv.textContent = i18n.t(enabled ? 'popup.autoEnhance.enabled' : 'popup.autoEnhance.disabled');
    });

    // 多列排序开关变更事件
    multiColumnSortSwitch.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        await browser.storage.local.set({ multiColumnSort: enabled });
        
        // 通知内容脚本
        const tab = await getCurrentTab();
        if (tab) {
            browser.tabs.sendMessage(tab.id, {
                action: 'setMultiColumnSort',
                enabled: enabled
            });
        }
        
        // 更新状态
        statusDiv.textContent = i18n.t(enabled ? 'popup.multiColumnSort.enabled' : 'popup.multiColumnSort.disabled');
    });

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
                showStatus(i18n.t('popup.status.picking'), 'picking');
                window.close(); // 关闭弹出窗口
            } else {
                showStatus(i18n.t('popup.status.error'), 'error');
            }
        } catch (error) {
            console.error('启动选择器失败:', error);
            showStatus(i18n.t('popup.status.error'), 'error');
        }
    });

    // 清除选择按钮点击事件
    clearButton.addEventListener('click', async () => {
        try {
            const response = await sendMessageToContentScript({action: 'clearSelection'});
            if (response && response.success) {
                showStatus(i18n.t('popup.status.success'), 'success');
                updateButtonState();
            } else {
                showStatus(i18n.t('popup.status.error'), 'error');
            }
        } catch (error) {
            console.error('清除选择失败:', error);
            showStatus(i18n.t('popup.status.error'), 'error');
        }
    });

    // 初始化时加载设置
    async function loadSettings() {
        try {
            const browser = window.browser || chrome;
            const result = await browser.storage.local.get(['autoEnhance', 'multiColumnSort']);
            autoEnhanceSwitch.checked = result.autoEnhance !== false;
            multiColumnSortSwitch.checked = result.multiColumnSort === true;
        } catch (error) {
            console.error('加载设置失败:', error);
            autoEnhanceSwitch.checked = true;
            multiColumnSortSwitch.checked = false;
        }
    }

    // 初始化时更新按钮状态、i18n 元素和设置
    updateButtonState();
    updateI18nElements();
    loadSettings();
}); 