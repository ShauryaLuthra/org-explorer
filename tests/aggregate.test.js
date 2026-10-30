// aggregate.test.js: checks every count and cost against the brief's worked example, the real CSV, and a full recompute.

import { describe, it, expect } from 'vitest' // Vitest's test tools.
import { readFileSync } from 'node:fs' // Node's file reader: tests run in Node, where there's no server to fetch from.
import { buildTree } from '../src/data/buildTree.js' // Builds the tree.
import { aggregate, updateSalary } from '../src/data/aggregate.js' // The code under test.
import { parseCsv } from '../src/data/loadCsv.js' // The same parser the app uses.
import { row } from './helpers.js' // Fake-row maker shared by both test files.

describe('aggregate: worked example', () => { // A(300) > B(200), C(100); B > D(90), E(80).
  const { root, byId } = buildTree([row('A', '', '300'), row('B', 'A', '200'), row('C', 'A', '100'), row('D', 'B', '90'), row('E', 'B', '80')]) // Build it.
  aggregate(root) // Fill in the numbers.
  const A = byId.get('A') // The CEO.
  const B = byId.get('B') // The middle manager.

  it('computes A', () => { // Expected values from the brief.
    expect([A.desc, A.nonLeafDesc, A.mgmtCost, A.icCost, A.totalCost]).toEqual([4, 1, 200, 270, 470]) // All five sums.
    expect(A.ratio).toBeCloseTo(200 / 270) // Decimal division, so "close to" rather than exactly equal.
  }) // End of test.

  it('computes B and the leaves', () => { // B has two IC reports.
    expect([B.desc, B.nonLeafDesc, B.mgmtCost, B.icCost]).toEqual([2, 0, 0, 170]) // B's sums.
    for (const id of ['C', 'D', 'E']) expect(byId.get(id).desc + byId.get(id).totalCost).toBe(0) // Leaves have nothing below them.
  }) // End of test.
}) // End of the worked-example group.

describe('aggregate: bundled CSV', () => { // Works whatever file is at this path (stand-in now, official file later).
  const { rows } = parseCsv(readFileSync('public/data/giga-corp.csv', 'utf8')) // Read and parse the real file.
  const { root, byId } = buildTree(rows) // Build the tree.
  const order = aggregate(root) // Fill in every number.

  it('root counts everyone except itself', () => { // desc excludes self.
    expect(root.desc).toBe(byId.size - 1) // n - 1 (valid when the file has one CEO and no placeholders).
  }) // End of test.

  it('root total cost = all salaries minus the root\'s own', () => { // Total cost excludes own salary.
    const allSalaries = [...byId.values()].reduce((sum, p) => sum + p.salary, 0) // Sum of every cleaned salary.
    expect(root.totalCost).toBeCloseTo(allSalaries - root.salary, 2) // Everyone below the root, equal to the cent (decimal salaries can be off by ~0.000001).
  }) // End of test.

  it('every node: totalCost = mgmt + IC, and nonLeafDesc <= desc', () => { // Invariants that must hold everywhere.
    for (const p of order) { // Every person.
      expect(p.totalCost).toBe(p.mgmtCost + p.icCost) // The two parts add up.
      expect(p.nonLeafDesc).toBeLessThanOrEqual(p.desc) // Managers below can't outnumber everyone below.
    } // End of loop.
  }) // End of test.

  it('updateSalary gives the same result as a full recompute', () => { // Proves the O(depth) shortcut is correct.
    const manager = order.find((p) => !p.isLeaf && p.depth > 3) // A manager deep in the tree.
    const leaf = order.find((p) => p.isLeaf && p.depth > 5) // An IC deep in the tree.
    updateSalary(manager, manager.salary + 5000) // Raise the manager.
    updateSalary(leaf, 1) // Cut the IC's pay.
    const fast = order.map((p) => [p.mgmtCost, p.icCost, p.totalCost]) // Snapshot after the shortcut.
    aggregate(root) // Recompute everything from scratch.
    const full = order.map((p) => [p.mgmtCost, p.icCost, p.totalCost]) // Snapshot after the full recompute.
    full.forEach((row, i) => row.forEach((value, j) => expect(value).toBeCloseTo(fast[i][j], 2))) // Every number must match the shortcut's to the cent.
  }) // End of test.
}) // End of the bundled-CSV group.
