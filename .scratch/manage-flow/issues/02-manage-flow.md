# 02 管理流（Manage）

Status: ready-for-agent

实现 `manage.ts`（runManage）+ `manage-logic.ts` 纯函数（TDD，
沿用 wizard-logic 测试模式），按 PRD 决议 7-12：全量状态列表 →
进入即详情 → 宿主粒度动作 → 执行后回详情重探测。重接
menu.ts / cli.ts / i18n（manage.* 替代 uninstall.*），删除
uninstall.ts（不留兼容 shim），README 双语同步。

## Comments

- 2026-07-13 已交付：manage.ts + manage-logic.ts（TDD 7 测试）
  落地，menu/cli/i18n 重接，uninstall.ts 删除；双轴评审
  （Standards 4 项 + Spec 2 项）已全部处置。
