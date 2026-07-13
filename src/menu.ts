import type { Lang } from './i18n.js'
import type { Io } from './io.js'
import { homedir } from 'node:os'
import { select, Separator } from '@inquirer/prompts'
import pc from 'picocolors'
import { runDoctor } from './doctor.js'
import { getLang, savedLang, saveLang, setLang, t } from './i18n.js'
import { realIo } from './io.js'
import { runManage } from './manage.js'
import { fetchLatestVersion, isNewer } from './update.js'
import { runWizard } from './wizard.js'

const REPO_URL = 'https://github.com/LFT-OXY/oxy-workflow'

/** ANSI Shadow 风格 OXY 横幅（ZCF 式） */
const LOGO = `
  ██████╗ ██╗  ██╗██╗   ██╗
 ██╔═══██╗╚██╗██╔╝╚██╗ ██╔╝
 ██║   ██║ ╚███╔╝  ╚████╔╝
 ██║   ██║ ██╔██╗   ╚██╔╝
 ╚██████╔╝██╔╝ ██╗   ██║
  ╚═════╝ ╚═╝  ╚═╝   ╚═╝`

type MenuAction = 'install' | 'manage' | 'doctor' | 'update' | 'lang' | 'help' | 'quit'

/** 主菜单循环：横幅 → 选择 → 执行 → 回菜单，Q 退出（CCG/ZCF 式壳） */
export async function runMenu(version: string): Promise<void> {
  const home = homedir()
  const io = realIo()

  // 首次运行（无偏好文件）先选显示语言并落盘（ADR-0006）
  if (savedLang(home, io) === null)
    await pickLang(home, io)

  console.log(pc.cyan(LOGO))
  console.log(pc.cyan('        for Claude Code & Codex'))
  console.log(pc.dim(`  Version: ${version} | ${REPO_URL}`))

  while (true) {
    console.log()
    const action = await select<MenuAction>({
      message: t('menu.title'),
      choices: menuChoices(),
      pageSize: 12,
      loop: false,
    })
    switch (action) {
      case 'install':
        await runWizard()
        break
      case 'manage':
        await runManage()
        break
      case 'doctor':
        await runDoctor()
        break
      case 'update':
        await checkUpdate(version)
        break
      case 'lang':
        await pickLang(home, io)
        break
      case 'help':
        console.log(`\n${t('help.body', { url: REPO_URL })}`)
        break
      case 'quit':
        console.log(t('menu.bye'))
        return
    }
  }
}

/** 菜单项按当前语言即时构建，切换语言后下一轮立即生效 */
function menuChoices(): (Separator | { value: MenuAction, name: string })[] {
  const row = (value: MenuAction, no: string, label: string, desc = '') =>
    ({ value, name: `${no} ${label}${desc ? ` ${pc.dim(`- ${desc}`)}` : ''}` })
  const rule = (title: string) => new Separator(pc.dim(`──────── ${title} ────────`))
  return [
    rule(t('menu.groupComponents')),
    row('install', '1.', t('menu.install'), t('menu.installDesc')),
    row('manage', '2.', t('menu.manage'), t('menu.manageDesc')),
    row('doctor', '3.', t('menu.doctor'), t('menu.doctorDesc')),
    rule(t('menu.groupOxy')),
    row('update', 'U.', t('menu.update'), t('menu.updateDesc')),
    row('lang', '0.', t('menu.lang'), t('menu.langDesc')),
    row('help', 'H.', t('menu.help'), t('menu.helpDesc')),
    row('quit', 'Q.', t('menu.quit')),
  ]
}

/** 语言选择并落盘；首次运行与菜单内切换共用 */
async function pickLang(home: string, io: Io): Promise<void> {
  const lang = await select<Lang>({
    message: t('menu.pickLang'),
    choices: [
      { value: 'zh', name: '简体中文' },
      { value: 'en', name: 'English' },
    ],
    default: getLang(),
  })
  setLang(lang)
  await saveLang(home, lang, io)
}

/** 对比 npm 最新版本；网络失败仅提示不中断菜单 */
async function checkUpdate(current: string): Promise<void> {
  console.log(pc.dim(t('update.checking')))
  try {
    const latest = await fetchLatestVersion('oxy-workflow')
    console.log(isNewer(latest, current)
      ? pc.yellow(t('update.newVersion', { latest, current }))
      : pc.green(t('update.upToDate', { current })))
  }
  catch (err) {
    console.log(pc.red(t('update.failed', { detail: err instanceof Error ? err.message : String(err) })))
  }
}
