<!-- App.vue: the top-level screen. For now it loads the data and shows a summary, proving the whole pipeline works in the browser. -->
<script setup>
import { onMounted } from 'vue' // A Vue "hook": runs code once this screen has appeared on the page.
import { useOrg } from './composables/useOrg.js' // Our shared state and actions.

const { org, status, errorMessage, timings, loadBundled } = useOrg() // Take only what this screen needs (destructuring, like Python unpacking).
onMounted(loadBundled) // As soon as the screen appears, download and process the bundled CSV.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What this screen shows. -->
  <main class="min-h-screen bg-slate-100 p-8"> <!-- Light grey full-height page with padding. -->
    <h1 class="text-2xl font-semibold text-slate-800">Org Explorer</h1> <!-- Product name. -->
    <p v-if="status === 'loading'" class="mt-4 text-slate-500">Loading…</p> <!-- v-if: only shown while loading. -->
    <p v-else-if="status === 'error'" class="mt-4 text-red-600">{{ errorMessage }}</p> <!-- Shown if loading failed; {{ }} prints a value. -->
    <div v-else-if="status === 'ready'" class="mt-4 space-y-1 text-slate-700"> <!-- Shown once the data is ready. -->
      <p>Top of the tree: {{ org.root.name }} ({{ org.root.title }})</p> <!-- The root person. -->
      <p>Direct reports: {{ org.root.children.length }} · Total cost below: ${{ org.root.totalCost.toLocaleString() }}</p> <!-- Proves aggregate ran; toLocaleString adds thousands commas. -->
      <p>Data problems found: {{ org.issues.length }}</p> <!-- Proves buildTree's report reached the screen. -->
      <p class="text-sm text-slate-500">Loaded {{ org.byId.size.toLocaleString() }} people in {{ (timings.total / 1000).toFixed(2) }} s</p> <!-- The footer line the brief asks for (ms -> s, 2 decimals). -->
    </div> <!-- End of the ready state. -->
  </main> <!-- End of the page. -->
</template> <!-- End of what this screen shows. -->
