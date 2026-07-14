# 目录收录边界：只收可自动安装组件，宿主 CLI 走引导安装

目录只收录能被某一安装机制（mcp-config / fetch-files / fetch-collection /
shell / plugin）自动装入宿主或全局环境的组件。独立 App（Penpot、
open-design）、普通代码库（supervision 等 pip/npm 库）、复制粘贴片段集
（galaxy）、纯格式约定（design.md）不属于组件，不进目录，仅留维护者的
外部参考清单——它们无统一安装路径、多为 OS 专属或自托管服务，收录会把
安装器撑成"通用工具安装器"并弄脏跨平台模型（ADR-0005）。

宿主 CLI 本身（claude/codex）不作为目录组件，改由宿主侧引导安装
（bootstrap）：主菜单置顶「安装 AI Agent」，`HostAdapter.installCommand`
跑官方跨平台命令（npm 全局）。引导成功判定，以及"组件安装时宿主缺失 →
跳转引导"的触发，均以 **CLI binary 是否在 PATH** 为准，区别于配置目录
（后者留给"是否配置过"语义）。

**Status**: accepted

**Considered Options**: (1) 为独立 App 加 OS 专属安装分支（brew cask /
docker / dmg）——否决：违反跨平台边界，且多数条目根本不是"App"（库 /
片段 / 自托管服务）。(2) 宿主 CLI 当普通 shell 组件——否决：与"宿主 ≠
组件"边界冲突，并引入安装顺序问题（宿主未装则 `mcp add` 全失败）。

**Consequences**: 维护者的收藏清单 ⊋ 目录；不可自动安装项只在外部文档
留链接，不在安装器出现。
