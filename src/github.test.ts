import type { FetchLike } from './github.js'
import { describe, expect, it } from 'vitest'
import { fetchSource } from './github.js'

/** 伪造 GitHub：tree API + raw 内容按 URL 查表 */
function fakeGithub(tree: { path: string, type: string }[], raws: Record<string, string>): FetchLike {
  return async (url: string) => {
    const rawHit = Object.entries(raws).find(([p]) => url === `https://raw.githubusercontent.com/o/r/HEAD/${p}`)
    if (url.startsWith('https://api.github.com/repos/o/r/git/trees/'))
      return { ok: true, status: 200, json: async () => ({ tree }), arrayBuffer: async () => new ArrayBuffer(0) }
    if (rawHit)
      return { ok: true, status: 200, json: async () => ({}), arrayBuffer: async () => new TextEncoder().encode(rawHit[1]).buffer as ArrayBuffer }
    return { ok: false, status: 404, json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0) }
  }
}

describe('fetchSource：从官方 repo 抓取组件内容', () => {
  it('目录 source：取树中该前缀下全部 blob，键为相对路径', async () => {
    const fetchFn = fakeGithub(
      [
        { path: 'skills/skill-creator/SKILL.md', type: 'blob' },
        { path: 'skills/skill-creator/references/api.md', type: 'blob' },
        { path: 'skills/other/SKILL.md', type: 'blob' },
        { path: 'skills/skill-creator', type: 'tree' },
      ],
      {
        'skills/skill-creator/SKILL.md': 'skill body',
        'skills/skill-creator/references/api.md': 'ref body',
      },
    )
    const files = await fetchSource('o/r', 'skills/skill-creator', 'dir', undefined, fetchFn)
    expect(Object.keys(files).sort()).toEqual(['SKILL.md', 'references/api.md'])
    expect(new TextDecoder().decode(files['SKILL.md'])).toBe('skill body')
  })

  it('kind=file：直接抓 raw，键为文件名（语义由调用方按类型指定，不猜扩展名）', async () => {
    const fetchFn = fakeGithub([], { 'agents/code-refactorer.md': 'agent body' })
    const files = await fetchSource('o/r', 'agents/code-refactorer.md', 'file', undefined, fetchFn)
    expect(Object.keys(files)).toEqual(['code-refactorer.md'])
  })

  it('source 下无文件时报错（避免静默装空目录）', async () => {
    const fetchFn = fakeGithub([{ path: 'x/y.md', type: 'blob' }], {})
    await expect(fetchSource('o/r', 'skills/nope', 'dir', undefined, fetchFn)).rejects.toThrow(/no files/)
  })
})
