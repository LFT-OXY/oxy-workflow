import type { CatalogEntry } from './catalog/types.js'
import type { Io } from './io.js'
import type { HostState, ManageAction, PresenceLookup } from './manage-logic.js'
import type { StatusLookup } from './wizard-logic.js'
import { homedir } from 'node:os'
import { confirm, select, Separator } from '@inquirer/prompts'
import pc from 'picocolors'
import { CATALOG } from './catalog/entries.js'
import { HOSTS } from './hosts/index.js'
import { localize, t } from './i18n.js'
import { installEntry, uninstallEntry } from './install.js'
import { realIo } from './io.js'
import { entryActions, hostStates } from './manage-logic.js'
import { isGlobalType, TYPE_ORDER } from './catalog/types.js'
import { hostPresent, statusOf } from './probe.js'
import { promptEnv, statusLabel, typeTitle } from './ui.js'

/** 返回伪选项的哨兵值；目录条目 id 不使用双下划线前缀，不会冲突 */
const BACK = '__back__'

/**
 * 管理流（CONTEXT.md「管理」）：全目录状态列表 → 进入即详情 →
 * 宿主粒度动作（装/卸）→ 执行后回详情重探测，状态变化当场可见。
 */
export async function runManage(): Promise<void> {
  const home = homedir()
  const io = realIo()
  const status: StatusLookup = (e, h) => statusOf(e, h, home, io)
  const present: PresenceLookup = h => hostPresent(h, home, io)

  while (true) {
    const picked = await select<string>({
      message: t('manage.pick'),
      choices: listChoices(status, present),
      pageSize: 18,
      loop: false,
    })
    if (picked === BACK)
      return
    await manageEntry(CATALOG.find(e => e.id === picked)!, home, io, status, present)
  }
}

/** 列表屏选项：按全局类型顺序分组，行尾带各宿主实时状态徽标 */
function listChoices(status: StatusLookup, present: PresenceLookup): (Separator | { value: string, name: string })[] {
  const rows: (Separator | { value: string, name: string })[] = [
    { value: BACK, name: pc.dim(t('common.backToMenu')) },
  ]
  for (const type of TYPE_ORDER) {
    const group = CATALOG.filter(e => e.type === type)
    if (group.length === 0)
      continue
    rows.push(new Separator(pc.dim(`──── ${typeTitle(type)} ────`)))
    for (const entry of group) {
      const badges = hostStates(entry, HOSTS, status, present).map(s => badge(entry, s)).join(' ')
      rows.push({ value: entry.id, name: `${entry.name} ${badges} ${pc.dim(`— ${localize(entry.summary)}`)}` })
    }
  }
  return rows
}

/** 单条目循环：详情 → 动作 → 执行 → 回详情（重探测）；返回列表退出 */
async function manageEntry(entry: CatalogEntry, home: string, io: Io, status: StatusLookup, present: PresenceLookup): Promise<void> {
  while (true) {
    const states = hostStates(entry, HOSTS, status, present)
    printDetail(entry, states)
    const action = await select<ManageAction | typeof BACK>({
      message: t('manage.pickAction'),
      choices: [
        ...entryActions(entry, states).map(a => ({ value: a, name: actionLabel(entry, a) })),
        { value: BACK, name: pc.dim(t('manage.backToList')) },
      ],
    })
    if (action === BACK)
      return

    if (action.kind === 'uninstall') {
      // 逐项确认是无状态架构下防误删的唯一防线（ADR-0004）
      if (!await confirm({ message: t('manage.confirmRemove', { name: entry.name, host: action.host.label }), default: false }))
        continue
      report(await uninstallEntry(entry, action.host, home, io))
    }
    else {
      report(await installEntry(entry, action.host, home, await promptEnv(entry), io))
    }
  }
}

/** 详情块：名称/类型/summary/主页/安装方式/逐宿主状态（spec 附不可逆提示） */
function printDetail(entry: CatalogEntry, states: HostState[]): void {
  console.log()
  console.log(`${pc.bold(entry.name)} ${pc.dim(`(${entry.type})`)}`)
  console.log(localize(entry.summary))
  console.log(`${t('manage.homepage')}: ${pc.cyan(entry.homepage)}`)
  console.log(`${t('manage.installVia')}: ${pc.dim(installLabel(entry))}`)
  console.log(`${t('manage.status')}: ${states.map(s => `${badge(entry, s)} ${statusLabel(s.status)}`).join(' · ')}`)
  if (entry.install.method === 'shell' && states.some(s => s.status !== 'missing'))
    console.log(pc.dim(`  (${t('manage.globalCli')})`))
}

/** 状态徽标：✓ 已装（缺 env 黄）/ ✗ 未装；全局工具视角显示为 global */
function badge(entry: CatalogEntry, s: HostState): string {
  const name = isGlobalType(entry.type) ? 'global' : s.host.id
  if (s.status === 'installed')
    return pc.green(`${name} ✓`)
  if (s.status === 'missing-env')
    return pc.yellow(`${name} ✓`)
  return pc.dim(`${name} ✗`)
}

/** 动作菜单文案：未检测宿主的安装动作照列并标注（与向导口径一致） */
function actionLabel(entry: CatalogEntry, a: ManageAction): string {
  if (a.kind === 'uninstall')
    return t('manage.actionUninstall', { host: a.host.label })
  if (isGlobalType(entry.type))
    return t('manage.actionInstallGlobal')
  const mark = a.detected ? '' : ` ${pc.dim(`(${t('common.notDetected')})`)}`
  return `${t('manage.actionInstall', { host: a.host.label })}${mark}`
}

/** 安装机制一行展示（详情屏用，维护者策展视角） */
function installLabel(entry: CatalogEntry): string {
  const { install } = entry
  switch (install.method) {
    case 'mcp-config':
      return `mcp-config · ${[install.server.command, ...(install.server.args ?? [])].join(' ')}`
    case 'fetch-files':
      return `fetch-files · ${install.repo} / ${install.source}`
    case 'fetch-collection':
      return `fetch-collection · ${install.repo} / ${install.source}`
    case 'shell':
      return `shell · ${install.command}`
    case 'plugin':
      return `plugin · ${install.command}`
  }
}

/** 动作结果单行汇报；失败不中断，回详情由重探测呈现真实状态 */
function report(r: { ok: boolean, detail: string }): void {
  console.log(r.ok ? pc.green(`  ${t('common.ok')}`) : pc.red(`  ${t('common.failed')}: ${r.detail}`))
}
