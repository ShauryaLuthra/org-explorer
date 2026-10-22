<!-- CostAnalysisView.vue: the "Cost analysis" tab: a department filter, KPI cards and four charts that answer "where does the money go, and is the structure efficient?". -->
<script setup>
import { computed } from 'vue' // Derived values.
import KpiCards from '../components/charts/KpiCards.vue' // Headline numbers.
import CostByDepartment from '../components/charts/CostByDepartment.vue' // Mgmt vs IC cost per department.
import SpanOfControl from '../components/charts/SpanOfControl.vue' // Team-size distribution + narrow-span table.
import LayersPyramid from '../components/charts/LayersPyramid.vue' // People and cost per layer.
import CostTreemap from '../components/charts/CostTreemap.vue' // Drill-down cost map.
import { formatCount } from '../data/format.js' // "40,000".
import { useOrg } from '../composables/useOrg.js' // Shared state.

const { org, departmentFilter } = useOrg() // The tree and the shared filter.
const departments = computed(() => [...new Set(org.value.order.filter((p) => !p.synthetic).map((p) => p.department))].sort()) // Filter options, A-Z.
const people = computed(() => org.value.order.filter((p) => !p.synthetic && (departmentFilter.value === '' || p.department === departmentFilter.value))) // Real people in the current filter (placeholders excluded).
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the tab shows. -->
  <div class="h-full overflow-auto"> <!-- The tab scrolls vertically. -->
    <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-6"> <!-- Centred column with spacing. -->
      <div class="flex flex-wrap items-center gap-3"> <!-- Filter row, above all charts. -->
        <label for="dept" class="text-sm font-medium text-slate-700">Department</label> <!-- Label tied to the select. -->
        <select id="dept" v-model="departmentFilter" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"> <!-- v-model keeps the shared filter in sync. -->
          <option value="">All departments</option> <!-- '' = no filter. -->
          <option v-for="d in departments" :key="d" :value="d">{{ d }}</option> <!-- One option per department. -->
        </select> <!-- End of select. -->
        <span class="text-sm text-slate-500">{{ formatCount(people.length) }} people</span> <!-- How many are in view. -->
      </div> <!-- End of filter row. -->
      <KpiCards :people="people" /> <!-- Six headline numbers. -->
      <div class="grid gap-6 lg:grid-cols-2"> <!-- Two charts side by side on wide screens. -->
        <CostByDepartment :people="people" /> <!-- Where the money goes. -->
        <LayersPyramid :people="people" /> <!-- How deep and how wide. -->
      </div> <!-- End of two-up row. -->
      <SpanOfControl :people="people" /> <!-- Team sizes + action table. -->
      <CostTreemap /> <!-- Drill-down map (uses the filter directly). -->
    </div> <!-- End of column. -->
  </div> <!-- End of tab. -->
</template> <!-- End of what the tab shows. -->
