import type { HostId } from './catalog/types.js'
import pc from 'picocolors'
import { HOSTS, hostById } from './hosts/index.js'
import { t } from './i18n.js'
import { realIo } from './io.js'
import { multiSelect } from './list-prompt.js'
import { hostCliInstalled } from './probe.js'

/**
 * 宿主引导安装（「安装 AI Agent」，ADR-0008）：装 claude/codex CLI 本体。
 * 探测看 PATH binary；跑各宿主官方跨平台命令；失败跳过 + 汇总。
 * preset 供"组件安装时缺宿主 → 跳转"预勾选缺失的宿主。
 */
export async function runAgentInstall(preset?: HostId[]): Promise<void> {
  const io = realIo()
  const installed = new Set(HOSTS.filter(h => hostCliInstalled(h, io)).map(h => h.id))
  // 预勾选：给定 preset 用 preset，否则默认勾选尚未安装的宿主
  const presetSet = new Set<HostId>(preset ?? HOSTS.filter(h => !installed.has(h.id)).map(h => h.id))

  const res = await multiSelect<HostId>({
    message: t('agent.pick'),
    backLabel: t('common.backToMenu'),
    help: t('prompt.multiHelp'),
    items: HOSTS.map(h => ({
      value: h.id,
      name: installed.has(h.id) ? `${h.label} ${pc.dim(`(${t('agent.alreadyInstalled')})`)}` : h.label,
      short: h.label,
      checked: presetSet.has(h.id) && !installed.has(h.id),
    })),
  })
  if (res.back || res.picked.length === 0)
    return

  const failures: string[] = []
  let done = 0
  for (const id of res.picked) {
    const host = hostById(id)
    process.stdout.write(`  ${host.label} ${pc.dim(`→ ${host.installCommand}`)} ... `)
    const r = await io.exec(host.installCommand.split(' '))
    if (r.ok) {
      done++
      console.log(pc.green(t('common.ok')))
    }
    else {
      failures.push(`${host.label}: ${r.detail}`)
      console.log(pc.red(t('common.failed')))
    }
  }

  console.log()
  console.log(pc.green(t('wizard.summary', { n: done })) + (failures.length ? pc.red(t('wizard.summaryFailed', { n: failures.length })) : ''))
  for (const f of failures)
    console.log(pc.red(`  ✗ ${f}`))
}
