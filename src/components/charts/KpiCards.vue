<!-- Six headline numbers for the selected department, or the whole company. -->
<script setup>
import { computed } from 'vue'
import { formatMoney, formatCount } from '../../data/format.js'

const props = defineProps({ people: { type: Array, required: true } })

const cards = computed(() => {
  const managers = props.people.filter((p) => !p.isLeaf)
  const salary = props.people.reduce((sum, p) => sum + p.salary, 0)
  const managerSalary = managers.reduce((sum, p) => sum + p.salary, 0)
  const span = managers.length ? managers.reduce((sum, p) => sum + p.children.length, 0) / managers.length : 0
  const layers = new Set(props.people.map((p) => p.depth)).size
  return [
    { label: 'Headcount', value: formatCount(props.people.length), note: 'people in view' },
    { label: 'Total salary cost', value: formatMoney(salary), note: 'sum of every salary' },
    { label: 'Managers', value: formatCount(managers.length), note: `${((managers.length / Math.max(props.people.length, 1)) * 100).toFixed(1)}% of headcount` },
    { label: 'Management cost share', value: `${((managerSalary / Math.max(salary, 1)) * 100).toFixed(1)}%`, note: 'of salary goes to managers' },
    { label: 'Avg span of control', value: span.toFixed(1), note: 'direct reports per manager' },
    { label: 'Layers', value: formatCount(layers), note: 'levels from the top' },
  ]
})
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
    <div v-for="card in cards" :key="card.label" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-medium text-slate-500">{{ card.label }}</p>
      <p class="mt-1 text-2xl font-semibold text-slate-900">{{ card.value }}</p>
      <p class="mt-1 text-xs text-slate-400">{{ card.note }}</p>
    </div>
  </div>
</template>
