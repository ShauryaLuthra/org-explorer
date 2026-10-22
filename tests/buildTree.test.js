// buildTree.test.js: checks the tree is linked correctly and that every kind of messy data is handled and reported.

import { describe, it, expect } from 'vitest' // Vitest's test tools: describe = a group, it = one test, expect = a check.
import { buildTree, UNASSIGNED_ID, COMPANY_ROOT_ID } from '../src/data/buildTree.js' // The code under test, plus the placeholder IDs.
import { row } from './helpers.js' // Fake-row maker shared by both test files.

const issueTypes = (result) => result.issues.map((issue) => issue.type) // Helper: just the problem types, e.g. ['cycle'].

describe('buildTree', () => { // Group of tests for buildTree.
  it('links the worked example A > B, C; B > D, E', () => { // The brief's example.
    const { root, byId } = buildTree([row('A', '', '300'), row('B', 'A', '200'), row('C', 'A', '100'), row('D', 'B', '90'), row('E', 'B', '80')]) // Build it.
    expect(root.id).toBe('A') // A is the top.
    expect(byId.get('D').parent.id).toBe('B') // D points up to B.
    expect(byId.get('B').children.map((p) => p.id)).toEqual(['D', 'E']) // B points down to D and E.
    expect(byId.get('C').isLeaf).toBe(true) // C has no reports.
  }) // End of test.

  it('moves a person with a missing manager under Unassigned', () => { // Edge case 1.
    const result = buildTree([row('A', '', '1'), row('B', 'ZZZ', '1')]) // B's boss doesn't exist.
    expect(result.byId.get('B').parent.id).toBe(UNASSIGNED_ID) // B is parked under Unassigned.
    expect(issueTypes(result)).toContain('missing-manager') // And it's reported.
  }) // End of test.

  it('puts two top people under one Giga Corp root', () => { // Edge case 2.
    const result = buildTree([row('A', '', '1'), row('B', '', '1')]) // Two people with no boss.
    expect(result.root.id).toBe(COMPANY_ROOT_ID) // A placeholder root sits above them.
    expect(result.root.children.length).toBe(2) // Both are under it.
    expect(issueTypes(result)).toContain('multiple-roots') // And it's reported.
  }) // End of test.

  it('breaks a reporting loop', () => { // Edge case 3.
    const result = buildTree([row('A', '', '1'), row('X', 'Y', '1'), row('Y', 'X', '1')]) // X and Y report to each other.
    expect(issueTypes(result)).toContain('cycle') // The loop is reported.
    expect(result.byId.get('X').parent.id === UNASSIGNED_ID || result.byId.get('Y').parent.id === UNASSIGNED_ID).toBe(true) // One of them was cut free and parked.
  }) // End of test.

  it('turns blank or junk salaries into 0 and cleans "$1,200"', () => { // Edge case 4.
    const result = buildTree([row('A', '', ''), row('B', 'A', 'abc'), row('C', 'A', '$1,200')]) // Blank, junk, formatted.
    expect(result.byId.get('A').salary).toBe(0) // Blank -> 0.
    expect(result.byId.get('B').salary).toBe(0) // Junk -> 0.
    expect(result.byId.get('C').salary).toBe(1200) // "$1,200" -> 1200.
    expect(issueTypes(result).filter((type) => type === 'invalid-salary').length).toBe(2) // Both bad ones reported.
  }) // End of test.

  it('keeps the first row when an ID is duplicated', () => { // Edge case 5.
    const result = buildTree([row('A', '', '1'), row('B', 'A', '5'), row('B', 'A', '9')]) // B appears twice.
    expect(result.byId.get('B').salary).toBe(5) // The first B was kept.
    expect(issueTypes(result)).toContain('duplicate-id') // And it's reported.
  }) // End of test.
}) // End of the buildTree group.
