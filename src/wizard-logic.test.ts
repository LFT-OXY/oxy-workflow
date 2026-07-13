import type { CatalogEntry } from './catalog/types.js'
import type { Status } from './probe.js'
import { describe, expect, it } from 'vitest'
import { claude } from './hosts/claude.js'
import { codex } from './hosts/codex.js'
import { buildChoices, installHosts, prunePicks, screenTypes } from './wizard-logic.js'

function entry(partial: Partial<CatalogEntry> & Pick<CatalogEntry, 'id' | 'type'>): CatalogEntry {
  return {
    name: partial.id,
    summary: '',
    homepage: 'https://x',
    install: { method: 'shell', command: 'x', binary: partial.id },
    ...partial,
  } as CatalogEntry
}

const skill = entry({ id: 's1', type: 'skill', recommended: true, install: { method: 'fetch-files', repo: 'o/r', source: 'skills/s1' } })
const agent = entry({ id: 'a1', type: 'agent', hosts: ['claude'], install: { method: 'fetch-files', repo: 'o/r', source: 'agents/a1.md' } })

/** 以 (entryId, hostId) 查表伪造探测结果，缺省 missing */
function statuses(map: Record<string, Status>) {
  return (e: CatalogEntry, h: { id: string }): Status => map[`${e.id}@${h.id}`] ?? 'missing'
}

describe('buildChoices：向导选择行', () => {
  it('推荐且未装 → 预选；未推荐 → 不预选', () => {
    const rows = buildChoices([skill, agent], [claude, codex], statuses({}))
    expect(rows.find(r => r.entry.id === 's1')!.checked).toBe(true)
    expect(rows.find(r => r.entry.id === 'a1')!.checked).toBe(false)
  })

  it('所选宿主全都不支持 → 禁用并给出原因', () => {
    const rows = buildChoices([agent], [codex], statuses({}))
    const row = rows[0]!
    expect(row.disabled).toMatch(/Claude Code/)
  })

  it('在全部目标宿主都已装 → 不预选并标注 installed', () => {
    const rows = buildChoices([skill], [claude, codex], statuses({ 's1@claude': 'installed', 's1@codex': 'installed' }))
    const row = rows[0]!
    expect(row.checked).toBe(false)
    expect(row.note).toMatch(/installed/)
  })

  it('部分宿主已装 → 仍预选（补装缺的那个），标注部分状态', () => {
    const rows = buildChoices([skill], [claude, codex], statuses({ 's1@claude': 'installed' }))
    const row = rows[0]!
    expect(row.checked).toBe(true)
    expect(row.note).toMatch(/claude/i)
  })

  it('回访屏传入存留勾选 → 覆盖默认预选（勾选过的恢复，取消过的不再预选）', () => {
    const rows = buildChoices([skill, agent], [claude], statuses({}), ['a1'])
    expect(rows.find(r => r.entry.id === 'a1')!.checked).toBe(true)
    expect(rows.find(r => r.entry.id === 's1')!.checked).toBe(false)
  })

  it('禁用行即使在存留勾选中也不勾选', () => {
    const rows = buildChoices([agent], [codex], statuses({}), ['a1'])
    expect(rows[0]!.checked).toBe(false)
  })
})

describe('screenTypes：分屏选择链的屏幕清单', () => {
  it('按 skill 首位的全局顺序排列，目录中无条目的类型整屏跳过', () => {
    const mcp = entry({ id: 'm1', type: 'mcp', install: { method: 'mcp-config', server: { command: 'npx' } } })
    expect(screenTypes([mcp, skill])).toEqual(['skill', 'mcp'])
    expect(screenTypes([skill])).toEqual(['skill'])
    expect(screenTypes([])).toEqual([])
  })
})

describe('prunePicks：改宿主后的勾选存留', () => {
  it('仍适用的保留，不再适用的静默丢弃，spec 恒保留', () => {
    const spec = entry({ id: 'openspec', type: 'spec' })
    const catalog = [skill, agent, spec]
    // claude → codex：agent（仅 claude）被丢弃，skill 与 spec 保留
    expect(prunePicks(['s1', 'a1', 'openspec'], catalog, [codex])).toEqual(['s1', 'openspec'])
    expect(prunePicks(['s1', 'a1', 'openspec'], catalog, [claude])).toEqual(['s1', 'a1', 'openspec'])
  })
})

describe('installHosts：真正要执行安装的 (条目×宿主) 对', () => {
  it('跳过已装宿主，只装缺的', () => {
    const targets = installHosts(skill, [claude, codex], statuses({ 's1@claude': 'installed' }))
    expect(targets.map(h => h.id)).toEqual(['codex'])
  })

  it('spec 与宿主无关：缺则恰好一次，装齐则零次', () => {
    const spec = entry({ id: 'openspec', type: 'spec' })
    expect(installHosts(spec, [claude, codex], statuses({})).length).toBe(1)
    expect(installHosts(spec, [claude, codex], statuses({ 'openspec@claude': 'installed', 'openspec@codex': 'installed' })).length).toBe(0)
  })

  it('missing-env 视为已装（补 env 是 doctor 的事，不重复安装）', () => {
    const mcp = entry({ id: 'm1', type: 'mcp', install: { method: 'mcp-config', server: { command: 'npx' } } })
    const targets = installHosts(mcp, [claude], statuses({ 'm1@claude': 'missing-env' }))
    expect(targets.length).toBe(0)
  })
})
