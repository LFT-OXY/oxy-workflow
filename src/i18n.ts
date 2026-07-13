import { join } from 'node:path'

/** 显示语言（ZCF 式双语，首次运行选择后落盘，ADR-0006） */
export type Lang = 'zh' | 'en'

/** 全部 UI 文案；en 为键的唯一来源，zh 由类型约束保证键集合一致 */
const en = {
  'cli.menu': 'Interactive main menu (install / doctor / uninstall)',
  'cli.install': 'Install wizard (hosts → components → env)',
  'cli.doctor': 'Probe hosts & components, finish missing env setup',
  'cli.uninstall': 'Remove installed components (reversible mechanisms only)',

  'menu.title': 'oxy main menu',
  'menu.groupComponents': 'Components',
  'menu.groupOxy': 'oxy',
  'menu.install': 'Install components',
  'menu.installDesc': 'wizard: hosts → picks → env',
  'menu.doctor': 'Doctor',
  'menu.doctorDesc': 'probe status / finish env setup',
  'menu.uninstall': 'Uninstall components',
  'menu.uninstallDesc': 'reversible mechanisms only',
  'menu.update': 'Check updates',
  'menu.updateDesc': 'compare with latest on npm',
  'menu.lang': 'Display language',
  'menu.langDesc': 'switch English / 简体中文',
  'menu.help': 'Help',
  'menu.helpDesc': 'all commands',
  'menu.quit': 'Quit',
  'menu.bye': 'Bye.',
  'menu.pickLang': 'Select display language / 选择显示语言',

  'help.body': `oxy              open this menu
oxy install      install wizard (hosts → components → env)
oxy doctor       probe everything, finish env setup
oxy uninstall    remove installed components

Docs & issues: {url}`,

  'update.checking': 'Checking npm for the latest version…',
  'update.upToDate': 'Already the latest version (v{current}).',
  'update.newVersion': 'New version v{latest} available (current v{current}). Upgrade: npm i -g oxy-workflow@latest',
  'update.failed': 'Update check failed: {detail}',

  'status.installed': 'installed',
  'status.missingEnv': 'installed, missing env',
  'status.notInstalled': 'not installed',

  'type.mcp': 'MCP servers',
  'type.skill': 'Skills',
  'type.agent': 'Agents (subagents)',
  'type.spec': 'Spec tools (global)',

  'logic.requires': 'requires {hosts}',
  'logic.supportedHost': 'a supported host',
  'logic.installedOn': 'installed on {hosts}',
  'logic.hostsOnly': '{hosts} only',

  'wizard.pickHosts': 'Install into which hosts?',
  'wizard.needHost': 'Pick at least one host',
  'wizard.pickComponents': 'Select components to install',
  'wizard.skipInstalled': '{id} already installed everywhere, skipped',
  'wizard.envOptional': '(optional, Enter to skip)',
  'wizard.summary': '{n} installed',
  'wizard.summaryFailed': ', {n} failed',
  'wizard.doctorHint': 'Run `npx oxy-workflow doctor` anytime to check status or finish env setup.',

  'doctor.globalTools': 'Global tools',
  'doctor.envPrompt': '{name} on {host} · {key} (Enter to skip)',
  'doctor.reRegisterFailed': '{id} failed to re-register: {detail}',
  'doctor.envConfigured': '{id} env configured',
  'doctor.envFailed': '{id} failed: {detail}',

  'uninstall.nothingFound': 'Nothing installed by catalog entries was found.',
  'uninstall.pick': 'Select components to remove',
  'uninstall.onHost': 'on {host}',
  'uninstall.globalCli': 'global CLI, uninstall manually',
  'uninstall.confirm': 'Remove {name} on {host}?',
  'uninstall.removed': 'removed {key}',
  'uninstall.failedItem': 'failed {key}: {detail}',
  'uninstall.doneHint': 'Done. `npx oxy-workflow doctor` to verify.',

  'common.notDetected': 'not detected',
  'common.nothingSelected': 'Nothing selected, bye.',
  'common.ok': 'ok',
  'common.failed': 'failed',
}

export type MsgKey = keyof typeof en

const zh: Record<MsgKey, string> = {
  'cli.menu': '交互主菜单（安装 / 体检 / 卸载）',
  'cli.install': '安装向导（宿主 → 组件 → env）',
  'cli.doctor': '探测宿主与组件状态，补配缺失 env',
  'cli.uninstall': '卸载已安装组件（仅可逆机制）',

  'menu.title': 'oxy 主菜单',
  'menu.groupComponents': '组件',
  'menu.groupOxy': 'oxy',
  'menu.install': '安装组件',
  'menu.installDesc': '向导：宿主 → 多选 → env',
  'menu.doctor': '体检 doctor',
  'menu.doctorDesc': '探测状态 / 补配 env',
  'menu.uninstall': '卸载组件',
  'menu.uninstallDesc': '仅可逆机制',
  'menu.update': '检查更新',
  'menu.updateDesc': '对比 npm 最新版本',
  'menu.lang': '更改显示语言 / Language',
  'menu.langDesc': '切换 English / 简体中文',
  'menu.help': '帮助',
  'menu.helpDesc': '全部命令说明',
  'menu.quit': '退出',
  'menu.bye': '再见。',
  'menu.pickLang': 'Select display language / 选择显示语言',

  'help.body': `oxy              打开主菜单
oxy install      安装向导（宿主 → 组件 → env）
oxy doctor       全量探测，补配 env
oxy uninstall    卸载已安装组件

文档与反馈：{url}`,

  'update.checking': '正在查询 npm 最新版本…',
  'update.upToDate': '已是最新版本（v{current}）。',
  'update.newVersion': '发现新版本 v{latest}（当前 v{current}）。升级：npm i -g oxy-workflow@latest',
  'update.failed': '检查更新失败：{detail}',

  'status.installed': '已安装',
  'status.missingEnv': '已安装，缺 env',
  'status.notInstalled': '未安装',

  'type.mcp': 'MCP 服务器',
  'type.skill': 'Skill 技能',
  'type.agent': 'Agent 子代理',
  'type.spec': 'Spec 工具（全局安装）',

  'logic.requires': '需要 {hosts}',
  'logic.supportedHost': '受支持的宿主',
  'logic.installedOn': '已装于 {hosts}',
  'logic.hostsOnly': '仅 {hosts}',

  'wizard.pickHosts': '安装到哪些宿主？',
  'wizard.needHost': '至少选择一个宿主',
  'wizard.pickComponents': '选择要安装的组件',
  'wizard.skipInstalled': '{id} 已在所有目标宿主安装，跳过',
  'wizard.envOptional': '（可选，回车跳过）',
  'wizard.summary': '{n} 个安装成功',
  'wizard.summaryFailed': '，{n} 个失败',
  'wizard.doctorHint': '随时运行 `npx oxy-workflow doctor` 查看状态或补配 env。',

  'doctor.globalTools': '全局工具',
  'doctor.envPrompt': '{name} @ {host} · {key}（回车跳过）',
  'doctor.reRegisterFailed': '{id} 重新注册失败：{detail}',
  'doctor.envConfigured': '{id} env 已配置',
  'doctor.envFailed': '{id} 失败：{detail}',

  'uninstall.nothingFound': '未探测到目录内的任何已安装组件。',
  'uninstall.pick': '选择要卸载的组件',
  'uninstall.onHost': '于 {host}',
  'uninstall.globalCli': '全局 CLI，请手动卸载',
  'uninstall.confirm': '确认卸载 {name}（{host}）？',
  'uninstall.removed': '已卸载 {key}',
  'uninstall.failedItem': '卸载失败 {key}：{detail}',
  'uninstall.doneHint': '完成。可运行 `npx oxy-workflow doctor` 复核。',

  'common.notDetected': '未检测到',
  'common.nothingSelected': '未选择任何项，再见。',
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
