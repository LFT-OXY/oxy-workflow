# oxy-workflow v1 PRD

> 领域术语见 CONTEXT.md；关键决策见 docs/adr/。本文是实现与评审
> 的锚点：只写做什么与怎么验收，不重复决策论证。

## 定位

策展式 AI 工具链安装器。npm 包 `oxy-workflow`（bin `oxy`）只含
安装器 + 目录元数据（ADR-0001）；组件一律按官方方式装进所选宿主
（ADR-0005）；无状态，一切状态来自实时探测（ADR-0004）。

## 验收

任何用户在 macOS/Linux/Windows 上执行 `npx oxy-workflow`：

1. 探测本机宿主（Claude Code / Codex），默认勾选已存在的
2. 按类型分组多选组件；推荐集预选；已装项标注；不支持所选宿主
   的条目不可选并标注原因
3. 需 env 的条目引导输入（可跳过；跳过后 doctor 可补配）
4. 逐条执行官方安装，单条失败跳过不中断，结尾汇总
5. `oxy doctor` 全量探测报告（含"已装但缺 env"状态）
6. `oxy manage` 单件详情 / 安装 / 卸载（卸载仅可逆机制，逐项确认）

## 支持矩阵（v1）

| 类型 | claude | codex | 安装机制 | 探测 | 卸载 |
|------|:--:|:--:|---|---|---|
| mcp | ✓ | ✓ | `claude mcp add -s user -e K=V --` / `codex mcp add --env K=V --`（参数式，规避 JSON 引号跨平台问题） | 解析 `~/.claude.json` / `~/.codex/config.toml`（只读） | `claude mcp remove -s user` / `codex mcp remove` |
| skill | ✓ | ✓ | fetch 官方 repo 的技能目录 → 宿主 skills 目录 | `<skillsDir>/<id>/SKILL.md` 存在 | 删目录 |
| agent | ✓ | — | fetch 官方 repo 单文件 → `~/.claude/agents/<id>.md` | 文件存在 | 删文件 |
| spec | 全局 | 全局 | 执行官方安装命令 | PATH 上可解析二进制 | 提示手动卸载 |

宿主目录（Windows/macOS/Linux 差异由 homedir 解析吸收）：

- claude: `~/.claude/skills`、`~/.claude/agents`，MCP 配置在
  `~/.claude.json` 的 `mcpServers`
- codex: `~/.codex/skills`，MCP 配置在 `~/.codex/config.toml`
  的 `[mcp_servers.*]`

宿主存在性探测：宿主根目录存在（`~/.claude` / `~/.codex`）。

## Catalog Schema（src/catalog/）

条目字段：`id / type / name / summary / homepage / recommended?
/ hosts? / install / env?`。

- `install` 三形态：
  - `mcp-config`: `{ server: { command, args? } }`
  - `fetch-files`: `{ repo, ref?, source }`（source 为目录=skill
    整包 / 单文件=agent）
  - `shell`: `{ command, binary }`
- `env` 声明：`{ key, required, hint? }`；值由向导收集，安装时
  注入宿主 MCP 配置，目录中永不存储密钥值
- `hosts` 省略 = 支持全部宿主；spec 类忽略宿主（全局安装）
- 探测方式由 type + install 推导，v1 不设逐条目 check 字段

## 种子目录（来源均已核实）

| id | type | 官方来源 | 备注 |
|----|------|---------|------|
| context7 | mcp | upstash/context7 → `@upstash/context7-mcp` | `CONTEXT7_API_KEY` 可选 |
| skill-creator | skill | anthropics/skills `skills/skill-creator` | 双宿主 |
| oxy-summary | skill | LFT-OXY/skills `skills/oxy-summary` | 双宿主，自有公开集合仓库 |
| code-refactorer | agent | iannuttall/claude-agents `agents/code-refactorer.md` | README 官方 cp 安装法 |
| openspec | spec | `@fission-ai/openspec`（bin `openspec`） | npm -g |

## CLI

- `oxy`：向导（宿主选择 → 组件多选 → env 引导 → 执行 → 汇总）
- `oxy doctor`：全量探测报告 + 缺失必需 env 现场补配（合并既有
  env 重注册，不丢已配置键）
- `oxy manage`：管理目录——单件详情 / 安装 / 卸载（卸载仅可逆
  机制，逐项确认）
- 退出码：向导完成（含部分失败已汇总）为 0；参数/环境错误为 1；
  用户 Ctrl-C 中断为 130（Unix 惯例）

## 非目标（v2+）

plugin 类型（`claude plugin install` 已核实可行，留作类型扩展）、
远程目录索引、更多宿主（Gemini CLI 等）、非交互 `--all`、界面
中文 i18n（v1 界面英文；共用文案已集中 ui.ts，全量抽取随 i18n
一并做，v1 不强求）。

## 工程

TypeScript ESM（NodeNext、tsc 构建）、Node ≥20、vitest 测试、
CI 三平台矩阵（typecheck + test + pack dry-run）。运行时依赖仅
4 个：cac / @inquirer/prompts / picocolors / smol-toml。
