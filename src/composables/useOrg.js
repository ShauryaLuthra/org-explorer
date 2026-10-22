// useOrg.js: the app's one shared "memory". Loads the CSV, builds and aggregates the tree, and holds the small UI state every screen shares.

import { shallowRef, ref, reactive, markRaw } from 'vue' // Vue's tools for values the screen should react to (explained in the chat).
import { fetchBundledCsv, parseCsv } from '../data/loadCsv.js' // Get + parse the CSV.
import { buildTree } from '../data/buildTree.js' // Rows -> tree.
import { aggregate } from '../data/aggregate.js' // Tree -> counts and costs.

const FIRST_CHILDREN = 12 // How many reports a card shows before "Show more" (wide teams have up to 78).
const MORE_CHILDREN = 24 // How many more each "Show more" click reveals.

// Shared state. Created ONCE, outside the function, so every component that calls useOrg() sees the same values.
const org = shallowRef(null) // The big data: { root, byId, order, issues, parseErrors, searchTexts }. shallowRef = Vue only notices when we swap the whole thing.
const status = ref('idle') // 'idle' | 'loading' | 'ready' | 'error', so the screen can show a spinner or an error.
const errorMessage = ref('') // What went wrong, if status is 'error'.
const timings = ref(null) // How long each stage took, in milliseconds, for the footer.
const expanded = reactive(new Set()) // IDs of people whose reports are showing. A Set: "is this ID open?" is O(1).
const visibleCounts = reactive(new Map()) // ID -> how many of their reports are rendered (only for people where "Show more" was used).
const selectedId = ref(null) // Whose details are open in the side drawer (null = drawer closed).
const highlightedId = ref(null) // Whose card glows for 2 seconds after a search.
const searchText = ref('') // What's typed in the search box.
const departmentFilter = ref('') // Department chosen on the cost view ('' = all).
const activeTab = ref(readTab()) // 'org' or 'cost', read from the URL hash (#org / #cost).

window.addEventListener('hashchange', () => { activeTab.value = readTab() }) // Back/forward buttons or a typed URL switch the tab too.

/**
 * Which tab the URL asks for.
 * @returns {'org'|'cost'} The tab name.
 */
function readTab() { // Reads the part of the URL after "#".
  return window.location.hash === '#cost' ? 'cost' : 'org' // Anything other than #cost means the org chart.
} // End of readTab.

/**
 * Run the whole pipeline on some CSV text and store the result. Times every stage.
 * @param {() => Promise<string>} getText - A function that produces the CSV text (download or uploaded file).
 */
async function load(getText) { // Shared by the bundled file and Upload CSV, so both behave identically.
  status.value = 'loading' // Tell the screen we're busy.
  errorMessage.value = '' // Clear any old error.
  try { // Anything below that throws jumps to "catch".
    const t0 = performance.now() // High-precision clock, in milliseconds.
    const text = await getText() // 1. Get the text.
    const t1 = performance.now() // Time after reading.
    const { rows, errors } = parseCsv(text) // 2. Text -> rows.
    const t2 = performance.now() // Time after parsing.
    const { root, byId, issues } = buildTree(rows) // 3. Rows -> tree.
    const t3 = performance.now() // Time after building.
    const order = aggregate(root) // 4. Tree -> numbers.
    const t4 = performance.now() // Time after aggregating.
    for (const person of order) markRaw(person) // Tell Vue never to watch inside these 40k objects: saves lots of memory and time.
    const searchTexts = order.map((p) => `${p.name} ${p.title}`.toLowerCase()) // Lower-cased once, so each search is a quick text check.
    org.value = { root, byId, order, issues, parseErrors: errors, searchTexts } // Swap in the new data in one go; the screen redraws once.
    timings.value = { read: t1 - t0, parse: t2 - t1, build: t3 - t2, aggregate: t4 - t3, total: t4 - t0 } // Store the stage times.
    console.info('[Org Explorer] timings (ms):', timings.value) // The brief asks for a console breakdown.
    resetView() // Start from the initial view: CEO open, their reports showing.
    status.value = 'ready' // Done.
  } catch (error) { // A missing column, a failed download, an empty file...
    status.value = 'error' // Tell the screen.
    errorMessage.value = error.message // Show the human-readable reason.
  } // End of try/catch.
} // End of load.

/** Back to the starting view: only the root expanded, nothing selected. */
function resetView() { // Used after loading and by "Collapse all".
  expanded.clear() // Close everything...
  visibleCounts.clear() // ...forget every "Show more"...
  if (org.value) expanded.add(org.value.root.id) // ...then open just the root, so its direct reports show (collapsed).
  selectedId.value = null // Close the drawer.
} // End of resetView.

/**
 * Open or close one person's reports.
 * @param {string} id - Whose card was clicked.
 */
function toggle(id) { // Called by the chevron button.
  if (expanded.has(id)) expanded.delete(id) // Open -> close.
  else expanded.add(id) // Closed -> open.
} // End of toggle.

/**
 * How many of this person's reports to render.
 * @param {string} id - The manager.
 * @returns {number} The count.
 */
function visibleCount(id) { // Used by the card that lists children.
  return visibleCounts.get(id) ?? FIRST_CHILDREN // 12 unless "Show more" (or a search) raised it.
} // End of visibleCount.

/**
 * Reveal 24 more of this person's reports.
 * @param {string} id - The manager.
 */
function showMore(id) { // Called by the "Show 24 more" card.
  visibleCounts.set(id, visibleCount(id) + MORE_CHILDREN) // Raise this manager's limit.
} // End of showMore.

/**
 * Open every manager above a person so their card becomes visible. O(depth).
 * @param {string} id - The person to reveal.
 */
function expandPathTo(id) { // Used by search and by the drawer's reporting chain.
  let child = org.value.byId.get(id) // Start at the person (O(1) lookup).
  if (!child) return // Unknown ID: nothing to do.
  let boss = child.parent // Their manager.
  while (boss !== null) { // Climb to the top, one manager at a time.
    expanded.add(boss.id) // Open this manager so the level below shows.
    const position = boss.children.indexOf(child) // Where the person on our path sits in this manager's team.
    if (position >= visibleCount(boss.id)) visibleCounts.set(boss.id, position + 1) // If hidden behind "Show more", render up to them.
    child = boss // Step up:
    boss = boss.parent // one level.
  } // End of the climb.
} // End of expandPathTo.

/**
 * Open the path to a person and make their card glow for 2 seconds.
 * @param {string} id - The person to reveal.
 */
function revealPerson(id) { // Called when a search result is chosen.
  expandPathTo(id) // Make sure their card exists on screen.
  highlightedId.value = id // Start the glow (the canvas also pans to this card).
  setTimeout(() => { if (highlightedId.value === id) highlightedId.value = null }, 2000) // Stop the glow after 2 s, unless another search replaced it.
} // End of revealPerson.

/**
 * The first 10 people whose name or title contains the query (case-insensitive).
 * @param {string} query - What the user typed.
 * @returns {Object[]} Up to 10 people, most senior first (order is top-down).
 */
function search(query) { // Called by the search box (after a 150 ms pause in typing).
  const needle = query.trim().toLowerCase() // Normalise: no outer spaces, lower case.
  if (needle === '' || !org.value) return [] // Nothing typed or nothing loaded.
  const { order, searchTexts } = org.value // The people and their pre-lowered text, in the same order.
  const results = [] // Matches found so far.
  for (let i = 0; i < order.length && results.length < 10; i++) { // Stop as soon as we have 10.
    if (searchTexts[i].includes(needle)) results.push(order[i]) // Text contains the query: a match.
  } // End of the scan.
  return results // Hand back the matches.
} // End of search.

/**
 * Switch tab and record it in the URL.
 * @param {'org'|'cost'} tab - The tab to show.
 */
function setTab(tab) { // Called by the header tabs.
  window.location.hash = tab === 'cost' ? '#cost' : '#org' // Changing the hash fires "hashchange", which updates activeTab.
} // End of setTab.

/**
 * Access the shared org state and actions from any component.
 * @returns {Object} State (refs) and actions (functions).
 */
export function useOrg() { // Every component calls this; they all get the same shared state above.
  return { // Hand out the state and the actions.
    org, status, errorMessage, timings, expanded, selectedId, highlightedId, searchText, departmentFilter, activeTab, // State.
    loadBundled: () => load(fetchBundledCsv), // Load the CSV that ships with the app.
    loadFile: (file) => load(() => file.text()), // Load a user-chosen file (Upload CSV) through the same pipeline.
    toggle, visibleCount, showMore, expandPathTo, revealPerson, search, setTab, // Actions.
    collapseAll: resetView, // "Collapse all" = back to the starting view.
  } // End of the returned object.
} // End of useOrg.
