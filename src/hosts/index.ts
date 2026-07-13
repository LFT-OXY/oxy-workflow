import type { HostId } from '../catalog/types.js'
import type { HostAdapter } from './types.js'
import { claude } from './claude.js'
import { codex } from './codex.js'

/** 宿主注册表：新增宿主 = 实现 HostAdapter 后在此登记（ADR-0005） */
export const HOSTS: HostAdapter[] = [claude, codex]

export function hostById(id: HostId): HostAdapter {
  const host = HOSTS.find(h => h.id === id)
  if (!host)
    throw new Error(`unknown host: ${id}`)
  return host
}
