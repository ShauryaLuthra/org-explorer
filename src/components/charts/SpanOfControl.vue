<!-- Span of control: managers bucketed by direct reports, plus a sortable table of managers with only 1–2 reports. -->
<script setup>
import { computed, ref } from 'vue'
import { scaleLinear } from 'd3-scale'
import { formatMoney, formatCount } from '../../data/format.js'
import { MGMT_COLOUR } from './chartColors.js'
import { useOrg } from '../../composables/useOrg.js'

const props = defineProps({ people: { type: Array, required: true } })
const { setTab, revealPerson, select } = useOrg()
const BUCKETS = [{ label: '1', min: 1, max: 1 }, { label: '2', min: 2, max: 2 }, { label: '3–5', min: 3, max: 5 }, { label: '6–10', min: 6, max: 10 }, { label: '11+', min: 11, max: Infinity }]
const WIDTH = 640
const HEIGHT = 200

const managers = computed(() => props.people.filter((p) => !p.isLeaf))
const bars = computed(() => BUCKETS.map((b) => ({ ...b, count: managers.value.filter((m) => m.children.length >= b.min && m.children.length <= b.max).length })))
const y = computed(() => scaleLinear().domain([0, Math.max(...bars.value.map((b) => b.count), 1)]).range([0, HEIGHT - 40]))
// Managers with 1–2 reports are the classic restructuring candidates.
const narrow = computed(() => managers.value.filter((m) => m.children.length <= 2))
const busiest = computed(() => bars.value.reduce((best, b) => (b.count > best.count ? b : best)))
const title = computed(() => `${formatCount(busiest.value.count)} of ${formatCount(managers.value.length)} managers have ${busiest.value.label} direct reports`)

const sortKey = ref('totalCost')
const sortDesc = ref(true)
const limit = ref(10)
const COLUMNS = [{ key: 'name', label: 'Manager' }, { key: 'department', label: 'Department' }, { key: 'reports', label: 'Reports' }, { key: 'totalCost', label: 'Team cost' }]
const sorted = computed(() => {
  const value = (m) => (sortKey.value === 'reports' ? m.children.length : m[sortKey.value])
  return [...narrow.value].sort((a, b) => {
    const A = value(a), B = value(b)
    const order = typeof A === 'string' ? A.localeCompare(B) : A - B
    return sortDesc.value ? -order : order
  })
})

// Numbers default to descending; clicking the active column flips direction.
function sortBy(key) {
  if (sortKey.value === key) sortDesc.value = !sortDesc.value
  else { sortKey.value = key; sortDesc.value = key === 'totalCost' || key === 'reports' }
}

function viewInOrg(id) {
  revealPerson(id)
  select(id)
  setTab('org')
}
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2>
    <p class="mt-1 text-xs text-slate-500">Managers grouped by number of direct reports</p>
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="mt-3 w-full max-w-2xl" role="img" :aria-label="title">
      <g v-for="(bar, i) in bars" :key="bar.label" :transform="`translate(${40 + i * ((WIDTH - 60) / BUCKETS.length)}, 0)`">
        <rect :x="8" :y="HEIGHT - 24 - y(bar.count)" :width="(WIDTH - 60) / BUCKETS.length - 16" :height="y(bar.count)" rx="4" :fill="MGMT_COLOUR"><title>{{ bar.label }} reports: {{ formatCount(bar.count) }} managers</title></rect>
        <text :x="(WIDTH - 60) / BUCKETS.length / 2" :y="HEIGHT - 30 - y(bar.count)" text-anchor="middle" class="fill-slate-600 text-[12px]">{{ formatCount(bar.count) }}</text>
        <text :x="(WIDTH - 60) / BUCKETS.length / 2" :y="HEIGHT - 6" text-anchor="middle" class="fill-slate-500 text-[12px]">{{ bar.label }}</text>
      </g>
    </svg>

    <div class="mt-4 overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 text-xs text-slate-500">
          <tr>
            <th v-for="col in COLUMNS" :key="col.key" class="py-2 pr-4 font-medium">
              <button type="button" class="hover:text-slate-900" :aria-sort="sortKey === col.key ? (sortDesc ? 'descending' : 'ascending') : 'none'" @click="sortBy(col.key)">{{ col.label }}{{ sortKey === col.key ? (sortDesc ? ' ↓' : ' ↑') : '' }}</button>
            </th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="m in sorted.slice(0, limit)" :key="m.id">
            <td class="py-2 pr-4"><span class="font-medium text-slate-900">{{ m.name }}</span><span class="block text-xs text-slate-500">{{ m.title }}</span></td>
            <td class="py-2 pr-4 text-slate-600">{{ m.department }}</td>
            <td class="py-2 pr-4 text-slate-600">{{ m.children.length }}</td>
            <td class="py-2 pr-4 text-slate-900">{{ formatMoney(m.totalCost) }}</td>
            <td class="py-2 text-right"><button type="button" class="whitespace-nowrap text-indigo-700 hover:underline" @click="viewInOrg(m.id)">View in org chart</button></td>
          </tr>
        </tbody>
      </table>
      <button v-if="sorted.length > limit" type="button" class="mt-3 text-sm text-indigo-700 hover:underline" @click="limit += 25">Show 25 more ({{ formatCount(sorted.length - limit) }} remaining)</button>
    </div>
  </section>
</template>
