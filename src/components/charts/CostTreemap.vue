<!-- CostTreemap.vue: rectangles sized by team salary cost for two levels below the current focus (focus = CEO at first). Click a team to drill in; the breadcrumb goes back. -->
<script setup>
import { computed, shallowRef, watch } from 'vue' // Derived values; shallowRef holds a raw person object.
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy' // d3's tree layout helpers (suggested in the assignment).
import { formatMoney } from '../../data/format.js' // Labels.
import { departmentColor } from '../../data/departmentColors.js' // Department fill colours, same as the cards.
import { useOrg } from '../../composables/useOrg.js' // Shared state.

const { org, departmentFilter } = useOrg() // The tree and the department filter.
const WIDTH = 960 // Drawing width.
const HEIGHT = 460 // Drawing height.
const focus = shallowRef(org.value.root) // Whose organisation we're looking inside.
watch(() => org.value, (value) => { focus.value = value.root }) // A newly uploaded file resets the focus to its root.

const teamCost = computed(() => { // person id -> salary cost of them + everyone below, counting only the filtered department.
  const cost = new Map() // Filled bottom-up.
  const { order } = org.value // Top-down order from aggregate.
  for (let i = order.length - 1; i >= 0; i--) { // Same backwards sweep as aggregate: children are always finished before their parent. O(n).
    const p = order[i] // This person.
    const own = departmentFilter.value === '' || p.department === departmentFilter.value ? p.salary : 0 // Their salary, if they're in the filter.
    cost.set(p.id, (cost.get(p.id) ?? 0) + own) // Add their own salary to whatever their reports already added.
    if (p.parent) cost.set(p.parent.id, (cost.get(p.parent.id) ?? 0) + cost.get(p.id)) // Pass the total up to their boss.
  } // End of sweep.
  return cost // Lookup used to size rectangles.
}) // End of teamCost.

const layout = computed(() => { // Run d3's treemap on focus -> children -> grandchildren.
  const top = focus.value.depth // Depth of the focus person.
  const root = hierarchy(focus.value, (p) => (p.depth - top < 2 ? p.children : null)) // Only go two levels down from the focus.
    .sum((p) => { // How much area each node adds on top of its children's.
      const level = p.depth - top // 0 = focus, 1 = their direct reports, 2 = the level below.
      if (level === 2 || (level === 1 && p.isLeaf)) return teamCost.value.get(p.id) // Bottom of what we show: their whole team's cost.
      if (level === 1) return departmentFilter.value === '' || p.department === departmentFilter.value ? p.salary : 0 // A direct report who manages: add their own salary, so the group total matches the other charts.
      return 0 // The focus person themself isn't "under" themself.
    }) // End of sum.
    .sort((a, b) => b.value - a.value) // Biggest teams first (top-left).
  treemap().tile(treemapSquarify).size([WIDTH, HEIGHT]).paddingTop(20).paddingInner(2).round(true)(root) // Compute x0/y0/x1/y1 for every node; 20 px top padding leaves room for group labels.
  return root // Laid-out tree.
}) // End of layout.
const groups = computed(() => (layout.value.children ?? []).filter((g) => g.value > 0)) // Direct reports of the focus (the outlined groups).
const tiles = computed(() => layout.value.leaves().filter((t) => t.value > 0 && t.depth > 0)) // The coloured rectangles.
const breadcrumb = computed(() => { // Root -> ... -> focus.
  const path = [] // People on the way.
  for (let p = focus.value; p; p = p.parent) path.push(p) // Walk parent pointers up.
  return path.reverse() // Top-down.
}) // End of breadcrumb.
const title = computed(() => { // The finding.
  const biggest = groups.value[0] // Biggest team under the focus.
  if (!biggest || layout.value.value === 0) return 'No salary cost in this view' // Empty.
  return `${biggest.data.name}'s team is ${((biggest.value / layout.value.value) * 100).toFixed(0)}% of the cost under ${focus.value.name} (${formatMoney(biggest.value)})` // Share of the biggest team.
}) // End of title.

/**
 * Drill into a team (if it has people below it).
 * @param {Object} node - A d3 node whose .data is a person.
 */
function drill(node) { // Rectangle or group click.
  const person = node.data // The person clicked (d3 keeps our object in .data).
  if (!person.isLeaf) focus.value = person // Only managers can be drilled into.
} // End of drill.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the treemap shows. -->
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"> <!-- Chart card. -->
    <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2> <!-- Finding as a sentence. -->
    <nav class="mt-1 flex flex-wrap items-center gap-1 text-xs" aria-label="Treemap level"> <!-- Breadcrumb. -->
      <template v-for="(p, i) in breadcrumb" :key="p.id"> <!-- One step. -->
        <button v-if="i < breadcrumb.length - 1" type="button" class="text-indigo-700 hover:underline" @click="focus = p">{{ p.name }}</button> <!-- Earlier steps: click to go back up. -->
        <span v-else class="font-medium text-slate-700">{{ p.name }}</span> <!-- Current focus. -->
        <span v-if="i < breadcrumb.length - 1" class="text-slate-300">›</span> <!-- Separator. -->
      </template> <!-- End of step. -->
      <span class="ml-2 text-slate-400">· sized by team salary cost · click a team to drill in</span> <!-- How to read it. -->
    </nav> <!-- End of breadcrumb. -->
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="mt-3 w-full" role="img" :aria-label="title"> <!-- Scales to fit. -->
      <g v-for="group in groups" :key="group.data.id" class="cursor-pointer" @click="drill(group)"> <!-- One direct report's team. -->
        <rect :x="group.x0" :y="group.y0" :width="group.x1 - group.x0" :height="group.y1 - group.y0" rx="4" class="fill-slate-100"><title>{{ group.data.name }} ({{ group.data.title }}): {{ formatMoney(group.value) }}</title></rect> <!-- Group background; hover shows the total. -->
        <text v-if="group.x1 - group.x0 > (group.data.name.length + 10) * 6.5" :x="group.x0 + 6" :y="group.y0 + 14" class="fill-slate-700 text-[11px] font-medium">{{ group.data.name }} · {{ formatMoney(group.value) }}</text> <!-- Group label, only if the text fits (≈6.5 px per character). -->
      </g> <!-- End of group. -->
      <g v-for="tile in tiles" :key="tile.data.id" class="cursor-pointer" @click="drill(tile.depth === 1 ? tile : tile.parent)"> <!-- One team two levels down (click drills into its group). -->
        <rect :x="tile.x0" :y="tile.y0" :width="tile.x1 - tile.x0" :height="tile.y1 - tile.y0" rx="3" :class="departmentColor(tile.data.department).fill" class="opacity-90 hover:opacity-100"><title>{{ tile.data.name }} ({{ tile.data.title }}): {{ formatMoney(tile.value) }}</title></rect> <!-- Coloured by department, like the cards. -->
        <text v-if="tile.x1 - tile.x0 > 80 && tile.y1 - tile.y0 > 34" :x="tile.x0 + 6" :y="tile.y0 + 15" class="pointer-events-none fill-white text-[11px] font-medium">{{ tile.data.name }}</text> <!-- Name, only if it fits. -->
        <text v-if="tile.x1 - tile.x0 > 80 && tile.y1 - tile.y0 > 34" :x="tile.x0 + 6" :y="tile.y0 + 29" class="pointer-events-none fill-white/80 text-[11px]">{{ formatMoney(tile.value) }}</text> <!-- Cost, only if it fits. -->
      </g> <!-- End of tile. -->
    </svg> <!-- End of treemap. -->
  </section> <!-- End of chart card. -->
</template> <!-- End of what the treemap shows. -->
