import type { CatalogEntry } from './catalog/types.js'
import type { ProbeIo } from './probe.js'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { claude } from './hosts/claude.js'
import { codex } from './hosts/codex.js'
import { hostPresent, statusOf } from './probe.js'

const HOME = join('/home', 'u')

/** 用文件映射伪造 IO：无状态探测的全部事实来源 */
function fakeIo(files: Record<string, string>, binaries: string[] = []): ProbeIo {
  return {
    exists: p => p in files,
    readFile: p => files[p] ?? null,
    hasBinary: name => binaries.includes(name),
  }
}

const mcpEntry: CatalogEntry = {
  id: 'context7',
  type: 'mcp',
  name: 'Context7',
  summary: '',
  homepage: 'https://x',
  install: { method: 'mcp-config', server: { command: 'npx' } },
  env: [{ key: 'MUST_HAVE', required: true }],
}

describe('宿主存在性探测', () => {
  it('root 目录存在即宿主存在', () => {
    const io = fakeIo({ [join(HOME, '.claude')]: '' })
    expect(hostPresent(claude, HOME, io)).toBe(true)
    expect(hostPresent(codex, HOME, io)).toBe(false)
  })
})

describe('组件探测（无状态，ADR-0004）', () => {
  it('mcp：配置里有条目即已装；缺必需 env 报 missing-env', () => {
    const cfg = (env: object) => JSON.stringify({ mcpServers: { context7: { command: 'npx', env } } })
    const path = claude.mcp.configPath(HOME)

    expect(statusOf(mcpEntry, claude, HOME, fakeIo({}))).toBe('missing')
    expect(statusOf(mcpEntry, claude, HOME, fakeIo({ [path]: cfg({}) }))).toBe('missing-env')
    expect(statusOf(mcpEntry, claude, HOME, fakeIo({ [path]: cfg({ MUST_HAVE: 'v' }) }))).toBe('installed')
  })

  it('skill：宿主 skills 目录下存在 <id>/SKILL.md 即已装（双宿主各查各的）', () => {
    const skill: CatalogEntry = {
      id: 'skill-creator',
      type: 'skill',
      name: '',
      summary: '',
      homepage: 'https://x',
      install: { method: 'fetch-files', repo: 'anthropics/skills', source: 'skills/skill-creator' },
    }
    const io = fakeIo({ [join(claude.skillsDir(HOME), 'skill-creator', 'SKILL.md')]: '' })
    expect(statusOf(skill, claude, HOME, io)).toBe('installed')
    expect(statusOf(skill, codex, HOME, io)).toBe('missing')
  })

  it('agent：~/.claude/agents/<id>.md 存在即已装', () => {
    const agent: CatalogEntry = {
      id: 'code-refactorer',
      type: 'agent',
      name: '',
      summary: '',
      homepage: 'https://x',
      hosts: ['claude'],
      install: { method: 'fetch-files', repo: 'iannuttall/claude-agents', source: 'agents/code-refactorer.md' },
    }
    const io = fakeIo({ [join(HOME, '.claude', 'agents', 'code-refactorer.md')]: '' })
    expect(statusOf(agent, claude, HOME, io)).toBe('installed')
    expect(statusOf(agent, claude, HOME, fakeIo({}))).toBe('missing')
  })

  it('spec：PATH 上能解析二进制即已装（与宿主无关）', () => {
    const spec: CatalogEntry = {
      id: 'openspec',
      type: 'spec',
      name: '',
      summary: '',
      homepage: 'https://x',
      install: { method: 'shell', command: 'npm i -g @fission-ai/openspec', binary: 'openspec' },
    }
    expect(statusOf(spec, claude, HOME, fakeIo({}, ['openspec']))).toBe('installed')
    expect(statusOf(spec, claude, HOME, fakeIo({}))).toBe('missing')
  })
})
