import type { HostAdapter } from './types.js'
import { join } from 'node:path'

/** Claude Code：MCP 走 `claude mcp add/remove -s user`，配置读 ~/.claude.json */
export const claude: HostAdapter = {
  id: 'claude',
  label: 'Claude Code',
  installCommand: 'npm install -g @anthropic-ai/claude-code',
  binary: 'claude',
  root: home => join(home, '.claude'),
  skillsDir: home => join(home, '.claude', 'skills'),
  agentsDir: home => join(home, '.claude', 'agents'),
  mcp: {
    configPath: home => join(home, '.claude.json'),
    addCommand: (id, server, env) => [
      'claude',
      'mcp',
      'add',
      id,
      '-s',
      'user',
      ...Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
      '--',
      server.command,
      ...(server.args ?? []),
    ],
    removeCommand: id => ['claude', 'mcp', 'remove', id, '-s', 'user'],
    parseInstalled: (text) => {
      try {
        const servers = JSON.parse(text)?.mcpServers ?? {}
        return Object.fromEntries(Object.entries(servers).map(
          ([id, s]) => [id, { env: (s as { env?: Record<string, string> }).env ?? {} }],
        ))
      }
      catch {
        return {}
      }
    },
  },
}
