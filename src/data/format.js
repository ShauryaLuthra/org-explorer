// Display formatting for money, ratios, counts and initials.

/** Compact money: $4.39B, $1.24M, $856.3K, $92K, $950. Null becomes "–". */
export function formatMoney(value) {
  if (value === null || value === undefined) return '–'
  const size = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  // Each threshold sits where the smaller unit would round up to 1000, so 999,999 shows as $1M, not $1000K.
  if (size >= 999.995e6) return `${sign}$${trim((size / 1e9).toFixed(2))}B`
  if (size >= 999.95e3) return `${sign}$${trim((size / 1e6).toFixed(2))}M`
  if (size >= 999.5) return `${sign}$${trim((size / 1e3).toFixed(1))}K`
  return `${sign}$${Math.round(size)}`
}

// "92.0" -> "92", "1.20" -> "1.2"
function trim(text) {
  return text.replace(/\.?0+$/, '')
}

/** A ratio to 2 decimals, or "–" when it is undefined (no ICs below). */
export function formatRatio(value) {
  return value === null || value === undefined ? '–' : value.toFixed(2)
}

/** 12001 -> "12,001" */
export function formatCount(value) {
  return value.toLocaleString('en-US')
}

/** Avatar initials: "Nora Nguyen" -> "NN". */
export function initials(name) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
