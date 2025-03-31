// 非模块入口文件
const browser = window.browser || chrome;
import(browser.runtime.getURL('src/content.js')).catch(error => {
    console.error('Failed to load content script:', error);
}); 