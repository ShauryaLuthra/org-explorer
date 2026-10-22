<!-- DataQualityPanel.vue: a badge in the header ("Data OK" or "N issues"); click it to see what buildTree found and what it did about each problem. -->
<script setup>
import { ref, computed } from 'vue' // Reactive value + derived values.
import { useOrg } from '../composables/useOrg.js' // Shared state.

const { org } = useOrg() // The loaded data (issues live on it).
const open = ref(false) // Is the details popover showing?
const LABELS = { 'duplicate-id': 'Duplicate IDs (kept first row)', 'missing-manager': 'Unknown manager (moved to Unassigned)', 'multiple-roots': 'Several top people (grouped under Giga Corp)', cycle: 'Reporting loops (cut, moved to Unassigned)', 'invalid-salary': 'Blank/invalid salary (used 0)' } // Plain-English name for each problem type.

const issues = computed(() => [...org.value.issues, ...org.value.parseErrors.map((e) => ({ type: 'parse', message: `Row ${e.row + 2}: ${e.message}` }))]) // buildTree's problems plus PapaParse's row problems (+2: header row and 1-based numbering).
const counts = computed(() => { // How many of each type.
  const byType = new Map() // type -> count.
  for (const issue of issues.value) byType.set(issue.type, (byType.get(issue.type) ?? 0) + 1) // Count each one.
  return [...byType] // As a list of [type, count] pairs.
}) // End of counts.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the badge shows. -->
  <div class="relative"> <!-- Anchor for the popover. -->
    <button
      type="button"
      class="rounded-full px-3 py-1 text-xs font-medium ring-1"
      :class="issues.length === 0 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-amber-200'"
      :aria-expanded="open"
      @click="open = !open"
    >{{ issues.length === 0 ? 'Data OK' : `${issues.length} data issues` }}</button> <!-- Green when clean, amber when not. -->
    <div v-if="open" class="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg"> <!-- Popover. -->
      <p class="font-semibold text-slate-900">Data quality</p> <!-- Title. -->
      <p v-if="issues.length === 0" class="mt-1 text-slate-600">No problems found: no duplicate IDs, missing managers, loops or bad salaries.</p> <!-- Clean file. -->
      <ul v-else class="mt-2 space-y-1"> <!-- Counts per type. -->
        <li v-for="[type, count] in counts" :key="type" class="flex justify-between gap-3"><span class="text-slate-600">{{ LABELS[type] ?? 'Unreadable rows' }}</span><span class="font-medium">{{ count }}</span></li> <!-- e.g. "Reporting loops … 2". -->
      </ul> <!-- End of counts. -->
      <ul v-if="issues.length > 0" class="mt-3 max-h-40 space-y-1 overflow-auto border-t border-slate-100 pt-2 text-xs text-slate-500"> <!-- First 20 exact messages, scrollable. -->
        <li v-for="(issue, index) in issues.slice(0, 20)" :key="index">{{ issue.message }}</li> <!-- e.g. "Cat (C) reports to unknown ID ZZZ…". -->
      </ul> <!-- End of messages. -->
    </div> <!-- End of popover. -->
  </div> <!-- End of badge. -->
</template> <!-- End of what the badge shows. -->
