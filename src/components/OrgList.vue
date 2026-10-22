<!-- OrgList.vue: the phone layout (under 768 px). An indented, collapsible list using the same expanded Set as the canvas. It draws itself for each child (recursive). -->
<script setup>
import { computed, watch, ref, nextTick } from 'vue' // Vue helpers.
import MoreCard from './MoreCard.vue' // Same "Show more" button.
import { formatMoney, formatCount } from '../data/format.js' // Labels.
import { departmentColor } from '../data/departmentColors.js' // Colour dot.
import { useOrg } from '../composables/useOrg.js' // Shared state.

const props = defineProps({ person: { type: Object, required: true }, depth: { type: Number, default: 0 } }) // Who this row is, and how far to indent.
const { expanded, highlightedId, toggle, visibleCount, showMore, select } = useOrg() // Same state as the canvas.
const row = ref(null) // This row's element, to scroll to after a search.

const isOpen = computed(() => expanded.has(props.person.id)) // O(1): are their reports showing?
const shownChildren = computed(() => props.person.children.slice(0, visibleCount(props.person.id))) // First 12 (or more).
const remaining = computed(() => props.person.children.length - shownChildren.value.length) // Still hidden.

watch(highlightedId, async (id) => { // When search highlights this person...
  if (id !== props.person.id) return // ...(only the matching row reacts)...
  await nextTick() // ...wait for it to be drawn...
  row.value?.scrollIntoView({ block: 'center', behavior: 'smooth' }) // ...and scroll it into the middle of the screen.
}, { immediate: true }) // Also check right away, in case this row was just created by the search.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What one row (and its team) shows. -->
  <li> <!-- One person. -->
    <div ref="row" class="flex items-center gap-2 border-b border-slate-100 py-2 pr-3" :class="highlightedId === person.id ? 'bg-amber-50' : 'bg-white'" :style="{ paddingLeft: `${12 + depth * 16}px` }"> <!-- Indent 16px per level. -->
      <button
        v-if="!person.isLeaf"
        type="button"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
        :aria-expanded="isOpen"
        :aria-label="isOpen ? 'Collapse team' : 'Expand team'"
        @click="toggle(person.id)"
      >{{ isOpen ? '▾' : '▸' }}</button> <!-- Expand/collapse, same Set as the canvas. -->
      <span v-else class="w-6 shrink-0"></span> <!-- Spacer so leaves line up with managers. -->
      <button type="button" class="min-w-0 flex-1 text-left" @click="select(person.id)"> <!-- Tap the text to open details. -->
        <span class="flex items-center gap-2"><span class="h-2 w-2 shrink-0 rounded-full" :class="departmentColor(person.department).avatar"></span><span class="truncate text-sm font-medium text-slate-900">{{ person.name }}</span></span> <!-- Colour dot + name. -->
        <span class="block truncate text-xs text-slate-500">{{ person.title }}</span> <!-- Title. -->
        <span class="block text-xs text-slate-500">{{ person.isLeaf ? `IC · ${formatMoney(person.salary)}` : `${person.children.length} / ${formatCount(person.desc)} · ${formatCount(person.nonLeafDesc)} mgrs · ${formatMoney(person.totalCost)}` }}</span> <!-- Compact cost line. -->
      </button> <!-- End of text. -->
    </div> <!-- End of the row. -->
    <ul v-if="isOpen && person.children.length > 0"> <!-- Their team, only when open. -->
      <OrgList v-for="child in shownChildren" :key="child.id" :person="child" :depth="depth + 1" /> <!-- RECURSION: each child is a row of this same component, indented one more level. -->
      <li v-if="remaining > 0" class="py-2" :style="{ paddingLeft: `${12 + (depth + 1) * 16}px` }"><MoreCard :remaining="remaining" :step="24" @more="showMore(person.id)" /></li> <!-- Show more. -->
    </ul> <!-- End of team. -->
  </li> <!-- End of person. -->
</template> <!-- End of what one row shows. -->
