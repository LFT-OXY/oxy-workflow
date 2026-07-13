import type { InstallIo } from './install.js'
import type { ProbeIo } from './probe.js'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { delimiter, dirname, join } from 'node:path'
import { fetchSource } from './github.js'

/** 真实 IO 实现——探测与安装的全部副作用集中于此，逻辑层零 IO */
export type Io = ProbeIo & InstallIo

export function realIo(): Io {
  return {
    exists: p => existsSync(p),
    readFile: (p) => {
      try {
        return readFileSync(p, 'utf8')
      }
      catch {
        return null
      }
    },
    hasBinary,
    exec,
    fetchSource: (repo, source, ref) => fetchSource(repo, source, ref),
    writeFile: async (path, content) => {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, content)
    },
    remove: async (path) => {
      rmSync(path, { recursive: true, force: true })
    },
  }
}

/** PATH 扫描（Windows 追加 PATHEXT），不依赖外部 which */
function hasBinary(name: string): boolean {
  const dirs = (process.env.PATH ?? '').split(delimiter).filter(Boolean)
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';')
    : ['']
  return dirs.some(dir => exts.some(ext =>
    existsSync(join(dir, name + ext)) || existsSync(join(dir, name + ext.toLowerCase())),
  ))
}

/** 跨平台执行官方 CLI：win 下 .cmd 垫片必须走 shell，参数做最小引号包裹 */
function exec(argv: string[]): Promise<{ ok: boolean, detail: string }> {
  const [cmd, ...args] = argv
  return new Promise((resolve) => {
    const child = process.platform === 'win32'
      ? spawn([cmd!, ...args.map(quoteWin)].join(' '), { shell: true })
      : spawn(cmd!, args)
    let output = ''
    child.stdout?.on('data', d => output += String(d))
    child.stderr?.on('data', d => output += String(d))
    child.on('error', err => resolve({ ok: false, detail: err.message }))
    child.on('close', code => resolve({ ok: code === 0, detail: output.trim().slice(-400) }))
  })
}

function quoteWin(arg: string): string {
  return /[\s"]/.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg
}
