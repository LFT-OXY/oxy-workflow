import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { cac } from 'cac'
import pc from 'picocolors'
import { runDoctor } from './doctor.js'
import { detectLang, savedLang, setLang, t } from './i18n.js'
import { realIo } from './io.js'
import { runMenu } from './menu.js'
import { runUninstall } from './uninstall.js'
import { runWizard } from './wizard.js'

const { version } = createRequire(import.meta.url)('../package.json') as { version: string }

// 启动即确定显示语言：已存偏好 > 系统 locale；首次落盘由主菜单负责（ADR-0006）
setLang(savedLang(homedir(), realIo()) ?? detectLang(process.env))

/** 用户 Ctrl-C 静默退出；其余错误红字 + 退出码 1 */
function wrap(fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    try {
      await fn()
    }
    catch (err) {
      if (err instanceof Error && err.name === 'ExitPromptError')
        process.exit(130)
      console.error(pc.red(err instanceof Error ? err.message : String(err)))
      process.exitCode = 1
    }
  }
}

const cli = cac('oxy')
cli.command('', t('cli.menu')).action(wrap(() => runMenu(version)))
cli.command('install', t('cli.install')).action(wrap(runWizard))
cli.command('doctor', t('cli.doctor')).action(wrap(runDoctor))
cli.command('uninstall', t('cli.uninstall')).action(wrap(runUninstall))
cli.help()
cli.version(version)

// 参数/命令错误也走红字 + 退出码 1，不裸抛堆栈（PRD：参数错误为 1）
try {
  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}
catch (err) {
  console.error(pc.red(err instanceof Error ? err.message : String(err)))
  process.exitCode = 1
}
