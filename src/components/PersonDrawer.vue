<!-- The right-side panel with one person's full details, their reporting chain up to the CEO, and their direct reports. -->
<script setup>
import { computed } from 'vue'
import { formatMoney, formatRatio, formatCount } from '../data/format.js'
import { departmentColor } from '../data/departmentColors.js'
import { useOrg } from '../composables/useOrg.js'

const { org, selectedId, select, revealPerson } = useOrg()
const person = computed(() => (selectedId.value ? org.value.byId.get(selectedId.value) : null))
const chain = computed(() => {
  const path = []
  // Follow parent pointers up to the CEO: O(depth).
  for (let boss = person.value?.parent; boss; boss = boss.parent) path.push(boss)
  return path.reverse()
})

function goTo(id) {
  revealPerson(id)
  select(id)
}
</script>

<template>
  <aside v-if="person" class="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl" aria-label="Person details" @keydown.esc="select(null)">
    <div class="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
      <div class="min-w-0">
        <p class="truncate text-lg font-semibold text-slate-900">{{ person.name }}</p>
        <p class="truncate text-sm text-slate-500">{{ person.title }}</p>
        <div v-if="!person.synthetic" class="mt-2 flex flex-wrap gap-1 text-xs">
          <span class="rounded-full px-2 py-0.5" :class="departmentColor(person.department).pill">{{ person.department }}</span>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{{ person.location }}</span>
          <span v-if="person.level" class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">L{{ person.level }}</span>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{{ person.id }}</span>
        </div>
      </div>
      <button type="button" class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close details" @click="select(null)">✕</button>
    </div>

    <div class="flex-1 space-y-6 overflow-auto p-5 text-sm">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
        <dt class="text-slate-500">Own salary</dt><dd class="text-right font-medium">{{ formatMoney(person.salary) }}</dd>
        <dt class="text-slate-500">Direct reports</dt><dd class="text-right font-medium">{{ formatCount(person.children.length) }}</dd>
        <dt class="text-slate-500">Total descendants</dt><dd class="text-right font-medium">{{ formatCount(person.desc) }}</dd>
        <dt class="text-slate-500">Managers below</dt><dd class="text-right font-medium">{{ formatCount(person.nonLeafDesc) }}</dd>
        <dt class="text-slate-500">Management cost</dt><dd class="text-right font-medium">{{ formatMoney(person.mgmtCost) }}</dd>
        <dt class="text-slate-500">IC cost</dt><dd class="text-right font-medium">{{ formatMoney(person.icCost) }}</dd>
        <dt class="text-slate-500">Total cost</dt><dd class="text-right font-semibold">{{ formatMoney(person.totalCost) }}</dd>
        <dt class="text-slate-500">Mgmt cost ratio</dt><dd class="text-right font-medium">{{ formatRatio(person.ratio) }}</dd>
      </dl>

      <section v-if="chain.length > 0">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Reporting chain</p>
        <ol class="flex flex-wrap items-center gap-1">
          <li v-for="boss in chain" :key="boss.id" class="flex items-center gap-1">
            <button type="button" class="rounded px-1 text-indigo-700 hover:bg-indigo-50 hover:underline" @click="goTo(boss.id)">{{ boss.name }}</button>
            <span class="text-slate-300">›</span>
          </li>
          <li class="font-medium text-slate-900">{{ person.name }}</li>
        </ol>
      </section>

      <section v-if="person.children.length > 0">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Direct reports ({{ person.children.length }})</p>
        <ul class="divide-y divide-slate-100 rounded-lg border border-slate-100">
          <li v-for="child in person.children" :key="child.id">
            <button type="button" class="flex w-full justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50" @click="goTo(child.id)">
              <span class="min-w-0"><span class="block truncate font-medium text-slate-900">{{ child.name }}</span><span class="block truncate text-xs text-slate-500">{{ child.title }}</span></span>
              <span class="shrink-0 text-xs text-slate-500">{{ child.isLeaf ? formatMoney(child.salary) : `${formatCount(child.desc)} below` }}</span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  </aside>
</template>
