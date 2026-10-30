<!-- Search by name or title. Choosing a result opens the path to that person and highlights them. -->
<script setup>
import { ref, watch } from 'vue'
import { departmentColor } from '../data/departmentColors.js'
import { useOrg } from '../composables/useOrg.js'

const { searchText, search, revealPerson, select } = useOrg()
const results = ref([])
const activeIndex = ref(0)
let timer = null

watch(searchText, (text) => {
  // Debounce: only search after a 150 ms pause in typing.
  clearTimeout(timer)
  timer = setTimeout(() => { results.value = search(text); activeIndex.value = 0 }, 150)
})

function choose(person) {
  revealPerson(person.id)
  select(person.id)
  searchText.value = ''
  results.value = []
}

// Arrow keys move through results, Enter chooses, Escape closes.
function onKey(event) {
  if (event.key === 'ArrowDown') { activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1); event.preventDefault() }
  else if (event.key === 'ArrowUp') { activeIndex.value = Math.max(activeIndex.value - 1, 0); event.preventDefault() }
  else if (event.key === 'Enter' && results.value[activeIndex.value]) choose(results.value[activeIndex.value])
  else if (event.key === 'Escape') { searchText.value = ''; results.value = [] }
}
</script>

<template>
  <div class="relative w-full max-w-sm">
    <input
      v-model="searchText"
      type="search"
      placeholder="Search name or title…"
      aria-label="Search people"
      class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
      @keydown="onKey"
    />
    <ul v-if="results.length > 0" class="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
      <li v-for="(person, index) in results" :key="person.id">
        <!-- mousedown (not click) fires before the input blurs, so the list is still there to click. -->
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
          :class="index === activeIndex ? 'bg-slate-50' : ''"
          @mousedown.prevent="choose(person)"
        >
          <span class="min-w-0"><span class="block truncate font-medium text-slate-900">{{ person.name }}</span><span class="block truncate text-xs text-slate-500">{{ person.title }}</span></span>
          <span class="shrink-0 rounded-full px-2 py-0.5 text-xs" :class="departmentColor(person.department).pill">{{ person.department }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
