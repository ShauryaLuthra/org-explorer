// departmentColors.js: gives every department a fixed colour from a 10-colour palette, with no two departments sharing one (up to 10).

// Full Tailwind class names written out in full, so Tailwind's scanner finds them and generates their CSS.
const PALETTE = [ // pill = department label, tint = card background, avatar = initials circle.
  { pill: 'bg-sky-100 text-sky-800', tint: 'bg-sky-50', avatar: 'bg-sky-600' }, // 1. Sky blue.
  { pill: 'bg-emerald-100 text-emerald-800', tint: 'bg-emerald-50', avatar: 'bg-emerald-600' }, // 2. Green.
  { pill: 'bg-amber-100 text-amber-800', tint: 'bg-amber-50', avatar: 'bg-amber-600' }, // 3. Amber.
  { pill: 'bg-rose-100 text-rose-800', tint: 'bg-rose-50', avatar: 'bg-rose-600' }, // 4. Rose.
  { pill: 'bg-violet-100 text-violet-800', tint: 'bg-violet-50', avatar: 'bg-violet-600' }, // 5. Violet.
  { pill: 'bg-teal-100 text-teal-800', tint: 'bg-teal-50', avatar: 'bg-teal-600' }, // 6. Teal.
  { pill: 'bg-orange-100 text-orange-800', tint: 'bg-orange-50', avatar: 'bg-orange-600' }, // 7. Orange.
  { pill: 'bg-indigo-100 text-indigo-800', tint: 'bg-indigo-50', avatar: 'bg-indigo-600' }, // 8. Indigo.
  { pill: 'bg-lime-100 text-lime-800', tint: 'bg-lime-50', avatar: 'bg-lime-700' }, // 9. Lime.
  { pill: 'bg-fuchsia-100 text-fuchsia-800', tint: 'bg-fuchsia-50', avatar: 'bg-fuchsia-600' }, // 10. Fuchsia.
] // End of palette.
const NEUTRAL = { pill: 'bg-slate-100 text-slate-700', tint: 'bg-white', avatar: 'bg-slate-500' } // For placeholders and blank departments.

let colourByDepartment = new Map() // Department name -> palette entry. Filled once per loaded file.

/**
 * Assign colours to departments: sort the names, then hand out palette colours in order.
 * Sorting makes it deterministic; handing out in order means no two departments collide (hashing would).
 * @param {string[]} departments - Every department name in the file (duplicates are fine).
 */
export function assignDepartmentColors(departments) { // Called once by useOrg after each load.
  const names = [...new Set(departments.filter((name) => name !== ''))].sort() // Unique, non-blank, A-Z.
  colourByDepartment = new Map(names.map((name, index) => [name, PALETTE[index % PALETTE.length]])) // 1st name -> colour 1, 2nd -> colour 2... wraps after 10.
} // End of assignDepartmentColors.

/**
 * The colour classes for one department.
 * @param {string} department - Department name.
 * @returns {{pill: string, tint: string, avatar: string}} Tailwind classes.
 */
export function departmentColor(department) { // Called by every card.
  return colourByDepartment.get(department) ?? NEUTRAL // Unknown or blank department: neutral grey.
} // End of departmentColor.
