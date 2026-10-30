// Fills in every person's counts and costs in one bottom-up sweep, with no recursion.

/**
 * Compute desc, nonLeafDesc, mgmtCost, icCost, totalCost, ratio, headcountRatio and depth for every person.
 * O(n) time and O(n) memory; children lists are then sorted once (biggest teams first).
 * @param {Object} root - The top of the tree from buildTree.
 * @returns {Object[]} Everyone in top-down (breadth-first) order, reused later by the cost charts.
 */
export function aggregate(root) {
  // Breadth-first walk with an index pointer (Array.shift is O(n)), so every parent lands in `order` first.
  const order = [root]
  root.depth = 0
  for (let i = 0; i < order.length; i++) {
    const person = order[i]
    resetTotals(person)
    for (const child of person.children) {
      child.depth = person.depth + 1
      order.push(child)
    }
  }

  // Walk backwards so each child is final before its parent: a post-order pass without recursion, which could
  // overflow the stack on deep trees.
  for (let i = order.length - 1; i > 0; i--) {
    const person = order[i]
    const parent = person.parent
    const counts = person.synthetic ? 0 : 1 // Placeholders aren't people.
    const isManager = !person.isLeaf
    parent.desc += counts + person.desc
    parent.nonLeafDesc += (isManager ? counts : 0) + person.nonLeafDesc
    parent.mgmtCost += (isManager ? person.salary : 0) + person.mgmtCost
    parent.icCost += (isManager ? 0 : person.salary) + person.icCost
  }

  for (const person of order) {
    computeRatios(person)
    // Sort once here so rendering never has to: biggest teams first, ties by name.
    person.children.sort((a, b) => b.desc - a.desc || a.name.localeCompare(b.name))
  }
  return order
}

// Zeroing first makes aggregate() safe to run again on the same tree.
function resetTotals(person) {
  person.desc = 0
  person.nonLeafDesc = 0
  person.mgmtCost = 0
  person.icCost = 0
}

// Ratios are null when the denominator is 0; the UI shows "–" rather than Infinity or NaN.
function computeRatios(person) {
  person.totalCost = person.mgmtCost + person.icCost
  person.ratio = person.icCost > 0 ? person.mgmtCost / person.icCost : null
  const icCount = person.desc - person.nonLeafDesc
  person.headcountRatio = icCount > 0 ? person.nonLeafDesc / icCount : null
}

/**
 * Change one person's salary and update only the people above them: O(depth), not O(n).
 * @param {Object} person - Whose salary changes.
 * @param {number} newSalary - The new salary.
 */
export function updateSalary(person, newSalary) {
  const change = newSalary - person.salary
  person.salary = newSalary
  let boss = person.parent
  while (boss !== null) {
    if (person.isLeaf) boss.icCost += change
    else boss.mgmtCost += change
    computeRatios(boss)
    boss = boss.parent
  }
}
