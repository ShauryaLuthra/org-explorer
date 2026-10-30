// Checks every count and cost against the brief's worked example, the real CSV, and a full recompute.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildTree } from '../src/data/buildTree.js'
import { aggregate, updateSalary } from '../src/data/aggregate.js'
import { parseCsv } from '../src/data/loadCsv.js'
import { row } from './helpers.js'

describe('aggregate: worked example', () => {
  const { root, byId } = buildTree([row('A', '', '300'), row('B', 'A', '200'), row('C', 'A', '100'), row('D', 'B', '90'), row('E', 'B', '80')])
  aggregate(root)
  const A = byId.get('A')
  const B = byId.get('B')

  it('computes A', () => {
    expect([A.desc, A.nonLeafDesc, A.mgmtCost, A.icCost, A.totalCost]).toEqual([4, 1, 200, 270, 470])
    expect(A.ratio).toBeCloseTo(200 / 270)
  })

  it('computes B and the leaves', () => {
    expect([B.desc, B.nonLeafDesc, B.mgmtCost, B.icCost]).toEqual([2, 0, 0, 170])
    for (const id of ['C', 'D', 'E']) expect(byId.get(id).desc + byId.get(id).totalCost).toBe(0)
  })
})

describe('aggregate: bundled CSV', () => {
  const { rows } = parseCsv(readFileSync('public/data/giga-corp.csv', 'utf8'))
  const { root, byId } = buildTree(rows)
  const order = aggregate(root)

  it('root counts everyone except itself', () => {
    expect(root.desc).toBe(byId.size - 1)
  })

  it('root total cost = all salaries minus the root\'s own', () => {
    const allSalaries = [...byId.values()].reduce((sum, p) => sum + p.salary, 0)
    // Decimal salaries summed in a different order can differ by ~1e-6, so compare to the cent.
    expect(root.totalCost).toBeCloseTo(allSalaries - root.salary, 2)
  })

  it('every node: totalCost = mgmt + IC, and nonLeafDesc <= desc', () => {
    for (const p of order) {
      expect(p.totalCost).toBe(p.mgmtCost + p.icCost)
      expect(p.nonLeafDesc).toBeLessThanOrEqual(p.desc)
    }
  })

  it('updateSalary gives the same result as a full recompute', () => {
    const manager = order.find((p) => !p.isLeaf && p.depth > 3)
    const leaf = order.find((p) => p.isLeaf && p.depth > 5)
    updateSalary(manager, manager.salary + 5000)
    updateSalary(leaf, 1)
    const fast = order.map((p) => [p.mgmtCost, p.icCost, p.totalCost])
    aggregate(root)
    const full = order.map((p) => [p.mgmtCost, p.icCost, p.totalCost])
    full.forEach((row, i) => row.forEach((value, j) => expect(value).toBeCloseTo(fast[i][j], 2)))
  })
})
