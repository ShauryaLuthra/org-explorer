<!-- LayersPyramid.vue: headcount (left) and salary cost (right) at each layer below the CEO, drawn back-to-back like a population pyramid. -->
<script setup>
import { computed } from 'vue' // Derived values.
import { scaleLinear } from 'd3-scale' // Values -> pixel widths.
import { formatMoney, formatCount } from '../../data/format.js' // Labels.
import { MGMT_COLOUR, IC_COLOUR } from './chartColors.js' // Reused colours: blue = people, orange = cost (legend says so).

const props = defineProps({ people: { type: Array, required: true } }) // Everyone in the current filter.
const WIDTH = 640 // Drawing width.
const ROW = 24 // Height of one layer.
const MID = WIDTH / 2 // Centre line where the layer labels sit.
const HALF = MID - 90 // Max bar length on each side (room for labels and values, so "$275.08M" never clips).

const layers = computed(() => { // One entry per depth.
  const byDepth = new Map() // depth -> { people, cost }.
  for (const p of props.people) { // One pass.
    const layer = byDepth.get(p.depth) ?? { depth: p.depth, people: 0, cost: 0 } // Existing or new.
    layer.people += 1 // Count the person...
    layer.cost += p.salary // ...and their salary.
    byDepth.set(p.depth, layer) // Store.
  } // End of pass.
  return [...byDepth.values()].sort((a, b) => a.depth - b.depth) // Top layer first.
}) // End of layers.
const people = computed(() => scaleLinear().domain([0, Math.max(...layers.value.map((l) => l.people), 1)]).range([0, HALF])) // Headcount -> width (its own scale).
const cost = computed(() => scaleLinear().domain([0, Math.max(...layers.value.map((l) => l.cost), 1)]).range([0, HALF])) // Cost -> width (its own scale, its own side).
const title = computed(() => { // The finding.
  const biggest = [...layers.value].sort((a, b) => b.people - a.people)[0] // Layer with the most people.
  if (!biggest) return 'No people in this view' // Empty.
  return `Layer ${biggest.depth + 1} holds the most people: ${formatCount(biggest.people)} (${((biggest.people / props.people.length) * 100).toFixed(0)}%) costing ${formatMoney(biggest.cost)}` // Layer 1 = CEO.
}) // End of title.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the chart shows. -->
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"> <!-- Chart card. -->
    <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2> <!-- Finding as a sentence. -->
    <p class="mt-1 flex gap-4 text-xs text-slate-500"> <!-- Legend: two measures, two sides. -->
      <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm" :style="{ background: MGMT_COLOUR }"></span>Headcount (left)</span> <!-- Left side. -->
      <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm" :style="{ background: IC_COLOUR }"></span>Salary cost (right)</span> <!-- Right side. -->
    </p> <!-- End of legend. -->
    <svg :viewBox="`0 0 ${WIDTH} ${layers.length * ROW + 8}`" class="mt-3 w-full" role="img" :aria-label="title"> <!-- Scales to fit. -->
      <g v-for="(layer, i) in layers" :key="layer.depth" :transform="`translate(0, ${i * ROW + 4})`"> <!-- One layer row. -->
        <rect :x="MID - 18 - people(layer.people)" :y="4" :width="people(layer.people)" :height="ROW - 8" rx="3" :fill="MGMT_COLOUR"><title>Layer {{ layer.depth + 1 }}: {{ formatCount(layer.people) }} people</title></rect> <!-- Headcount bar grows LEFT from the centre. -->
        <text :x="MID - 24 - people(layer.people)" :y="ROW / 2" text-anchor="end" dominant-baseline="middle" class="fill-slate-500 text-[11px]">{{ formatCount(layer.people) }}</text> <!-- Headcount value. -->
        <text :x="MID" :y="ROW / 2" text-anchor="middle" dominant-baseline="middle" class="fill-slate-700 text-[11px] font-medium">L{{ layer.depth + 1 }}</text> <!-- Layer label in the middle. -->
        <rect :x="MID + 18" :y="4" :width="cost(layer.cost)" :height="ROW - 8" rx="3" :fill="IC_COLOUR"><title>Layer {{ layer.depth + 1 }}: {{ formatMoney(layer.cost) }}</title></rect> <!-- Cost bar grows RIGHT from the centre. -->
        <text :x="MID + 24 + cost(layer.cost)" :y="ROW / 2" dominant-baseline="middle" class="fill-slate-500 text-[11px]">{{ formatMoney(layer.cost) }}</text> <!-- Cost value. -->
      </g> <!-- End of layer row. -->
    </svg> <!-- End of chart. -->
  </section> <!-- End of chart card. -->
</template> <!-- End of what the chart shows. -->
