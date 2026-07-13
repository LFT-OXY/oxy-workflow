import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { claude } from './claude.js'

const HOME = join('/home', 'u')

describe('claude 宿主适配器', () => {
  it('路径由 home 推导：根目录、skills、agents、MCP 配置', () => {
    expect(claude.root(HOME)).toBe(join(HOME, '.claude'))
    expect(claude.skillsDir(HOME)).toBe(join(HOME, '.claude', 'skills'))
    expect(claude.agentsDir(HOME)).toBe(join(HOME, '.claude', 'agents'))
    expect(claude.mcp.configPath(HOME)).toBe(join(HOME, '.claude.json'))
  })

  it('MCP 安装/卸载渲染为官方 CLI 调用（user scope + env 注入）', () => {
    const argv = claude.mcp.addCommand(
      'context7',
      { command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
      { CONTEXT7_API_KEY: 'k1' },
    )
    expect(argv).toEqual([
      'claude', 'mcp', 'add', 'context7', '-s', 'user',
      '-e', 'CONTEXT7_API_KEY=k1',
      '--', 'npx', '-y', '@upstash/context7-mcp',
    ])
    expect(claude.mcp.removeCommand('context7'))
      .toEqual(['claude', 'mcp', 'remove', 'context7', '-s', 'user'])
  })

  it('解析 ~/.claude.json 的 mcpServers（含 env），坏输入视为空', () => {
    const text = JSON.stringify({
      mcpServers: {
        'context7': { command: 'npx', args: ['-y', '@upstash/context7-mcp'], env: { CONTEXT7_API_KEY: 'k' } },
        'no-env': { command: 'foo' },
      },
      otherTopLevelStuff: true,
    })
    expect(claude.mcp.parseInstalled(text)).toEqual({
      'context7': { env: { CONTEXT7_API_KEY: 'k' } },
      'no-env': { env: {} },
    })
    expect(claude.mcp.parseInstalled('not json')).toEqual({})
    expect(claude.mcp.parseInstalled('{}')).toEqual({})
  })
})
