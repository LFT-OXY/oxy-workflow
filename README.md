# oxy-workflow

Curated installer for AI toolchain components. One short command,
pick what you want, everything installs the official way — into
**Claude Code** and/or **Codex**.

```bash
npx oxy-workflow
```

## What it does

- **Wizard**: detects your hosts (Claude Code / Codex), shows a
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
