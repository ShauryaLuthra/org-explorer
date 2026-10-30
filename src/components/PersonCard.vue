<!-- One person's card. Managers show cost rows and an expand button; individual contributors show their own salary. -->
<script setup>
import { computed } from 'vue'
import { formatMoney, formatRatio, formatCount, initials } from '../data/format.js'
import { departmentColor } from '../data/departmentColors.js'

const props = defineProps({
  person: { type: Object, required: true },
  expanded: { type: Boolean, default: false },
  highlighted: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle', 'select'])

const colour = computed(() => departmentColor(props.person.department))
const icCount = computed(() => props.person.desc - props.person.nonLeafDesc)
</script>

<template>
  <!-- A div with role="button", because a real <button> can't contain the expand <button>. -->
  <div
    :data-id="person.id"
    role="button"
    tabindex="0"
    class="w-72 cursor-pointer rounded-xl border border-slate-200 p-4 text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    :class="[person.synthetic ? 'border-dashed bg-white' : colour.tint, highlighted ? 'ring-4 ring-amber-400' : '']"
    @click="emit('select', person.id)"
    @keydown.enter.prevent="emit('select', person.id)"
    @keydown.space.prevent="emit('select', person.id)"
  >
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" :class="colour.avatar">{{ initials(person.name) }}</div>
      <div class="min-w-0">
        <p class="truncate font-semibold text-slate-900">{{ person.name }}</p>
        <p class="truncate text-sm text-slate-500">{{ person.title }}</p>
      </div>
    </div>

    <div v-if="!person.synthetic" class="mt-3 flex flex-wrap gap-1 text-xs">
      <span class="rounded-full px-2 py-0.5" :class="colour.pill">{{ person.department }}</span>
      <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{{ person.location }}</span>
      <span v-if="person.level" class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">L{{ person.level }}</span>
    </div>

    <dl v-if="!person.isLeaf" class="mt-3 space-y-1 text-sm">
      <div class="flex justify-between"><dt class="text-slate-500">Management cost</dt><dd class="font-medium text-slate-900">{{ formatMoney(person.mgmtCost) }}</dd></div>
      <div class="flex justify-between"><dt class="text-slate-500">IC cost</dt><dd class="font-medium text-slate-900">{{ formatMoney(person.icCost) }}</dd></div>
      <div class="flex justify-between"><dt class="text-slate-500">Total cost</dt><dd class="font-semibold text-slate-900">{{ formatMoney(person.totalCost) }}</dd></div>
      <div class="flex justify-between">
        <dt class="text-slate-500">
          Mgmt cost ratio
          <!-- A CSS tooltip, not title="", because native tooltips are slow to appear and don't show up in screen recordings. -->
          <span class="group relative cursor-help text-slate-400" aria-label="Management cost divided by IC cost">ⓘ
            <span role="tooltip" class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-snug text-white shadow-lg group-hover:block">
              Management cost ÷ IC cost<br />{{ formatMoney(person.mgmtCost) }} ÷ {{ formatMoney(person.icCost) }} = {{ formatRatio(person.ratio) }}
            </span>
          </span>
        </dt>
        <dd class="font-medium text-slate-900">{{ formatRatio(person.ratio) }}</dd>
      </div>
      <div class="flex justify-between gap-2"><dt class="text-slate-500">Mgmt : IC headcount</dt><dd class="whitespace-nowrap font-medium text-slate-900">{{ formatCount(person.nonLeafDesc) }} : {{ formatCount(icCount) }}</dd></div>
    </dl>

    <!-- Every cost is $0 for someone with no reports, so ICs show their own salary instead. -->
    <div v-else-if="!person.synthetic" class="mt-3 flex justify-between text-sm">
      <span class="text-slate-500">Individual contributor</span>
      <span class="font-medium text-slate-900">{{ formatMoney(person.salary) }}</span>
    </div>

    <div v-if="!person.isLeaf" class="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-3">
      <div class="text-xs text-slate-600">
        <span class="rounded-md bg-white/80 px-1.5 py-0.5 font-medium ring-1 ring-slate-200">{{ person.children.length }} / {{ formatCount(person.desc) }}</span>
        <span class="ml-2">{{ formatCount(person.nonLeafDesc) }} managers</span>
      </div>
      <!-- .stop keeps expanding from also opening the drawer. -->
      <button
        type="button"
        class="rounded-full p-1 text-slate-500 hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        :aria-expanded="expanded"
        :aria-label="expanded ? 'Collapse team' : 'Expand team'"
        @click.stop="emit('toggle', person.id)"
        @keydown.stop
      >
        <svg class="h-5 w-5 transition-transform" :class="expanded ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
      </button>
    </div>
  </div>
</template>
