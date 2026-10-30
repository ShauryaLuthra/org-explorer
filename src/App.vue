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
    <main class="min-h-0 flex-1">
      <p v-if="status === 'loading'" class="p-6 text-slate-500">Loading…</p>
      <p v-else-if="status === 'error'" class="p-6 text-red-600">{{ errorMessage }}</p>
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
