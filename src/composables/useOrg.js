// Shared app state: loads the CSV, builds and aggregates the tree, and holds the small UI state every view
// uses.

import { shallowRef, ref, reactive, markRaw } from 'vue'
import { fetchBundledCsv, parseCsv } from '../data/loadCsv.js'
import { buildTree } from '../data/buildTree.js'
import { aggregate } from '../data/aggregate.js'
import { assignDepartmentColors } from '../data/departmentColors.js'

// Wide teams are paged so a manager with hundreds of reports never mounts hundreds of cards at once.
const FIRST_CHILDREN = 12
const MORE_CHILDREN = 24

// The 40k-person tree is a shallowRef of markRaw objects so Vue doesn't deep-track it. Only the small UI
// state below is reactive.
const org = shallowRef(null)
const status = ref('idle')
const errorMessage = ref('')
const timings = ref(null)
const expanded = reactive(new Set())
const visibleCounts = reactive(new Map())
const selectedId = ref(null)
const highlightedId = ref(null)
const searchText = ref('')
const departmentFilter = ref('')
const activeTab = ref(readTab())

// The active tab lives in the URL hash, so links and back/forward work.
window.addEventListener('hashchange', () => { activeTab.value = readTab() })

function readTab() {
  return window.location.hash === '#cost' ? 'cost' : 'org'
}

/**
 * Run parse -> build -> aggregate on CSV text and store the result, timing each stage.
 * @param {() => Promise<string>} getText - Produces the CSV text (bundled download or uploaded file).
 */
async function load(getText) {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    const t0 = performance.now()
    const text = await getText()
    const t1 = performance.now()
    const { rows, errors } = parseCsv(text)
    const t2 = performance.now()
    const { root, byId, issues } = buildTree(rows)
    const t3 = performance.now()
    const order = aggregate(root)
    const t4 = performance.now()
    for (const person of order) markRaw(person)
    assignDepartmentColors(order.map((p) => p.department))
    // Lower-cased once at load, so each search is a plain substring scan.
    const searchTexts = order.map((p) => `${p.name} ${p.title}`.toLowerCase())
    org.value = { root, byId, order, issues, parseErrors: errors, searchTexts }
    timings.value = { read: t1 - t0, parse: t2 - t1, build: t3 - t2, aggregate: t4 - t3, total: t4 - t0 }
    console.info('[Org Explorer] timings (ms):', timings.value)
    resetView()
    status.value = 'ready'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error.message
  }
}

/** Back to the starting view: only the root expanded, nothing selected. */
function resetView() {
  expanded.clear()
  visibleCounts.clear()
  if (org.value) expanded.add(org.value.root.id)
  selectedId.value = null
}

function toggle(id) {
  if (expanded.has(id)) expanded.delete(id)
  else expanded.add(id)
}

function visibleCount(id) {
  return visibleCounts.get(id) ?? FIRST_CHILDREN
}

function showMore(id) {
  visibleCounts.set(id, visibleCount(id) + MORE_CHILDREN)
}

/**
 * Expand every manager above a person, O(depth), paging wide teams far enough to include them.
 * @param {string} id - The person to reveal.
 */
function expandPathTo(id) {
  let child = org.value.byId.get(id)
  if (!child) return
  let boss = child.parent
  while (boss !== null) {
    expanded.add(boss.id)
    const position = boss.children.indexOf(child)
    if (position >= visibleCount(boss.id)) visibleCounts.set(boss.id, position + 1)
    child = boss
    boss = boss.parent
  }
}

function revealPerson(id) {
  expandPathTo(id)
  highlightedId.value = id
  // Only clear the glow if a newer search hasn't taken it over.
  setTimeout(() => { if (highlightedId.value === id) highlightedId.value = null }, 2000)
}

/**
 * The first 10 people whose name or title contains the query (case-insensitive).
 * `order` is top-down, so more senior matches come first.
 * @param {string} query - What the user typed.
 * @returns {Object[]} Up to 10 people.
 */
function search(query) {
  const needle = query.trim().toLowerCase()
  if (needle === '' || !org.value) return []
  const { order, searchTexts } = org.value
  const results = []
  for (let i = 0; i < order.length && results.length < 10; i++) {
    if (searchTexts[i].includes(needle)) results.push(order[i])
  }
  return results
}

function setTab(tab) {
  window.location.hash = tab === 'cost' ? '#cost' : '#org'
}

/**
 * Shared org state and actions. State lives at module level, so every component gets the same instance.
 * @returns {Object} State (refs) and actions (functions).
 */
export function useOrg() {
  return {
    org, status, errorMessage, timings, expanded, selectedId, highlightedId, searchText, departmentFilter, activeTab,
    loadBundled: () => load(fetchBundledCsv),
    loadFile: (file) => load(() => file.text()),
    toggle, visibleCount, showMore, expandPathTo, revealPerson, search, setTab,
    select: (id) => { selectedId.value = id },
    collapseAll: resetView,
  }
}
