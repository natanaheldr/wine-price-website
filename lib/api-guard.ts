'use client'

const LOG_KEY = 'lista-precios-api-log'
const MAX_PER_HOUR = 3
const MAX_PER_DAY = 10

interface ApiLogEntry {
  t: number
}

function getLog(): ApiLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLog(log: ApiLogEntry[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log))
}

export function getApiQuota() {
  const now = Date.now()
  const log = getLog()

  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * 60 * 60 * 1000

  const lastHour = log.filter((e) => now - e.t < oneHour).length
  const lastDay = log.filter((e) => now - e.t < oneDay).length

  return {
    usedHour: lastHour,
    usedDay: lastDay,
    remainingHour: Math.max(0, MAX_PER_HOUR - lastHour),
    remainingDay: Math.max(0, MAX_PER_DAY - lastDay),
    maxHour: MAX_PER_HOUR,
    maxDay: MAX_PER_DAY,
    canProceed: lastHour < MAX_PER_HOUR && lastDay < MAX_PER_DAY,
  }
}

export function recordApiCall() {
  const log = getLog()
  log.push({ t: Date.now() })
  saveLog(log)
}
