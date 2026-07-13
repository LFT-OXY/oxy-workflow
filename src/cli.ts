import { createRequire } from 'node:module'
import { cac } from 'cac'
import pc from 'picocolors'
import { runDoctor } from './doctor.js'
import { runUninstall } from './uninstall.js'
import { runWizard } from './wizard.js'

const { version } = createRequire(import.meta.url)('../package.json') as { version: string }

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
cli.command('', 'Interactive install wizard (hosts → components → env)').action(wrap(runWizard))
cli.command('doctor', 'Probe hosts & components, finish missing env setup').action(wrap(runDoctor))
cli.command('uninstall', 'Remove installed components (reversible mechanisms only)').action(wrap(runUninstall))
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
