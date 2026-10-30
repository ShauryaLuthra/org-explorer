<!-- Header badge ("Data OK" or "N data issues"). Click it to see what the loader found and how each problem was handled. -->
<script setup>
import { ref, computed } from 'vue'
import { useOrg } from '../composables/useOrg.js'

const { org } = useOrg()
const open = ref(false)
const LABELS = { 'duplicate-id': 'Duplicate IDs (kept first row)', 'missing-manager': 'Unknown manager (moved to Unassigned)', 'multiple-roots': 'Several top people (grouped under Giga Corp)', cycle: 'Reporting loops (cut, moved to Unassigned)', 'invalid-salary': 'Blank/invalid salary (used 0)' }

// PapaParse rows are 0-based and exclude the header, hence row + 2 to match the file's line numbers.
const issues = computed(() => [...org.value.issues, ...org.value.parseErrors.map((e) => ({ type: 'parse', message: `Row ${e.row + 2}: ${e.message}` }))])
const counts = computed(() => {
  const byType = new Map()
  for (const issue of issues.value) byType.set(issue.type, (byType.get(issue.type) ?? 0) + 1)
  return [...byType]
})
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="rounded-full px-3 py-1 text-xs font-medium ring-1"
      :class="issues.length === 0 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-amber-200'"
      :aria-expanded="open"
      @click="open = !open"
    >{{ issues.length === 0 ? 'Data OK' : `${issues.length} data issues` }}</button>
    <div v-if="open" class="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg">
      <p class="font-semibold text-slate-900">Data quality</p>
      <p v-if="issues.length === 0" class="mt-1 text-slate-600">No problems found: no duplicate IDs, missing managers, loops or bad salaries.</p>
      <ul v-else class="mt-2 space-y-1">
        <li v-for="[type, count] in counts" :key="type" class="flex justify-between gap-3"><span class="text-slate-600">{{ LABELS[type] ?? 'Unreadable rows' }}</span><span class="font-medium">{{ count }}</span></li>
      </ul>
      <ul v-if="issues.length > 0" class="mt-3 max-h-40 space-y-1 overflow-auto border-t border-slate-100 pt-2 text-xs text-slate-500">
        <li v-for="(issue, index) in issues.slice(0, 20)" :key="index">{{ issue.message }}</li>
      </ul>
    </div>
  </div>
</template>
