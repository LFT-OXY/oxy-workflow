import type { Status } from './probe.js'
import pc from 'picocolors'

/** 状态的统一展示口径（wizard/doctor 共用） */
export function statusLabel(status: Status): string {
  switch (status) {
    case 'installed':
      return pc.green('installed')
    case 'missing-env':
      return pc.yellow('installed, missing env')
    case 'missing':
      return pc.dim('not installed')
  }
}

export const TYPE_ORDER = ['mcp', 'skill', 'agent', 'spec'] as const

export const TYPE_TITLE: Record<(typeof TYPE_ORDER)[number], string> = {
  mcp: 'MCP servers',
  skill: 'Skills',
  agent: 'Agents (subagents)',
  spec: 'Spec tools (global)',
}
