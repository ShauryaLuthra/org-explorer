// Gets CSV text and turns it into rows. Used for the bundled file AND for files the user uploads.

import Papa from 'papaparse'
import { COLUMNS } from './columns.js'

/**
 * Parse CSV text into one object per row, keyed by header name.
 * @param {string} text - The whole CSV file as one string.
 * @returns {{ rows: Object[], errors: Object[] }} The rows, plus any problems PapaParse found.
 */
export function parseCsv(text) {
  // No dynamicTyping: IDs stay strings, and buildTree cleans salaries itself.
  const result = Papa.parse(text, { header: true, skipEmptyLines: true })
  const fields = result.meta.fields
  // Fail fast with a clear message if an uploaded file has a different header.
  const missing = Object.values(COLUMNS).filter((name) => !fields.includes(name))
  if (missing.length > 0) {
    throw new Error(`CSV is missing columns: ${missing.join(', ')}`)
  }
  return { rows: result.data, errors: result.errors }
}

/**
 * Download and unzip the CSV that ships with the app.
 * It is stored gzipped (12 MB -> 2.6 MB) because StackBlitz's GitHub import stalls on large files.
 * @returns {Promise<string>} The file's text, once the download finishes.
 */
export async function fetchBundledCsv() {
  // BASE_URL keeps the path right when the app is hosted under a sub-path.
  const url = `${import.meta.env.BASE_URL}data/giga-corp.csv.gz`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not load ${url} (HTTP ${response.status})`)
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  // Some servers already undo the gzip for us, so only decompress if the gzip header (1f 8b) is still there.
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b
  const stream = new Blob([bytes]).stream()
  return new Response(isGzip ? stream.pipeThrough(new DecompressionStream('gzip')) : stream).text()
}
