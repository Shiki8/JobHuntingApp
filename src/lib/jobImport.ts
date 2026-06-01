import { type Job, type JobSource, type RemoteType, type EmploymentType, JOB_SOURCES } from '../types'

export type JobImport = {
  companyName?: string
  position?: string
  source?: string
  sourceNote?: string
  url?: string
  salaryMin?: number | null
  salaryMax?: number | null
  location?: string
  remoteType?: string
  employmentType?: string
  workStartTime?: string
  yearEndHolidays?: number | null
  housingAllowance?: boolean
  annualBonus?: number | null
  requiredSkills?: string[]
  preferredSkills?: string[]
  techStack?: string[]
  summary?: string
  notes?: string
}

type ParseResult =
  | { ok: true; data: JobImport }
  | { ok: false; error: string }

export function parseJobImport(raw: string): ParseResult {
  if (!raw.trim()) return { ok: false, error: 'JSON が空です' }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: '有効な JSON ではありません' }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'JSON はオブジェクトである必要があります' }
  }
  return { ok: true, data: parsed as JobImport }
}

const REMOTE_TYPES: RemoteType[] = ['不可', '一部リモート', 'フルリモート']
const EMPLOYMENT_TYPES: EmploymentType[] = ['正社員', '契約社員', '業務委託', 'その他']

export function normalizeJobImport(imported: JobImport): Partial<Job> {
  const result: Partial<Job> = {}

  if (imported.companyName !== undefined) result.companyName = imported.companyName
  if (imported.position !== undefined) result.position = imported.position
  if (imported.url !== undefined) result.url = imported.url
  if (imported.location !== undefined) result.location = imported.location
  if (imported.workStartTime !== undefined) result.workStartTime = imported.workStartTime
  if (imported.summary !== undefined) result.summary = imported.summary
  if (imported.notes !== undefined) result.notes = imported.notes
  if (imported.housingAllowance !== undefined) result.housingAllowance = imported.housingAllowance
  if (imported.requiredSkills !== undefined) result.requiredSkills = imported.requiredSkills
  if (imported.preferredSkills !== undefined) result.preferredSkills = imported.preferredSkills
  if (imported.techStack !== undefined) result.techStack = imported.techStack

  const toNum = (v: unknown): number | null => (typeof v === 'number' ? v : null)
  result.salaryMin = toNum(imported.salaryMin)
  result.salaryMax = toNum(imported.salaryMax)
  result.yearEndHolidays = toNum(imported.yearEndHolidays)
  result.annualBonus = toNum(imported.annualBonus)

  // source：enum 外は 'その他' + sourceNote に元の値
  if (imported.source !== undefined) {
    if ((JOB_SOURCES as readonly string[]).includes(imported.source)) {
      result.source = imported.source as JobSource
      result.sourceNote = ''
    } else {
      result.source = 'その他'
      result.sourceNote = imported.source
    }
  }

  // remoteType：enum 外はデフォルト値にフォールバック
  if (imported.remoteType !== undefined) {
    result.remoteType = (REMOTE_TYPES as readonly string[]).includes(imported.remoteType)
      ? (imported.remoteType as RemoteType)
      : '不可'
  }

  // employmentType：enum 外はデフォルト値にフォールバック
  if (imported.employmentType !== undefined) {
    result.employmentType = (EMPLOYMENT_TYPES as readonly string[]).includes(imported.employmentType)
      ? (imported.employmentType as EmploymentType)
      : '正社員'
  }

  return result
}
