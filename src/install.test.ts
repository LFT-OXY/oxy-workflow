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
  summary: '',
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
      summary: '',
      homepage: 'https://x',
      install: { method: 'fetch-files', repo: 'anthropics/skills', source: 'skills/skill-creator' },
    }
    const { io, calls } = fakeIo({
      fetchSource: async (repo, source) => {
        expect([repo, source]).toEqual(['anthropics/skills', 'skills/skill-creator'])
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
      summary: '',
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
      summary: '',
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
      summary: '',
      homepage: 'https://x',
      install: { method: 'fetch-files', repo: 'o/r', source: 'skills/skill-creator' },
    }
    expect((await uninstallEntry(skill, claude, HOME, io)).ok).toBe(true)
    expect(removed).toEqual([join(claude.skillsDir(HOME), 'skill-creator')])

    const spec: CatalogEntry = {
      id: 'openspec',
      type: 'spec',
      name: '',
      summary: '',
      homepage: 'https://x',
      install: { method: 'shell', command: 'npm i -g x', binary: 'openspec' },
    }
    const r = await uninstallEntry(spec, claude, HOME, io)
    expect(r.ok).toBe(false)
    expect(r.detail).toMatch(/manual/i)
  })

  it('任何 IO 失败都收敛为 ok:false，绝不抛出（失败跳过 + 汇总）', async () => {
    const { io } = fakeIo({ fetchSource: async () => { throw new Error('network down') } })
    const skill: CatalogEntry = {
      id: 's',
      type: 'skill',
      name: '',
      summary: '',
      homepage: 'https://x',
      install: { method: 'fetch-files', repo: 'o/r', source: 'skills/s' },
    }
    const r = await installEntry(skill, claude, HOME, {}, io)
    expect(r.ok).toBe(false)
    expect(r.detail).toMatch(/network down/)
  })
})
