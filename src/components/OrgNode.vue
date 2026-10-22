<!-- OrgNode.vue: one person plus (if expanded) their team. It uses ITSELF for each team member, so the tree draws itself level by level. -->
<script setup>
import { computed } from 'vue' // Derived values.
import PersonCard from './PersonCard.vue' // The card.
import MoreCard from './MoreCard.vue' // The "Show more" button.
import { useOrg } from '../composables/useOrg.js' // Shared state: expanded Set, visible counts, highlight.

const props = defineProps({ person: { type: Object, required: true } }) // The person this node draws.
const { expanded, highlightedId, toggle, visibleCount, showMore, select } = useOrg() // Shared state and actions.

const isOpen = computed(() => expanded.has(props.person.id)) // O(1) Set lookup: are this person's reports showing?
const shownChildren = computed(() => props.person.children.slice(0, visibleCount(props.person.id))) // Only the first 12 (or more after "Show more"): never render more than needed.
const remaining = computed(() => props.person.children.length - shownChildren.value.length) // How many are still hidden.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What one node shows. -->
  <li> <!-- One person in the tree; the connector lines are drawn on this <li> by style.css. -->
    <PersonCard :person="person" :expanded="isOpen" :highlighted="highlightedId === person.id" @toggle="toggle" @select="select" /> <!-- The card; its events go straight to the shared actions. -->
    <ul v-if="isOpen && person.children.length > 0"> <!-- The team row, only when expanded (collapsed teams aren't rendered at all). -->
      <OrgNode v-for="child in shownChildren" :key="child.id" :person="child" /> <!-- RECURSION: each child is drawn by this same component. :key helps Vue track each one. -->
      <li v-if="remaining > 0"><MoreCard :remaining="remaining" :step="24" @more="showMore(person.id)" /></li> <!-- "Show more" at the end of wide teams. -->
    </ul> <!-- End of team row. -->
  </li> <!-- End of this node. -->
</template> <!-- End of what one node shows. -->
