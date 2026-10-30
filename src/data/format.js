// Display formatting for money, ratios, counts and initials.

/** Compact money: $4.39B, $1.24M, $856.3K, $92K, $950. Null becomes "–". */
export function formatMoney(value) {
  if (value === null || value === undefined) return '–'
  const size = Math.abs(value)
  if (size >= 1e9) return `$${trim((value / 1e9).toFixed(2))}B`
  if (size >= 1e6) return `$${trim((value / 1e6).toFixed(2))}M`
  if (size >= 1e3) return `$${trim((value / 1e3).toFixed(1))}K`
  return `$${Math.round(value)}`
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
