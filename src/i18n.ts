import { join } from 'node:path'

/** 显示语言（ZCF 式双语，首次运行选择后落盘，ADR-0006） */
export type Lang = 'zh' | 'en'

/** 双语文案对象（目录 summary / env hint 等数据侧文案用） */
export type Localized = Record<Lang, string>

/** 全部 UI 文案；en 为键的唯一来源，zh 由类型约束保证键集合一致 */
const en = {
  'cli.menu': 'Interactive main menu (install / manage / health check)',
  'cli.install': 'Install wizard: pick AI tools, then components, then API keys',
  'cli.doctor': 'Check every component, fill in missing API keys',
  'cli.manage': 'View each component, install or uninstall it',

  'menu.title': 'oxy main menu',
  'menu.groupComponents': 'Components',
  'menu.groupOxy': 'oxy',
  'menu.install': 'Install components',
  'menu.installDesc': 'pick components, install into Claude Code / Codex',
  'menu.doctor': 'Health check',
  'menu.doctorDesc': 'see what is installed, fill in missing API keys',
  'menu.manage': 'Manage components',
  'menu.manageDesc': 'view each component, install or uninstall it',
  'menu.update': 'Check updates',
  'menu.updateDesc': 'see if a newer version is on npm',
  'menu.lang': 'Display language',
  'menu.langDesc': 'switch English / 简体中文',
  'menu.help': 'Help',
  'menu.helpDesc': 'what each command does',
  'menu.quit': 'Quit',
  'menu.bye': 'Bye.',
  'menu.pickLang': 'Select display language / 选择显示语言',

  'help.body': `oxy              open this menu
oxy install      install wizard: pick AI tools, components, API keys
oxy manage       view each component, install or uninstall it
oxy doctor       check every component, fill in missing API keys

Docs & issues: {url}`,

  'update.checking': 'Checking npm for the latest version…',
  'update.upToDate': 'Already the latest version (v{current}).',
  'update.newVersion': 'New version v{latest} available (current v{current}). Upgrade: npm i -g oxy-workflow@latest',
  'update.failed': 'Update check failed: {detail}',

  'status.installed': 'installed',
  'status.missingEnv': 'installed, missing API key',
  'status.notInstalled': 'not installed',

  'type.mcp': 'MCP servers',
  'type.skill': 'Skills',
  'type.agent': 'Agents (subagents)',
  'type.spec': 'Spec tools (global)',

  'logic.requires': 'requires {hosts}',
  'logic.supportedHost': 'a supported host',
  'logic.installedOn': 'installed on {hosts}',
  'logic.hostsOnly': '{hosts} only',

  'wizard.pickHosts': 'Install into which AI tools?',
  'wizard.needHost': 'Pick at least one AI tool',
  'wizard.pickType': 'Select {type} to install',
  'wizard.back': '← Back',
  'wizard.confirmList': 'About to install {n} component(s):',
  'wizard.confirmEmpty': 'Nothing selected.',
  'wizard.confirmProceed': 'What next?',
  'wizard.confirmGo': 'Install now',
  'wizard.confirmCancel': 'Cancel, back to menu',
  'wizard.summary': '{n} installed',
  'wizard.summaryFailed': ', {n} failed',
  'wizard.doctorHint': 'Run `npx oxy-workflow doctor` anytime to check status or fill in missing API keys.',

  'prompt.multiHelp': 'space to select · enter to continue · esc to go back',
  'prompt.singleHelp': 'enter to confirm · esc to go back',

  'doctor.globalTools': 'Global tools',
  'doctor.envPrompt': '{name} on {host} · {key} (Enter to skip)',
  'doctor.reRegisterFailed': '{id} failed to re-register: {detail}',
  'doctor.envConfigured': '{id} API key saved',
  'doctor.envFailed': '{id} failed: {detail}',

  'manage.pick': 'Select a component (Enter = detail)',
  'manage.backToList': '← Back to list',
  'manage.homepage': 'Homepage',
  'manage.installVia': 'Install via',
  'manage.status': 'Status',
  'manage.pickAction': 'Action?',
  'manage.actionInstall': 'Install to {host}',
  'manage.actionInstallGlobal': 'Install (global CLI)',
  'manage.actionUninstall': 'Uninstall from {host}',
  'manage.confirmRemove': 'Remove {name} on {host}?',
  'manage.globalCli': 'global CLI, uninstall manually',

  'common.backToMenu': '← Back to menu',
  'common.envOptional': '(optional, Enter to skip)',
  'common.notDetected': 'not detected',
  'common.ok': 'ok',
  'common.failed': 'failed',
}

export type MsgKey = keyof typeof en

const zh: Record<MsgKey, string> = {
  'cli.menu': '交互主菜单（安装 / 管理 / 体检）',
  'cli.install': '安装向导：选 AI 工具、挑组件、填 API Key',
  'cli.doctor': '检查所有组件，补填缺少的 API Key',
  'cli.manage': '查看单个组件，安装或卸载',

  'menu.title': 'oxy 主菜单',
  'menu.groupComponents': '组件',
  'menu.groupOxy': 'oxy',
  'menu.install': '安装组件',
  'menu.installDesc': '挑选组件，批量安装到 Claude Code / Codex',
  'menu.doctor': '环境体检',
  'menu.doctorDesc': '检查哪些组件已装好，补填缺少的 API Key',
  'menu.manage': '管理组件',
  'menu.manageDesc': '查看每个组件的状态，单独安装或卸载',
  'menu.update': '检查更新',
  'menu.updateDesc': '看看 npm 上有没有新版本',
  'menu.lang': '更改显示语言 / Language',
  'menu.langDesc': '切换 English / 简体中文',
  'menu.help': '帮助',
  'menu.helpDesc': '查看全部命令说明',
  'menu.quit': '退出',
  'menu.bye': '再见。',
  'menu.pickLang': 'Select display language / 选择显示语言',

  'help.body': `oxy              打开主菜单
oxy install      安装向导：选 AI 工具、挑组件、填 API Key
oxy manage       查看单个组件，安装或卸载
oxy doctor       检查所有组件，补填缺少的 API Key

文档与反馈：{url}`,

  'update.checking': '正在查询 npm 最新版本…',
  'update.upToDate': '已是最新版本（v{current}）。',
  'update.newVersion': '发现新版本 v{latest}（当前 v{current}）。升级：npm i -g oxy-workflow@latest',
  'update.failed': '检查更新失败：{detail}',

  'status.installed': '已安装',
  'status.missingEnv': '已安装，缺 API Key',
  'status.notInstalled': '未安装',

  'type.mcp': 'MCP 服务器',
  'type.skill': 'Skill 技能',
  'type.agent': 'Agent 子代理',
  'type.spec': 'Spec 工具（全局安装）',

  'logic.requires': '需要 {hosts}',
  'logic.supportedHost': '受支持的 AI 工具',
  'logic.installedOn': '已装于 {hosts}',
  'logic.hostsOnly': '仅 {hosts}',

  'wizard.pickHosts': '安装到哪些 AI 工具？',
  'wizard.needHost': '至少选择一个 AI 工具',
  'wizard.pickType': '选择要安装的 {type}',
  'wizard.back': '← 返回上一步',
  'wizard.confirmList': '即将安装 {n} 个组件：',
  'wizard.confirmEmpty': '未选择任何组件。',
  'wizard.confirmProceed': '如何继续？',
  'wizard.confirmGo': '确认安装',
  'wizard.confirmCancel': '取消，回主菜单',
  'wizard.summary': '{n} 个安装成功',
  'wizard.summaryFailed': '，{n} 个失败',
  'wizard.doctorHint': '随时运行 `npx oxy-workflow doctor` 检查状态、补填 API Key。',

  'prompt.multiHelp': '空格勾选 · 回车下一步 · Esc 返回',
  'prompt.singleHelp': '回车确认 · Esc 返回',

  'doctor.globalTools': '全局工具',
  'doctor.envPrompt': '{name} @ {host} · {key}（回车跳过）',
  'doctor.reRegisterFailed': '{id} 重新注册失败：{detail}',
  'doctor.envConfigured': '{id} API Key 已配置',
  'doctor.envFailed': '{id} 失败：{detail}',

  'manage.pick': '选择要管理的组件（回车进入详情）',
  'manage.backToList': '← 返回列表',
  'manage.homepage': '主页',
  'manage.installVia': '安装方式',
  'manage.status': '状态',
  'manage.pickAction': '选择操作',
  'manage.actionInstall': '安装到 {host}',
  'manage.actionInstallGlobal': '安装（全局 CLI）',
  'manage.actionUninstall': '从 {host} 卸载',
  'manage.confirmRemove': '确认卸载 {name}（{host}）？',
  'manage.globalCli': '全局 CLI，请手动卸载',

  'common.backToMenu': '← 返回主菜单',
  'common.envOptional': '（可选，回车跳过）',
  'common.notDetected': '未检测到',
  'common.ok': '成功',
  'common.failed': '失败',
}

/** 仅测试用：校验双语字典键集合一致 */
export const MESSAGES = { en, zh } as const

// 模块级当前语言；默认 en，启动时由 cli 按偏好/locale 覆盖
let current: Lang = 'en'

export function getLang(): Lang {
  return current
}

export function setLang(lang: Lang): void {
  current = lang
}

/** 取当前语言文案并做 {name} 占位插值；缺参保留占位符原样 */
export function t(key: MsgKey, params?: Record<string, string | number>): string {
  return MESSAGES[current][key].replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params?.[name]
    return value === undefined ? match : String(value)
  })
}

/** 按当前显示语言取双语文案 */
export function localize(text: Localized): string {
  return text[current]
}

/** 按系统 locale 推断默认语言：zh* → zh，其余 en */
export function detectLang(env: Record<string, string | undefined>): Lang {
  const locale = env.LC_ALL || env.LC_MESSAGES || env.LANG || ''
  return /^zh/i.test(locale) ? 'zh' : 'en'
}

/** UI 偏好文件——只存显示偏好，不含任何安装状态（ADR-0006） */
export function prefsPath(home: string): string {
  return join(home, '.config', 'oxy-workflow', 'prefs.json')
}

/** 读取已保存语言；文件缺失/损坏/非法值一律视为未设置 */
export function savedLang(home: string, io: { readFile: (path: string) => string | null }): Lang | null {
  try {
    const { lang } = JSON.parse(io.readFile(prefsPath(home)) ?? '') as { lang?: unknown }
    return lang === 'zh' || lang === 'en' ? lang : null
  }
  catch {
    return null
  }
}

export async function saveLang(
  home: string,
  lang: Lang,
  io: { writeFile: (path: string, content: Uint8Array) => Promise<void> },
): Promise<void> {
  await io.writeFile(prefsPath(home), new TextEncoder().encode(`${JSON.stringify({ lang })}\n`))
}
