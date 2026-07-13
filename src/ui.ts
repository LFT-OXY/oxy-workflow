import type { Status } from './probe.js'
import pc from 'picocolors'
import { t } from './i18n.js'

/** 状态的统一展示口径（wizard/doctor 共用） */
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

export const TYPE_ORDER = ['mcp', 'skill', 'agent', 'spec'] as const

/** 类型分组标题；随当前显示语言运行时求值，不能做常量表 */
export function typeTitle(type: (typeof TYPE_ORDER)[number]): string {
  return t(`type.${type}`)
}
