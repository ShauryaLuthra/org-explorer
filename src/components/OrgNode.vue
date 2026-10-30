<!-- One person plus, if expanded, their team. Recursive: renders an OrgNode for each visible child. -->
<script setup>
import { computed } from 'vue'
import PersonCard from './PersonCard.vue'
import MoreCard from './MoreCard.vue'
import { useOrg, MORE_CHILDREN } from '../composables/useOrg.js'

const props = defineProps({ person: { type: Object, required: true } })
const { expanded, highlightedId, toggle, visibleCount, showMore, select } = useOrg()

const isOpen = computed(() => expanded.has(props.person.id))
const shownChildren = computed(() => props.person.children.slice(0, visibleCount(props.person.id)))
const remaining = computed(() => props.person.children.length - shownChildren.value.length)
</script>

<template>
  <li>
    <PersonCard :person="person" :expanded="isOpen" :highlighted="highlightedId === person.id" @toggle="toggle" @select="select" />
    <!-- Only expanded nodes render children, so the page holds dozens of cards, not 40,000. -->
    <ul v-if="isOpen && person.children.length > 0">
      <OrgNode v-for="child in shownChildren" :key="child.id" :person="child" />
      <li v-if="remaining > 0"><MoreCard :remaining="remaining" :step="MORE_CHILDREN" @more="showMore(person.id)" /></li>
    </ul>
  </li>
</template>
