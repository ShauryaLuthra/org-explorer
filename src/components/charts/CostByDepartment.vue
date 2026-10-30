<!-- Management vs IC salary cost per department, biggest first. -->
<script setup>
import { computed } from 'vue'
import { scaleLinear } from 'd3-scale'
import { formatMoney } from '../../data/format.js'
import { MGMT_COLOUR, IC_COLOUR } from './chartColors.js'

const props = defineProps({ people: { type: Array, required: true } })
const WIDTH = 640
const LABEL = 210
const ROW = 30

const rows = computed(() => {
  const byDept = new Map()
  for (const p of props.people) {
    const row = byDept.get(p.department) ?? { name: p.department, mgmt: 0, ic: 0 }
    if (p.isLeaf) row.ic += p.salary
    else row.mgmt += p.salary
    byDept.set(p.department, row)
  }
  return [...byDept.values()].map((r) => ({ ...r, total: r.mgmt + r.ic })).sort((a, b) => b.total - a.total)
})
const grandTotal = computed(() => rows.value.reduce((sum, r) => sum + r.total, 0))
const x = computed(() => scaleLinear().domain([0, rows.value[0]?.total ?? 1]).range([0, WIDTH - LABEL - 70]))
const title = computed(() => {
  const top = rows.value[0]
  if (!top) return 'No people in this view'
  // With one department selected, a share-of-total headline would always say 100%, so show its management
  // share instead.
  if (rows.value.length === 1) return `${top.name}: ${((top.mgmt / top.total) * 100).toFixed(0)}% of its ${formatMoney(top.total)} salary cost goes to managers`
  return `${top.name} carries ${((top.total / grandTotal.value) * 100).toFixed(0)}% of all salary cost (${formatMoney(top.total)})`
})
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2>
    <p class="mt-1 flex gap-4 text-xs text-slate-500">
      <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm" :style="{ background: MGMT_COLOUR }"></span>Management</span>
      <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm" :style="{ background: IC_COLOUR }"></span>Individual contributors</span>
    </p>
    <svg :viewBox="`0 0 ${WIDTH} ${rows.length * ROW + 8}`" class="mt-3 w-full" role="img" :aria-label="title">
      <g v-for="(row, i) in rows" :key="row.name" :transform="`translate(0, ${i * ROW + 4})`">
        <text :x="LABEL - 8" :y="ROW / 2" text-anchor="end" dominant-baseline="middle" class="fill-slate-600 text-[12px]">{{ row.name }}</text>
        <rect :x="LABEL" :y="6" :width="Math.max(x(row.mgmt) - 1, 0)" :height="ROW - 12" rx="3" :fill="MGMT_COLOUR"><title>{{ row.name }} management: {{ formatMoney(row.mgmt) }}</title></rect>
        <rect :x="LABEL + x(row.mgmt) + 1" :y="6" :width="Math.max(x(row.ic) - 1, 0)" :height="ROW - 12" rx="3" :fill="IC_COLOUR"><title>{{ row.name }} IC: {{ formatMoney(row.ic) }}</title></rect>
        <text :x="LABEL + x(row.total) + 6" :y="ROW / 2" dominant-baseline="middle" class="fill-slate-500 text-[11px]">{{ formatMoney(row.total) }}</text>
      </g>
    </svg>
  </section>
</template>
