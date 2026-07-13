import type { FetchLike } from './github.js'

/** latest 是否比 current 新：仅比较主.次.补三段，容忍 v 前缀，忽略预发布后缀 */
export function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(s => Number.parseInt(s, 10) || 0)
  const [a, b] = [parse(latest), parse(current)]
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0))
      return (a[i] ?? 0) > (b[i] ?? 0)
  }
  return false
}

/** 从 npm registry 查询包的最新版本号 */
export async function fetchLatestVersion(pkg: string, fetchFn: FetchLike = fetch): Promise<string> {
  const res = await fetchFn(`https://registry.npmjs.org/${pkg}/latest`)
  if (!res.ok)
    throw new Error(`npm registry ${res.status}`)
  const { version } = await res.json() as { version: string }
  return version
}
