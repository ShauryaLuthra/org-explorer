<!-- Page frame: header, the active tab, and a footer with the load time. Loads the bundled CSV on start. -->
<script setup>
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import OrgChartView from './views/OrgChartView.vue'
import CostAnalysisView from './views/CostAnalysisView.vue'
import { formatCount } from './data/format.js'
import { useOrg } from './composables/useOrg.js'

const { org, status, errorMessage, timings, activeTab, loadBundled } = useOrg()
onMounted(loadBundled)
</script>

<template>
  <div class="flex h-screen flex-col bg-slate-100 text-slate-900">
    <AppHeader />
    <div v-if="status === 'ready' && errorMessage" role="alert" class="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-700">
      <span>Couldn't load that file ({{ errorMessage }}). Still showing the previous data.</span>
      <button type="button" class="shrink-0 rounded px-2 py-0.5 font-medium hover:bg-red-100" @click="errorMessage = ''">Dismiss</button>
    </div>
    <main class="min-h-0 flex-1">
      <p v-if="status === 'loading'" class="p-6 text-slate-500">Loading…</p>
      <p v-else-if="status === 'error'" role="alert" class="p-6 text-red-600">Couldn't load the data: {{ errorMessage }}</p>
      <template v-else-if="status === 'ready'">
        <OrgChartView v-if="activeTab === 'org'" />
        <CostAnalysisView v-else />
      </template>
    </main>
    <footer v-if="status === 'ready'" class="border-t border-slate-200 bg-white px-6 py-2 text-xs text-slate-500">
      Loaded {{ formatCount(org.order.length) }} people in {{ (timings.total / 1000).toFixed(2) }} s
    </footer>
  </div>
</template>
