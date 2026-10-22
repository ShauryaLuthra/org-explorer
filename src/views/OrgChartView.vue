<!-- OrgChartView.vue: the "Org chart" tab: the zoomable canvas on wide screens, the indented list on phones, plus the details drawer. -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue' // Vue helpers.
import OrgCanvas from '../components/OrgCanvas.vue' // Pan/zoom area.
import OrgNode from '../components/OrgNode.vue' // Recursive tree node.
import OrgList from '../components/OrgList.vue' // Phone layout.
import PersonDrawer from '../components/PersonDrawer.vue' // Details panel.
import { useOrg } from '../composables/useOrg.js' // Shared state.

const { org } = useOrg() // The loaded tree.
const narrow = ref(window.innerWidth < 768) // Phone-sized screen? (768 px = Tailwind's "md" breakpoint.)
const onResize = () => { narrow.value = window.innerWidth < 768 } // Re-check when the window changes size.
onMounted(() => window.addEventListener('resize', onResize)) // Start listening.
onBeforeUnmount(() => window.removeEventListener('resize', onResize)) // Stop listening when this view goes away.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the tab shows. -->
  <div class="relative h-full"> <!-- relative = the drawer is positioned inside this area. -->
    <div v-if="narrow" class="h-full overflow-auto bg-white"> <!-- Phone: scrollable list. -->
      <ul><OrgList :person="org.root" /></ul> <!-- Start at the root; it draws everything open below it. -->
    </div> <!-- End of phone layout. -->
    <OrgCanvas v-else> <!-- Desktop: everything inside goes into the canvas's <slot />. -->
      <ul class="org-tree"><OrgNode :person="org.root" /></ul> <!-- style.css draws connector lines inside .org-tree. -->
    </OrgCanvas> <!-- End of canvas. -->
    <PersonDrawer /> <!-- Shows itself when someone is selected. -->
  </div> <!-- End of the tab. -->
</template> <!-- End of what the tab shows. -->
