# 安装界面按组件类型拆主菜单；扩展组件类型与安装机制

安装体验不再是"一个向导装尽所有类型"，而是按组件类型拆成多个主菜单
入口；交互体验对标 CCG（借鉴其菜单手感，但**不 fork、不复刻**，
ADR-0002 仍有效）：

- **宿主组件**（先选宿主 → 多选 → 确认）：「安装 MCP/技能」向导、
  「子代理」、「Skills 合集」。子代理与合集因内容量大、单列入口，不
  并进向导。
- **全局工具**（跑官方命令、无宿主步）：「Spec 工具」、「命令行工具」、
  「AI 插件」。
- 置顶「安装 AI Agent」引导装宿主 CLI（见 ADR-0008）。

组件类型扩展：新增 **cli**（独立全局工具，探 binary）、**plugin**（命令
安装、内容落宿主、探 marker）、**skill-collection**（整仓摊平、哨兵探测）。
安装机制相应新增：`plugin`（command + marker + 可选 uninstall）、
`fetch-collection`（source + sentinel），并给 `mcp-config` 增可选
`prerequisite`（供需预编译的 MCP 先跑跨平台安装命令；仅 OS 专属安装的
不收）。cli/spec 复用现有 `shell`。

**Status**: accepted

**Considered Options**: (1) 保持单向导装尽所有类型——否决：合集 / 全局
工具塞进宿主向导别扭（`spec` 已有"忽略宿主"的 wart），高内容量类型难
浏览。(2) 全部类型平铺主菜单（含 mcp/skill）——否决：mcp/skill 原子项
多，批量选装更适合向导。(3) `spec` 并入 `cli`——否决：维持 spec 语义
独立。

**Consequences**: 主菜单入口增多；批量装一台机器需访问多个入口
（ADR-0003 已解散 Restore 硬性诉求，可接受）；向导退化为纯宿主组件
选装，术语「向导」定义相应更新（见 CONTEXT.md）。宿主 UI 文案统一
「AI Agent」（弃旧文案「AI 工具」）。
