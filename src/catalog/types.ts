/** 宿主标识——组件被安装进的目标 AI CLI 环境（ADR-0005） */
export type HostId = 'claude' | 'codex'

/** 组件类型（可扩展枚举） */
export type EntryType = 'mcp' | 'skill' | 'agent' | 'spec'

/** 条目声明的环境变量需求；值由向导收集，目录中永不存储密钥值 */
export interface EnvVar {
  key: string
  required: boolean
  hint?: string
}

/** MCP 服务器定义，由宿主适配器渲染成各自官方 CLI 的参数 */
export interface McpConfigInstall {
  method: 'mcp-config'
  server: { command: string, args?: string[] }
}

/** 从官方 repo 抓取文件放进宿主目录：source 为目录=skill 整包，单文件=agent */
export interface FetchFilesInstall {
  method: 'fetch-files'
  repo: string
  ref?: string
  source: string
}

/** 执行官方安装命令（spec 类）；binary 用于 PATH 探测与卸载提示 */
export interface ShellInstall {
  method: 'shell'
  command: string
  binary: string
}

export type InstallSpec = McpConfigInstall | FetchFilesInstall | ShellInstall

/** 目录条目：一条可安装组件的全部元数据（纯元数据，不含内容，ADR-0001） */
export interface CatalogEntry {
  id: string
  type: EntryType
  name: string
  summary: string
  homepage: string
  /** 维护者推荐集标记，向导默认勾选 */
  recommended?: boolean
  /** 支持的宿主；省略 = 全部宿主；spec 类忽略宿主（全局安装） */
  hosts?: HostId[]
  install: InstallSpec
  env?: EnvVar[]
}
