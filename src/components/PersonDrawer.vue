<!-- PersonDrawer.vue: the right-side panel with one person's full details, their reporting chain up to the CEO, and their direct reports. -->
<script setup>
import { computed } from 'vue' // Derived values.
import { formatMoney, formatRatio, formatCount } from '../data/format.js' // Labels.
import { departmentColor } from '../data/departmentColors.js' // Department colour.
import { useOrg } from '../composables/useOrg.js' // Shared state and actions.

const { org, selectedId, select, revealPerson } = useOrg() // Who's selected, and how to jump to others.
const person = computed(() => (selectedId.value ? org.value.byId.get(selectedId.value) : null)) // O(1) lookup of the selected person.
const chain = computed(() => { // Reporting chain: CEO -> ... -> their manager.
  const path = [] // Bosses found so far.
  for (let boss = person.value?.parent; boss; boss = boss.parent) path.push(boss) // Walk parent pointers up: O(depth).
  return path.reverse() // Reverse so it reads top-down, like a breadcrumb.
}) // End of chain.

/**
 * Show someone else: open the path to them, highlight them, and show their details.
 * @param {string} id - Who to jump to.
 */
function goTo(id) { // Used by the chain and the direct-reports list.
  revealPerson(id) // Open the path + glow + pan.
  select(id) // Switch the drawer to them.
} // End of goTo.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the drawer shows. -->
  <aside v-if="person" class="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl" aria-label="Person details" @keydown.esc="select(null)"> <!-- Slides over the right side; Escape closes it. -->
    <div class="flex items-start justify-between gap-3 border-b border-slate-100 p-5"> <!-- Top: name + close. -->
      <div class="min-w-0"> <!-- Name block. -->
        <p class="truncate text-lg font-semibold text-slate-900">{{ person.name }}</p> <!-- Name. -->
        <p class="truncate text-sm text-slate-500">{{ person.title }}</p> <!-- Title. -->
        <div v-if="!person.synthetic" class="mt-2 flex flex-wrap gap-1 text-xs"> <!-- Pills. -->
          <span class="rounded-full px-2 py-0.5" :class="departmentColor(person.department).pill">{{ person.department }}</span> <!-- Department. -->
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{{ person.location }}</span> <!-- Location. -->
          <span v-if="person.level" class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">L{{ person.level }}</span> <!-- Level. -->
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{{ person.id }}</span> <!-- Employee ID. -->
        </div> <!-- End of pills. -->
      </div> <!-- End of name block. -->
      <button type="button" class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close details" @click="select(null)">✕</button> <!-- Close. -->
    </div> <!-- End of top. -->

    <div class="flex-1 space-y-6 overflow-auto p-5 text-sm"> <!-- Scrollable body. -->
      <dl class="grid grid-cols-2 gap-x-4 gap-y-2"> <!-- Numbers in two columns. -->
        <dt class="text-slate-500">Own salary</dt><dd class="text-right font-medium">{{ formatMoney(person.salary) }}</dd> <!-- Their pay. -->
        <dt class="text-slate-500">Direct reports</dt><dd class="text-right font-medium">{{ formatCount(person.children.length) }}</dd> <!-- Team size. -->
        <dt class="text-slate-500">Total descendants</dt><dd class="text-right font-medium">{{ formatCount(person.desc) }}</dd> <!-- Everyone below. -->
        <dt class="text-slate-500">Managers below</dt><dd class="text-right font-medium">{{ formatCount(person.nonLeafDesc) }}</dd> <!-- Non-leaf descendants. -->
        <dt class="text-slate-500">Management cost</dt><dd class="text-right font-medium">{{ formatMoney(person.mgmtCost) }}</dd> <!-- Managers' salaries below. -->
        <dt class="text-slate-500">IC cost</dt><dd class="text-right font-medium">{{ formatMoney(person.icCost) }}</dd> <!-- ICs' salaries below. -->
        <dt class="text-slate-500">Total cost</dt><dd class="text-right font-semibold">{{ formatMoney(person.totalCost) }}</dd> <!-- Everyone below. -->
        <dt class="text-slate-500">Mgmt cost ratio</dt><dd class="text-right font-medium">{{ formatRatio(person.ratio) }}</dd> <!-- Mgmt ÷ IC cost. -->
      </dl> <!-- End of numbers. -->

      <section v-if="chain.length > 0"> <!-- Reporting chain (not for the CEO). -->
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Reporting chain</p> <!-- Heading. -->
        <ol class="flex flex-wrap items-center gap-1"> <!-- Breadcrumb: CEO › VP › … -->
          <li v-for="boss in chain" :key="boss.id" class="flex items-center gap-1"> <!-- One boss. -->
            <button type="button" class="rounded px-1 text-indigo-700 hover:bg-indigo-50 hover:underline" @click="goTo(boss.id)">{{ boss.name }}</button> <!-- Click to jump to them. -->
            <span class="text-slate-300">›</span> <!-- Separator. -->
          </li> <!-- End of one boss. -->
          <li class="font-medium text-slate-900">{{ person.name }}</li> <!-- The selected person, last. -->
        </ol> <!-- End of breadcrumb. -->
      </section> <!-- End of chain. -->

      <section v-if="person.children.length > 0"> <!-- Direct reports list. -->
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Direct reports ({{ person.children.length }})</p> <!-- Heading. -->
        <ul class="divide-y divide-slate-100 rounded-lg border border-slate-100"> <!-- One row each. -->
          <li v-for="child in person.children" :key="child.id"> <!-- One report. -->
            <button type="button" class="flex w-full justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50" @click="goTo(child.id)"> <!-- Click to jump to them. -->
              <span class="min-w-0"><span class="block truncate font-medium text-slate-900">{{ child.name }}</span><span class="block truncate text-xs text-slate-500">{{ child.title }}</span></span> <!-- Name + title. -->
              <span class="shrink-0 text-xs text-slate-500">{{ child.isLeaf ? formatMoney(child.salary) : `${formatCount(child.desc)} below` }}</span> <!-- IC: salary; manager: team size. -->
            </button> <!-- End of row. -->
          </li> <!-- End of one report. -->
        </ul> <!-- End of list. -->
      </section> <!-- End of direct reports. -->
    </div> <!-- End of body. -->
  </aside> <!-- End of drawer. -->
</template> <!-- End of what the drawer shows. -->
