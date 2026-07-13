import type { CatalogEntry } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import { join } from 'node:path'

/** 组件状态：installed / missing / missing-env（已装但缺必需 env） */
export type Status = 'installed' | 'missing' | 'missing-env'

/** 探测所需的最小 IO 面；真实实现见 io.ts，测试注入伪造 */
export interface ProbeIo {
  exists: (path: string) => boolean
  readFile: (path: string) => string | null
  hasBinary: (name: string) => boolean
}

export function hostPresent(host: HostAdapter, home: string, io: ProbeIo): boolean {
  return io.exists(host.root(home))
}

/** 单条目 × 单宿主实时探测——doctor 与卸载的唯一状态来源（ADR-0004） */
export function statusOf(entry: CatalogEntry, host: HostAdapter, home: string, io: ProbeIo): Status {
  const { install } = entry
  switch (install.method) {
    case 'mcp-config': {
      const installed = installedMcp(entry, host, home, io)
      if (!installed)
        return 'missing'
      return missingEnvKeys(entry, host, home, io).length > 0 ? 'missing-env' : 'installed'
    }
    case 'fetch-files': {
      const target = entry.type === 'agent'
        ? agentFile(entry.id, host, home)
        : join(host.skillsDir(home), entry.id, 'SKILL.md')
      return target && io.exists(target) ? 'installed' : 'missing'
    }
    case 'shell':
      return io.hasBinary(install.binary) ? 'installed' : 'missing'
  }
}

/** agent 定义文件的落点；宿主无 subagent 概念时为 null */
export function agentFile(id: string, host: HostAdapter, home: string): string | null {
  const dir = host.agentsDir(home)
  return dir ? join(dir, `${id}.md`) : null
}

/** 宿主配置中该 MCP 条目的已装记录；未装/不可读为 undefined */
export function installedMcp(entry: CatalogEntry, host: HostAdapter, home: string, io: ProbeIo) {
  const text = io.readFile(host.mcp.configPath(home))
  return host.mcp.parseInstalled(text ?? '')[entry.id]
}

/** 已装但缺失的必需 env 键（doctor 补配与 missing-env 判定共用） */
export function missingEnvKeys(entry: CatalogEntry, host: HostAdapter, home: string, io: ProbeIo): string[] {
  const installed = installedMcp(entry, host, home, io)
  return (entry.env ?? [])
    .filter(v => v.required && !(v.key in (installed?.env ?? {})))
    .map(v => v.key)
}
