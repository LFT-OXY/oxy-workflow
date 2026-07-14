import { describe, expect, it } from 'vitest'
import { CATALOG } from './entries.js'

describe('种子目录', () => {
  it('四种组件类型各至少收录一条（v1 发布门槛）', () => {
    const types = new Set(CATALOG.map(e => e.type))
    expect(types).toEqual(new Set(['mcp', 'skill', 'agent', 'spec']))
  })
})

describe('目录不变量（schema 规则）', () => {
  it('id 唯一且为 kebab-case', () => {
    const ids = CATALOG.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids)
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('类型与安装机制一一对应', () => {
    const expected = { mcp: 'mcp-config', skill: 'fetch-files', agent: 'fetch-files', spec: 'shell' } as const
    for (const e of CATALOG)
      expect(e.install.method, e.id).toBe(expected[e.type])
  })

  it('agent 的 source 是单个 .md 文件，skill 的 source 是目录', () => {
    for (const e of CATALOG) {
      if (e.install.method !== 'fetch-files')
        continue
      if (e.type === 'agent')
        expect(e.install.source, e.id).toMatch(/\.md$/)
      if (e.type === 'skill')
        expect(e.install.source, e.id).not.toMatch(/\.md$/)
    }
  })

  it('agent 条目必须显式声明宿主（禁用原因文案依赖它）', () => {
    for (const e of CATALOG.filter(e => e.type === 'agent'))
      expect(e.hosts?.length, e.id).toBeGreaterThan(0)
  })

  it('env 键为大写蛇形，且每条目录条目都有官方主页', () => {
    for (const e of CATALOG) {
      expect(e.homepage, e.id).toMatch(/^https:\/\//)
      for (const v of e.env ?? [])
        expect(v.key, e.id).toMatch(/^[A-Z][A-Z0-9_]*$/)
    }
  })

  it('summary 与 env hint 双语齐全且非空', () => {
    for (const e of CATALOG) {
      expect(e.summary.en.length, e.id).toBeGreaterThan(0)
      expect(e.summary.zh.length, e.id).toBeGreaterThan(0)
      for (const v of e.env ?? []) {
        if (v.hint) {
          expect(v.hint.en.length, `${e.id}.${v.key}`).toBeGreaterThan(0)
          expect(v.hint.zh.length, `${e.id}.${v.key}`).toBeGreaterThan(0)
        }
      }
    }
  })
})
