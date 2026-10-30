<!-- SpanOfControl.vue: how many direct reports managers have (bucketed), plus a sortable table of managers with only 1-2 reports. -->
<script setup>
import { computed, ref } from 'vue' // Derived values + table state.
import { scaleLinear } from 'd3-scale' // Counts -> pixel heights.
import { formatMoney, formatCount } from '../../data/format.js' // Labels.
import { MGMT_COLOUR } from './chartColors.js' // Single series colour.
import { useOrg } from '../../composables/useOrg.js' // To jump to the org chart.

const props = defineProps({ people: { type: Array, required: true } }) // Everyone in the current filter.
const { setTab, revealPerson, select } = useOrg() // Actions for "View in org chart".
const BUCKETS = [{ label: '1', min: 1, max: 1 }, { label: '2', min: 2, max: 2 }, { label: '3–5', min: 3, max: 5 }, { label: '6–10', min: 6, max: 10 }, { label: '11+', min: 11, max: Infinity }] // Team-size groups from the brief.
const WIDTH = 640 // Drawing width.
const HEIGHT = 200 // Drawing height.

const managers = computed(() => props.people.filter((p) => !p.isLeaf)) // Only people with reports.
const bars = computed(() => BUCKETS.map((b) => ({ ...b, count: managers.value.filter((m) => m.children.length >= b.min && m.children.length <= b.max).length }))) // How many managers fall in each group.
const y = computed(() => scaleLinear().domain([0, Math.max(...bars.value.map((b) => b.count), 1)]).range([0, HEIGHT - 40])) // Count -> bar height.
const narrow = computed(() => managers.value.filter((m) => m.children.length <= 2)) // Managers with only 1-2 reports.
const busiest = computed(() => bars.value.reduce((best, b) => (b.count > best.count ? b : best))) // The group holding the most managers, e.g. "3–5".
const title = computed(() => `${formatCount(busiest.value.count)} of ${formatCount(managers.value.length)} managers have ${busiest.value.label} direct reports`) // The finding: the normal team size.

const sortKey = ref('totalCost') // Which column the table is sorted by.
const sortDesc = ref(true) // Biggest first?
const limit = ref(10) // How many rows to show (the list can be thousands long).
const COLUMNS = [{ key: 'name', label: 'Manager' }, { key: 'department', label: 'Department' }, { key: 'reports', label: 'Reports' }, { key: 'totalCost', label: 'Team cost' }] // Table columns.
const sorted = computed(() => { // The table rows, sorted.
  const value = (m) => (sortKey.value === 'reports' ? m.children.length : m[sortKey.value]) // What to compare for the chosen column.
  return [...narrow.value].sort((a, b) => { // Copy, then sort (never sort the shared data in place).
    const A = value(a), B = value(b) // The two values.
    const order = typeof A === 'string' ? A.localeCompare(B) : A - B // Text A-Z, numbers small-big.
    return sortDesc.value ? -order : order // Flip for descending.
  }) // End of sort.
}) // End of sorted.

/**
 * Click a column header: sort by it, or flip direction if it's already the sort column.
 * @param {string} key - The column.
 */
function sortBy(key) { // Table header click.
  if (sortKey.value === key) sortDesc.value = !sortDesc.value // Same column: flip.
  else { sortKey.value = key; sortDesc.value = key === 'totalCost' || key === 'reports' } // New column: numbers start big-first, text A-Z.
} // End of sortBy.

/**
 * Jump to a manager on the org chart tab.
 * @param {string} id - The manager.
 */
function viewInOrg(id) { // "View in org chart" link.
  revealPerson(id) // Open the path and glow (the canvas pans when it appears).
  select(id) // Open their details.
  setTab('org') // Switch tabs.
} // End of viewInOrg.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the chart + table show. -->
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"> <!-- Chart card. -->
    <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2> <!-- Finding as a sentence. -->
    <p class="mt-1 text-xs text-slate-500">Managers grouped by number of direct reports</p> <!-- Single series: the subtitle names it, no legend needed. -->
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="mt-3 w-full max-w-2xl" role="img" :aria-label="title"> <!-- Vertical bars. -->
      <g v-for="(bar, i) in bars" :key="bar.label" :transform="`translate(${40 + i * ((WIDTH - 60) / BUCKETS.length)}, 0)`"> <!-- One bar column. -->
        <rect :x="8" :y="HEIGHT - 24 - y(bar.count)" :width="(WIDTH - 60) / BUCKETS.length - 16" :height="y(bar.count)" rx="4" :fill="MGMT_COLOUR"><title>{{ bar.label }} reports: {{ formatCount(bar.count) }} managers</title></rect> <!-- Bar grows up from the baseline; hover shows the count. -->
        <text :x="(WIDTH - 60) / BUCKETS.length / 2" :y="HEIGHT - 30 - y(bar.count)" text-anchor="middle" class="fill-slate-600 text-[12px]">{{ formatCount(bar.count) }}</text> <!-- Count above the bar. -->
        <text :x="(WIDTH - 60) / BUCKETS.length / 2" :y="HEIGHT - 6" text-anchor="middle" class="fill-slate-500 text-[12px]">{{ bar.label }}</text> <!-- Group label under the bar. -->
      </g> <!-- End of column. -->
    </svg> <!-- End of chart. -->

    <div class="mt-4 overflow-x-auto"> <!-- Table scrolls sideways on phones. -->
      <table class="w-full text-left text-sm"> <!-- Managers with 1-2 reports: candidates for merging teams. -->
        <thead class="border-b border-slate-200 text-xs text-slate-500"> <!-- Headers. -->
          <tr> <!-- Header row. -->
            <th v-for="col in COLUMNS" :key="col.key" class="py-2 pr-4 font-medium"> <!-- One header cell. -->
              <button type="button" class="hover:text-slate-900" :aria-sort="sortKey === col.key ? (sortDesc ? 'descending' : 'ascending') : 'none'" @click="sortBy(col.key)">{{ col.label }}{{ sortKey === col.key ? (sortDesc ? ' ↓' : ' ↑') : '' }}</button> <!-- Click to sort; arrow shows direction. -->
            </th> <!-- End of header cell. -->
            <th class="py-2"></th> <!-- Empty header for the link column. -->
          </tr> <!-- End of header row. -->
        </thead> <!-- End of headers. -->
        <tbody class="divide-y divide-slate-100"> <!-- Rows. -->
          <tr v-for="m in sorted.slice(0, limit)" :key="m.id"> <!-- One manager. -->
            <td class="py-2 pr-4"><span class="font-medium text-slate-900">{{ m.name }}</span><span class="block text-xs text-slate-500">{{ m.title }}</span></td> <!-- Name + title. -->
            <td class="py-2 pr-4 text-slate-600">{{ m.department }}</td> <!-- Department. -->
            <td class="py-2 pr-4 text-slate-600">{{ m.children.length }}</td> <!-- Direct reports. -->
            <td class="py-2 pr-4 text-slate-900">{{ formatMoney(m.totalCost) }}</td> <!-- Cost of everyone below them. -->
            <td class="py-2 text-right"><button type="button" class="whitespace-nowrap text-indigo-700 hover:underline" @click="viewInOrg(m.id)">View in org chart</button></td> <!-- Jump to them. -->
          </tr> <!-- End of row. -->
        </tbody> <!-- End of rows. -->
      </table> <!-- End of table. -->
      <button v-if="sorted.length > limit" type="button" class="mt-3 text-sm text-indigo-700 hover:underline" @click="limit += 25">Show 25 more ({{ formatCount(sorted.length - limit) }} remaining)</button> <!-- Paging, so thousands of rows never render at once. -->
    </div> <!-- End of table area. -->
  </section> <!-- End of chart card. -->
</template> <!-- End of what the chart + table show. -->
