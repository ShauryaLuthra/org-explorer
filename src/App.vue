<!-- App.vue: the page frame: header, the active tab, and the footer with load time. Loads the data on start. -->
<script setup>
import { onMounted } from 'vue' // Runs code once the page has appeared.
import AppHeader from './components/AppHeader.vue' // Name, tabs, search, data badge, upload.
import OrgChartView from './views/OrgChartView.vue' // Org chart tab.
import CostAnalysisView from './views/CostAnalysisView.vue' // Cost analysis tab.
import { formatCount } from './data/format.js' // "40,000".
import { useOrg } from './composables/useOrg.js' // Shared state and actions.

const { org, status, errorMessage, timings, activeTab, loadBundled } = useOrg() // What the frame needs.
onMounted(loadBundled) // Load the bundled CSV as soon as the page appears.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the page shows. -->
  <div class="flex h-screen flex-col bg-slate-100 text-slate-900"> <!-- Full-height column: header, main, footer. -->
    <AppHeader /> <!-- Top bar. -->
    <main class="min-h-0 flex-1"> <!-- Takes all remaining height; min-h-0 lets it shrink so the canvas fits. -->
      <p v-if="status === 'loading'" class="p-6 text-slate-500">Loading…</p> <!-- While loading. -->
      <p v-else-if="status === 'error'" class="p-6 text-red-600">{{ errorMessage }}</p> <!-- If loading failed (e.g. an uploaded file is missing columns). -->
      <template v-else-if="status === 'ready'"> <!-- Once data is ready, show the active tab. -->
        <OrgChartView v-if="activeTab === 'org'" /> <!-- #org -->
        <CostAnalysisView v-else /> <!-- #cost -->
      </template> <!-- End of tabs. -->
    </main> <!-- End of main. -->
    <footer v-if="status === 'ready'" class="border-t border-slate-200 bg-white px-6 py-2 text-xs text-slate-500"> <!-- Footer, once loaded. -->
      Loaded {{ formatCount(org.order.length) }} people in {{ (timings.total / 1000).toFixed(2) }} s <!-- The brief's load-time line. -->
    </footer> <!-- End of footer. -->
  </div> <!-- End of page. -->
</template> <!-- End of what the page shows. -->
