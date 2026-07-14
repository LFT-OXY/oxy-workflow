import type { CatalogEntry } from './types.js'

/**
 * 种子目录：来源均为官方链接（ADR-0001），安装方式由并行调研逐仓核实。
 * 分组：mcp / skill / skill-collection / agent / spec / cli / plugin。
 * env 仅 mcp 条目有效（安装时注入宿主 MCP 配置）；其余类型的密钥由组件
 * 自身管理，安装器不收集（ADR-0009）。
 */
export const CATALOG: CatalogEntry[] = [
  // ────────── MCP 服务器 ──────────
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
    id: 'chrome-devtools-mcp',
    type: 'mcp',
    name: 'Chrome DevTools MCP',
    summary: {
      en: 'Drive real Chrome via DevTools for debugging & automation',
      zh: '通过 DevTools 协议驱动真实 Chrome，调试与浏览器自动化',
    },
    homepage: 'https://github.com/ChromeDevTools/chrome-devtools-mcp',
    install: {
      method: 'mcp-config',
      server: { command: 'npx', args: ['-y', 'chrome-devtools-mcp@latest'] },
    },
  },
  {
    id: 'playwright-mcp',
    type: 'mcp',
    name: 'Playwright MCP',
    summary: {
      en: 'Microsoft browser automation via accessibility tree (not pixels)',
      zh: '微软官方浏览器自动化 MCP，基于无障碍树操作页面',
    },
    homepage: 'https://github.com/microsoft/playwright-mcp',
    install: {
      method: 'mcp-config',
      server: { command: 'npx', args: ['@playwright/mcp@latest'] },
    },
  },
  {
    id: 'excel-mcp-server',
    type: 'mcp',
    name: 'Excel MCP Server',
    summary: {
      en: 'Read/write & manipulate Excel workbooks without Excel installed',
      zh: '无需安装 Excel 即可读写与操作工作簿（公式、图表、格式）',
    },
    homepage: 'https://github.com/haris-musa/excel-mcp-server',
    install: {
      method: 'mcp-config',
      server: { command: 'uvx', args: ['excel-mcp-server', 'stdio'] },
    },
  },
  {
    id: 'office-word-mcp-server',
    type: 'mcp',
    name: 'Office Word MCP Server',
    summary: {
      en: 'Create & edit Word (.docx): content, formatting, tables, images',
      zh: '创建与编辑 Word（.docx）文档：内容、格式、表格、图片',
    },
    homepage: 'https://github.com/GongRzhe/Office-Word-MCP-Server',
    install: {
      method: 'mcp-config',
      server: { command: 'uvx', args: ['--from', 'office-word-mcp-server', 'word_mcp_server'] },
    },
  },
  {
    id: 'shadcn-ui-mcp-server',
    type: 'mcp',
    name: 'shadcn/ui MCP Server',
    summary: {
      en: 'Serve shadcn/ui component source, demos & metadata to the model',
      zh: '向模型提供 shadcn/ui 组件源码、示例与元数据',
    },
    homepage: 'https://github.com/Jpisnice/shadcn-ui-mcp-server',
    install: {
      method: 'mcp-config',
      server: { command: 'npx', args: ['-y', '@jpisnice/shadcn-ui-mcp-server'] },
    },
    env: [{
      key: 'GITHUB_PERSONAL_ACCESS_TOKEN',
      required: false,
      hint: {
        en: 'Optional GitHub token; raises API limit 60→5000 req/h, no scopes',
        zh: '可选 GitHub token，将 API 限额从 60 提到 5000 次/小时，无需 scope',
      },
    }],
  },
  {
    id: 'grok-search',
    type: 'mcp',
    name: 'GrokSearch',
    summary: {
      en: 'Grok (OpenAI-compatible) web search MCP with Tavily fetch/map',
      zh: '基于 Grok（OpenAI 兼容）的联网搜索 MCP，含 Tavily 抓取/建图',
    },
    homepage: 'https://github.com/GuDaStudio/GrokSearch',
    install: {
      method: 'mcp-config',
      server: {
        command: 'uvx',
        args: ['--from', 'git+https://github.com/GuDaStudio/GrokSearch@grok-with-tavily', 'grok-search'],
      },
    },
    env: [
      { key: 'GROK_API_URL', required: true, hint: { en: 'Grok API base URL (OpenAI-compatible, e.g. https://.../v1)', zh: 'Grok API 地址（OpenAI 兼容，如 https://.../v1）' } },
      { key: 'GROK_API_KEY', required: true, hint: { en: 'Grok API key', zh: 'Grok API 密钥' } },
      { key: 'GROK_MODEL', required: false, hint: { en: 'Model id, default grok-4-fast', zh: '模型 ID，默认 grok-4-fast' } },
      { key: 'TAVILY_API_KEY', required: false, hint: { en: 'Enables web_fetch / web_map tools', zh: '启用 web_fetch / web_map 工具' } },
    ],
  },
  {
    id: 'grok-search-rs',
    type: 'mcp',
    name: 'GrokSearch-rs',
    summary: {
      en: 'Rust Grok web/X search MCP with Tavily fetch/map (prebuilt binary)',
      zh: 'Rust 版 Grok 联网/X 搜索 MCP，含 Tavily 抓取（预编译二进制）',
    },
    homepage: 'https://github.com/Episkey-G/GrokSearch-rs',
    install: {
      method: 'mcp-config',
      server: { command: 'npx', args: ['-y', 'grok-search-rs'] },
    },
    env: [
      { key: 'GROK_SEARCH_API_KEY', required: true, hint: { en: 'Grok Responses API key', zh: 'Grok Responses API 密钥' } },
      { key: 'GROK_SEARCH_URL', required: true, hint: { en: 'Grok API base URL', zh: 'Grok API 地址' } },
      { key: 'GROK_SEARCH_MODEL', required: false, hint: { en: 'Model id, default grok-4.20-fast', zh: '模型 ID，默认 grok-4.20-fast' } },
      { key: 'TAVILY_API_KEY', required: false, hint: { en: 'Enables web_fetch / web_map tools', zh: '启用 web_fetch / web_map 工具' } },
    ],
  },
  {
    id: 'codebase-memory-mcp',
    type: 'mcp',
    name: 'codebase-memory-mcp',
    summary: {
      en: 'Fast local code-intelligence MCP: index, search, call-graph/impact',
      zh: '本地代码智能 MCP：仓库索引、代码搜索、调用链/影响面查询',
    },
    homepage: 'https://github.com/DeusData/codebase-memory-mcp',
    install: {
      method: 'mcp-config',
      server: { command: 'npx', args: ['-y', 'codebase-memory-mcp'] },
    },
  },

  // ────────── Skill 技能（单个，fetch-files） ──────────
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
    id: 'web-access',
    type: 'skill',
    name: 'web-access',
    summary: {
      en: 'Real browsing for agents: networking policy + CDP browser control',
      zh: '赋予 Agent 真实联网：联网策略 + CDP 浏览器操控',
    },
    homepage: 'https://github.com/eze-is/web-access',
    install: {
      method: 'fetch-files',
      repo: 'eze-is/web-access',
      source: '.',
    },
  },
  {
    id: 'anysearch',
    type: 'skill',
    name: 'AnySearch Skill',
    summary: {
      en: 'Unified real-time search: web, vertical, batch + URL extraction',
      zh: '统一实时搜索：网页 + 垂直领域 + 并行批量 + URL 正文抽取',
    },
    homepage: 'https://github.com/anysearch-ai/anysearch-skill',
    install: {
      method: 'fetch-files',
      repo: 'anysearch-ai/anysearch-skill',
      source: '.',
    },
  },
  {
    id: 'last30days',
    type: 'skill',
    name: 'last30days-skill',
    summary: {
      en: 'Last-30-days multi-platform research (Reddit, HN, GitHub…)',
      zh: '近 30 天多平台研究（Reddit / HN / GitHub 等）',
    },
    homepage: 'https://github.com/mvanhorn/last30days-skill',
    install: {
      method: 'fetch-files',
      repo: 'mvanhorn/last30days-skill',
      source: 'skills/last30days',
    },
  },
  {
    id: 'ai-website-cloner',
    type: 'skill',
    name: 'AI Website Cloner',
    summary: {
      en: 'clone-website skill: reverse-engineer any site (needs a browser MCP)',
      zh: 'clone-website 技能：逆向克隆任意网站（需配套浏览器 MCP）',
    },
    homepage: 'https://github.com/JCodesMore/ai-website-cloner-template',
    install: {
      method: 'fetch-files',
      repo: 'JCodesMore/ai-website-cloner-template',
      source: '.claude/skills/clone-website',
    },
  },
  {
    id: 'gorden-ppt-skill',
    type: 'skill',
    name: 'Gorden PPT Skill',
    summary: {
      en: 'PPT builder: 17 Chinese PPTX templates, text-only editing (python-pptx)',
      zh: 'PPT 生成技能：17 套中文 PPTX 模板，纯文字替换（python-pptx）',
    },
    homepage: 'https://github.com/GordenSun/GordenPPTSkill',
    install: {
      method: 'fetch-files',
      repo: 'GordenSun/GordenPPTSkill',
      source: '.',
    },
  },
  {
    id: 'guizang-ppt-skill',
    type: 'skill',
    name: 'Guizang PPT Skill',
    summary: {
      en: 'Generate polished HTML slide decks, image prompts & social covers',
      zh: '生成精美 HTML 网页 PPT：版式、配图提示词、社媒封面',
    },
    homepage: 'https://github.com/op7418/guizang-ppt-skill',
    install: {
      method: 'fetch-files',
      repo: 'op7418/guizang-ppt-skill',
      source: '.',
    },
  },
  {
    id: 'ppt-master',
    type: 'skill',
    name: 'PPT Master',
    summary: {
      en: 'Generate natively editable PPTX from PDF/DOCX/URL/Markdown',
      zh: '从 PDF/DOCX/URL/Markdown 生成原生可编辑 PPTX',
    },
    homepage: 'https://github.com/hugohe3/ppt-master',
    install: {
      method: 'fetch-files',
      repo: 'hugohe3/ppt-master',
      source: 'skills/ppt-master',
    },
  },

  // ────────── Skills 合集（fetch-collection，摊平安装） ──────────
  {
    id: 'mattpocock-skills',
    type: 'skill-collection',
    name: 'mattpocock/skills (engineering)',
    summary: {
      en: "Matt Pocock's engineering skills (tdd, code-review, research…)",
      zh: 'Matt Pocock 工程技能合集（tdd、code-review、research 等）',
    },
    homepage: 'https://github.com/mattpocock/skills',
    install: {
      method: 'fetch-collection',
      repo: 'mattpocock/skills',
      source: 'skills/engineering',
      sentinel: 'tdd',
    },
  },
  {
    id: 'taste-skill',
    type: 'skill-collection',
    name: 'Taste Skill',
    summary: {
      en: '13 frontend-design "taste" skills that stop generic AI UI',
      zh: '13 个前端设计品味技能，让 AI 不再生成千篇一律的 UI',
    },
    homepage: 'https://github.com/Leonxlnx/taste-skill',
    install: {
      method: 'fetch-collection',
      repo: 'Leonxlnx/taste-skill',
      source: 'skills',
      sentinel: 'taste-skill',
    },
  },
  {
    id: 'ui-ux-pro-max',
    type: 'skill-collection',
    name: 'ui-ux-pro-max-skill',
    summary: {
      en: 'UI/UX skills: 84 styles, 161 palettes, 73 font pairings, charts',
      zh: 'UI/UX 设计技能合集：84 风格、161 配色、73 字体搭配、图表',
    },
    homepage: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
    install: {
      method: 'fetch-collection',
      repo: 'nextlevelbuilder/ui-ux-pro-max-skill',
      source: '.claude/skills',
      sentinel: 'ui-ux-pro-max',
    },
  },
  {
    id: 'paper-craft-skills',
    type: 'skill-collection',
    name: 'paper-craft-skills',
    summary: {
      en: 'Academic-paper skills: analyzer (deep read), comic, deck. Zero config',
      zh: '论文技能：analyzer 深读、comic 方法图、deck 幻灯片。零配置',
    },
    homepage: 'https://github.com/zsyggg/paper-craft-skills',
    install: {
      method: 'fetch-collection',
      repo: 'zsyggg/paper-craft-skills',
      source: 'skills',
      sentinel: 'paper-analyzer',
    },
  },

  // ────────── Agent 子代理（fetch-files 单文件） ──────────
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

  // ────────── Spec 工具（全局 shell 安装） ──────────
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

  // ────────── 命令行工具（全局 shell 安装，探 binary） ──────────
  {
    id: 'auggie',
    type: 'cli',
    name: 'auggie',
    summary: {
      en: "Augment Code's agentic terminal coding CLI",
      zh: 'Augment Code 的终端 AI 编码 CLI',
    },
    homepage: 'https://github.com/augmentcode/auggie',
    install: {
      method: 'shell',
      command: 'npm install -g @augmentcode/auggie@latest',
      binary: 'auggie',
    },
  },
  {
    id: 'playwright-cli',
    type: 'cli',
    name: 'Playwright CLI',
    summary: {
      en: 'Playwright dedicated CLI for coding agents (browser automation)',
      zh: 'Playwright 面向编码 agent 的专用浏览器自动化 CLI',
    },
    homepage: 'https://github.com/microsoft/playwright-cli',
    install: {
      method: 'shell',
      command: 'npm install -g @playwright/cli@latest',
      binary: 'playwright-cli',
    },
  },
  {
    id: 'uv',
    type: 'cli',
    name: 'uv',
    summary: {
      en: 'Fast Python package/project manager; prerequisite for uvx MCP tools',
      zh: '高速 Python 包/项目管理器；uvx 类 MCP 的前置依赖',
    },
    homepage: 'https://github.com/astral-sh/uv',
    install: {
      method: 'shell',
      command: 'pip install uv',
      binary: 'uv',
    },
  },
  {
    id: 'agent-reach',
    type: 'cli',
    name: 'Agent-Reach',
    summary: {
      en: 'One-command internet access for agents (17 platforms); run `agent-reach install` after',
      zh: '给 Agent 一键联网（17 平台）；装后需再跑 `agent-reach install`',
    },
    homepage: 'https://github.com/Panniantong/Agent-Reach',
    install: {
      method: 'shell',
      command: 'pipx install https://github.com/Panniantong/agent-reach/archive/main.zip',
      binary: 'agent-reach',
    },
  },

  // ────────── AI 插件（跑官方命令装、内容落宿主，探 marker） ──────────
  {
    id: 'superpowers',
    type: 'plugin',
    name: 'superpowers',
    summary: {
      en: 'Coding-agent methodology plugin (brainstorming, TDD, debugging)',
      zh: '编程代理方法论插件（头脑风暴、TDD、系统化调试）',
    },
    homepage: 'https://github.com/obra/superpowers',
    recommended: true,
    hosts: ['claude'],
    install: {
      method: 'plugin',
      command: 'claude plugin install superpowers@claude-plugins-official',
      marker: 'plugins/cache/claude-plugins-official/superpowers',
      uninstall: 'claude plugin uninstall superpowers@claude-plugins-official',
    },
  },
  {
    id: 'ccg-workflow',
    type: 'plugin',
    name: 'CCG (ccg-workflow)',
    summary: {
      en: 'Claude+Codex+Gemini multi-model workflow: quality-gate skills & commands',
      zh: 'Claude+Codex+Gemini 多模型协作：质量门 skills、斜杠命令与 hooks',
    },
    homepage: 'https://github.com/fengshao1227/ccg-workflow',
    hosts: ['claude'],
    install: {
      method: 'plugin',
      command: 'npx ccg-workflow init --skip-prompt',
      marker: 'skills/ccg',
      uninstall: 'npx ccg-workflow uninstall',
    },
  },
  {
    id: 'claude-mem',
    type: 'plugin',
    name: 'claude-mem',
    summary: {
      en: 'Cross-session memory: hooks capture observations, inject prior context',
      zh: '跨会话记忆：hooks 采集观察并注入历史上下文',
    },
    homepage: 'https://github.com/thedotmack/claude-mem',
    hosts: ['claude'],
    install: {
      method: 'plugin',
      command: 'npx claude-mem install',
      marker: '../.claude-mem',
    },
  },
]
