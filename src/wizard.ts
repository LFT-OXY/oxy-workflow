import type { CatalogEntry, EntryType, HostId } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import { homedir } from 'node:os'
import pc from 'picocolors'
import { runAgentInstall } from './agent-install.js'
import { CATALOG } from './catalog/entries.js'
import { HOSTS, hostById } from './hosts/index.js'
import { installEntry } from './install.js'
import { realIo } from './io.js'
import type { MultiResult } from './list-prompt.js'
import { localize, t } from './i18n.js'
import { multiSelect, singleSelect } from './list-prompt.js'
import { isGlobalType } from './catalog/types.js'
import { hostCliInstalled, hostPresent, type ProbeIo, statusOf } from './probe.js'
import { promptEnv, typeTitle } from './ui.js'
import { buildChoices, installHosts, prunePicks, screenTypes } from './wizard-logic.js'

/** 条目的安装去向展示口径（全局工具与宿主无关，显示 global） */
function targetLabel(entry: CatalogEntry, hosts: HostAdapter[]): string {
  return isGlobalType(entry.type) ? 'global' : hosts.map(h => h.id).join(', ')
}

/**
 * 缺宿主 CLI → 引导去「安装 AI Agent」（否则装进宿主的组件必失败，ADR-0008）。
 * 选宿主屏与执行前的插件落点两处共用（宿主组件在选宿主屏拦，全局流的插件在此拦）。
 */
async function bootstrapIfMissing(hosts: HostAdapter[], io: ProbeIo): Promise<void> {
  const missing = hosts.filter(h => !hostCliInstalled(h, io))
  if (missing.length === 0)
    return
  console.log(pc.yellow(`\n${t('wizard.hostCliMissing', { hosts: missing.map(h => h.label).join(', ') })}`))
  const jump = await singleSelect<'install' | 'skip'>({
    message: t('wizard.confirmProceed'),
    backLabel: t('wizard.back'),
    help: t('prompt.singleHelp'),
    items: [
      { value: 'install', name: t('wizard.hostCliInstall') },
      { value: 'skip', name: t('wizard.hostCliSkip') },
    ],
  })
  if (!jump.back && jump.picked === 'install')
    await runAgentInstall(missing.map(h => h.id))
}

/**
 * 交互向导（PRD 验收 1-4）：按组件类型拆入口后，allowedTypes 限定本次覆盖的
 * 类型；全为全局工具时跳过选宿主屏、直接进类型屏（ADR-0009）。
 * 宿主选择 ↔ 类型分屏多选 ↔ 汇总确认 → env 引导 → 逐条安装 → 汇总。
 * 确认前全链可退（每屏顶部返回行 / Esc 后退一层，ADR-0007），确认后不可逆。
 * allowedTypes 缺省 = 全部宿主组件类型（供 `oxy install` 平铺入口）。
 */
export async function runWizard(allowedTypes?: readonly EntryType[]): Promise<void> {
  const home = homedir()
  const io = realIo()
  const status = (e: CatalogEntry, h: HostAdapter) => statusOf(e, h, home, io)

  // 本次覆盖的类型屏：按全局顺序，交 allowedTypes（缺省=全部宿主组件类型）
  const allScreens = screenTypes(CATALOG)
  const allowed = allowedTypes ?? allScreens.filter(ty => !isGlobalType(ty))
  const screens = allScreens.filter(ty => allowed.includes(ty))
  // 全局工具入口无宿主维度：跳过选宿主屏，selected 取全部宿主供 installHosts 归一。
  // 以 allowed（而非当前有条目的 screens）判定，未收录时也不误弹选宿主屏
  const global = allowed.length > 0 && allowed.every(isGlobalType)

  const picks = new Map<EntryType, string[]>() // 各类型屏离开时的选中集（回访时恢复）
  let hostIds: HostId[] | null = null // 宿主屏回访时恢复上次选择
  let selected: HostAdapter[] = global ? [...HOSTS] : []
  let todo: { entry: CatalogEntry, hosts: HostAdapter[] }[] = []
  // 选择链状态机：-1 = 宿主屏，0..N-1 = 类型屏，N = 汇总确认；全局工具从 0 起
  let step = global ? 0 : -1

  chain: while (true) {
    if (step < 0) {
      // 全局工具无宿主屏，退到链头即回主菜单
      if (global)
        return
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
      await bootstrapIfMissing(selected, io)
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

  // 全局流跳过了选宿主屏，但 plugin 仍落进宿主：缺宿主 CLI 同样引导（ADR-0008）。
  // shell 类（spec/cli）无宿主，install.method 过滤掉即可。
  if (global) {
    const pluginHosts = [...new Set(todo.filter(p => p.entry.install.method !== 'shell').flatMap(p => p.hosts))]
    await bootstrapIfMissing(pluginHosts, io)
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
