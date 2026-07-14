import type { CatalogEntry } from './catalog/types.js'
import type { ProbeIo } from './probe.js'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { claude } from './hosts/claude.js'
import { codex } from './hosts/codex.js'
import { hostCliInstalled, hostPresent, missingEnvKeys, statusOf } from './probe.js'

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
  summary: { en: '', zh: '' },
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

  it('宿主 CLI 是否已装看 PATH binary（引导安装/跳转的依据，非配置目录）', () => {
    expect(hostCliInstalled(claude, fakeIo({}, ['claude']))).toBe(true)
    expect(hostCliInstalled(claude, fakeIo({}))).toBe(false)
    expect(hostCliInstalled(codex, fakeIo({}, ['codex']))).toBe(true)
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

  it('missingEnvKeys：只列缺失的必需键（doctor 补配数据源）', () => {
    const entry: CatalogEntry = {
      ...mcpEntry,
      env: [
        { key: 'MUST_HAVE', required: true },
        { key: 'ALSO_MUST', required: true },
        { key: 'OPTIONAL', required: false },
      ],
    }
    const path = claude.mcp.configPath(HOME)
    const io = fakeIo({ [path]: JSON.stringify({ mcpServers: { context7: { command: 'npx', env: { MUST_HAVE: 'v' } } } }) })
    expect(missingEnvKeys(entry, claude, HOME, io)).toEqual(['ALSO_MUST'])
  })

  it('skill：宿主 skills 目录下存在 <id>/SKILL.md 即已装（双宿主各查各的）', () => {
    const skill: CatalogEntry = {
      id: 'skill-creator',
      type: 'skill',
      name: '',
      summary: { en: '', zh: '' },
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
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      hosts: ['claude'],
      install: { method: 'fetch-files', repo: 'iannuttall/claude-agents', source: 'agents/code-refactorer.md' },
    }
    const io = fakeIo({ [join(HOME, '.claude', 'agents', 'code-refactorer.md')]: '' })
    expect(statusOf(agent, claude, HOME, io)).toBe('installed')
    expect(statusOf(agent, claude, HOME, fakeIo({}))).toBe('missing')
  })

  it('plugin：宿主内标记路径存在即已装（探 marker，非 binary）', () => {
    const plugin: CatalogEntry = {
      id: 'ccg',
      type: 'plugin',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'plugin', command: 'x', marker: 'skills/ccg' },
    }
    const io = fakeIo({ [join(claude.root(HOME), 'skills', 'ccg')]: '' })
    expect(statusOf(plugin, claude, HOME, io)).toBe('installed')
    expect(statusOf(plugin, claude, HOME, fakeIo({}))).toBe('missing')
  })

  it('skill-collection：哨兵子技能的 SKILL.md 存在即已装', () => {
    const coll: CatalogEntry = {
      id: 'mp-skills',
      type: 'skill-collection',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'fetch-collection', repo: 'o/r', source: 'skills', sentinel: 'flagship' },
    }
    const io = fakeIo({ [join(claude.skillsDir(HOME), 'flagship', 'SKILL.md')]: '' })
    expect(statusOf(coll, claude, HOME, io)).toBe('installed')
    expect(statusOf(coll, claude, HOME, fakeIo({}))).toBe('missing')
  })

  it('cli：与 spec 同走 shell，PATH 有 binary 即已装', () => {
    const cli: CatalogEntry = {
      id: 'auggie',
      type: 'cli',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'shell', command: 'npm i -g @augmentcode/auggie', binary: 'auggie' },
    }
    expect(statusOf(cli, claude, HOME, fakeIo({}, ['auggie']))).toBe('installed')
    expect(statusOf(cli, claude, HOME, fakeIo({}))).toBe('missing')
  })

  it('spec：PATH 上能解析二进制即已装（与宿主无关）', () => {
    const spec: CatalogEntry = {
      id: 'openspec',
      type: 'spec',
      name: '',
      summary: { en: '', zh: '' },
      homepage: 'https://x',
      install: { method: 'shell', command: 'npm i -g @fission-ai/openspec', binary: 'openspec' },
    }
    expect(statusOf(spec, claude, HOME, fakeIo({}, ['openspec']))).toBe('installed')
    expect(statusOf(spec, claude, HOME, fakeIo({}))).toBe('missing')
  })
})
