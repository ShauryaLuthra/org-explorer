<!-- MoreCard.vue: the "Show 24 more (N remaining)" button that sits at the end of a wide team. -->
<script setup>
defineProps({ // Inputs from OrgNode.
  remaining: { type: Number, required: true }, // How many reports are still hidden.
  step: { type: Number, required: true }, // How many one click reveals (24).
}) // End of props.
defineEmits(['more']) // Event sent up when clicked.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What it shows. -->
  <button
    type="button"
    class="flex w-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    @click="$emit('more')"
  > <!-- A real <button>, so keyboard users can press it. -->
    <span class="font-medium">Show {{ Math.min(step, remaining) }} more</span> <!-- Never promise more than exist. -->
    <span class="text-xs text-slate-400">{{ remaining }} remaining</span> <!-- How many are hidden in total. -->
  </button> <!-- End of button. -->
</template> <!-- End of what it shows. -->
