<!-- KpiCards.vue: six headline numbers for the selected department (or the whole company). -->
<script setup>
import { computed } from 'vue' // Derived values.
import { formatMoney, formatCount } from '../../data/format.js' // Labels.

const props = defineProps({ people: { type: Array, required: true } }) // Everyone in the current filter.

const cards = computed(() => { // Work out all six numbers in one pass-style block.
  const managers = props.people.filter((p) => !p.isLeaf) // People with at least one report.
  const salary = props.people.reduce((sum, p) => sum + p.salary, 0) // Total salary cost.
  const managerSalary = managers.reduce((sum, p) => sum + p.salary, 0) // Of which, paid to managers.
  const span = managers.length ? managers.reduce((sum, p) => sum + p.children.length, 0) / managers.length : 0 // Average direct reports per manager.
  const layers = new Set(props.people.map((p) => p.depth)).size // How many distinct levels these people sit on.
  return [ // One entry per card: label, big value, small explanation.
    { label: 'Headcount', value: formatCount(props.people.length), note: 'people in view' }, // How many people.
    { label: 'Total salary cost', value: formatMoney(salary), note: 'sum of every salary' }, // Total pay.
    { label: 'Managers', value: formatCount(managers.length), note: `${((managers.length / Math.max(props.people.length, 1)) * 100).toFixed(1)}% of headcount` }, // How many managers.
    { label: 'Management cost share', value: `${((managerSalary / Math.max(salary, 1)) * 100).toFixed(1)}%`, note: 'of salary goes to managers' }, // Share of pay going to managers.
    { label: 'Avg span of control', value: span.toFixed(1), note: 'direct reports per manager' }, // Team size.
    { label: 'Layers', value: formatCount(layers), note: 'levels from the top' }, // Depth of the org.
  ] // End of cards.
}) // End of computed.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the KPI row shows. -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"> <!-- 2 per row on phones, 3 on tablets, 6 on desktop. -->
    <div v-for="card in cards" :key="card.label" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"> <!-- One card. -->
      <p class="text-xs font-medium text-slate-500">{{ card.label }}</p> <!-- Label. -->
      <p class="mt-1 text-2xl font-semibold text-slate-900">{{ card.value }}</p> <!-- Big number. -->
      <p class="mt-1 text-xs text-slate-400">{{ card.note }}</p> <!-- What it means. -->
    </div> <!-- End of card. -->
  </div> <!-- End of KPI row. -->
</template> <!-- End of what the KPI row shows. -->
