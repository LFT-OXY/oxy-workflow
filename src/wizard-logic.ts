import type { CatalogEntry, EntryType } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import type { Status } from './probe.js'
import { hostById } from './hosts/index.js'
import { t } from './i18n.js'
import { TYPE_ORDER } from './ui.js'

/** 探测查询函数：向导把真实 IO 探测柯里化后传入，纯逻辑可测 */
export type StatusLookup = (entry: CatalogEntry, host: HostAdapter) => Status

export interface ChoiceRow {
  entry: CatalogEntry
  /** 预选 = 推荐集 ∧ 尚有目标宿主未装 */
  checked: boolean
  /** 非 false 时不可选，值为原因 */
  disabled: string | false
  /** 状态标注（installed / 部分已装 / 宿主范围） */
  note: string
}

/** 分屏选择链的屏幕清单：按全局类型顺序排列，目录中无条目的类型整屏跳过 */
export function screenTypes(catalog: CatalogEntry[]): EntryType[] {
  return TYPE_ORDER.filter(type => catalog.some(e => e.type === type))
}

/** 条目是否适用于某宿主（spec 全局恒真；agent 还要求宿主有 subagent 概念） */
export function supportsHost(entry: CatalogEntry, host: HostAdapter): boolean {
  if (entry.type === 'spec')
    return true
  // agentsDir 是 home 的纯函数：传空串即可判断该宿主有无 subagent 概念（null = 无）
  if (entry.type === 'agent' && host.agentsDir('') === null)
    return false
  return (entry.hosts ?? [host.id]).includes(host.id)
}

/** 改宿主后修剪存留勾选：仍适用（任一所选宿主支持）的保留，其余静默丢弃 */
export function prunePicks(ids: string[], catalog: CatalogEntry[], selected: HostAdapter[]): string[] {
  return ids.filter((id) => {
    const entry = catalog.find(e => e.id === id)
    return entry !== undefined && selected.some(h => supportsHost(entry, h))
  })
}

/** 条目在所选宿主中的适用集合；spec 与宿主无关，恒等于所选 */
function applicableHosts(entry: CatalogEntry, selected: HostAdapter[]): HostAdapter[] {
  return selected.filter(h => supportsHost(entry, h))
}

/** 真正要执行安装的宿主：适用 ∧ 未装（missing-env 视为已装，补配走 doctor） */
export function installHosts(entry: CatalogEntry, selected: HostAdapter[], status: StatusLookup): HostAdapter[] {
  const applicable = applicableHosts(entry, selected)
  if (entry.type === 'spec') {
    // 全局安装：任一宿主视角 missing 才装，且只装一次
    const missing = applicable.some(h => status(entry, h) === 'missing')
    return missing ? applicable.slice(0, 1) : []
  }
  return applicable.filter(h => status(entry, h) === 'missing')
}

/** stored：回访屏的存留勾选（离开该屏时的选中集）；缺省 = 首访走推荐集默认 */
export function buildChoices(catalog: CatalogEntry[], selected: HostAdapter[], status: StatusLookup, stored?: string[]): ChoiceRow[] {
  return catalog.map((entry) => {
    const applicable = applicableHosts(entry, selected)
    if (applicable.length === 0) {
      // 禁用原因用适配器注册表里的正式 label，新增宿主无需改这里（ADR-0005）
      const wanted = (entry.hosts ?? []).map(id => hostById(id).label).join(', ')
      return { entry, checked: false, disabled: t('logic.requires', { hosts: wanted || t('logic.supportedHost') }), note: '' }
    }

    const missing = installHosts(entry, selected, status)
    const installedOn = applicable.filter(h => status(entry, h) !== 'missing')
    const note = missing.length === 0
      ? t('status.installed')
      : installedOn.length > 0
        ? t('logic.installedOn', { hosts: installedOn.map(h => h.id).join(', ') })
        : entry.hosts ? t('logic.hostsOnly', { hosts: entry.hosts.join(', ') }) : ''

    return {
      entry,
      checked: stored ? stored.includes(entry.id) : Boolean(entry.recommended) && missing.length > 0,
      disabled: false,
      note,
    }
  })
}
