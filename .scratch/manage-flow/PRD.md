# manage-flow：oxy-summary 入目录 + 管理流

Status: ready-for-agent
Date: 2026-07-13（grilling 设计会决议，共 12 项）

## A：oxy-summary 入目录

1. **分发来源**：发布到 GitHub，走现有 `fetch-files` 机制，零架构改动。
2. **仓库形态**：public 集合仓库 `LFT-OXY/skills`，结构
   `skills/oxy-summary/`；只放维护者原创 skill，第三方 skill 指向
   其官方上游。
3. **宿主限制**：省略 `hosts` 字段 = 两宿主开放（维护者接受 Codex
   下工具约定失效的功能折损）。
4. **依赖处理**：完全不处理。grok-search-rs 不入目录，skill 靠
   自身兜底约定降级运行。
5. **元数据**：`id: oxy-summary` / `name: Oxy Summary` /
   summary 英文单句 / `homepage: https://github.com/LFT-OXY/skills`
   / `recommended: true`。
6. **公开约束**：接受 public 仓库（fetchSource 无认证抓取的硬
   前提）；推送前完成内容敏感信息自查。

## B：管理流（Manage）

7. **菜单关系**：新增"管理组件"入口，**删除**批量卸载入口
   （uninstall 流程并入管理流）。主菜单：安装 / 管理 / doctor。
   CLI 子命令 `oxy uninstall` 同步替换为 `oxy manage`。
8. **列表形态**：全量单列表 + 类型分隔符，每行带实时探测状态
   标注；不做类型分屏。
9. **条目交互**：进入即详情（名称/类型/summary/主页/安装方式/
   逐宿主状态），动作菜单按宿主 × 状态动态生成，无"详情"选项。
10. **动作后去向**：回同一条目详情，重新探测渲染（状态变化当场
    可见），"返回列表"退层。
11. **未检测宿主**：安装动作照列并标注（与向导口径一致）；未检测
    宿主状态恒 missing，卸载动作天然不出现。
12. **术语定名**：管理（Manage）——`manage.ts` / `runManage` /
    i18n `manage.*` 键；CONTEXT.md 已同步（管理词条、组件定义、
    探测措辞）。

## 沿用不变的既有语义

- 卸载前逐项 confirm，default false（ADR-0004 无状态防线）。
- MCP 类安装前 env 引导（password prompt，可跳过）。
- 卸载资格以机制可逆性判定（与 uninstallEntry 同一判据）：shell
  机制（现即 spec 类）不可逆，已装不列卸载动作，详情附手动提示；
  spec 安装动作为全局。
- 单条失败不中断，收敛为失败汇报。

## 验收

- [ ] `LFT-OXY/skills` 可被 tree API 列举、raw 抓取到 SKILL.md。
- [ ] 向导与 doctor 中出现 Oxy Summary（推荐集默认勾选）。
- [ ] 主菜单第 2 项为"管理组件"（安装/管理/doctor），批量卸载
      入口消失。
- [ ] 管理流：列表带状态 → 详情 → 动作 → 执行 → 回详情状态刷新。
- [ ] `oxy uninstall` 子命令移除，`oxy manage` 可用，help 同步。
- [ ] typecheck + 全量测试通过；README 双语同步。
