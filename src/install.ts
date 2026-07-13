import type { CatalogEntry } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import { join } from 'node:path'
import { agentFile } from './probe.js'

/** 安装/卸载所需的最小 IO 面；真实实现见 io.ts */
export interface InstallIo {
  exec: (argv: string[]) => Promise<ActionResult>
  fetchSource: (repo: string, source: string, ref?: string) => Promise<Record<string, Uint8Array>>
  writeFile: (path: string, content: Uint8Array) => Promise<void>
  /** 递归删除文件或目录（卸载用） */
  remove: (path: string) => Promise<void>
}

export interface ActionResult {
  ok: boolean
  detail: string
}

/**
 * 按官方方式安装单条目到单宿主；spec 类与宿主无关（调用方去重）。
 * 永不抛出：失败收敛为 ok:false，供"跳过 + 汇总"（PRD 验收 4）。
 */
export async function installEntry(
  entry: CatalogEntry,
  host: HostAdapter,
  home: string,
  env: Record<string, string>,
  io: InstallIo,
): Promise<ActionResult> {
  try {
    const { install } = entry
    switch (install.method) {
      case 'mcp-config':
        return await io.exec(host.mcp.addCommand(entry.id, install.server, env))
      case 'fetch-files': {
        const target = entry.type === 'agent' ? agentFile(entry.id, host, home) : join(host.skillsDir(home), entry.id)
        if (!target)
          return { ok: false, detail: `${host.label} does not support ${entry.type}` }
        const files = await io.fetchSource(install.repo, install.source, install.ref)
        for (const [rel, content] of Object.entries(files)) {
          // agent 是单文件：target 即落点；skill 是目录：按相对路径展开
          const dest = entry.type === 'agent' ? target : join(target, ...rel.split('/'))
          await io.writeFile(dest, content)
        }
        return { ok: true, detail: '' }
      }
      case 'shell':
        return await io.exec(install.command.split(' '))
    }
  }
  catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

/** 仅可逆机制可卸载：mcp 走官方 remove，文件类删落点；spec 不可逆提示手动 */
export async function uninstallEntry(
  entry: CatalogEntry,
  host: HostAdapter,
  home: string,
  io: InstallIo,
): Promise<ActionResult> {
  try {
    const { install } = entry
    switch (install.method) {
      case 'mcp-config':
        return await io.exec(host.mcp.removeCommand(entry.id))
      case 'fetch-files': {
        const target = entry.type === 'agent' ? agentFile(entry.id, host, home) : join(host.skillsDir(home), entry.id)
        if (!target)
          return { ok: false, detail: `${host.label} does not support ${entry.type}` }
        await io.remove(target)
        return { ok: true, detail: '' }
      }
      case 'shell':
        return { ok: false, detail: `not reversible, manual uninstall (installed via: ${install.command})` }
    }
  }
  catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}
