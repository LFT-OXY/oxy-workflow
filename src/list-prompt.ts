import { cursorHide } from '@inquirer/ansi'
import { createPrompt, isDownKey, isEnterKey, isSpaceKey, isUpKey, useKeypress, usePagination, usePrefix, useState } from '@inquirer/core'
import figures from '@inquirer/figures'
import pc from 'picocolors'

/** 列表条目；disabled 为非空字符串时不可选，值为原因文案 */
export interface ListItem<T> {
  value: T
  name: string
  /** 提交后回显的短名（缺省用 name，避免回显整行长文案） */
  short?: string
  checked?: boolean
  disabled?: string
}

/** 单屏配置：每屏必有顶部返回行与底部按键提示（ADR-0007） */
export interface ListConfig<T> {
  message: string
  items: ListItem<T>[]
  /** 顶部返回行文案（「← 返回上一步」/「← 返回主菜单」） */
  backLabel: string
  /** 底部按键提示行 */
  help: string
  /** 多选提交校验；true 通过，字符串为错误提示 */
  validate?: (picked: T[]) => true | string
  pageSize?: number
}

/** 多选结果：back 时 picked 仍带回当前勾选，调用方存留（离屏不丢勾选） */
export interface MultiResult<T> {
  back: boolean
  picked: T[]
}

export type SingleResult<T> = { back: true } | { back: false, picked: T }

/**
 * 光标移动纯函数：-1 = 返回行（恒可选），0..N-1 = 条目行。
 * 沿 dir 找下一个可选位置，两端不循环，无处可去则原地不动。
 */
export function moveCursor(selectable: boolean[], from: number, dir: 1 | -1): number {
  for (let pos = from + dir; pos >= -1 && pos < selectable.length; pos += dir) {
    if (pos === -1 || selectable[pos])
      return pos
  }
  return from
}

interface InternalConfig extends ListConfig<unknown> {
  multi: boolean
}

/**
 * 自写列表组件（ADR-0007）：原生 inquirer 的回车永远是提交整屏，做不到
 * "光标在返回行时回车即后退"，也不暴露 Esc 钩子，故自行处理按键与渲染。
 * 布局按间距规范：问题行 / 返回行+分隔线 / 条目 / 按键提示，段间空行。
 */
const listPrompt = createPrompt<{ back: boolean, picked: unknown[] }, InternalConfig>((config, done) => {
  const { items, multi } = config
  const selectable = items.map(it => !it.disabled)
  const [status, setStatus] = useState<'idle' | 'done'>('idle')
  const prefix = usePrefix({ status })
  const [cursor, setCursor] = useState(moveCursor(selectable, -1, 1))
  const [checked, setChecked] = useState(items.map(it => Boolean(it.checked && !it.disabled)))
  const [wentBack, setWentBack] = useState(false)
  const [error, setError] = useState('')

  const pickedValues = (): unknown[] => items.filter((_, i) => checked[i]).map(it => it.value)
  const goBack = (): void => {
    setWentBack(true)
    setStatus('done')
    done({ back: true, picked: pickedValues() })
  }

  useKeypress((key) => {
    if (key.name === 'escape') {
      goBack()
    }
    else if (isEnterKey(key)) {
      if (cursor === -1)
        return goBack()
      if (!multi) {
        setStatus('done')
        return done({ back: false, picked: [items[cursor]!.value] })
      }
      const picked = pickedValues()
      const valid = config.validate?.(picked) ?? true
      if (valid !== true)
        return setError(valid)
      setStatus('done')
      done({ back: false, picked })
    }
    else if (isSpaceKey(key)) {
      if (multi && cursor >= 0) {
        setError('')
        setChecked(checked.map((c, i) => (i === cursor ? !c : c)))
      }
    }
    else if (isUpKey(key) || isDownKey(key)) {
      setError('')
      setCursor(moveCursor(selectable, cursor, isUpKey(key) ? -1 : 1))
    }
  })

  const page = usePagination({
    items,
    active: Math.max(cursor, 0),
    renderItem({ item, index }) {
      if (item.disabled)
        return pc.dim(`    ${item.name} (${item.disabled})`)
      const active = index === cursor
      const ptr = active ? figures.pointer : ' '
      const row = multi
        ? `${ptr} ${checked[index] ? pc.green(figures.circleFilled) : figures.circle} ${item.name}`
        : `${ptr} ${item.name}`
      return active ? pc.cyan(row) : row
    },
    pageSize: config.pageSize ?? 12,
    loop: false,
  })

  // 提交后单行回显：返回 → 返回行文案；多选 → 短名清单；单选 → 所选短名
  if (status === 'done') {
    const answer = wentBack
      ? pc.dim(config.backLabel)
      : pc.cyan(multi
        ? items.filter((_, i) => checked[i]).map(it => it.short ?? it.name).join(', ')
        : items[cursor]?.short ?? items[cursor]?.name ?? '')
    return `${prefix} ${pc.bold(config.message)} ${answer}`
  }

  const backActive = cursor === -1
  const backRow = backActive ? pc.cyan(`${figures.pointer} ${config.backLabel}`) : `  ${pc.dim(config.backLabel)}`
  const lines = [
    `${prefix} ${pc.bold(config.message)}`,
    '',
    backRow,
    ` ${pc.dim('─'.repeat(10))}`,
    '',
    page,
    '',
    ` ${pc.dim(config.help)}`,
  ]
  if (error)
    lines.push(pc.red(`  ${error}`))
  return lines.join('\n') + cursorHide
})

/** 多选屏：back=true 表示后退一层，此时 picked 仍为当前勾选集 */
export function multiSelect<T>(config: ListConfig<T>): Promise<MultiResult<T>> {
  return listPrompt({ ...config, multi: true } as InternalConfig) as Promise<MultiResult<T>>
}

/** 单选屏（确认屏等）：back=true 表示后退一层 */
export async function singleSelect<T>(config: Omit<ListConfig<T>, 'validate'>): Promise<SingleResult<T>> {
  const res = await listPrompt({ ...config, multi: false } as InternalConfig)
  return res.back ? { back: true } : { back: false, picked: res.picked[0] as T }
}
