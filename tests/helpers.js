// Shared test helpers.

import { COLUMNS } from '../src/data/columns.js'

/** A minimal CSV row; only id, manager and salary matter to these tests. The id doubles as the name. */
export function row(id, managerId, salary) {
  return { [COLUMNS.id]: id, [COLUMNS.name]: id, [COLUMNS.title]: 'T', [COLUMNS.department]: 'D', [COLUMNS.location]: 'L', [COLUMNS.level]: '1', [COLUMNS.managerId]: managerId, [COLUMNS.salary]: salary }
}
