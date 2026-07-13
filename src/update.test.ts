import type { FetchLike } from './github.js'
import { describe, expect, it } from 'vitest'
import { fetchLatestVersion, isNewer } from './update.js'

describe('isNewer：版本比较', () => {
  it('主/次/补丁段逐级比较', () => {
    expect(isNewer('0.2.0', '0.1.0')).toBe(true)
    expect(isNewer('1.0.0', '0.9.9')).toBe(true)
    expect(isNewer('0.1.0', '0.1.1')).toBe(false)
    expect(isNewer('0.1.0', '0.1.0')).toBe(false)
  })

  it('容忍 v 前缀与缺段', () => {
    expect(isNewer('v1.1.0', '1.0.9')).toBe(true)
    expect(isNewer('1.1', '1.0.9')).toBe(true)
  })
})

describe('fetchLatestVersion：npm registry 查询', () => {
  const fake = (status: number, body: unknown): FetchLike => async () => ({
    ok: status === 200,
    status,
    json: async () => body,
    arrayBuffer: async () => new ArrayBuffer(0),
  })

  it('返回 latest 版本号', async () => {
    await expect(fetchLatestVersion('oxy-workflow', fake(200, { version: '0.2.0' }))).resolves.toBe('0.2.0')
  })

  it('registry 非 200 → 抛错', async () => {
    await expect(fetchLatestVersion('oxy-workflow', fake(404, {}))).rejects.toThrow('404')
  })
})
