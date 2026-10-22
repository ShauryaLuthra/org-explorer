<!-- SearchBox.vue: type a name or title; after a 150 ms pause, show the top 10 matches; choosing one opens the path to that person and highlights them. -->
<script setup>
import { ref, watch } from 'vue' // ref = a value the screen reacts to; watch = run code when a value changes.
import { departmentColor } from '../data/departmentColors.js' // Department colour for each result's pill.
import { useOrg } from '../composables/useOrg.js' // Shared state and actions.

const { searchText, search, revealPerson, select } = useOrg() // What search needs.
const results = ref([]) // The current top-10 matches.
const activeIndex = ref(0) // Which result the arrow keys are on.
let timer = null // The pending "search after 150 ms" timer.

watch(searchText, (text) => { // Every keystroke changes searchText...
  clearTimeout(timer) // ...cancel the previous pending search...
  timer = setTimeout(() => { results.value = search(text); activeIndex.value = 0 }, 150) // ...and only search once typing pauses for 150 ms (debounce).
}) // End of watch.

/**
 * Jump to a chosen person: open their path, glow, open their details, and clear the box.
 * @param {Object} person - The chosen result.
 */
function choose(person) { // Click or Enter on a result.
  revealPerson(person.id) // Expand every manager above them and highlight the card (the canvas pans to it).
  select(person.id) // Open their details in the drawer.
  searchText.value = '' // Clear the box...
  results.value = [] // ...and close the dropdown.
} // End of choose.

/**
 * Arrow keys move through results, Enter chooses, Escape closes.
 * @param {KeyboardEvent} event - The key press.
 */
function onKey(event) { // Keyboard support.
  if (event.key === 'ArrowDown') { activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1); event.preventDefault() } // Next result.
  else if (event.key === 'ArrowUp') { activeIndex.value = Math.max(activeIndex.value - 1, 0); event.preventDefault() } // Previous result.
  else if (event.key === 'Enter' && results.value[activeIndex.value]) choose(results.value[activeIndex.value]) // Choose the highlighted one.
  else if (event.key === 'Escape') { searchText.value = ''; results.value = [] } // Close.
} // End of onKey.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the search box shows. -->
  <div class="relative w-full max-w-sm"> <!-- relative = the dropdown is positioned under this box. -->
    <input
      v-model="searchText"
      type="search"
      placeholder="Search name or title…"
      aria-label="Search people"
      class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
      @keydown="onKey"
    /> <!-- v-model keeps searchText and the box's text in sync both ways. -->
    <ul v-if="results.length > 0" class="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"> <!-- Dropdown, floating above the page (z-30). -->
      <li v-for="(person, index) in results" :key="person.id"> <!-- One row per match. -->
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
          :class="index === activeIndex ? 'bg-slate-50' : ''"
          @mousedown.prevent="choose(person)"
        > <!-- mousedown (not click) so it fires before the input loses focus. -->
          <span class="min-w-0"><span class="block truncate font-medium text-slate-900">{{ person.name }}</span><span class="block truncate text-xs text-slate-500">{{ person.title }}</span></span> <!-- Name + title. -->
          <span class="shrink-0 rounded-full px-2 py-0.5 text-xs" :class="departmentColor(person.department).pill">{{ person.department }}</span> <!-- Department pill. -->
        </button> <!-- End of row. -->
      </li> <!-- End of one match. -->
    </ul> <!-- End of dropdown. -->
  </div> <!-- End of search box. -->
</template> <!-- End of what the search box shows. -->
