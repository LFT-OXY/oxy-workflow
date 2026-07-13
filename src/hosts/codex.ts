import type { HostAdapter } from './types.js'
import { join } from 'node:path'
import { parse } from 'smol-toml'

/** Codex：MCP 走 `codex mcp add/remove`，配置读 ~/.codex/config.toml */
export const codex: HostAdapter = {
  id: 'codex',
  label: 'Codex',
  root: home => join(home, '.codex'),
  skillsDir: home => join(home, '.codex', 'skills'),
  agentsDir: () => null,
  mcp: {
    configPath: home => join(home, '.codex', 'config.toml'),
    addCommand: (id, server, env) => [
      'codex',
      'mcp',
      'add',
      id,
      ...Object.entries(env).flatMap(([k, v]) => ['--env', `${k}=${v}`]),
      '--',
      server.command,
      ...(server.args ?? []),
    ],
    removeCommand: id => ['codex', 'mcp', 'remove', id],
    parseInstalled: (text) => {
      try {
        const servers = (parse(text) as { mcp_servers?: Record<string, { env?: Record<string, string> }> }).mcp_servers ?? {}
        return Object.fromEntries(Object.entries(servers).map(
          ([id, s]) => [id, { env: s.env ?? {} }],
        ))
      }
      catch {
        return {}
      }
    },
  },
}
