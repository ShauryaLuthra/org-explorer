<!-- AppHeader.vue: product name, the two tabs, search, the data-quality badge and the Upload CSV button. -->
<script setup>
import { ref } from 'vue' // For the hidden file input.
import SearchBox from './SearchBox.vue' // Search.
import DataQualityPanel from './DataQualityPanel.vue' // Data badge.
import { useOrg } from '../composables/useOrg.js' // Shared state and actions.

const { activeTab, setTab, loadFile, status } = useOrg() // Tabs and upload.
const fileInput = ref(null) // The hidden <input type="file">.
const TABS = [{ id: 'org', label: 'Org chart' }, { id: 'cost', label: 'Cost analysis' }] // The two views.

/**
 * Load the CSV the user picked, through the same pipeline as the bundled file.
 * @param {Event} event - The file input's change event.
 */
function onFile(event) { // Runs after a file is chosen.
  const file = event.target.files[0] // The chosen file (only one allowed).
  if (file) loadFile(file) // Parse, build, aggregate: same code path, so same column mapping and checks.
  event.target.value = '' // Reset so choosing the same file again still triggers.
} // End of onFile.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the header shows. -->
  <header class="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6"> <!-- Wraps onto two lines on narrow screens. -->
    <h1 class="text-lg font-semibold text-slate-900">Org Explorer</h1> <!-- Product name. -->
    <nav class="flex rounded-lg bg-slate-100 p-1 text-sm" aria-label="Views"> <!-- Tab switcher. -->
      <button
        v-for="tab in TABS"
        :key="tab.id"
        type="button"
        class="rounded-md px-3 py-1"
        :class="activeTab === tab.id ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        :aria-current="activeTab === tab.id ? 'page' : undefined"
        @click="setTab(tab.id)"
      >{{ tab.label }}</button> <!-- setTab writes #org / #cost into the URL. -->
    </nav> <!-- End of tabs. -->
    <div class="order-last w-full sm:order-none sm:ml-4 sm:w-auto sm:flex-1"><SearchBox v-if="status === 'ready'" /></div> <!-- Search: full width on phones, flexible on desktop. -->
    <div class="ml-auto flex items-center gap-2"> <!-- Right side. -->
      <DataQualityPanel v-if="status === 'ready'" /> <!-- Badge, once data exists. -->
      <button type="button" class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700" @click="fileInput.click()">Upload CSV</button> <!-- Opens the hidden file picker. -->
      <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden" @change="onFile" /> <!-- The real file picker, hidden. -->
    </div> <!-- End of right side. -->
  </header> <!-- End of header. -->
</template> <!-- End of what the header shows. -->
