import type { CatalogEntry, EntryType, HostId } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import { homedir } from 'node:os'
import pc from 'picocolors'
import { CATALOG } from './catalog/entries.js'
import { HOSTS, hostById } from './hosts/index.js'
import { installEntry } from './install.js'
import { realIo } from './io.js'
import type { MultiResult } from './list-prompt.js'
import { localize, t } from './i18n.js'
import { multiSelect, singleSelect } from './list-prompt.js'
import { hostPresent, statusOf } from './probe.js'
import { promptEnv, typeTitle } from './ui.js'
import { buildChoices, installHosts, prunePicks, screenTypes } from './wizard-logic.js'

/** 条目的安装去向展示口径（spec 全局安装，与宿主无关） */
function targetLabel(entry: CatalogEntry, hosts: HostAdapter[]): string {
  return entry.type === 'spec' ? 'global' : hosts.map(h => h.id).join(', ')
}

/**
 * 交互向导（PRD 验收 1-4）：
 * 宿主选择 ↔ 类型分屏多选 ↔ 汇总确认 → env 引导 → 逐条安装 → 汇总。
 * 确认前全链可退（每屏顶部返回行 / Esc 后退一层，ADR-0007），确认后不可逆。
 */
export async function runWizard(): Promise<void> {
  const home = homedir()
  const io = realIo()
  const status = (e: CatalogEntry, h: HostAdapter) => statusOf(e, h, home, io)

  const screens = screenTypes(CATALOG)
  const picks = new Map<EntryType, string[]>() // 各类型屏离开时的选中集（回访时恢复）
  let hostIds: HostId[] | null = null // 宿主屏回访时恢复上次选择
  let selected: HostAdapter[] = []
  let todo: { entry: CatalogEntry, hosts: HostAdapter[] }[] = []
  // 选择链状态机：-1 = 宿主屏，0..N-1 = 类型屏，N = 汇总确认
  let step = -1

  chain: while (true) {
    if (step < 0) {
      // 宿主屏（链头，返回即回主菜单）：首访默认勾选探测到的宿主
      const detected = new Set(HOSTS.filter(h => hostPresent(h, home, io)).map(h => h.id))
      const preset = new Set<HostId>(hostIds ?? [...detected])
      // 显式注解断开「preset → hostIds → res → preset」的循环推断
      const res: MultiResult<HostId> = await multiSelect<HostId>({
        message: t('wizard.pickHosts'),
        backLabel: t('common.backToMenu'),
        help: t('prompt.multiHelp'),
        items: HOSTS.map(h => ({
          value: h.id,
          name: detected.has(h.id) ? h.label : `${h.label} ${pc.dim(`(${t('common.notDetected')})`)}`,
          short: h.label,
          checked: preset.has(h.id),
        })),
        validate: v => v.length > 0 || t('wizard.needHost'),
      })
      if (res.back)
        return
      hostIds = res.picked
      selected = res.picked.map(hostById)
      // 改宿主后：仍适用的勾选保留，不再适用的静默丢弃
      for (const [type, ids] of picks)
        picks.set(type, prunePicks(ids, CATALOG, selected))
      step = 0
    }
    else if (step < screens.length) {
      // 类型屏：首访推荐集预选，回访恢复存留勾选；不适用条目置灰示因
      const type = screens[step]!
      const rows = buildChoices(CATALOG.filter(e => e.type === type), selected, status, picks.get(type))
      const res = await multiSelect<string>({
        message: t('wizard.pickType', { type: typeTitle(type) }),
        backLabel: t('wizard.back'),
        help: t('prompt.multiHelp'),
        items: rows.map(r => ({
          value: r.entry.id,
          name: `${r.entry.name} ${pc.dim(`— ${localize(r.entry.summary)}`)}${r.note ? ` ${pc.yellow(`[${r.note}]`)}` : ''}`,
          short: r.entry.name,
          checked: r.checked,
          disabled: r.disabled || undefined,
        })),
        pageSize: 15,
      })
      // 后退也存留当前勾选（离屏即存，回访恢复）
      picks.set(type, res.picked)
      step += res.back ? -1 : 1
    }
    else {
      // 汇总确认：全量已选 × 目标宿主一览，确认后进入不可逆阶段
      const pickedIds = new Set(screens.flatMap(ty => picks.get(ty) ?? []))
      const plans = CATALOG.filter(e => pickedIds.has(e.id))
        .map(entry => ({ entry, hosts: installHosts(entry, selected, status) }))
      console.log()
      if (plans.length === 0) {
        console.log(pc.yellow(t('wizard.confirmEmpty')))
      }
      else {
        console.log(pc.bold(t('wizard.confirmList', { n: plans.length })))
        for (const p of plans) {
          const where = p.hosts.length === 0
            ? pc.dim(`(${t('status.installed')})`)
            : pc.dim(`→ ${targetLabel(p.entry, p.hosts)}`)
          console.log(`  ${p.entry.name} ${where}`)
        }
      }
      const action = await singleSelect<'go' | 'cancel'>({
        message: t('wizard.confirmProceed'),
        backLabel: t('wizard.back'),
        help: t('prompt.singleHelp'),
        items: [
          ...(plans.length > 0 ? [{ value: 'go' as const, name: t('wizard.confirmGo') }] : []),
          { value: 'cancel' as const, name: t('wizard.confirmCancel') },
        ],
      })
      if (action.back) {
        step -= 1
        continue
      }
      if (action.picked === 'cancel')
        return
      // 已装满的条目无安装目标，静默跳过（确认屏已标注 installed）
      todo = plans.filter(p => p.hosts.length > 0)
      break chain
    }
  }

  // env 引导（可跳过；跳过的必需项由 doctor 补配）
  const envValues: Record<string, Record<string, string>> = {}
  for (const { entry } of todo)
    envValues[entry.id] = await promptEnv(entry)

  // 逐条执行，单条失败跳过不中断
  const failures: string[] = []
  let done = 0
  for (const { entry, hosts } of todo) {
    for (const host of hosts) {
      const where = targetLabel(entry, [host])
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

  // 汇总
  console.log()
  console.log(pc.green(t('wizard.summary', { n: done })) + (failures.length ? pc.red(t('wizard.summaryFailed', { n: failures.length })) : ''))
  for (const f of failures)
    console.log(pc.red(`  ✗ ${f}`))
  console.log(pc.dim(t('wizard.doctorHint')))
}
