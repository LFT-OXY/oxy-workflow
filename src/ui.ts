import type { CatalogEntry, EntryType } from './catalog/types.js'
import type { Status } from './probe.js'
import { password } from '@inquirer/prompts'
import pc from 'picocolors'
import { localize, t } from './i18n.js'

/** 状态的统一展示口径（各流程共用） */
export function statusLabel(status: Status): string {
  switch (status) {
    case 'installed':
      return pc.green(t('status.installed'))
    case 'missing-env':
      return pc.yellow(t('status.missingEnv'))
    case 'missing':
      return pc.dim(t('status.notInstalled'))
  }
}

/** 类型分组标题；随当前显示语言运行时求值，不能做常量表 */
export function typeTitle(type: EntryType): string {
  return t(`type.${type}`)
}

/** 条目 env 引导（wizard/manage 共用）：逐键掩码输入，空值即跳过不落键 */
export async function promptEnv(entry: CatalogEntry): Promise<Record<string, string>> {
  const values: Record<string, string> = {}
  for (const v of entry.env ?? []) {
    const suffix = v.required ? '' : ` ${t('common.envOptional')}`
    const hint = v.hint ? pc.dim(` ${localize(v.hint)}`) : ''
    const value = await password({ message: `${entry.name} · ${v.key}${suffix}${hint}`, mask: '*' })
    if (value)
      values[v.key] = value
  }
  return values
}
