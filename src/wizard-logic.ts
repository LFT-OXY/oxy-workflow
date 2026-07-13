import type { CatalogEntry } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import type { Status } from './probe.js'
import { hostById } from './hosts/index.js'

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

/** 条目是否适用于某宿主（spec 全局恒真；agent 还要求宿主有 subagent 概念） */
export function supportsHost(entry: CatalogEntry, host: HostAdapter): boolean {
  if (entry.type === 'spec')
    return true
  // agentsDir 是 home 的纯函数：传空串即可判断该宿主有无 subagent 概念（null = 无）
  if (entry.type === 'agent' && host.agentsDir('') === null)
    return false
  return (entry.hosts ?? [host.id]).includes(host.id)
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

export function buildChoices(catalog: CatalogEntry[], selected: HostAdapter[], status: StatusLookup): ChoiceRow[] {
  return catalog.map((entry) => {
    const applicable = applicableHosts(entry, selected)
    if (applicable.length === 0) {
      // 禁用原因用适配器注册表里的正式 label，新增宿主无需改这里（ADR-0005）
      const wanted = (entry.hosts ?? []).map(id => hostById(id).label).join(', ')
      return { entry, checked: false, disabled: `requires ${wanted || 'a supported host'}`, note: '' }
    }

    const missing = installHosts(entry, selected, status)
    const installedOn = applicable.filter(h => status(entry, h) !== 'missing')
    const note = missing.length === 0
      ? 'installed'
      : installedOn.length > 0
        ? `installed on ${installedOn.map(h => h.id).join(', ')}`
        : entry.hosts ? `${entry.hosts.join(', ')} only` : ''

    return {
      entry,
      checked: Boolean(entry.recommended) && missing.length > 0,
      disabled: false,
      note,
    }
  })
}
