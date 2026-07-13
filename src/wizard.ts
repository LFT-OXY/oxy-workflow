import type { CatalogEntry, HostId } from './catalog/types.js'
import { homedir } from 'node:os'
import { checkbox, password, Separator } from '@inquirer/prompts'
import pc from 'picocolors'
import { CATALOG } from './catalog/entries.js'
import { HOSTS, hostById } from './hosts/index.js'
import { installEntry } from './install.js'
import { realIo } from './io.js'
import { t } from './i18n.js'
import { hostPresent, statusOf } from './probe.js'
import { TYPE_ORDER, typeTitle } from './ui.js'
import { buildChoices, installHosts } from './wizard-logic.js'

/** 交互向导：宿主选择 → 组件多选 → env 引导 → 执行 → 汇总（PRD 验收 1-4） */
export async function runWizard(): Promise<void> {
  const home = homedir()
  const io = realIo()

  // 1. 宿主选择：探测到的默认勾选
  const detected = new Set(HOSTS.filter(h => hostPresent(h, home, io)).map(h => h.id))
  const hostIds = await checkbox<HostId>({
    message: t('wizard.pickHosts'),
    choices: HOSTS.map(h => ({
      value: h.id,
      name: detected.has(h.id) ? h.label : `${h.label} ${pc.dim(`(${t('common.notDetected')})`)}`,
      checked: detected.has(h.id),
    })),
    validate: v => v.length > 0 || t('wizard.needHost'),
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
    choices.push(new Separator(pc.bold(typeTitle(type))))
    for (const r of group) {
      choices.push({
        value: r.entry.id,
        name: `${r.entry.name} ${pc.dim(`— ${r.entry.summary}`)}${r.note ? ` ${pc.yellow(`[${r.note}]`)}` : ''}`,
        checked: r.checked,
        disabled: r.disabled && pc.dim(`(${r.disabled})`),
      })
    }
  }
  const pickedIds = await checkbox<string>({ message: t('wizard.pickComponents'), choices, pageSize: 18 })
  const picked = CATALOG.filter(e => pickedIds.includes(e.id))
  if (picked.length === 0) {
    console.log(t('common.nothingSelected'))
    return
  }

  // 只对真正有安装目标的条目走后续流程；选了但已装满的仅提示
  const plans = picked.map(entry => ({ entry, hosts: installHosts(entry, selected, status) }))
  for (const p of plans.filter(p => p.hosts.length === 0))
    console.log(pc.dim(`  ${t('wizard.skipInstalled', { id: p.entry.id })}`))
  const todo = plans.filter(p => p.hosts.length > 0)

  // 3. env 引导（可跳过；跳过的必需项由 doctor 补配）
  const envValues: Record<string, Record<string, string>> = {}
  for (const { entry } of todo) {
    for (const v of entry.env ?? []) {
      const suffix = v.required ? '' : ` ${t('wizard.envOptional')}`
      const hint = v.hint ? pc.dim(` ${v.hint}`) : ''
      const value = await password({ message: `${entry.name} · ${v.key}${suffix}${hint}`, mask: '*' })
      if (value)
        (envValues[entry.id] ??= {})[v.key] = value
    }
  }

  // 4. 逐条执行，单条失败跳过不中断
  const failures: string[] = []
  let done = 0
  for (const { entry, hosts } of todo) {
    for (const host of hosts) {
      const where = entry.type === 'spec' ? 'global' : host.id
      process.stdout.write(`  ${entry.id} ${pc.dim(`→ ${where}`)} ... `)
      const r = await installEntry(entry, host, home, envValues[entry.id] ?? {}, io)
      if (r.ok) {
        done++
        console.log(pc.green(t('common.ok')))
      }
      else {
        failures.push(`${entry.id} → ${where}: ${r.detail}`)
        console.log(pc.red(t('common.failed')))
      }
    }
  }

  // 5. 汇总
  console.log()
  console.log(pc.green(t('wizard.summary', { n: done })) + (failures.length ? pc.red(t('wizard.summaryFailed', { n: failures.length })) : ''))
  for (const f of failures)
    console.log(pc.red(`  ✗ ${f}`))
  console.log(pc.dim(t('wizard.doctorHint')))
}
