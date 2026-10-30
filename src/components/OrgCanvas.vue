<!-- Pan/zoom canvas for the tree (drag to pan, wheel or pinch to zoom) with Fit, Reset and Collapse all. -->
<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { select } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import { useOrg } from '../composables/useOrg.js'

const { highlightedId, selectedId, collapseAll } = useOrg()
const viewport = ref(null)
const content = ref(null)
const transform = ref({ x: 0, y: 0, k: 1 })
let zoomBehavior = null

onMounted(() => {
  zoomBehavior = zoom().scaleExtent([0.1, 2]).on('zoom', (event) => { transform.value = event.transform })
  select(viewport.value).call(zoomBehavior).on('dblclick.zoom', null) // Double-click zoom fights with clicking cards.
  nextTick(() => { reset(); if (highlightedId.value) panTo(highlightedId.value) })
})

// Every move goes through d3-zoom so its internal state stays in sync with dragging and the wheel.
function moveTo(x, y, k) {
  select(viewport.value).call(zoomBehavior.transform, zoomIdentity.translate(x, y).scale(k))
}

/** Back to 100%, tree centred at the top. */
function reset() {
  moveTo((viewport.value.clientWidth - content.value.offsetWidth) / 2, 24, 1)
}

/** Zoom out (never in past 100%) so the whole visible tree fits. */
function fit() {
  const width = content.value.offsetWidth
  const height = content.value.offsetHeight
  const k = Math.min(1, (viewport.value.clientWidth - 48) / width, (viewport.value.clientHeight - 48) / height)
  moveTo((viewport.value.clientWidth - width * k) / 2, 24, k)
}

watch(highlightedId, async (id) => {
  if (!id) return
  // Wait for the newly expanded cards to render before measuring.
  await nextTick()
  panTo(id)
})

/**
 * Centre one person's card in the visible area.
 * Measured with getBoundingClientRect and divided by the zoom: offsetLeft is relative to the nearest
 * positioned ancestor, not the tree, which sent the pan to the wrong place.
 * @param {string} id - Whose card.
 */
function panTo(id) {
  const card = content.value.querySelector(`[data-id="${CSS.escape(id)}"]`)
  if (!card) return
  const k = Math.max(transform.value.k, 0.8)
  const box = card.getBoundingClientRect()
  const tree = content.value.getBoundingClientRect()
  const x = (box.left - tree.left + box.width / 2) / transform.value.k
  const y = (box.top - tree.top + box.height / 2) / transform.value.k
  const visibleWidth = viewport.value.clientWidth - (selectedId.value ? 384 : 0) // Leave room for the open drawer (max-w-sm).
  moveTo(visibleWidth / 2 - x * k, viewport.value.clientHeight / 3 - y * k, k)
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <div ref="viewport" class="h-full w-full cursor-grab select-none active:cursor-grabbing">
      <div ref="content" class="relative w-max origin-top-left" :style="{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }">
        <slot />
      </div>
    </div>
    <div class="absolute right-4 top-4 flex gap-2">
      <button type="button" class="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" @click="fit">Fit</button>
      <button type="button" class="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" @click="reset">Reset</button>
      <button type="button" class="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" @click="collapseAll(); nextTick(reset)">Collapse all</button>
    </div>
  </div>
</template>
