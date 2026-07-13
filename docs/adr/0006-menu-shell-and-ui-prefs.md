# 主菜单壳与 UI 偏好文件

`oxy` 默认命令由直接进向导改为 CCG/ZCF 式常驻主菜单：分组列出
安装向导 / doctor / 卸载 / 检查更新 / 语言 / 帮助，动作执行完回到
菜单；原能力保留子命令直达（install / doctor / uninstall）。显示
语言中英双语，首次运行选择后写入
`~/.config/oxy-workflow/prefs.json`。该文件只记录 UI 偏好（当前仅
lang），不记录任何安装状态，因此不违反 ADR-0004——"装没装"仍以
实时探测为唯一来源；删除该文件仅回到首次运行体验。

**Status**: accepted

**后记**（2026-07-13）：卸载入口并入「管理」流——菜单项与子命令
uninstall → manage（单件详情 / 安装 / 卸载），见 CONTEXT.md
「管理」词条。
