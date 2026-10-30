<!-- "Org chart" tab: the zoomable canvas on wide screens, the indented list on phones, plus the details drawer. -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import OrgCanvas from '../components/OrgCanvas.vue'
import OrgNode from '../components/OrgNode.vue'
import OrgList from '../components/OrgList.vue'
import PersonDrawer from '../components/PersonDrawer.vue'
import { useOrg } from '../composables/useOrg.js'

const { org } = useOrg()
// Below 768 px (Tailwind's md) a wide tree doesn't fit. v-if, not CSS, so only one layout is ever mounted.
const narrow = ref(window.innerWidth < 768)
const onResize = () => { narrow.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div class="relative h-full">
    <div v-if="narrow" class="h-full overflow-auto bg-white">
      <ul><OrgList :person="org.root" /></ul>
    </div>
    <OrgCanvas v-else>
      <ul class="org-tree"><OrgNode :person="org.root" /></ul>
    </OrgCanvas>
    <PersonDrawer />
  </div>
</template>
