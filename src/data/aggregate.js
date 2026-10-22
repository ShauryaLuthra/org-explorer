// aggregate.js: fills in every person's counts and costs in one bottom-up sweep, with no recursion.

/**
 * Compute desc, nonLeafDesc, mgmtCost, icCost, totalCost, ratio, headcountRatio and depth for every person.
 * O(n) time and O(n) memory; children lists are then sorted once (biggest teams first).
 * @param {Object} root - The top of the tree from buildTree.
 * @returns {Object[]} Everyone in top-down (breadth-first) order, reused later by the cost charts.
 */
export function aggregate(root) { // The main function: call it once after buildTree.
  // Step 1: list everyone top-down, level by level (breadth-first), setting depth on the way.
  const order = [root] // The list we are building. It starts with just the root.
  root.depth = 0 // The root is 0 steps from the top.
  for (let i = 0; i < order.length; i++) { // Walk the list with a pointer i; the list keeps growing as we add children.
    const person = order[i] // The person at the pointer.
    resetTotals(person) // Zero their totals, so running aggregate twice never double-counts.
    for (const child of person.children) { // Each of their direct reports...
      child.depth = person.depth + 1 // ...is one step further from the top...
      order.push(child) // ...and joins the END of the list, so every child comes after its parent.
    } // End of this person's children.
  } // End of step 1: order now holds everyone, every parent before all of its children.

  // Step 2: walk the list BACKWARDS (bottom-up), each person adding their contribution into their parent.
  for (let i = order.length - 1; i > 0; i--) { // From the last person down to index 1 (index 0 is the root: no parent to add into).
    const person = order[i] // By now all of this person's children have already added into them, so their totals are final.
    const parent = person.parent // The boss we add into.
    const counts = person.synthetic ? 0 : 1 // Placeholders like "Unassigned" are not people, so they don't count as descendants.
    const isManager = !person.isLeaf // true if this person has reports of their own.
    parent.desc += counts + person.desc // desc(v) = sum over children c of (1 + desc(c)).
    parent.nonLeafDesc += (isManager ? counts : 0) + person.nonLeafDesc // nonLeafDesc(v) = sum of ([c is a manager] + nonLeafDesc(c)).
    parent.mgmtCost += (isManager ? person.salary : 0) + person.mgmtCost // mgmtCost(v) = sum of ([c is a manager] * salary(c) + mgmtCost(c)).
    parent.icCost += (isManager ? 0 : person.salary) + person.icCost // icCost(v) = sum of ([c is a leaf] * salary(c) + icCost(c)).
  } // End of step 2.

  // Step 3: derived numbers, and sort each team once.
  for (const person of order) { // Everyone once more.
    computeRatios(person) // totalCost, ratio, headcountRatio from the sums above.
    person.children.sort((a, b) => b.desc - a.desc || a.name.localeCompare(b.name)) // Biggest teams first; ties by name A-Z.
  } // End of step 3.
  return order // Hand back the top-down list for later use.
} // End of aggregate.




/**
 * Set a person's sums back to zero before adding them up.
 * @param {Object} person - Anyone in the tree.
 */
function resetTotals(person) { // Called once per person in step 1.
  person.desc = 0 // No descendants counted yet.
  person.nonLeafDesc = 0 // No managers counted yet.
  person.mgmtCost = 0 // No management cost yet.
  person.icCost = 0 // No IC cost yet.
} // End of resetTotals.

/**
 * Work out totalCost, ratio and headcountRatio from a person's sums.
 * @param {Object} person - Anyone whose sums are final.
 */
function computeRatios(person) { // Used by aggregate and by updateSalary.
  person.totalCost = person.mgmtCost + person.icCost // Everyone below them; NOT their own salary.
  person.ratio = person.icCost > 0 ? person.mgmtCost / person.icCost : null // Mgmt cost per $1 of IC cost; null when there's no IC cost (shown as an en dash).
  const icCount = person.desc - person.nonLeafDesc // How many people below them are individual contributors.
  person.headcountRatio = icCount > 0 ? person.nonLeafDesc / icCount : null // Managers per IC below them; null when there are no ICs.
} // End of computeRatios.

/**
 * Change one person's salary and update only the people above them: O(depth), not O(n).
 * @param {Object} person - Whose salary changes.
 * @param {number} newSalary - The new salary.
 */
export function updateSalary(person, newSalary) { // Shows the "per path" optimisation.
  const change = newSalary - person.salary // How much the salary went up (or down, if negative).
  person.salary = newSalary // Store the new salary on the person.
  let boss = person.parent // Start at their manager...
  while (boss !== null) { // ...and climb to the top.
    if (person.isLeaf) boss.icCost += change // An IC's salary is IC cost for every boss above them...
    else boss.mgmtCost += change // ...a manager's salary is management cost for every boss above them.
    computeRatios(boss) // Refresh this boss's totalCost and ratio.
    boss = boss.parent // Step up one level.
  } // End of the climb.
} // End of updateSalary.
