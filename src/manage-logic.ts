import type { CatalogEntry } from './catalog/types.js'
import type { HostAdapter } from './hosts/types.js'
import type { Status } from './probe.js'
import type { StatusLookup } from './wizard-logic.js'
import { isGlobalType } from './ui.js'
import { supportsHost } from './wizard-logic.js'

/** 宿主存在性查询：管理流把真实探测柯里化后传入，纯逻辑可测 */
export type PresenceLookup = (host: HostAdapter) => boolean

/** 条目在单个适用宿主上的实时快照（列表徽标与详情状态行共用） */
export interface HostState {
  host: HostAdapter
  status: Status
  detected: boolean
}

/**
 * 条目在各适用宿主上的实时状态，顺序与宿主注册表一致。
 * 全局工具（spec/cli/plugin）与宿主无关，归一为首个适用宿主视角的单条全局状态。
 */
export function hostStates(
  entry: CatalogEntry,
  hosts: HostAdapter[],
  status: StatusLookup,
  present: PresenceLookup,
): HostState[] {
  const applicable = hosts.filter(h => supportsHost(entry, h))
  const targets = isGlobalType(entry.type) ? applicable.slice(0, 1) : applicable
  return targets.map(host => ({ host, status: status(entry, host), detected: present(host) }))
}

/** 详情屏动作：装/卸 × 宿主；detected 供未检测宿主标注（照列，与向导口径一致） */
export interface ManageAction {
  kind: 'install' | 'uninstall'
  host: HostAdapter
  detected: boolean
}

/**
 * 按宿主 × 状态生成动作清单：missing → 安装；已装（含缺 env）→ 卸载。
 * 安装动作在前。卸载资格以机制可逆性判定（与 uninstallEntry 同一
 * 判据，非按类型）：shell 不可逆，已装不给卸载动作。
 */
export function entryActions(entry: CatalogEntry, states: HostState[]): ManageAction[] {
  const installs = states
    .filter(s => s.status === 'missing')
    .map(s => ({ kind: 'install' as const, host: s.host, detected: s.detected }))
  const uninstalls = states
    .filter(s => s.status !== 'missing' && entry.install.method !== 'shell')
    .map(s => ({ kind: 'uninstall' as const, host: s.host, detected: s.detected }))
  return [...installs, ...uninstalls]
}
