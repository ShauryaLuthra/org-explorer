<!-- Headcount (left) and salary cost (right) per layer, back to back like a population pyramid. -->
<script setup>
import { computed } from 'vue'
import { scaleLinear } from 'd3-scale'
import { formatMoney, formatCount } from '../../data/format.js'
import { MGMT_COLOUR, IC_COLOUR } from './chartColors.js'

const props = defineProps({ people: { type: Array, required: true } })
const WIDTH = 640
const ROW = 24
const MID = WIDTH / 2
const HALF = MID - 90

const layers = computed(() => {
  const byDepth = new Map()
  for (const p of props.people) {
    const layer = byDepth.get(p.depth) ?? { depth: p.depth, people: 0, cost: 0 }
    layer.people += 1
    layer.cost += p.salary
    byDepth.set(p.depth, layer)
  }
  return [...byDepth.values()].sort((a, b) => a.depth - b.depth)
})
const people = computed(() => scaleLinear().domain([0, Math.max(...layers.value.map((l) => l.people), 1)]).range([0, HALF]))
const cost = computed(() => scaleLinear().domain([0, Math.max(...layers.value.map((l) => l.cost), 1)]).range([0, HALF]))
const title = computed(() => {
  const biggest = [...layers.value].sort((a, b) => b.people - a.people)[0]
  if (!biggest) return 'No people in this view'
  // Layers are 1-based for readers: the CEO is layer 1.
  return `Layer ${biggest.depth + 1} holds the most people: ${formatCount(biggest.people)} (${((biggest.people / props.people.length) * 100).toFixed(0)}%) costing ${formatMoney(biggest.cost)}`
})
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2>
    <p class="mt-1 flex gap-4 text-xs text-slate-500">
      <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm" :style="{ background: MGMT_COLOUR }"></span>Headcount (left)</span>
      <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm" :style="{ background: IC_COLOUR }"></span>Salary cost (right)</span>
    </p>
    <svg :viewBox="`0 0 ${WIDTH} ${layers.length * ROW + 8}`" class="mt-3 w-full" role="img" :aria-label="title">
      <g v-for="(layer, i) in layers" :key="layer.depth" :transform="`translate(0, ${i * ROW + 4})`">
        <rect :x="MID - 18 - people(layer.people)" :y="4" :width="people(layer.people)" :height="ROW - 8" rx="3" :fill="MGMT_COLOUR"><title>Layer {{ layer.depth + 1 }}: {{ formatCount(layer.people) }} people</title></rect>
        <text :x="MID - 24 - people(layer.people)" :y="ROW / 2" text-anchor="end" dominant-baseline="middle" class="fill-slate-500 text-[11px]">{{ formatCount(layer.people) }}</text>
        <text :x="MID" :y="ROW / 2" text-anchor="middle" dominant-baseline="middle" class="fill-slate-700 text-[11px] font-medium">L{{ layer.depth + 1 }}</text>
        <rect :x="MID + 18" :y="4" :width="cost(layer.cost)" :height="ROW - 8" rx="3" :fill="IC_COLOUR"><title>Layer {{ layer.depth + 1 }}: {{ formatMoney(layer.cost) }}</title></rect>
        <text :x="MID + 24 + cost(layer.cost)" :y="ROW / 2" dominant-baseline="middle" class="fill-slate-500 text-[11px]">{{ formatMoney(layer.cost) }}</text>
      </g>
    </svg>
  </section>
</template>
