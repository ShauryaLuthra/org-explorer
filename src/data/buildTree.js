// buildTree.js: turns the flat list of CSV rows into a tree of people, each linked to their manager and their direct reports.

import { COLUMNS } from './columns.js' // Our header-name mapping, so this file never types a CSV header itself.

// The IDs that synthetic (made-up) nodes use, so the UI and tests can recognise them.
export const UNASSIGNED_ID = '__unassigned__' // ID of the placeholder that holds people whose manager is missing or who were in a loop.
export const COMPANY_ROOT_ID = '__company__' // ID of the placeholder root we add when the file has more than one top person.

/**
 * Make one person object with every field the app needs, the calculated ones starting empty.
 * @param {Object} fields - id, name, title, department, location, level, managerId, salary, synthetic.
 * @returns {Object} A person ready to be linked into the tree.
 */
function createPerson(fields) { // Used for real people AND for synthetic nodes, so every person has exactly the same shape.
  return { // Build and hand back a new object.
    ...fields, // "Spread": copy every field we were given into this object. Python: {**fields, ...}.
    parent: null, // Their manager's person object. null = "nothing here yet" (Python: None). Filled in by buildTree.
    children: [], // Their direct reports. Starts as an empty list; buildTree adds to it.
    depth: 0, // Steps from the top of the tree. Set later by aggregate.
    isLeaf: true, // true = nobody reports to them (an individual contributor). Corrected at the end of buildTree.
    desc: 0, // Number of people below them (all levels). Set by aggregate.
    nonLeafDesc: 0, // How many of those people are managers themselves. Set by aggregate.
    mgmtCost: 0, // Total salary of the managers below them. Set by aggregate.
    icCost: 0, // Total salary of the individual contributors below them. Set by aggregate.
    totalCost: 0, // mgmtCost + icCost (NOT their own salary). Set by aggregate.
    ratio: null, // mgmtCost / icCost, or null when icCost is 0. Set by aggregate.
    headcountRatio: null, // managers below / ICs below, or null when there are no ICs. Set by aggregate.
  } // End of the person object.
} // End of createPerson.


/**
 * Turn a salary cell into a number. Strips "$" and ",". Blank or invalid -> 0, and the problem is reported.
 * @param {string} raw - The salary text exactly as it appears in the CSV.
 * @param {string} id - Whose salary this is, so the report can name them.
 * @param {Object[]} issues - The shared list of data problems; we add to it when the salary is bad.
 * @returns {number} The salary as a number.
 */
function parseSalary(raw, id, issues) { // Called once per row by rowToPerson.
  const cleaned = raw.replaceAll('$', '').replaceAll(',', '').trim() // "$92,000 " -> "92000": remove dollar signs, commas and outer spaces.
  const value = Number(cleaned) // Convert text to a number. Number("abc") gives NaN ("not a number").
  if (cleaned === '' || !Number.isFinite(value) || value < 0) { // Blank, not a real number (NaN/Infinity) or negative: all unusable.
    issues.push({ type: 'invalid-salary', id, message: `Salary "${raw}" is blank or invalid; using 0` }) // Record the problem for the data-quality panel.
    return 0 // Use 0 so the maths still works, as the brief says.
  } // End of the bad-salary branch.
  return value // A good salary: hand back the number.
} // End of parseSalary.

/**
 * Read one CSV row (via COLUMNS) into a person object.
 * @param {Object} row - One row from parseCsv, keyed by CSV header text.
 * @param {Object[]} issues - The shared list of data problems.
 * @returns {Object} The new person.
 */
function rowToPerson(row, issues) { // Called once per row by buildTree's first pass.
  const read = (key) => (row[COLUMNS[key]] ?? '').trim() // Tiny helper: look up a field by OUR name, use '' if the cell is missing, trim spaces.
  const id = read('id') // e.g. "E00042". Stays text forever.
  return createPerson({ // Build the full person from the cleaned-up values.
    id, // Shorthand for id: id (same name, same value).
    name: read('name'), // Full name.
    title: read('title'), // Job title.
    department: read('department'), // Department name.
    location: read('location'), // City, country.
    level: read('level'), // Seniority label, display only.
    managerId: read('managerId'), // Boss's ID, '' for a top person.
    salary: parseSalary(read('salary'), id, issues), // Salary as a cleaned number.
    synthetic: false, // A real person from the file, not a placeholder.
  }) // End of createPerson call.
} // End of rowToPerson.

/**
 * Make a placeholder node (not a real person) with zero salary.
 * @param {string} id - Its special ID.
 * @param {string} name - What the card shows.
 * @param {string} title - The line under the name.
 * @returns {Object} The placeholder person.
 */
function createSynthetic(id, name, title) { // Used for "Unassigned" and for the company root.
  return createPerson({ id, name, title, department: '', location: '', level: '', managerId: '', salary: 0, synthetic: true }) // Same shape as everyone else; salary 0 so it never changes any cost.
} // End of createSynthetic.


/**
 * Find reporting loops (A -> B -> A) by walking up from every person, and break each loop by cutting one link.
 * Every person is walked at most once overall, so this is O(n).
 * @param {Map<string, Object>} byId - Everyone, keyed by ID.
 * @param {Object[]} orphans - People to put under "Unassigned"; cut people are added here.
 * @param {Object[]} issues - The shared list of data problems.
 */
function breakCycles(byId, orphans, issues) { // Runs after every parent link is set, before children lists are built.
  const finished = new Set() // People already proven to reach the top (or already fixed). A Set is like Python's set().
  for (const start of byId.values()) { // Try a walk upward from every person.
    const onThisWalk = new Set() // Who we've passed on THIS walk. Seeing one of them again means we went round in a circle.
    let previous = null // The person we stepped up FROM (the one whose link we'd cut). "let" = a name we will re-assign.
    let current = start // The person we are standing on right now.
    while (current !== null && !finished.has(current)) { // Keep climbing until we reach the top (null) or someone already checked.
      if (onThisWalk.has(current)) { // We are back on someone from this same walk: it's a loop.
        issues.push({ type: 'cycle', id: previous.id, message: `${previous.name} (${previous.id}) was in a reporting loop; moved to Unassigned` }) // Report who we cut.
        previous.parent = null // Cut the link that closed the loop.
        orphans.push(previous) // They now have no manager, so they go under "Unassigned".
        break // This walk is done.
      } // End of the loop-found branch.
      onThisWalk.add(current) // Remember we passed this person.
      previous = current // Step up: the current person becomes the previous one...
      current = current.parent // ...and their manager becomes the current one.
    } // End of the climb.
    for (const person of onThisWalk) finished.add(person) // Everyone on this walk is now checked, so no walk ever repeats them.
  } // End of the walk from every person.
} // End of breakCycles.



/**
 * Build the org tree from parsed CSV rows. O(n) time and memory.
 * @param {Object[]} rows - Rows from parseCsv.
 * @returns {{ root: Object, byId: Map<string, Object>, issues: Object[] }} The top node, a lookup of everyone by ID, and every data problem found.
 */
export function buildTree(rows) { // The main function other files call.
  const issues = [] // Every data problem we find goes in here, for the data-quality badge.
  const byId = new Map() // ID -> person. A Map is like a Python dict: finding someone by ID is instant.

  // Pass 1: create every person and file them under their ID.
  for (const row of rows) { // Go through the rows once.
    const person = rowToPerson(row, issues) // Turn the row into a person (and clean the salary).
    if (byId.has(person.id)) { // This ID is already taken by an earlier row.
      issues.push({ type: 'duplicate-id', id: person.id, message: `ID ${person.id} appears more than once; kept the first row` }) // Report it.
      continue // Skip this duplicate row and move to the next one. Same as Python's continue.
    } // End of the duplicate branch.
    byId.set(person.id, person) // File the person under their ID. Python: by_id[person.id] = person.
  } // End of pass 1.


  // Pass 2: link each person to their manager.
  const tops = [] // People with no manager listed (normally just the CEO).
  const orphans = [] // People whose manager ID points at nobody.
  for (const person of byId.values()) { // Go through everyone once.
    if (person.managerId === '') { // Situation 1: no manager listed, so a top person.
      tops.push(person) // Remember them.
      continue // Nothing to link.
    } // End of the top-person branch.
    const manager = byId.get(person.managerId) // Instant lookup of the boss. undefined if the ID isn't in the file.
    if (manager === undefined) { // Situation 3: the boss's ID doesn't exist in the file.
      issues.push({ type: 'missing-manager', id: person.id, message: `${person.name} (${person.id}) reports to unknown ID ${person.managerId}; moved to Unassigned` }) // Report it.
      orphans.push(person) // Park them for "Unassigned".
      continue // Nothing to link.
    } // End of the missing-manager branch.
    person.parent = manager // Situation 2: the link. This person now points at their boss.
  } // End of pass 2.

  breakCycles(byId, orphans, issues) // Cut any reporting loops; anyone cut joins the orphans and will go under "Unassigned".


  if (orphans.length > 0) { // Anyone without a valid manager?
    const unassigned = createSynthetic(UNASSIGNED_ID, 'Unassigned', 'Manager missing from the data') // Make the placeholder.
    byId.set(unassigned.id, unassigned) // Add it to the lookup so the UI can find it like anyone else.
    for (const person of orphans) person.parent = unassigned // Hang every orphan under it.
    tops.push(unassigned) // The placeholder itself sits at the top level.
  } // End of the Unassigned branch.

  if (tops.length === 0) throw new Error('No people found in the CSV') // Only possible with an empty file.

  let root = tops[0] // Normally the one and only top person: the CEO.
  if (tops.length > 1) { // More than one top: they need a shared parent so there's ONE tree.
    root = createSynthetic(COMPANY_ROOT_ID, 'Giga Corp', 'Company') // Make the company placeholder.
    byId.set(root.id, root) // Add it to the lookup.
    for (const top of tops) top.parent = root // Hang every top person under it.
    const realTops = tops.filter((person) => !person.synthetic) // Top people who are real, not "Unassigned".
    if (realTops.length > 1) { // Several real people have no manager: worth reporting.
      issues.push({ type: 'multiple-roots', id: '', message: `${realTops.length} people have no manager; grouped under Giga Corp` }) // Report it.
    } // End of the multiple-roots report.
  } // End of the several-tops branch.

  // Pass 3: now every parent link is final, fill in each manager's list of direct reports.
  for (const person of byId.values()) { // Go through everyone once.
    if (person.parent !== null) person.parent.children.push(person) // Add this person to their boss's children list.
  } // End of pass 3.
  for (const person of byId.values()) person.isLeaf = person.children.length === 0 // Nobody reports to you = leaf (individual contributor).

  return { root, byId, issues } // Hand back the top node, the lookup and the problem list.
} // End of buildTree.
