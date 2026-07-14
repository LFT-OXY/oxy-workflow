import type { CatalogEntry } from './types.js'

/** 种子目录：来源均为官方链接（ADR-0001），核实记录见 docs/PRD.md */
export const CATALOG: CatalogEntry[] = [
  {
    id: 'context7',
    type: 'mcp',
    name: 'Context7',
    summary: {
      en: 'Up-to-date library docs for AI coding agents',
      zh: '为 AI 编程助手提供最新的库文档',
    },
    homepage: 'https://github.com/upstash/context7',
    recommended: true,
    install: {
      method: 'mcp-config',
      server: { command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
    },
    env: [{
      key: 'CONTEXT7_API_KEY',
      required: false,
      hint: {
        en: 'Optional, free at context7.com/dashboard (higher rate limits)',
        zh: '可选，在 context7.com/dashboard 免费获取（更高调用限额）',
      },
    }],
  },
  {
    id: 'skill-creator',
    type: 'skill',
    name: 'Skill Creator',
    summary: {
      en: 'Official Anthropic skill for authoring new skills',
      zh: 'Anthropic 官方技能，用来编写新的技能',
    },
    homepage: 'https://github.com/anthropics/skills',
    recommended: true,
    install: {
      method: 'fetch-files',
      repo: 'anthropics/skills',
      source: 'skills/skill-creator',
    },
  },
  {
    id: 'oxy-summary',
    type: 'skill',
    name: 'Oxy Summary',
    summary: {
      en: 'Teaching-style deep-dive notes from links, docs, and code',
      zh: '把链接、文档、代码深度解析成教学式笔记',
    },
    homepage: 'https://github.com/LFT-OXY/skills',
    recommended: true,
    install: {
      method: 'fetch-files',
      repo: 'LFT-OXY/skills',
      source: 'skills/oxy-summary',
    },
  },
  {
    id: 'code-refactorer',
    type: 'agent',
    name: 'Code Refactorer',
    summary: {
      en: 'Subagent focused on safe, behavior-preserving refactoring',
      zh: '专注安全重构的子代理，不改变现有行为',
    },
    homepage: 'https://github.com/iannuttall/claude-agents',
    hosts: ['claude'],
    install: {
      method: 'fetch-files',
      repo: 'iannuttall/claude-agents',
      source: 'agents/code-refactorer.md',
    },
  },
  {
    id: 'openspec',
    type: 'spec',
    name: 'OpenSpec',
    summary: {
      en: 'Spec-driven development workflow CLI',
      zh: '规范驱动开发（Spec-driven）的工作流命令行工具',
    },
    homepage: 'https://github.com/Fission-AI/OpenSpec',
    install: {
      method: 'shell',
      command: 'npm install -g @fission-ai/openspec',
      binary: 'openspec',
    },
  },
]
