<!-- The "Cost analysis" tab: a department filter, KPI cards and four charts that answer "where does the money go, and is the structure efficient?". -->
<script setup>
import { computed } from 'vue'
import KpiCards from '../components/charts/KpiCards.vue'
import CostByDepartment from '../components/charts/CostByDepartment.vue'
import SpanOfControl from '../components/charts/SpanOfControl.vue'
import LayersPyramid from '../components/charts/LayersPyramid.vue'
import CostTreemap from '../components/charts/CostTreemap.vue'
import { formatCount } from '../data/format.js'
import { useOrg } from '../composables/useOrg.js'

const { org, departmentFilter } = useOrg()
const departments = computed(() => [...new Set(org.value.order.filter((p) => !p.synthetic).map((p) => p.department))].sort())
// Every chart gets the same filtered list; placeholder nodes aren't people, so they're excluded.
const people = computed(() => org.value.order.filter((p) => !p.synthetic && (departmentFilter.value === '' || p.department === departmentFilter.value)))
</script>

<template>
  <div class="h-full overflow-auto">
    <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div class="flex flex-wrap items-center gap-3">
        <label for="dept" class="text-sm font-medium text-slate-700">Department</label>
        <select id="dept" v-model="departmentFilter" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100">
          <option value="">All departments</option>
          <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
        </select>
        <span class="text-sm text-slate-500">{{ formatCount(people.length) }} people</span>
      </div>
      <KpiCards :people="people" />
      <div class="grid gap-6 lg:grid-cols-2">
        <CostByDepartment :people="people" />
        <LayersPyramid :people="people" />
      </div>
      <SpanOfControl :people="people" />
      <CostTreemap />
    </div>
  </div>
</template>
