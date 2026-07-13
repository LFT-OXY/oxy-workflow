import type { CatalogEntry } from './types.js'

/** 种子目录：来源均为官方链接（ADR-0001），核实记录见 docs/PRD.md */
export const CATALOG: CatalogEntry[] = [
  {
    id: 'context7',
    type: 'mcp',
    name: 'Context7',
    summary: 'Up-to-date library docs for AI coding agents',
    homepage: 'https://github.com/upstash/context7',
    recommended: true,
    install: {
      method: 'mcp-config',
      server: { command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
    },
    env: [{
      key: 'CONTEXT7_API_KEY',
      required: false,
      hint: 'Optional, free at context7.com/dashboard (higher rate limits)',
    }],
  },
  {
    id: 'skill-creator',
    type: 'skill',
    name: 'Skill Creator',
    summary: 'Official Anthropic skill for authoring new skills',
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
    summary: 'Teaching-style deep-dive notes from links, docs, and code',
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
    summary: 'Subagent focused on safe, behavior-preserving refactoring',
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
    summary: 'Spec-driven development workflow CLI',
    homepage: 'https://github.com/Fission-AI/OpenSpec',
    install: {
      method: 'shell',
      command: 'npm install -g @fission-ai/openspec',
      binary: 'openspec',
    },
  },
]
