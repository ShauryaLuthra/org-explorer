// Checks display formatting, including the unit boundaries where rounding could produce "$1000K".

import { describe, it, expect } from 'vitest'
import { formatMoney, formatRatio, formatCount, initials } from '../src/data/format.js'

describe('formatMoney', () => {
  it('picks a compact unit', () => {
    expect([4387495800, 1240000, 856300, 92000, 950, 0].map(formatMoney)).toEqual(['$4.39B', '$1.24M', '$856.3K', '$92K', '$950', '$0'])
  })

  it('rolls up to the next unit instead of showing 1000', () => {
    expect([999.6, 999949, 999999, 999999999].map(formatMoney)).toEqual(['$1K', '$999.9K', '$1M', '$1B'])
  })

  it('handles negatives and missing values', () => {
    expect(formatMoney(-5000)).toBe('-$5K')
    expect(formatMoney(null)).toBe('–')
    expect(formatMoney(undefined)).toBe('–')
  })
})

describe('other formats', () => {
  it('formats ratios to 2 decimals, or a dash when undefined', () => {
    expect(formatRatio(200 / 270)).toBe('0.74')
    expect(formatRatio(null)).toBe('–')
  })

  it('adds thousands separators', () => {
    expect(formatCount(39999)).toBe('39,999')
  })

  it('builds initials from first and last name', () => {
    expect(['Nora Nguyen', 'Mary Jane Watson', 'Cher', '  '].map(initials)).toEqual(['NN', 'MW', 'C', ''])
  })
})
