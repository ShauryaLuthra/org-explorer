<!-- Treemap of team salary cost, two levels below the current focus. Click a team to drill in; the breadcrumb goes back. -->
<script setup>
import { computed, shallowRef, watch } from 'vue'
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import { formatMoney } from '../../data/format.js'
import { departmentColor } from '../../data/departmentColors.js'
import { useOrg } from '../../composables/useOrg.js'

const { org, departmentFilter } = useOrg()
const WIDTH = 960
const HEIGHT = 460
const focus = shallowRef(org.value.root)
watch(() => org.value, (value) => { focus.value = value.root }) // A new upload resets the drill-down.

// Bottom-up sweep (as in aggregate) so a team's cost includes its leader's salary and respects the department
// filter.
const teamCost = computed(() => {
  const cost = new Map()
  const { order } = org.value
  for (let i = order.length - 1; i >= 0; i--) {
    const p = order[i]
    const own = departmentFilter.value === '' || p.department === departmentFilter.value ? p.salary : 0
    cost.set(p.id, (cost.get(p.id) ?? 0) + own)
    if (p.parent) cost.set(p.parent.id, (cost.get(p.parent.id) ?? 0) + cost.get(p.id))
  }
  return cost
})

const layout = computed(() => {
  const top = focus.value.depth
  const root = hierarchy(focus.value, (p) => (p.depth - top < 2 ? p.children : null))
    .sum((p) => {
      const level = p.depth - top
      // Tiles carry their whole team's cost. A group header adds only its leader's own salary, so nobody is
      // counted twice or left out.
      if (level === 2 || (level === 1 && p.isLeaf)) return teamCost.value.get(p.id)
      if (level === 1) return departmentFilter.value === '' || p.department === departmentFilter.value ? p.salary : 0
      return 0
    })
    .sort((a, b) => b.value - a.value)
  treemap().tile(treemapSquarify).size([WIDTH, HEIGHT]).paddingTop(20).paddingInner(2).round(true)(root)
  return root
})
const groups = computed(() => (layout.value.children ?? []).filter((g) => g.value > 0))
const tiles = computed(() => layout.value.leaves().filter((t) => t.value > 0 && t.depth > 0))
const breadcrumb = computed(() => {
  const path = []
  for (let p = focus.value; p; p = p.parent) path.push(p)
  return path.reverse()
})
const title = computed(() => {
  const biggest = groups.value[0]
  if (!biggest || layout.value.value === 0) return 'No salary cost in this view'
  return `${biggest.data.name}'s team is ${((biggest.value / layout.value.value) * 100).toFixed(0)}% of the cost under ${focus.value.name} (${formatMoney(biggest.value)})`
})

// Drill into a team; ICs have nothing below them.
function drill(node) {
  const person = node.data
  if (!person.isLeaf) focus.value = person
}
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2>
    <nav class="mt-1 flex flex-wrap items-center gap-1 text-xs" aria-label="Treemap level">
      <template v-for="(p, i) in breadcrumb" :key="p.id">
        <button v-if="i < breadcrumb.length - 1" type="button" class="text-indigo-700 hover:underline" @click="focus = p">{{ p.name }}</button>
        <span v-else class="font-medium text-slate-700">{{ p.name }}</span>
        <span v-if="i < breadcrumb.length - 1" class="text-slate-300">›</span>
      </template>
      <span class="ml-2 text-slate-400">· sized by team salary cost · click a team to drill in</span>
    </nav>
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="mt-3 w-full" role="img" :aria-label="title">
      <g v-for="group in groups" :key="group.data.id" class="cursor-pointer" @click="drill(group)">
        <rect :x="group.x0" :y="group.y0" :width="group.x1 - group.x0" :height="group.y1 - group.y0" rx="4" class="fill-slate-100"><title>{{ group.data.name }} ({{ group.data.title }}): {{ formatMoney(group.value) }}</title></rect>
        <text v-if="group.x1 - group.x0 > (group.data.name.length + 10) * 6.5" :x="group.x0 + 6" :y="group.y0 + 14" class="fill-slate-700 text-[11px] font-medium">{{ group.data.name }} · {{ formatMoney(group.value) }}</text>
      </g>
      <g v-for="tile in tiles" :key="tile.data.id" class="cursor-pointer" @click="drill(tile.depth === 1 ? tile : tile.parent)">
        <rect :x="tile.x0" :y="tile.y0" :width="tile.x1 - tile.x0" :height="tile.y1 - tile.y0" rx="3" :class="departmentColor(tile.data.department).fill" class="opacity-90 hover:opacity-100"><title>{{ tile.data.name }} ({{ tile.data.title }}): {{ formatMoney(tile.value) }}</title></rect>
        <text v-if="tile.x1 - tile.x0 > 80 && tile.y1 - tile.y0 > 34" :x="tile.x0 + 6" :y="tile.y0 + 15" class="pointer-events-none fill-white text-[11px] font-medium">{{ tile.data.name }}</text>
        <text v-if="tile.x1 - tile.x0 > 80 && tile.y1 - tile.y0 > 34" :x="tile.x0 + 6" :y="tile.y0 + 29" class="pointer-events-none fill-white/80 text-[11px]">{{ formatMoney(tile.value) }}</text>
      </g>
    </svg>
  </section>
</template>
