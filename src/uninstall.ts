import { homedir } from 'node:os'
import { checkbox, confirm } from '@inquirer/prompts'
import pc from 'picocolors'
import { CATALOG } from './catalog/entries.js'
import { HOSTS } from './hosts/index.js'
import { uninstallEntry } from './install.js'
import { realIo } from './io.js'
import { hostPresent, statusOf } from './probe.js'
import { supportsHost } from './wizard-logic.js'

/** 交互卸载：只列探测到已装的，逐项勾选 + 总确认；spec 不可逆仅提示 */
export async function runUninstall(): Promise<void> {
  const home = homedir()
  const io = realIo()

  const removable: { key: string, name: string }[] = []
  for (const host of HOSTS.filter(h => hostPresent(h, home, io))) {
    for (const entry of CATALOG.filter(e => e.type !== 'spec' && supportsHost(e, host))) {
      if (statusOf(entry, host, home, io) !== 'missing')
        removable.push({ key: `${entry.id}@${host.id}`, name: `${entry.name} ${pc.dim(`on ${host.label}`)}` })
    }
  }
  const specInstalled = CATALOG.filter(e =>
    e.type === 'spec' && statusOf(e, HOSTS[0]!, home, io) === 'installed')

  if (removable.length === 0 && specInstalled.length === 0) {
    console.log('Nothing installed by catalog entries was found.')
    return
  }

  const picked = await checkbox<string>({
    message: 'Select components to remove',
    choices: [
      ...removable.map(r => ({ value: r.key, name: r.name })),
      ...specInstalled.map(e => ({
        value: e.id,
        name: e.name,
        disabled: pc.dim('(global CLI, uninstall manually)'),
      })),
    ],
  })
  if (picked.length === 0) {
    console.log('Nothing selected, bye.')
    return
  }

  // 逐项确认后再删（ADR-0004：无状态无法判断归属，确认是唯一防线）
  let failed = 0
  for (const key of picked) {
    const [entryId, hostId] = key.split('@')
    const entry = CATALOG.find(e => e.id === entryId)!
    const host = HOSTS.find(h => h.id === hostId)!
    if (!await confirm({ message: `Remove ${entry.name} on ${host.label}?`, default: false }))
      continue
    const r = await uninstallEntry(entry, host, home, io)
    console.log(r.ok ? pc.green(`  removed ${key}`) : pc.red(`  failed ${key}: ${r.detail}`))
    if (!r.ok)
      failed++
  }
  if (failed === 0)
    console.log(pc.dim('Done. `npx oxy-workflow doctor` to verify.'))
}
