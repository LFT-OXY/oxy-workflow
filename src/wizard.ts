import type { CatalogEntry, HostId } from './catalog/types.js'
import { homedir } from 'node:os'
import { checkbox, password, Separator } from '@inquirer/prompts'
import pc from 'picocolors'
import { CATALOG } from './catalog/entries.js'
import { HOSTS, hostById } from './hosts/index.js'
import { installEntry } from './install.js'
import { realIo } from './io.js'
import { hostPresent, statusOf } from './probe.js'
import { TYPE_ORDER, TYPE_TITLE } from './ui.js'
import { buildChoices, installTargets } from './wizard-logic.js'

/** 交互向导：宿主选择 → 组件多选 → env 引导 → 执行 → 汇总（PRD 验收 1-4） */
export async function runWizard(): Promise<void> {
  const home = homedir()
  const io = realIo()

  // 1. 宿主选择：探测到的默认勾选
  const detected = new Set(HOSTS.filter(h => hostPresent(h, home, io)).map(h => h.id))
  const hostIds = await checkbox<HostId>({
    message: 'Install into which hosts?',
    choices: HOSTS.map(h => ({
      value: h.id,
      name: detected.has(h.id) ? h.label : `${h.label} ${pc.dim('(not detected)')}`,
      checked: detected.has(h.id),
    })),
    validate: v => v.length > 0 || 'Pick at least one host',
  })
  const selected = hostIds.map(hostById)

  // 2. 组件多选：按类型分组，推荐集预选，已装/不适用标注
  const status = (e: CatalogEntry, h: (typeof HOSTS)[number]) => statusOf(e, h, home, io)
  const rows = buildChoices(CATALOG, selected, status)
  const choices: (Separator | { value: string, name: string, checked: boolean, disabled: string | boolean })[] = []
  for (const type of TYPE_ORDER) {
    const group = rows.filter(r => r.entry.type === type)
    if (group.length === 0)
      continue
    choices.push(new Separator(pc.bold(TYPE_TITLE[type])))
    for (const r of group) {
      choices.push({
        value: r.entry.id,
        name: `${r.entry.name} ${pc.dim(`— ${r.entry.summary}`)}${r.note ? ` ${pc.yellow(`[${r.note}]`)}` : ''}`,
        checked: r.checked,
        disabled: r.disabled && pc.dim(`(${r.disabled})`),
      })
    }
  }
  const pickedIds = await checkbox<string>({ message: 'Select components to install', choices, pageSize: 18 })
  const picked = CATALOG.filter(e => pickedIds.includes(e.id))
  if (picked.length === 0) {
    console.log('Nothing selected, bye.')
    return
  }

  // 3. env 引导（可跳过；跳过的必需项由 doctor 补配）
  const envValues: Record<string, Record<string, string>> = {}
  for (const entry of picked) {
    for (const v of entry.env ?? []) {
      const suffix = v.required ? '' : ' (optional, Enter to skip)'
      const hint = v.hint ? pc.dim(` ${v.hint}`) : ''
      const value = await password({ message: `${entry.name} · ${v.key}${suffix}${hint}`, mask: '*' })
      if (value)
        (envValues[entry.id] ??= {})[v.key] = value
    }
  }

  // 4. 逐条执行，单条失败跳过不中断
  const failures: string[] = []
  let done = 0
  for (const entry of picked) {
    for (const host of installTargets(entry, selected, status)) {
      const where = entry.type === 'spec' ? 'global' : host.id
      process.stdout.write(`  ${entry.id} ${pc.dim(`→ ${where}`)} ... `)
      const r = await installEntry(entry, host, home, envValues[entry.id] ?? {}, io)
      if (r.ok) {
        done++
        console.log(pc.green('ok'))
      }
      else {
        failures.push(`${entry.id} → ${where}: ${r.detail}`)
        console.log(pc.red('failed'))
      }
    }
  }

  // 5. 汇总
  console.log()
  console.log(`${pc.green(String(done))} installed${failures.length ? `, ${pc.red(String(failures.length))} failed` : ''}`)
  for (const f of failures)
    console.log(pc.red(`  ✗ ${f}`))
  console.log(pc.dim('Run `npx oxy-workflow doctor` anytime to check status or finish env setup.'))
}
