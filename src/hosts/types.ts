import type { HostId, McpConfigInstall } from '../catalog/types.js'

/** 宿主 MCP 配置中一条已装服务器（探测视角，只关心 env） */
export interface InstalledMcp {
  env: Record<string, string>
}

/**
 * 宿主适配器：路径、官方 MCP 命令渲染、配置解析。
 * 全部纯函数——真实 IO（exec/fs）由调用方执行，适配器只算不做。
 */
export interface HostAdapter {
  id: HostId
  label: string
  /** 宿主 CLI 引导安装命令（官方跨平台方式，ADR-0008「安装 AI Agent」入口） */
  installCommand: string
  /** 宿主 CLI 的 PATH 二进制名——引导安装成功判定与"缺宿主→跳转"的触发依据 */
  binary: string
  /** 宿主存在性探测目录 */
  root: (home: string) => string
  skillsDir: (home: string) => string
  /** null = 该宿主没有 subagent 概念 */
  agentsDir: (home: string) => string | null
  mcp: {
    configPath: (home: string) => string
    /** 渲染官方 CLI 安装 argv；env 值来自向导收集，即配即用 */
    addCommand: (id: string, server: McpConfigInstall['server'], env: Record<string, string>) => string[]
    removeCommand: (id: string) => string[]
    /** 解析宿主 MCP 配置文本 → 已装服务器映射；解析失败视为空（无状态探测语义） */
    parseInstalled: (configText: string) => Record<string, InstalledMcp>
  }
}
