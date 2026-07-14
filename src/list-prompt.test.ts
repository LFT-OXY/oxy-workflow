import { describe, expect, it } from 'vitest'
import { moveCursor } from './list-prompt.js'

// 位置约定：-1 = 返回行（恒可选），0..N-1 = 条目行
describe('moveCursor：光标移动（不循环）', () => {
  const sel = [true, false, true] // 中间条目禁用

  it('向下跳过禁用行', () => {
    expect(moveCursor(sel, 0, 1)).toBe(2)
  })

  it('向上可回到返回行', () => {
    expect(moveCursor(sel, 0, -1)).toBe(-1)
  })

  it('返回行向下到第一个可选条目', () => {
    expect(moveCursor(sel, -1, 1)).toBe(0)
  })

  it('两端不循环，原地不动', () => {
    expect(moveCursor(sel, 2, 1)).toBe(2)
    expect(moveCursor(sel, -1, -1)).toBe(-1)
  })

  it('全部禁用时只能停在返回行', () => {
    expect(moveCursor([false, false], -1, 1)).toBe(-1)
  })
})
