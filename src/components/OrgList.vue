<!-- Phone layout (under 768 px): an indented, collapsible list sharing the canvas's expanded state. Recursive. -->
<script setup>
import { computed, watch, ref, nextTick } from 'vue'
import MoreCard from './MoreCard.vue'
import { formatMoney, formatCount } from '../data/format.js'
import { departmentColor } from '../data/departmentColors.js'
import { useOrg } from '../composables/useOrg.js'

const props = defineProps({ person: { type: Object, required: true }, depth: { type: Number, default: 0 } })
const { expanded, highlightedId, toggle, visibleCount, showMore, select } = useOrg()
const row = ref(null)

const isOpen = computed(() => expanded.has(props.person.id))
const shownChildren = computed(() => props.person.children.slice(0, visibleCount(props.person.id)))
const remaining = computed(() => props.person.children.length - shownChildren.value.length)

// Scroll a searched-for row into view once it has rendered.
watch(highlightedId, async (id) => {
  if (id !== props.person.id) return
  await nextTick()
  row.value?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}, { immediate: true })
</script>

<template>
  <li>
    <div ref="row" class="flex items-center gap-2 border-b border-slate-100 py-2 pr-3" :class="highlightedId === person.id ? 'bg-amber-50' : 'bg-white'" :style="{ paddingLeft: `${12 + depth * 16}px` }">
      <button
        v-if="!person.isLeaf"
        type="button"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
        :aria-expanded="isOpen"
        :aria-label="isOpen ? 'Collapse team' : 'Expand team'"
        @click="toggle(person.id)"
      >{{ isOpen ? '▾' : '▸' }}</button>
      <span v-else class="w-6 shrink-0"></span>
      <button type="button" class="min-w-0 flex-1 text-left" @click="select(person.id)">
        <span class="flex items-center gap-2"><span class="h-2 w-2 shrink-0 rounded-full" :class="departmentColor(person.department).avatar"></span><span class="truncate text-sm font-medium text-slate-900">{{ person.name }}</span></span>
        <span class="block truncate text-xs text-slate-500">{{ person.title }}</span>
        <span class="block text-xs text-slate-500">{{ person.isLeaf ? `IC · ${formatMoney(person.salary)}` : `${person.children.length} / ${formatCount(person.desc)} · ${formatCount(person.nonLeafDesc)} mgrs · ${formatMoney(person.totalCost)}` }}</span>
      </button>
    </div>
    <ul v-if="isOpen && person.children.length > 0">
      <OrgList v-for="child in shownChildren" :key="child.id" :person="child" :depth="depth + 1" />
      <li v-if="remaining > 0" class="py-2" :style="{ paddingLeft: `${12 + (depth + 1) * 16}px` }"><MoreCard :remaining="remaining" :step="24" @more="showMore(person.id)" /></li>
    </ul>
  </li>
</template>
