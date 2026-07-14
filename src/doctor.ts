import type { CatalogEntry } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import { homedir } from 'node:os'
import { password } from '@inquirer/prompts'
import pc from 'picocolors'
import { CATALOG } from './catalog/entries.js'
import { HOSTS } from './hosts/index.js'
import { t } from './i18n.js'
import { installEntry } from './install.js'
import { realIo } from './io.js'
import { isGlobalType } from './catalog/types.js'
import { hostPresent, installedMcp, missingEnvKeys, statusOf } from './probe.js'
import { statusLabel } from './ui.js'
import { supportsHost } from './wizard-logic.js'

/** 全量探测报告 + 缺失 env 补配（PRD 验收 5；无状态，ADR-0004） */
export async function runDoctor(): Promise<void> {
  const home = homedir()
  const io = realIo()
  const needEnv: { entry: CatalogEntry, host: HostAdapter, keys: string[] }[] = []

  for (const host of HOSTS) {
    const present = hostPresent(host, home, io)
    console.log(pc.bold(host.label) + (present ? '' : pc.dim(` — ${t('common.notDetected')}`)))
    if (!present)
      continue
    for (const entry of CATALOG.filter(e => !isGlobalType(e.type) && supportsHost(e, host))) {
      const status = statusOf(entry, host, home, io)
      let line = `  ${entry.id.padEnd(18)} ${statusLabel(status)}`
      if (status === 'missing-env') {
        const keys = missingEnvKeys(entry, host, home, io)
        needEnv.push({ entry, host, keys })
        line += pc.yellow(` → ${keys.join(', ')}`)
      }
      console.log(line)
    }
  }
  console.log(pc.bold(t('doctor.globalTools')))
  for (const entry of CATALOG.filter(e => isGlobalType(e.type))) {
    // 全局工具与宿主无关；plugin 探 marker 用其声明宿主，回落首个宿主
    const host = HOSTS.find(h => supportsHost(entry, h)) ?? HOSTS[0]!
    console.log(`  ${entry.id.padEnd(18)} ${statusLabel(statusOf(entry, host, home, io))}`)
  }

  // 缺必需 env 的条目：现场补配。重装同名 MCP 时合并既有 env，避免丢失已配置的键
  for (const { entry, host, keys } of needEnv) {
    console.log()
    const entered: Record<string, string> = {}
    for (const key of keys) {
      const value = await password({ message: t('doctor.envPrompt', { name: entry.name, host: host.label, key }), mask: '*' })
      if (value)
        entered[key] = value
    }
    if (Object.keys(entered).length === 0)
      continue
    const merged = { ...installedMcp(entry, host, home, io)?.env, ...entered }
    const removed = await io.exec(host.mcp.removeCommand(entry.id))
    if (!removed.ok) {
      console.log(pc.red(`  ${t('doctor.reRegisterFailed', { id: entry.id, detail: removed.detail })}`))
      continue
    }
    const r = await installEntry(entry, host, home, merged, io)
    console.log(r.ok
      ? pc.green(`  ${t('doctor.envConfigured', { id: entry.id })}`)
      : pc.red(`  ${t('doctor.envFailed', { id: entry.id, detail: r.detail })}`))
  }
}
