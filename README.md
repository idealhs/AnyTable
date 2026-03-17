# AnyTable

AnyTable 是一个浏览器扩展，用来为任意网页中的原生 `table` 添加排序、筛选、统计和导出能力。  
AnyTable is a browser extension that adds sorting, filtering, statistics, and CSV export to native HTML tables on any webpage.

## 当前能力 / Current Capabilities

- 自动增强页面中的表格，也支持从 popup 手动点选单张表格。
- 每列提供快速排序和快速筛选，排序循环为 `无 -> 升序 -> 降序 -> 无`。
- 支持高级筛选规则组、高级排序、多列排序、统计行和 CSV 导出。
- 高级排序支持 `auto`、基础类型（`number`、`text`、`date`、`percent`）以及 16 种内置单位系统。
- 监听动态插入和删除的表格，在开启自动增强时保持同步。
- 兼容 Chrome 和 Firefox 的 Manifest V3 扩展运行方式。

## 测试

- 自动化测试：`npm test`
- 覆盖率检查：`npm run test:coverage`
- 手工测试页入口：`test/index.html`
- 手工测试说明：`test/README.md`

## 目录概览

- `src/content.js`：content script 组合根，负责装配控制器、工具栏、观察器和设置。
- `src/controllers/`：排序、筛选、表格增强、DOM 观察等主流程控制器。
- `src/core/`：表格模型、排序/筛选/统计引擎、CSV 导出、类型解析等核心逻辑。
- `src/ui/`：列工具栏、高级筛选/排序/统计面板及共享 UI 组件。
- `src/popup/`：popup 页面的状态、视图、控制器和页面通信客户端。
- `src/state/`：按表格维度保存排序、筛选、统计等运行时状态。

## 能力边界

- 当前高级排序只支持内置类型和内置单位系统，不支持自定义单位映射或自定义比较器。
- 已知限制与降级策略见 `docs/known-limitations.md`。

## 许可证 / License

GNU General Public License v3.0 (`GPL-3.0`)
