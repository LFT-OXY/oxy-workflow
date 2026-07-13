# 多宿主适配器：v1 支持 Claude Code 与 Codex

安装器不绑定单一 AI CLI。组件的安装位置与配置格式由
"宿主 × 组件类型 × 操作系统"三维共同决定，实现为可扩展的宿主
适配器层：每个宿主定义各组件类型在各操作系统下的路径与配置
格式（如 MCP 在 Claude 写 JSON 配置、在 Codex 写 config.toml），
并提供宿主自身的存在性探测。向导第一步探测本机宿主并让用户
选择安装目标；目录条目声明其支持的宿主（如 Agent 类为 Claude
专属）。v1 宿主集合为 Claude Code + Codex。

**Status**: accepted

**Considered Options**: 仅支持 Claude Code——被否决：维护者的
工具链横跨多个 agent CLI，单宿主覆盖不了真实使用环境。

**Consequences**: 每新增宿主需补全类型的路径/格式/探测适配；
路径解析必须区分 macOS/Linux/Windows，CI 测试矩阵覆盖三平台。
