/** fetch 的最小面，便于测试注入与未来加代理 */
export interface FetchLike {
  (url: string): Promise<{
    ok: boolean
    status: number
    json: () => Promise<unknown>
    arrayBuffer: () => Promise<ArrayBuffer>
  }>
}

/**
 * 从官方 GitHub repo 抓取组件内容（ADR-0001：安装时才从上游取内容）。
 * source 为目录 → tree API 一次列举 + raw 逐个下载，键为相对路径；
 * source 为单文件 → 直接 raw，键为文件名。ref 缺省 HEAD（默认分支）。
 */
export async function fetchSource(
  repo: string,
  source: string,
  ref = 'HEAD',
  fetchFn: FetchLike = fetch,
): Promise<Record<string, Uint8Array>> {
  if (/\.[a-z0-9]+$/i.test(source))
    return { [source.split('/').pop()!]: await raw(repo, ref, source, fetchFn) }

  const res = await fetchFn(`https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`)
  if (!res.ok)
    throw new Error(`GitHub tree API ${res.status} for ${repo}`)
  const { tree } = await res.json() as { tree: { path: string, type: string }[] }
  const prefix = `${source}/`
  const blobs = tree.filter(n => n.type === 'blob' && n.path.startsWith(prefix))
  if (blobs.length === 0)
    throw new Error(`no files under ${source} in ${repo}`)

  const out: Record<string, Uint8Array> = {}
  for (const b of blobs)
    out[b.path.slice(prefix.length)] = await raw(repo, ref, b.path, fetchFn)
  return out
}

async function raw(repo: string, ref: string, path: string, fetchFn: FetchLike): Promise<Uint8Array> {
  const url = `https://raw.githubusercontent.com/${repo}/${ref}/${path}`
  const res = await fetchFn(url)
  if (!res.ok)
    throw new Error(`download ${res.status}: ${url}`)
  return new Uint8Array(await res.arrayBuffer())
}
