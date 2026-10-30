// Deterministic department colours from a fixed 10-colour palette.

const PALETTE = [
  { pill: 'bg-sky-100 text-sky-800', tint: 'bg-sky-50', avatar: 'bg-sky-600', fill: 'fill-sky-600' },
  { pill: 'bg-emerald-100 text-emerald-800', tint: 'bg-emerald-50', avatar: 'bg-emerald-600', fill: 'fill-emerald-600' },
  { pill: 'bg-amber-100 text-amber-800', tint: 'bg-amber-50', avatar: 'bg-amber-600', fill: 'fill-amber-600' },
  { pill: 'bg-rose-100 text-rose-800', tint: 'bg-rose-50', avatar: 'bg-rose-600', fill: 'fill-rose-600' },
  { pill: 'bg-violet-100 text-violet-800', tint: 'bg-violet-50', avatar: 'bg-violet-600', fill: 'fill-violet-600' },
  { pill: 'bg-teal-100 text-teal-800', tint: 'bg-teal-50', avatar: 'bg-teal-600', fill: 'fill-teal-600' },
  { pill: 'bg-orange-100 text-orange-800', tint: 'bg-orange-50', avatar: 'bg-orange-600', fill: 'fill-orange-600' },
  { pill: 'bg-indigo-100 text-indigo-800', tint: 'bg-indigo-50', avatar: 'bg-indigo-600', fill: 'fill-indigo-600' },
  { pill: 'bg-lime-100 text-lime-800', tint: 'bg-lime-50', avatar: 'bg-lime-700', fill: 'fill-lime-700' },
  { pill: 'bg-fuchsia-100 text-fuchsia-800', tint: 'bg-fuchsia-50', avatar: 'bg-fuchsia-600', fill: 'fill-fuchsia-600' },
]
// Full class names are written out so Tailwind's scanner can find them.
const NEUTRAL = { pill: 'bg-slate-100 text-slate-700', tint: 'bg-white', avatar: 'bg-slate-500', fill: 'fill-slate-500' }

let colourByDepartment = new Map()

/**
 * Assign colours to departments: sort the names, then hand out palette colours in order.
 * Sorting makes it deterministic; handing out in order means no two departments collide (hashing would).
 * @param {string[]} departments - Every department name in the file (duplicates are fine).
 */
export function assignDepartmentColors(departments) {
  const names = [...new Set(departments.filter((name) => name !== ''))].sort()
  colourByDepartment = new Map(names.map((name, index) => [name, PALETTE[index % PALETTE.length]]))
}

/** Tailwind classes for a department; neutral for blanks and placeholders. */
export function departmentColor(department) {
  return colourByDepartment.get(department) ?? NEUTRAL
}
