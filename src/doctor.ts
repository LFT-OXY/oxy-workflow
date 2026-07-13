import type { CatalogEntry } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import type { Io } from './io.js'
import { homedir } from 'node:os'
import { password } from '@inquirer/prompts'
import pc from 'picocolors'
import { CATALOG } from './catalog/entries.js'
import { HOSTS } from './hosts/index.js'
import { installEntry } from './install.js'
import { realIo } from './io.js'
import { hostPresent, statusOf } from './probe.js'
import { statusLabel } from './ui.js'
import { supportsHost } from './wizard-logic.js'

/** 全量探测报告 + 缺失 env 补配（PRD 验收 5；无状态，ADR-0004） */
export async function runDoctor(): Promise<void> {
  const home = homedir()
  const io = realIo()
  const needEnv: { entry: CatalogEntry, host: HostAdapter, keys: string[] }[] = []

  for (const host of HOSTS) {
    const present = hostPresent(host, home, io)
    console.log(pc.bold(host.label) + (present ? '' : pc.dim(' — not detected')))
    if (!present)
      continue
    for (const entry of CATALOG.filter(e => e.type !== 'spec' && supportsHost(e, host))) {
      const status = statusOf(entry, host, home, io)
      let line = `  ${entry.id.padEnd(18)} ${statusLabel(status)}`
      if (status === 'missing-env') {
        const keys = missingKeys(entry, host, home, io)
        needEnv.push({ entry, host, keys })
        line += pc.yellow(` → ${keys.join(', ')}`)
      }
      console.log(line)
    }
  }
  console.log(pc.bold('Global tools'))
  for (const entry of CATALOG.filter(e => e.type === 'spec'))
    console.log(`  ${entry.id.padEnd(18)} ${statusLabel(statusOf(entry, HOSTS[0]!, home, io))}`)

  // 缺必需 env 的条目：现场补配（重装同名 MCP 以带上完整 env）
  for (const { entry, host, keys } of needEnv) {
    console.log()
    const env: Record<string, string> = {}
    for (const key of keys) {
      const value = await password({ message: `${entry.name} on ${host.label} · ${key} (Enter to skip)`, mask: '*' })
      if (value)
        env[key] = value
    }
    if (Object.keys(env).length === 0)
      continue
    await io.exec(host.mcp.removeCommand(entry.id))
    const r = await installEntry(entry, host, home, env, io)
    console.log(r.ok ? pc.green(`  ${entry.id} env configured`) : pc.red(`  ${entry.id} failed: ${r.detail}`))
  }
}

/** 已装但缺的必需 env 键（读宿主配置对比条目声明） */
function missingKeys(entry: CatalogEntry, host: HostAdapter, home: string, io: Io): string[] {
  const text = io.readFile(host.mcp.configPath(home)) ?? ''
  const installed = host.mcp.parseInstalled(text)[entry.id]
  return (entry.env ?? [])
    .filter(v => v.required && !(v.key in (installed?.env ?? {})))
    .map(v => v.key)
}
