import type { CatalogEntry } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import { join } from 'node:path'
import { agentFile } from './probe.js'

/** 安装/卸载所需的最小 IO 面；真实实现见 io.ts */
export interface InstallIo {
  exec: (argv: string[]) => Promise<ActionResult>
  fetchSource: (repo: string, source: string, kind: 'file' | 'dir', ref?: string) => Promise<Record<string, Uint8Array>>
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
      case 'mcp-config': {
        // 需预编译的 MCP：先跑跨平台前置命令，失败则不再 add（ADR-0009）
        if (install.prerequisite) {
          const pre = await io.exec(install.prerequisite.split(' '))
          if (!pre.ok)
            return pre
        }
        return await io.exec(host.mcp.addCommand(entry.id, install.server, env))
      }
      case 'fetch-files': {
        const target = fetchTarget(entry, host, home)
        if (!target)
          return { ok: false, detail: `${host.label} does not support ${entry.type}` }
        const files = await io.fetchSource(install.repo, install.source, entry.type === 'agent' ? 'file' : 'dir', install.ref)
        for (const [rel, content] of Object.entries(files)) {
          // agent 是单文件：target 即落点；skill 是目录：按相对路径展开
          const dest = entry.type === 'agent' ? target : join(target, ...rel.split('/'))
          await io.writeFile(dest, content)
        }
        return { ok: true, detail: '' }
      }
      case 'fetch-collection': {
        // 合集：抓 source 下所有文件，rel 已含子技能名，直接落到 skills 顶层即摊平
        const files = await io.fetchSource(install.repo, install.source, 'dir', install.ref)
        const skillsDir = host.skillsDir(home)
        for (const [rel, content] of Object.entries(files))
          await io.writeFile(join(skillsDir, ...rel.split('/')), content)
        return { ok: true, detail: '' }
      }
      case 'shell':
        return await io.exec(install.command.split(' '))
      case 'plugin':
        // 插件跑自己的官方安装命令，内容落宿主目录
        return await io.exec(install.command.split(' '))
    }
  }
  catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

/** fetch-files 类条目在宿主中的落点（安装写入与卸载删除共用） */
function fetchTarget(entry: CatalogEntry, host: HostAdapter, home: string): string | null {
  return entry.type === 'agent' ? agentFile(entry.id, host, home) : join(host.skillsDir(home), entry.id)
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
        const target = fetchTarget(entry, host, home)
        if (!target)
          return { ok: false, detail: `${host.label} does not support ${entry.type}` }
        await io.remove(target)
        return { ok: true, detail: '' }
      }
      case 'fetch-collection': {
        // 无 manifest（ADR-0004）：重列仓库树，取顶层子技能名逐个删
        const files = await io.fetchSource(install.repo, install.source, 'dir', install.ref)
        const children = new Set(Object.keys(files).map(rel => rel.split('/')[0]))
        const skillsDir = host.skillsDir(home)
        for (const child of children)
          await io.remove(join(skillsDir, child))
        return { ok: true, detail: '' }
      }
      case 'shell':
        return { ok: false, detail: `not reversible, manual uninstall (installed via: ${install.command})` }
      case 'plugin':
        // 有官方卸载命令走命令，否则删宿主内标记路径
        if (install.uninstall)
          return await io.exec(install.uninstall.split(' '))
        await io.remove(join(host.root(home), ...install.marker.split('/')))
        return { ok: true, detail: '' }
    }
  }
  catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}
