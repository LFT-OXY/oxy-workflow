# oxy-workflow

English | [简体中文](#简体中文)

Curated installer for AI toolchain components. One short command,
pick what you want, everything installs the official way — into
**Claude Code** and/or **Codex**.

```bash
npx oxy-workflow
```

## What it does

- **Main menu**: `npx oxy-workflow` opens a ZCF-style interactive
  menu (bilingual — English / 简体中文, picked on first run). Every
  action below returns to the menu, plus an npm update check.
- **Wizard** (`oxy install`): detects your hosts (Claude Code /
  Codex), shows a
  curated catalog grouped by type — MCP servers, skills, agents
  (subagents), spec tools — with recommended picks pre-selected,
  then installs each item via its official method:
  - MCP → `claude mcp add -s user` / `codex mcp add`
  - Skills → fetched from the official repo into the host's
    skills directory
  - Agents → fetched into `~/.claude/agents/`
  - Spec tools → official install command (e.g. `npm i -g ...`)
- **Guided env setup**: entries that need API keys prompt during
  install (skippable).
- **`oxy doctor`**: stateless live probe of every catalog entry on
  every host — installed / not installed / installed-but-missing-env
  (and lets you finish env setup on the spot).
- **`oxy uninstall`**: removes what the probe actually finds, for
  reversible mechanisms only, with per-item confirmation.

No state files. The tool never records what it did — it just looks
at your machine, every time.

## Requirements

Node.js ≥ 20. Claude Code and/or Codex CLI for MCP installs.

## Catalog

The catalog ships inside the package as pure metadata (id, official
homepage, install method). Component content is always fetched from
its official upstream at install time — this package vendors
nothing. See `src/catalog/entries.ts`.

## License

MIT

---

# 简体中文

[English](#oxy-workflow) | 简体中文

AI 工具链组件的精选安装器。一条短命令，勾选想要的组件，全部按
官方方式安装 —— 安装进 **Claude Code** 和/或 **Codex**。

```bash
npx oxy-workflow
```

## 功能

- **主菜单**：`npx oxy-workflow` 打开 ZCF 式交互菜单（中英双语，
  首次运行选择）。以下动作执行完均回到菜单，另含 npm 更新检查。
- **向导**（`oxy install`）：探测本机宿主（Claude Code / Codex），
  展示按类型分组
  的精选目录 —— MCP 服务器、Skill、Agent（子代理）、Spec 工具，
  推荐集默认勾选，随后逐项按其官方方式安装：
  - MCP → `claude mcp add -s user` / `codex mcp add`
  - Skill → 从官方仓库抓取到宿主的 skills 目录
  - Agent → 抓取到 `~/.claude/agents/`
  - Spec 工具 → 官方安装命令（如 `npm i -g ...`）
- **引导式环境配置**：需要 API key 的条目在安装时提示输入
  （可跳过）。
- **`oxy doctor`**：对目录中每个条目在每个宿主上做无状态实时
  探测 —— 已安装 / 未安装 / 已安装但缺环境变量（并可当场补齐
  环境配置）。
- **`oxy uninstall`**：只卸载探测实际发现的内容，仅限可逆机制，
  逐项确认。

无状态文件。本工具从不记录自己做过什么 —— 每次都直接查看你的
机器。

## 环境要求

Node.js ≥ 20。MCP 安装需要 Claude Code 和/或 Codex CLI。

## 目录

目录以纯元数据（id、官方主页、安装方式）随 npm 包分发。组件
内容始终在安装时从官方上游抓取 —— 本包不内置任何组件内容。见
`src/catalog/entries.ts`。

## 许可证

MIT
