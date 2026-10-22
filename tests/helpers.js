// helpers.js: shared helpers for the test files (not a test file itself, so Vitest doesn't run it).

import { COLUMNS } from '../src/data/columns.js' // Header names, so test rows look exactly like real CSV rows.

/**
 * Make one fake CSV row. Only id, manager and salary matter for these tests.
 * @param {string} id - The person's ID (also used as their name).
 * @param {string} managerId - Their boss's ID, or '' for none.
 * @param {string} salary - Salary text, exactly as a CSV cell would hold it.
 * @returns {Object} A row shaped like parseCsv's output.
 */
export function row(id, managerId, salary) { // Exported so both test files can use it.
  return { [COLUMNS.id]: id, [COLUMNS.name]: id, [COLUMNS.title]: 'T', [COLUMNS.department]: 'D', [COLUMNS.location]: 'L', [COLUMNS.level]: '1', [COLUMNS.managerId]: managerId, [COLUMNS.salary]: salary } // [x]: y uses the VALUE of x as the key.
} // End of row.
