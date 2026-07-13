import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { codex } from './codex.js'

const HOME = join('/home', 'u')

describe('codex 宿主适配器', () => {
  it('路径由 home 推导；无 subagent 概念（agentsDir 为 null）', () => {
    expect(codex.root(HOME)).toBe(join(HOME, '.codex'))
    expect(codex.skillsDir(HOME)).toBe(join(HOME, '.codex', 'skills'))
    expect(codex.agentsDir(HOME)).toBeNull()
    expect(codex.mcp.configPath(HOME)).toBe(join(HOME, '.codex', 'config.toml'))
  })

  it('MCP 安装/卸载渲染为官方 codex mcp CLI 调用', () => {
    const argv = codex.mcp.addCommand(
      'context7',
      { command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
      { CONTEXT7_API_KEY: 'k1' },
    )
    expect(argv).toEqual([
      'codex', 'mcp', 'add', 'context7',
      '--env', 'CONTEXT7_API_KEY=k1',
      '--', 'npx', '-y', '@upstash/context7-mcp',
    ])
    expect(codex.mcp.removeCommand('context7'))
      .toEqual(['codex', 'mcp', 'remove', 'context7'])
  })

  it('解析 config.toml 的 [mcp_servers.*]（含 env），坏输入视为空', () => {
    const text = [
      'model = "gpt-5.1-codex"',
      '',
      '[mcp_servers.context7]',
      'command = "npx"',
      'args = ["-y", "@upstash/context7-mcp"]',
      '',
      '[mcp_servers.context7.env]',
      'CONTEXT7_API_KEY = "k"',
      '',
      '[mcp_servers.plain]',
      'command = "foo"',
    ].join('\n')
    expect(codex.mcp.parseInstalled(text)).toEqual({
      context7: { env: { CONTEXT7_API_KEY: 'k' } },
      plain: { env: {} },
    })
    expect(codex.mcp.parseInstalled('= broken =')).toEqual({})
    expect(codex.mcp.parseInstalled('')).toEqual({})
  })
})
