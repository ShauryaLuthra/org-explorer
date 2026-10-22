// loadCsv.js: gets CSV text and turns it into rows. Used for the bundled file AND for files the user uploads.

import Papa from 'papaparse' // Load PapaParse (default import): the library that reads CSV text correctly, including commas inside quotes.
import { COLUMNS } from './columns.js' // Load our header-name mapping, so we can check the file has every column we need.

/**
 * Parse CSV text into one object per row, keyed by header name.
 * @param {string} text - The whole CSV file as one string.
 * @returns {{ rows: Object[], errors: Object[] }} The rows, plus any problems PapaParse found.
 */
export function parseCsv(text) { // A named, exported function that takes the raw file text. Like "def parse_csv(text):" in Python.
  const result = Papa.parse(text, { header: true, skipEmptyLines: true }) // header: use row 1 as keys, so each row is {"Name": "Nora", ...}. skipEmptyLines: ignore blank lines. No dynamicTyping, so every value stays text.
  const fields = result.meta.fields // The list of header names PapaParse found in row 1.
  const missing = Object.values(COLUMNS).filter((name) => !fields.includes(name)) // Take every header we need (the right side of COLUMNS) and keep only the ones NOT in this file.
  if (missing.length > 0) { // If even one required column is missing, this file can't be used...
    throw new Error(`CSV is missing columns: ${missing.join(', ')}`) // ...so stop with a clear message naming them. This matters when someone uploads the wrong file.
  } // End of the missing-columns check.
  return { rows: result.data, errors: result.errors } // Hand back the rows and PapaParse's own problem list (e.g. a row with too few commas) for the data-quality badge.
} // End of parseCsv.



/**
 * Download the CSV file that ships with the app.
 * @returns {Promise<string>} The file's text, once the download finishes.
 */
export async function fetchBundledCsv() { // "async" marks a function that waits on slow work (a download) without freezing the page.
  const url = `${import.meta.env.BASE_URL}data/giga-corp.csv` // Build the file's address. Backticks + ${} insert a value into text, like a Python f-string. BASE_URL = the site's base folder, usually "/".
  const response = await fetch(url) // Ask the server for the file. "await" pauses only THIS function until the reply arrives; the page stays responsive.
  if (!response.ok) { // "ok" is true only for a success reply (status 200–299). "!" means "not".
    throw new Error(`Could not load ${url} (HTTP ${response.status})`) // Stop with a readable message. For example, 404 means "file not found".
  } // End of the error check.
  return await response.text() // Read the reply's body as one long string (3.3 MB here). Also slow, so we await it.
} // End of fetchBundledCsv.