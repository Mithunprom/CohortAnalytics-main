/** Date and seed helpers used by the daily spark picker. */

export function dateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function hashString(input) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function pickIndex(seed, length) {
  if (length <= 0) return 0
  return hashString(String(seed)) % length
}

export function isYesterday(prevKey, todayKey) {
  const prev = new Date(`${prevKey}T12:00:00`)
  const today = new Date(`${todayKey}T12:00:00`)
  const diff = Math.round((today - prev) / 86400000)
  return diff === 1
}

export function daysBetween(aKey, bKey) {
  const a = new Date(`${aKey}T12:00:00`)
  const b = new Date(`${bKey}T12:00:00`)
  return Math.round((b - a) / 86400000)
}

export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(dateKey(new Date(year, month, day)))
  }
  return cells
}

export function formatPrettyDate(key) {
  const d = new Date(`${key}T12:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}
