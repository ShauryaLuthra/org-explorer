<!-- CostByDepartment.vue: horizontal stacked bars of management vs IC salary cost per department, biggest first. -->
<script setup>
import { computed } from 'vue' // Derived values.
import { scaleLinear } from 'd3-scale' // Maps dollars to pixel widths.
import { formatMoney } from '../../data/format.js' // Labels.
import { MGMT_COLOUR, IC_COLOUR } from './chartColors.js' // Series colours.

const props = defineProps({ people: { type: Array, required: true } }) // Everyone in the current filter.
const WIDTH = 640 // Drawing width (the SVG scales to fit its box).
const LABEL = 170 // Space on the left for department names.
const ROW = 30 // Height of one bar row.

const rows = computed(() => { // One row per department.
  const byDept = new Map() // department -> { mgmt, ic }.
  for (const p of props.people) { // One pass over everyone.
    const row = byDept.get(p.department) ?? { name: p.department, mgmt: 0, ic: 0 } // Existing row or a new one.
    if (p.isLeaf) row.ic += p.salary // ICs add to IC cost...
    else row.mgmt += p.salary // ...managers to management cost.
    byDept.set(p.department, row) // Store it back.
  } // End of pass.
  return [...byDept.values()].map((r) => ({ ...r, total: r.mgmt + r.ic })).sort((a, b) => b.total - a.total) // Add totals, biggest first.
}) // End of rows.
const grandTotal = computed(() => rows.value.reduce((sum, r) => sum + r.total, 0)) // All departments together.
const x = computed(() => scaleLinear().domain([0, rows.value[0]?.total ?? 1]).range([0, WIDTH - LABEL - 70])) // $0 -> 0 px, biggest department -> full width (leaving room for the total label).
const title = computed(() => { // The headline states the finding with a number.
  const top = rows.value[0] // Biggest department.
  if (!top) return 'No people in this view' // Empty filter.
  if (rows.value.length === 1) return `${top.name}: ${((top.mgmt / top.total) * 100).toFixed(0)}% of its ${formatMoney(top.total)} salary cost goes to managers` // Single department.
  return `${top.name} carries ${((top.total / grandTotal.value) * 100).toFixed(0)}% of all salary cost (${formatMoney(top.total)})` // Whole company.
}) // End of title.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the chart shows. -->
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"> <!-- Chart card. -->
    <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2> <!-- Finding as a sentence. -->
    <p class="mt-1 flex gap-4 text-xs text-slate-500"> <!-- Legend (2 series, so always shown). -->
      <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm" :style="{ background: MGMT_COLOUR }"></span>Management</span> <!-- Blue key. -->
      <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm" :style="{ background: IC_COLOUR }"></span>Individual contributors</span> <!-- Orange key. -->
    </p> <!-- End of legend. -->
    <svg :viewBox="`0 0 ${WIDTH} ${rows.length * ROW + 8}`" class="mt-3 w-full" role="img" :aria-label="title"> <!-- Scales to the card's width. -->
      <g v-for="(row, i) in rows" :key="row.name" :transform="`translate(0, ${i * ROW + 4})`"> <!-- One row, moved down i rows. -->
        <text :x="LABEL - 8" :y="ROW / 2" text-anchor="end" dominant-baseline="middle" class="fill-slate-600 text-[12px]">{{ row.name }}</text> <!-- Department name, right-aligned. -->
        <rect :x="LABEL" :y="6" :width="Math.max(x(row.mgmt) - 1, 0)" :height="ROW - 12" rx="3" :fill="MGMT_COLOUR"><title>{{ row.name }} management: {{ formatMoney(row.mgmt) }}</title></rect> <!-- Blue part; <title> = hover tooltip; -1 leaves a 2 px gap. -->
        <rect :x="LABEL + x(row.mgmt) + 1" :y="6" :width="Math.max(x(row.ic) - 1, 0)" :height="ROW - 12" rx="3" :fill="IC_COLOUR"><title>{{ row.name }} IC: {{ formatMoney(row.ic) }}</title></rect> <!-- Orange part, right after the blue. -->
        <text :x="LABEL + x(row.total) + 6" :y="ROW / 2" dominant-baseline="middle" class="fill-slate-500 text-[11px]">{{ formatMoney(row.total) }}</text> <!-- Total at the end of the bar. -->
      </g> <!-- End of row. -->
    </svg> <!-- End of chart. -->
  </section> <!-- End of chart card. -->
</template> <!-- End of what the chart shows. -->
