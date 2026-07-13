import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { detectLang, MESSAGES, prefsPath, savedLang, saveLang, setLang, t } from './i18n.js'

// t() 依赖模块级语言状态，每例结束还原默认 en，避免用例间串扰
afterEach(() => setLang('en'))

describe('双语字典', () => {
  it('zh/en 键集合完全一致', () => {
    expect(Object.keys(MESSAGES.zh).sort()).toEqual(Object.keys(MESSAGES.en).sort())
  })
})

describe('t：取文案与插值', () => {
  it('按当前语言取文案', () => {
    expect(t('status.installed')).toBe('installed')
    setLang('zh')
    expect(t('status.installed')).toBe('已安装')
  })

  it('{name} 占位插值；缺参保留占位符', () => {
    expect(t('logic.requires', { hosts: 'Claude Code' })).toBe('requires Claude Code')
    expect(t('logic.requires')).toBe('requires {hosts}')
  })

  it('多占位与数字参数', () => {
    expect(t('update.newVersion', { latest: '0.2.0', current: '0.1.0' })).toContain('v0.2.0')
    expect(t('wizard.summary', { n: 3 })).toBe('3 installed')
  })
})

describe('detectLang：locale 推断', () => {
  it('zh 前缀 → zh，其余 → en，缺省 → en', () => {
    expect(detectLang({ LANG: 'zh_CN.UTF-8' })).toBe('zh')
    expect(detectLang({ LANG: 'en_US.UTF-8' })).toBe('en')
    expect(detectLang({})).toBe('en')
  })

  it('LC_ALL 优先于 LANG', () => {
    expect(detectLang({ LC_ALL: 'zh_TW.UTF-8', LANG: 'en_US.UTF-8' })).toBe('zh')
  })
})

describe('语言偏好读写', () => {
  const home = '/home/u'

  it('合法偏好可读回；缺失/损坏/非法值 → null', () => {
    expect(savedLang(home, { readFile: () => '{"lang":"zh"}' })).toBe('zh')
    expect(savedLang(home, { readFile: () => null })).toBeNull()
    expect(savedLang(home, { readFile: () => 'not json' })).toBeNull()
    expect(savedLang(home, { readFile: () => '{"lang":"fr"}' })).toBeNull()
  })

  it('saveLang 写入偏好文件路径与 JSON 内容', async () => {
    const writes: Record<string, string> = {}
    await saveLang(home, 'zh', {
      writeFile: async (path, content) => {
        writes[path] = new TextDecoder().decode(content)
      },
    })
    const path = prefsPath(home)
    expect(path).toBe(join(home, '.config', 'oxy-workflow', 'prefs.json'))
    expect(JSON.parse(writes[path]!)).toEqual({ lang: 'zh' })
  })
})
