// format.js: turns raw numbers into the short labels shown on cards ($1.24M, $856.3K, $92K, 1.25, 12,001).

/**
 * Format money compactly: $4.39B, $1.24M, $856.3K, $92K, $950.
 * @param {number|null} value - Dollars.
 * @returns {string} The label ('–' for missing).
 */
export function formatMoney(value) { // Used for every cost on cards, drawer and charts.
  if (value === null || value === undefined) return '–' // Missing value: show an en dash.
  const size = Math.abs(value) // Size without sign, so negatives format the same way.
  if (size >= 1e9) return `$${trim((value / 1e9).toFixed(2))}B` // Billions, 2 decimals: $4.39B.
  if (size >= 1e6) return `$${trim((value / 1e6).toFixed(2))}M` // Millions, 2 decimals: $1.24M.
  if (size >= 1e3) return `$${trim((value / 1e3).toFixed(1))}K` // Thousands, 1 decimal: $856.3K, and $92.0K becomes $92K.
  return `$${Math.round(value)}` // Small amounts: whole dollars.
} // End of formatMoney.

/**
 * Drop useless trailing zeros: "92.0" -> "92", "1.20" -> "1.2".
 * @param {string} text - A number already rounded with toFixed.
 * @returns {string} The shorter text.
 */
function trim(text) { // Private helper for formatMoney.
  return text.replace(/\.?0+$/, '') // Regex: an optional "." followed by zeros at the very end, removed.
} // End of trim.

/**
 * Format a ratio to 2 decimals, or an en dash when it doesn't exist.
 * @param {number|null} value - The ratio.
 * @returns {string} e.g. "0.74" or "–".
 */
export function formatRatio(value) { // Used for the mgmt cost ratio and headcount ratio.
  return value === null || value === undefined ? '–' : value.toFixed(2) // null means "no ICs below", so no ratio.
} // End of formatRatio.

/**
 * Format a count with thousands separators: 12001 -> "12,001".
 * @param {number} value - A whole number.
 * @returns {string} The label.
 */
export function formatCount(value) { // Used for descendant counts and headcounts.
  return value.toLocaleString('en-US') // Built-in formatter adds the commas.
} // End of formatCount.

/**
 * Two-letter initials for the avatar: "Nora Nguyen" -> "NN".
 * @param {string} name - Full name.
 * @returns {string} Up to two capital letters.
 */
export function initials(name) { // Used by the card avatar.
  const parts = name.trim().split(/\s+/) // Split on any run of spaces.
  const first = parts[0]?.[0] ?? '' // First letter of the first word ('' if none). "?." = stop safely if missing.
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '' // First letter of the last word, if there are two or more words.
  return (first + last).toUpperCase() // Join and capitalise.
} // End of initials.
