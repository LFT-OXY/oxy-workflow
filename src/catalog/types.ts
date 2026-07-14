import type { Localized } from '../i18n.js'

/** 宿主标识——组件被安装进的目标 AI CLI 环境（ADR-0005） */
export type HostId = 'claude' | 'codex'

/** 组件类型（可扩展枚举） */
export type EntryType = 'mcp' | 'skill' | 'skill-collection' | 'agent' | 'spec' | 'cli' | 'plugin'

/** 组件类型的全局展示顺序（向导分屏与管理分组共用） */
export const TYPE_ORDER = ['skill', 'skill-collection', 'mcp', 'agent', 'spec', 'cli', 'plugin'] as const

/** 全局工具类型：无宿主维度，跑官方命令装、只装一次（ADR-0009） */
const GLOBAL_TYPES = new Set<EntryType>(['spec', 'cli', 'plugin'])

/** 是否全局工具（决定向导跳过选宿主屏、装一次、UI 显示 global）。
 * 放在纯类型模块，避免逻辑层经 ui.ts 牵入交互式 IO（关注点分离） */
export function isGlobalType(type: EntryType): boolean {
  return GLOBAL_TYPES.has(type)
}

/** 条目声明的环境变量需求；值由向导收集，目录中永不存储密钥值 */
export interface EnvVar {
  key: string
  required: boolean
  hint?: Localized
}

/** MCP 服务器定义，由宿主适配器渲染成各自官方 CLI 的参数 */
export interface McpConfigInstall {
  method: 'mcp-config'
  server: { command: string, args?: string[] }
  /** 可选前置命令：某些 MCP（如需预编译的 Rust 二进制）须先跑再 mcp add，
   * 只允许官方跨平台安装方式（ADR-0008/0009） */
  prerequisite?: string
}

/** 从官方 repo 抓取文件放进宿主目录：source 为目录=skill 整包，单文件=agent */
export interface FetchFilesInstall {
  method: 'fetch-files'
  repo: string
  ref?: string
  source: string
}

/** 抓整仓 skills 合集：source 下每个子目录=一个 skill，摊平到宿主 skills 目录；
 * sentinel 为无状态探测哨兵（某子技能名，查其 SKILL.md，ADR-0004/0009） */
export interface FetchCollectionInstall {
  method: 'fetch-collection'
  repo: string
  ref?: string
  source: string
  sentinel: string
}

/** 执行官方安装命令（spec / cli 类）；binary 用于 PATH 探测与卸载提示 */
export interface ShellInstall {
  method: 'shell'
  command: string
  binary: string
}

/** AI 插件：跑官方命令装、内容落宿主目录（如 CCG/superpowers）；
 * marker 为宿主内标记路径（相对 host root），探测查它在否；
 * uninstall 缺省则删 marker（ADR-0009） */
export interface PluginInstall {
  method: 'plugin'
  command: string
  marker: string
  uninstall?: string
}

/** 安装机制（命名避开组件类型 Spec，防止一词两义） */
export type InstallMethod =
  | McpConfigInstall
  | FetchFilesInstall
  | FetchCollectionInstall
  | ShellInstall
  | PluginInstall

/** 目录条目：一条可安装组件的全部元数据（纯元数据，不含内容，ADR-0001） */
export interface CatalogEntry {
  id: string
  type: EntryType
  name: string
  summary: Localized
  homepage: string
  /** 维护者推荐集标记，向导默认勾选 */
  recommended?: boolean
  /** 支持的宿主；省略 = 全部宿主；spec 类忽略宿主（全局安装） */
  hosts?: HostId[]
  install: InstallMethod
  env?: EnvVar[]
}
