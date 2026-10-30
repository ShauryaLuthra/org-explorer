<!-- Product name, the two tabs, search, the data-quality badge and the Upload CSV button. -->
<script setup>
import { ref } from 'vue'
import SearchBox from './SearchBox.vue'
import DataQualityPanel from './DataQualityPanel.vue'
import { useOrg } from '../composables/useOrg.js'

const { activeTab, setTab, loadFile, status } = useOrg()
const fileInput = ref(null)
const TABS = [{ id: 'org', label: 'Org chart' }, { id: 'cost', label: 'Cost analysis' }]

// An uploaded CSV goes through the same pipeline as the bundled file.
function onFile(event) {
  const file = event.target.files[0]
  if (file) loadFile(file)
  event.target.value = '' // Lets the same file be chosen again.
}
</script>

<template>
  <header class="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
    <h1 class="text-lg font-semibold text-slate-900">Org Explorer</h1>
    <nav class="flex rounded-lg bg-slate-100 p-1 text-sm" aria-label="Views">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        type="button"
        class="rounded-md px-3 py-1"
        :class="activeTab === tab.id ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        :aria-current="activeTab === tab.id ? 'page' : undefined"
        @click="setTab(tab.id)"
      >{{ tab.label }}</button>
    </nav>
    <div class="order-last w-full sm:order-none sm:ml-4 sm:w-auto sm:flex-1"><SearchBox v-if="status === 'ready'" /></div>
    <div class="ml-auto flex items-center gap-2">
      <DataQualityPanel v-if="status === 'ready'" />
      <button type="button" class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700" @click="fileInput.click()">Upload CSV</button>
      <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden" @change="onFile" />
    </div>
  </header>
</template>
