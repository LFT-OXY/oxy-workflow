import type { CatalogEntry } from './catalog/types.js'
import type { Status } from './probe.js'
import { describe, expect, it } from 'vitest'
import { claude } from './hosts/claude.js'
import { codex } from './hosts/codex.js'
import { entryActions, hostStates } from './manage-logic.js'

function entry(partial: Partial<CatalogEntry> & Pick<CatalogEntry, 'id' | 'type'>): CatalogEntry {
  return {
    name: partial.id,
    summary: '',
    homepage: 'https://x',
    install: { method: 'shell', command: 'x', binary: partial.id },
    ...partial,
  } as CatalogEntry
}

const skill = entry({ id: 's1', type: 'skill', install: { method: 'fetch-files', repo: 'o/r', source: 'skills/s1' } })

/** 以 (entryId, hostId) 查表伪造探测结果，缺省 missing */
function statuses(map: Record<string, Status>) {
  return (e: CatalogEntry, h: { id: string }): Status => map[`${e.id}@${h.id}`] ?? 'missing'
}

const allPresent = () => true

describe('hostStates：条目在各适用宿主上的实时状态', () => {
  it('逐宿主返回探测状态，顺序与宿主注册表一致', () => {
    const states = hostStates(skill, [claude, codex], statuses({ 's1@claude': 'installed' }), allPresent)
    expect(states.map(s => [s.host.id, s.status])).toEqual([
      ['claude', 'installed'],
      ['codex', 'missing'],
    ])
  })

  it('不适用宿主不出现（agent 仅 claude；codex 无 subagent 概念）', () => {
    const agent = entry({ id: 'a1', type: 'agent', hosts: ['claude'], install: { method: 'fetch-files', repo: 'o/r', source: 'agents/a1.md' } })
    const states = hostStates(agent, [claude, codex], statuses({}), allPresent)
    expect(states.map(s => s.host.id)).toEqual(['claude'])
  })

  it('spec 与宿主无关：归一为单条全局视角状态', () => {
    const spec = entry({ id: 'openspec', type: 'spec' })
    const states = hostStates(spec, [claude, codex], statuses({ 'openspec@claude': 'installed' }), allPresent)
    expect(states.length).toBe(1)
    expect(states[0]!.status).toBe('installed')
  })
})

describe('entryActions：详情屏动作清单', () => {
  it('未装宿主 → 安装动作，携带宿主检测标记（未检测照列，Q11 口径）', () => {
    const states = hostStates(skill, [claude, codex], statuses({}), h => h.id === 'claude')
    const actions = entryActions(skill, states)
    expect(actions).toEqual([
      { kind: 'install', host: claude, detected: true },
      { kind: 'install', host: codex, detected: false },
    ])
  })

  it('已装宿主 → 卸载动作；缺 env 视为已装同样可卸', () => {
    const states = hostStates(skill, [claude, codex], statuses({ 's1@claude': 'installed', 's1@codex': 'missing-env' }), allPresent)
    expect(entryActions(skill, states).map(a => [a.kind, a.host.id])).toEqual([
      ['uninstall', 'claude'],
      ['uninstall', 'codex'],
    ])
  })

  it('混合状态 → 装卸并存（装 codex、卸 claude）', () => {
    const states = hostStates(skill, [claude, codex], statuses({ 's1@claude': 'installed' }), allPresent)
    expect(entryActions(skill, states).map(a => [a.kind, a.host.id])).toEqual([
      ['install', 'codex'],
      ['uninstall', 'claude'],
    ])
  })

  it('spec 不可逆：已装无卸载动作，未装恰一个全局安装动作', () => {
    const spec = entry({ id: 'openspec', type: 'spec' })
    const installed = hostStates(spec, [claude, codex], statuses({ 'openspec@claude': 'installed' }), allPresent)
    expect(entryActions(spec, installed)).toEqual([])

    const missing = hostStates(spec, [claude, codex], statuses({}), allPresent)
    expect(entryActions(spec, missing).map(a => a.kind)).toEqual(['install'])
  })
})
