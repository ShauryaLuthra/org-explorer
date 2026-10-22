<!-- PersonCard.vue: one person's card. Managers show cost rows and an expand button; individual contributors show their salary. -->
<script setup>
import { computed } from 'vue' // computed = a value derived from others, recalculated only when they change.
import { formatMoney, formatRatio, formatCount, initials } from '../data/format.js' // Number/label helpers.
import { departmentColor } from '../data/departmentColors.js' // Department -> colour classes.

const props = defineProps({ // Inputs this card receives from its parent (OrgNode).
  person: { type: Object, required: true }, // The person to show.
  expanded: { type: Boolean, default: false }, // Are their reports currently showing?
  highlighted: { type: Boolean, default: false }, // Should the card glow (search result)?
}) // End of props.
const emit = defineEmits(['toggle', 'select']) // Events this card sends up: "open/close my reports" and "show my details".

const colour = computed(() => departmentColor(props.person.department)) // This department's colour classes.
const icCount = computed(() => props.person.desc - props.person.nonLeafDesc) // Individual contributors below this person.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the card shows. -->
  <div
    :data-id="person.id"
    role="button"
    tabindex="0"
    class="w-72 cursor-pointer rounded-xl border border-slate-200 p-4 text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    :class="[person.synthetic ? 'border-dashed bg-white' : colour.tint, highlighted ? 'ring-4 ring-amber-400' : '']"
    @click="emit('select', person.id)"
    @keydown.enter.prevent="emit('select', person.id)"
    @keydown.space.prevent="emit('select', person.id)"
  > <!-- Card body. data-id lets the canvas find it; role/tabindex make it keyboard-usable; :class adds the department tint and the search glow; click/Enter/Space open the drawer. -->
    <div class="flex items-center gap-3"> <!-- Top row: avatar + name/title. -->
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" :class="colour.avatar">{{ initials(person.name) }}</div> <!-- Initials circle in the department colour. -->
      <div class="min-w-0"> <!-- Name and title; min-w-0 lets long text shorten with "…". -->
        <p class="truncate font-semibold text-slate-900">{{ person.name }}</p> <!-- Name. -->
        <p class="truncate text-sm text-slate-500">{{ person.title }}</p> <!-- Job title. -->
      </div> <!-- End of name and title. -->
    </div> <!-- End of top row. -->

    <div v-if="!person.synthetic" class="mt-3 flex flex-wrap gap-1 text-xs"> <!-- Pills (not for placeholders). -->
      <span class="rounded-full px-2 py-0.5" :class="colour.pill">{{ person.department }}</span> <!-- Department pill. -->
      <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{{ person.location }}</span> <!-- Location pill. -->
      <span v-if="person.level" class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">L{{ person.level }}</span> <!-- Level pill, only if the file has one. -->
    </div> <!-- End of pills. -->

    <dl v-if="!person.isLeaf" class="mt-3 space-y-1 text-sm"> <!-- Cost rows: managers only. dl = a list of label/value pairs. -->
      <div class="flex justify-between"><dt class="text-slate-500">Management cost</dt><dd class="font-medium text-slate-900">{{ formatMoney(person.mgmtCost) }}</dd></div> <!-- Salaries of managers below. -->
      <div class="flex justify-between"><dt class="text-slate-500">IC cost</dt><dd class="font-medium text-slate-900">{{ formatMoney(person.icCost) }}</dd></div> <!-- Salaries of individual contributors below. -->
      <div class="flex justify-between"><dt class="text-slate-500">Total cost</dt><dd class="font-semibold text-slate-900">{{ formatMoney(person.totalCost) }}</dd></div> <!-- Everyone below (not their own salary). -->
      <div class="flex justify-between"> <!-- Ratio row with an info icon. -->
        <dt class="text-slate-500">Mgmt cost ratio <span class="cursor-help text-slate-400" title="Management cost ÷ IC cost">ⓘ</span></dt> <!-- Hovering the ⓘ shows the formula (title = native tooltip). -->
        <dd class="font-medium text-slate-900">{{ formatRatio(person.ratio) }}</dd> <!-- e.g. 0.74, or – when there are no ICs. -->
      </div> <!-- End of ratio row. -->
      <div class="flex justify-between gap-2"><dt class="text-slate-500">Mgmt : IC headcount</dt><dd class="whitespace-nowrap font-medium text-slate-900">{{ formatCount(person.nonLeafDesc) }} : {{ formatCount(icCount) }}</dd></div> <!-- Managers below : ICs below (never wraps). -->
    </dl> <!-- End of cost rows. -->

    <div v-else-if="!person.synthetic" class="mt-3 flex justify-between text-sm"> <!-- Individual contributors instead show their own salary. -->
      <span class="text-slate-500">Individual contributor</span> <!-- Label. -->
      <span class="font-medium text-slate-900">{{ formatMoney(person.salary) }}</span> <!-- Their salary. -->
    </div> <!-- End of IC row. -->

    <div v-if="!person.isLeaf" class="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-3"> <!-- Footer: counts + expand button. -->
      <div class="text-xs text-slate-600"> <!-- Counts. -->
        <span class="rounded-md bg-white/80 px-1.5 py-0.5 font-medium ring-1 ring-slate-200">{{ person.children.length }} / {{ formatCount(person.desc) }}</span> <!-- Direct reports / total descendants. -->
        <span class="ml-2">{{ formatCount(person.nonLeafDesc) }} managers</span> <!-- Non-leaf descendants. -->
      </div> <!-- End of counts. -->
      <button
        type="button"
        class="rounded-full p-1 text-slate-500 hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        :aria-expanded="expanded"
        :aria-label="expanded ? 'Collapse team' : 'Expand team'"
        @click.stop="emit('toggle', person.id)"
        @keydown.stop
      > <!-- Expand/collapse button. aria-* tells screen readers its state; .stop stops the click also opening the drawer. -->
        <svg class="h-5 w-5 transition-transform" :class="expanded ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg> <!-- Chevron icon; flips upside down when expanded. -->
      </button> <!-- End of expand button. -->
    </div> <!-- End of footer. -->
  </div> <!-- End of card. -->
</template> <!-- End of what the card shows. -->
