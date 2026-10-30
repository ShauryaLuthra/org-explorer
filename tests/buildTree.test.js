// Checks the tree is linked correctly and that every kind of messy data is handled and reported.

import { describe, it, expect } from 'vitest'
import { buildTree, UNASSIGNED_ID, COMPANY_ROOT_ID } from '../src/data/buildTree.js'
import { row } from './helpers.js'

const issueTypes = (result) => result.issues.map((issue) => issue.type)

describe('buildTree', () => {
  it('links the worked example A > B, C; B > D, E', () => {
    const { root, byId } = buildTree([row('A', '', '300'), row('B', 'A', '200'), row('C', 'A', '100'), row('D', 'B', '90'), row('E', 'B', '80')])
    expect(root.id).toBe('A')
    expect(byId.get('D').parent.id).toBe('B')
    expect(byId.get('B').children.map((p) => p.id)).toEqual(['D', 'E'])
    expect(byId.get('C').isLeaf).toBe(true)
  })

  it('moves a person with a missing manager under Unassigned', () => {
    const result = buildTree([row('A', '', '1'), row('B', 'ZZZ', '1')])
    expect(result.byId.get('B').parent.id).toBe(UNASSIGNED_ID)
    expect(issueTypes(result)).toContain('missing-manager')
  })

  it('puts two top people under one Giga Corp root', () => {
    const result = buildTree([row('A', '', '1'), row('B', '', '1')])
    expect(result.root.id).toBe(COMPANY_ROOT_ID)
    expect(result.root.children.length).toBe(2)
    expect(issueTypes(result)).toContain('multiple-roots')
  })

  it('breaks a reporting loop', () => {
    const result = buildTree([row('A', '', '1'), row('X', 'Y', '1'), row('Y', 'X', '1')])
    expect(issueTypes(result)).toContain('cycle')
    expect(result.byId.get('X').parent.id === UNASSIGNED_ID || result.byId.get('Y').parent.id === UNASSIGNED_ID).toBe(true)
  })

  it('turns blank or junk salaries into 0 and cleans "$1,200"', () => {
    const result = buildTree([row('A', '', ''), row('B', 'A', 'abc'), row('C', 'A', '$1,200')])
    expect(result.byId.get('A').salary).toBe(0)
    expect(result.byId.get('B').salary).toBe(0)
    expect(result.byId.get('C').salary).toBe(1200)
    expect(issueTypes(result).filter((type) => type === 'invalid-salary').length).toBe(2)
  })

  it('keeps the first row when an ID is duplicated', () => {
    const result = buildTree([row('A', '', '1'), row('B', 'A', '5'), row('B', 'A', '9')])
    expect(result.byId.get('B').salary).toBe(5)
    expect(issueTypes(result)).toContain('duplicate-id')
  })
})
