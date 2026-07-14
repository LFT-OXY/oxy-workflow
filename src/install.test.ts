import type { CatalogEntry } from './catalog/types.js'
import type { InstallIo } from './install.js'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { claude } from './hosts/claude.js'
import { codex } from './hosts/codex.js'
import { installEntry, uninstallEntry } from './install.js'

const HOME = join('/home', 'u')

/** 记录型伪 IO：断言调用轨迹而非真动环境 */
function fakeIo(overrides: Partial<InstallIo> = {}) {
  const calls: { exec: string[][], writes: Record<string, string> } = { exec: [], writes: {} }
  const io: InstallIo = {
    exec: async (argv) => {
      calls.exec.push(argv)
      return { ok: true, detail: '' }
    },
    fetchSource: async () => ({ 'SKILL.md': new TextEncoder().encode('body') }),
    writeFile: async (path, content) => {
      calls.writes[path] = new TextDecoder().decode(content)
    },
    remove: async () => {},
    ...overrides,
  }
  return { io, calls }
}

const mcp: CatalogEntry = {
  id: 'context7',
  type: 'mcp',
  name: '',
  summary: { en: '', zh: '' },
  homepage: 'https://x',
  install: { method: 'mcp-config', server: { command: 'npx', args: ['-y', 'pkg'] } },
}

describe('installEntry', () => {
  it('mcp：调用宿主官方 add 命令，env 值透传', async () => {
    const { io, calls } = fakeIo()
    const r = await installEntry(mcp, claude, HOME, { K: 'v' }, io)
    expect(r.ok).toBe(true)
    expect(calls.exec).toEqual([claude.mcp.addCommand('context7', { command: 'npx', args: ['-y', 'pkg'] }, { K: 'v' })])
  })

  it('skill：抓官方 repo 目录并落到宿主 skills/<id>/ 下', async () => {
    const skill: CatalogEntry = {
      id: 'skill-creator',
      type: 'skill',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'fetch-files', repo: 'anthropics/skills', source: 'skills/skill-creator' },
    }
    const { io, calls } = fakeIo({
      fetchSource: async (repo, source, kind) => {
        expect([repo, source, kind]).toEqual(['anthropics/skills', 'skills/skill-creator', 'dir'])
        return {
          'SKILL.md': new TextEncoder().encode('s'),
          'references/api.md': new TextEncoder().encode('r'),
        }
      },
    })
    const r = await installEntry(skill, codex, HOME, {}, io)
    expect(r.ok).toBe(true)
    expect(Object.keys(calls.writes).sort()).toEqual([
      join(codex.skillsDir(HOME), 'skill-creator', 'SKILL.md'),
      join(codex.skillsDir(HOME), 'skill-creator', 'references', 'api.md'),
    ].sort())
  })

  it('agent：单文件落到 agents 目录；宿主不支持时直接失败不动 IO', async () => {
    const agent: CatalogEntry = {
      id: 'code-refactorer',
      type: 'agent',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      hosts: ['claude'],
      install: { method: 'fetch-files', repo: 'iannuttall/claude-agents', source: 'agents/code-refactorer.md' },
    }
    const { io, calls } = fakeIo({
      fetchSource: async () => ({ 'code-refactorer.md': new TextEncoder().encode('a') }),
    })
    const ok = await installEntry(agent, claude, HOME, {}, io)
    expect(ok.ok).toBe(true)
    expect(Object.keys(calls.writes)).toEqual([join(HOME, '.claude', 'agents', 'code-refactorer.md')])

    const bad = await installEntry(agent, codex, HOME, {}, fakeIo().io)
    expect(bad.ok).toBe(false)
  })

  it('spec：按空格拆分官方命令执行', async () => {
    const spec: CatalogEntry = {
      id: 'openspec',
      type: 'spec',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'shell', command: 'npm install -g @fission-ai/openspec', binary: 'openspec' },
    }
    const { io, calls } = fakeIo()
    await installEntry(spec, claude, HOME, {}, io)
    expect(calls.exec).toEqual([['npm', 'install', '-g', '@fission-ai/openspec']])
  })

  it('卸载：mcp 走官方 remove，文件类删除落点，spec 提示手动（不可逆）', async () => {
    const removed: string[] = []
    const { io, calls } = fakeIo({ remove: async p => void removed.push(p) })

    expect((await uninstallEntry(mcp, claude, HOME, io)).ok).toBe(true)
    expect(calls.exec).toEqual([claude.mcp.removeCommand('context7')])

    const skill: CatalogEntry = {
      id: 'skill-creator',
      type: 'skill',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'fetch-files', repo: 'o/r', source: 'skills/skill-creator' },
    }
    expect((await uninstallEntry(skill, claude, HOME, io)).ok).toBe(true)
    expect(removed).toEqual([join(claude.skillsDir(HOME), 'skill-creator')])

    const spec: CatalogEntry = {
      id: 'openspec',
      type: 'spec',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'shell', command: 'npm i -g x', binary: 'openspec' },
    }
    const r = await uninstallEntry(spec, claude, HOME, io)
    expect(r.ok).toBe(false)
    expect(r.detail).toMatch(/manual/i)
  })

  it('cli：与 spec 同走 shell，按空格拆分执行', async () => {
    const cli: CatalogEntry = {
      id: 'auggie',
      type: 'cli',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'shell', command: 'npm install -g @augmentcode/auggie', binary: 'auggie' },
    }
    const { io, calls } = fakeIo()
    await installEntry(cli, claude, HOME, {}, io)
    expect(calls.exec).toEqual([['npm', 'install', '-g', '@augmentcode/auggie']])
  })

  it('mcp：声明 prerequisite 时先跑前置命令再 add', async () => {
    const withPre: CatalogEntry = {
      ...mcp,
      install: { method: 'mcp-config', server: { command: 'cmm' }, prerequisite: 'cargo install codebase-memory-mcp' },
    }
    const { io, calls } = fakeIo()
    await installEntry(withPre, claude, HOME, {}, io)
    expect(calls.exec).toEqual([
      ['cargo', 'install', 'codebase-memory-mcp'],
      claude.mcp.addCommand('context7', { command: 'cmm' }, {}),
    ])
  })

  it('plugin：跑官方安装命令', async () => {
    const plugin: CatalogEntry = {
      id: 'claude-mem',
      type: 'plugin',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'plugin', command: 'npx claude-mem install', marker: 'plugins/claude-mem' },
    }
    const { io, calls } = fakeIo()
    const r = await installEntry(plugin, claude, HOME, {}, io)
    expect(r.ok).toBe(true)
    expect(calls.exec).toEqual([['npx', 'claude-mem', 'install']])
  })

  it('skill-collection：抓整仓、每个子技能摊平到 skills 顶层', async () => {
    const coll: CatalogEntry = {
      id: 'mp-skills',
      type: 'skill-collection',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'fetch-collection', repo: 'mattpocock/skills', source: 'skills', sentinel: 'a' },
    }
    const { io, calls } = fakeIo({
      fetchSource: async (repo, source, kind) => {
        expect([repo, source, kind]).toEqual(['mattpocock/skills', 'skills', 'dir'])
        return {
          'a/SKILL.md': new TextEncoder().encode('a'),
          'b/SKILL.md': new TextEncoder().encode('b'),
          'b/ref.md': new TextEncoder().encode('r'),
        }
      },
    })
    const r = await installEntry(coll, claude, HOME, {}, io)
    expect(r.ok).toBe(true)
    expect(Object.keys(calls.writes).sort()).toEqual([
      join(claude.skillsDir(HOME), 'a', 'SKILL.md'),
      join(claude.skillsDir(HOME), 'b', 'SKILL.md'),
      join(claude.skillsDir(HOME), 'b', 'ref.md'),
    ].sort())
  })

  it('卸载 plugin：有 uninstall 跑命令，无则删 marker（相对 host root）', async () => {
    const removed: string[] = []
    const { io, calls } = fakeIo({ remove: async p => void removed.push(p) })
    const base = { id: 'p', type: 'plugin' as const, name: '', summary: { en: '', zh: '' }, homepage: 'https://x' }

    const withCmd: CatalogEntry = { ...base, install: { method: 'plugin', command: 'x', marker: 'm', uninstall: 'npx claude-mem uninstall' } }
    expect((await uninstallEntry(withCmd, claude, HOME, io)).ok).toBe(true)
    expect(calls.exec).toEqual([['npx', 'claude-mem', 'uninstall']])

    const noCmd: CatalogEntry = { ...base, install: { method: 'plugin', command: 'x', marker: 'skills/ccg' } }
    expect((await uninstallEntry(noCmd, claude, HOME, io)).ok).toBe(true)
    expect(removed).toEqual([join(claude.root(HOME), 'skills', 'ccg')])
  })

  it('卸载 skill-collection：重列仓库树，逐个删顶层子技能目录', async () => {
    const removed: string[] = []
    const { io } = fakeIo({
      fetchSource: async () => ({
        'a/SKILL.md': new TextEncoder().encode(''),
        'b/SKILL.md': new TextEncoder().encode(''),
        'b/ref.md': new TextEncoder().encode(''),
      }),
      remove: async p => void removed.push(p),
    })
    const coll: CatalogEntry = {
      id: 'mp-skills',
      type: 'skill-collection',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'fetch-collection', repo: 'o/r', source: 'skills', sentinel: 'a' },
    }
    expect((await uninstallEntry(coll, claude, HOME, io)).ok).toBe(true)
    expect(removed.sort()).toEqual([
      join(claude.skillsDir(HOME), 'a'),
      join(claude.skillsDir(HOME), 'b'),
    ].sort())
  })

  it('任何 IO 失败都收敛为 ok:false，绝不抛出（失败跳过 + 汇总）', async () => {
    const { io } = fakeIo({ fetchSource: async () => { throw new Error('network down') } })
    const skill: CatalogEntry = {
      id: 's',
      type: 'skill',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'fetch-files', repo: 'o/r', source: 'skills/s' },
    }
    const r = await installEntry(skill, claude, HOME, {}, io)
    expect(r.ok).toBe(false)
    expect(r.detail).toMatch(/network down/)
  })
})
