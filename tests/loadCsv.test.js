// Checks CSV parsing: real-world formatting (CRLF, quoted commas, extra columns) and a clear error for a wrong header.

import { describe, it, expect, vi, afterEach } from 'vitest'
import { gzipSync } from 'node:zlib'
import { parseCsv, fetchBundledCsv } from '../src/data/loadCsv.js'
import { COLUMNS } from '../src/data/columns.js'

const HEADER = Object.values(COLUMNS).join(',')

describe('parseCsv', () => {
  it('handles CRLF line endings, quoted commas, extra columns and leading-zero IDs', () => {
    const text = `${HEADER},Email\r\n007,Ada Lovelace,CEO,Exec,"Toronto, Canada",1,,"120,000",ada@example.com\r\n`
    const { rows } = parseCsv(text)
    expect(rows).toHaveLength(1)
    expect(rows[0][COLUMNS.id]).toBe('007')
    expect(rows[0][COLUMNS.location]).toBe('Toronto, Canada')
    expect(rows[0][COLUMNS.salary]).toBe('120,000')
  })

  it('names the missing columns when the header is wrong', () => {
    expect(() => parseCsv('Name,Salary\nAda,1\n')).toThrow(/missing columns: Employee Id/)
  })

  it('skips blank lines', () => {
    expect(parseCsv(`${HEADER}\n\nE1,A,T,D,L,1,,1\n\n`).rows).toHaveLength(1)
  })
})

describe('fetchBundledCsv', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('unzips the gzipped bundle, and passes through text a server already decoded', async () => {
    const text = 'a,b\n1,2\n'
    for (const body of [gzipSync(text), Buffer.from(text)]) {
      vi.stubGlobal('fetch', async () => new Response(body))
      expect(await fetchBundledCsv()).toBe(text)
    }
  })

  it('reports a failed download with its status', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 404 }))
    await expect(fetchBundledCsv()).rejects.toThrow('HTTP 404')
  })
})
