<!-- "Show 24 more (N remaining)" button at the end of a wide team. -->
<script setup>
defineProps({
  remaining: { type: Number, required: true },
  step: { type: Number, required: true },
})
defineEmits(['more'])
</script>

<template>
  <button
    type="button"
    class="flex w-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    @click="$emit('more')"
  >
    <span class="font-medium">Show {{ Math.min(step, remaining) }} more</span>
    <span class="text-xs text-slate-400">{{ remaining }} remaining</span>
  </button>
</template>
