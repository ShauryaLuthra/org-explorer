// Turns the flat list of CSV rows into a tree of people, each linked to their manager and direct reports.

import { COLUMNS } from './columns.js'

// Underscored IDs can't collide with real CSV IDs.
export const UNASSIGNED_ID = '__unassigned__'
export const COMPANY_ROOT_ID = '__company__'

function createPerson(fields) {
  return {
    ...fields,
    parent: null,
    children: [],
    depth: 0,
    isLeaf: true,
    desc: 0,
    nonLeafDesc: 0,
    mgmtCost: 0,
    icCost: 0,
    totalCost: 0,
    ratio: null,
    headcountRatio: null,
  }
}

// Accepts "$92,000"-style text. A blank or invalid salary becomes 0 and is reported, so no row is dropped.
function parseSalary(raw, id, issues) {
  const cleaned = raw.replaceAll('$', '').replaceAll(',', '').trim()
  const value = Number(cleaned)
  if (cleaned === '' || !Number.isFinite(value) || value < 0) {
    issues.push({ type: 'invalid-salary', id, message: `Salary "${raw}" is blank or invalid; using 0` })
    return 0
  }
  return value
}

function rowToPerson(row, issues) {
  const read = (key) => (row[COLUMNS[key]] ?? '').trim()
  const id = read('id')
  return createPerson({
    id,
    name: read('name'),
    title: read('title'),
    department: read('department'),
    location: read('location'),
    level: read('level'),
    managerId: read('managerId'),
    salary: parseSalary(read('salary'), id, issues),
    synthetic: false,
  })
}

// Placeholder nodes (Unassigned, company root) are flagged synthetic so they never count as descendants.
function createSynthetic(id, name, title) {
  return createPerson({ id, name, title, department: '', location: '', level: '', managerId: '', salary: 0, synthetic: true })
}

/**
 * Find reporting loops (A -> B -> A) and break each one by moving a person under "Unassigned".
 * The `finished` set means every person is walked at most once overall, so this stays O(n).
 */
function breakCycles(byId, orphans, issues) {
  const finished = new Set()
  for (const start of byId.values()) {
    const onThisWalk = new Set()
    let previous = null
    let current = start
    while (current !== null && !finished.has(current)) {
      if (onThisWalk.has(current)) {
        issues.push({ type: 'cycle', id: previous.id, message: `${previous.name} (${previous.id}) was in a reporting loop; moved to Unassigned` })
        previous.parent = null
        orphans.push(previous)
        break
      }
      onThisWalk.add(current)
      previous = current
      current = current.parent
    }
    for (const person of onThisWalk) finished.add(person)
  }
}

/**
 * Build the org tree from parsed CSV rows. O(n) time and memory.
 * @param {Object[]} rows - Rows from parseCsv.
 * @returns {{ root: Object, byId: Map<string, Object>, issues: Object[] }} The top node, a lookup of everyone by ID, and every data problem found.
 */
export function buildTree(rows) {
  const issues = []
  const byId = new Map()

  // Pass 1: index everyone by ID so each manager lookup below is O(1).
  for (const row of rows) {
    const person = rowToPerson(row, issues)
    if (byId.has(person.id)) {
      issues.push({ type: 'duplicate-id', id: person.id, message: `ID ${person.id} appears more than once; kept the first row` })
      continue
    }
    byId.set(person.id, person)
  }

  const tops = []
  const orphans = []
  // Pass 2: link each person to their manager.
  for (const person of byId.values()) {
    if (person.managerId === '') {
      tops.push(person)
      continue
    }
    const manager = byId.get(person.managerId)
    if (manager === undefined) {
      issues.push({ type: 'missing-manager', id: person.id, message: `${person.name} (${person.id}) reports to unknown ID ${person.managerId}; moved to Unassigned` })
      orphans.push(person)
      continue
    }
    person.parent = manager
  }

  breakCycles(byId, orphans, issues)

  if (orphans.length > 0) {
    const unassigned = createSynthetic(UNASSIGNED_ID, 'Unassigned', 'Manager missing from the data')
    byId.set(unassigned.id, unassigned)
    for (const person of orphans) person.parent = unassigned
    tops.push(unassigned)
  }

  if (tops.length === 0) throw new Error('No people found in the CSV')

  // Several tops (multiple CEOs, or the CEO plus Unassigned) go under one synthetic root.
  let root = tops[0]
  if (tops.length > 1) {
    root = createSynthetic(COMPANY_ROOT_ID, 'Giga Corp', 'Company')
    byId.set(root.id, root)
    for (const top of tops) top.parent = root
    const realTops = tops.filter((person) => !person.synthetic)
    if (realTops.length > 1) {
      issues.push({ type: 'multiple-roots', id: '', message: `${realTops.length} people have no manager; grouped under Giga Corp` })
    }
  }

  for (const person of byId.values()) {
    // Children are attached only now, after cycles are broken, so no cut link survives.
    if (person.parent !== null) person.parent.children.push(person)
  }
  for (const person of byId.values()) person.isLeaf = person.children.length === 0

  return { root, byId, issues }
}
