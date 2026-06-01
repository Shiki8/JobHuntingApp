import { describe, it, expect } from 'vitest'
import { parseJobImport, normalizeJobImport } from './jobImport'

describe('parseJobImport', () => {
  it('正常な JSON 文字列を渡すと ok:true で JobImport が返る', () => {
    const raw = JSON.stringify({ companyName: 'Acme', position: 'Engineer' })
    const result = parseJobImport(raw)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.companyName).toBe('Acme')
      expect(result.data.position).toBe('Engineer')
    }
  })

  it('壊れた JSON 文字列を渡すと ok:false が返る', () => {
    const result = parseJobImport('{invalid json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeTruthy()
  })

  it('JSON が配列の場合は ok:false が返る', () => {
    const result = parseJobImport('[1, 2, 3]')
    expect(result.ok).toBe(false)
  })

  it('JSON が数値の場合は ok:false が返る', () => {
    const result = parseJobImport('42')
    expect(result.ok).toBe(false)
  })

  it('空文字列を渡すと ok:false が返る', () => {
    const result = parseJobImport('')
    expect(result.ok).toBe(false)
  })

  it('フィールドが一部欠落した JSON を渡すと欠落フィールドが undefined の JobImport が返る', () => {
    const raw = JSON.stringify({ companyName: 'Acme' })
    const result = parseJobImport(raw)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.companyName).toBe('Acme')
      expect(result.data.position).toBeUndefined()
      expect(result.data.salaryMin).toBeUndefined()
    }
  })
})

describe('normalizeJobImport', () => {
  it('source が enum 外の値の場合、source="その他" かつ sourceNote に元の値が入る', () => {
    const result = normalizeJobImport({ source: 'Indeed' })
    expect(result.source).toBe('その他')
    expect(result.sourceNote).toBe('Indeed')
  })

  it('source が enum 内の値の場合、source はそのまま・sourceNote は空', () => {
    const result = normalizeJobImport({ source: 'Green' })
    expect(result.source).toBe('Green')
    expect(result.sourceNote).toBe('')
  })

  it('remoteType が enum 外の値の場合、デフォルト値（不可）にフォールバックされる', () => {
    const result = normalizeJobImport({ remoteType: 'フルリモート可' })
    expect(result.remoteType).toBe('不可')
  })

  it('remoteType が enum 内の値の場合、そのまま返る', () => {
    const result = normalizeJobImport({ remoteType: 'フルリモート' })
    expect(result.remoteType).toBe('フルリモート')
  })

  it('employmentType が enum 外の値の場合、デフォルト値（正社員）にフォールバックされる', () => {
    const result = normalizeJobImport({ employmentType: '派遣社員' })
    expect(result.employmentType).toBe('正社員')
  })

  it('salaryMin に文字列が来た場合、null になる', () => {
    const result = normalizeJobImport({ salaryMin: '500万円' as unknown as number })
    expect(result.salaryMin).toBeNull()
  })

  it('salaryMin に数値が来た場合、そのまま返る', () => {
    const result = normalizeJobImport({ salaryMin: 500 })
    expect(result.salaryMin).toBe(500)
  })

  it('存在しないフィールドは result に含まれない', () => {
    const result = normalizeJobImport({})
    expect(result.companyName).toBeUndefined()
    expect(result.position).toBeUndefined()
    expect(result.source).toBeUndefined()
  })

  it('url が Markdown リンク形式の場合、URL 部分のみ抽出される', () => {
    const result = normalizeJobImport({ url: '[求人詳細](https://example.com/jobs/123)' })
    expect(result.url).toBe('https://example.com/jobs/123')
  })

  it('url が通常の文字列の場合はそのまま返る', () => {
    const result = normalizeJobImport({ url: 'https://example.com/jobs/123' })
    expect(result.url).toBe('https://example.com/jobs/123')
  })
})
