<!-- OrgCanvas.vue: a pan/zoom area for the tree (drag to pan, wheel/pinch to zoom) with Fit, Reset and Collapse all buttons. -->
<script setup>
import { ref, onMounted, watch, nextTick } from 'vue' // Vue helpers.
import { select } from 'd3-selection' // Lets d3 attach to a page element.
import { zoom, zoomIdentity } from 'd3-zoom' // d3's pan/zoom behaviour, and the "no zoom" starting transform.
import { useOrg } from '../composables/useOrg.js' // Shared state.

const { highlightedId, selectedId, collapseAll } = useOrg() // The search highlight to pan to, whether the drawer is open, and the collapse action.
const viewport = ref(null) // The visible window (receives drag/wheel events).
const content = ref(null) // The big tree inside it (gets moved and scaled).
const transform = ref({ x: 0, y: 0, k: 1 }) // Current pan (x, y) and zoom level (k).
let zoomBehavior = null // The d3 zoom object, created once the page element exists.

onMounted(() => { // The elements exist now, so d3 can attach to them.
  zoomBehavior = zoom().scaleExtent([0.1, 2]).on('zoom', (event) => { transform.value = event.transform }) // Allow 10%-200% zoom; on every pan/zoom, remember the new transform.
  select(viewport.value).call(zoomBehavior).on('dblclick.zoom', null) // Attach to the viewport; turn off double-click zoom (it clashes with clicking cards).
  nextTick(() => { reset(); if (highlightedId.value) panTo(highlightedId.value) }) // After the first draw, centre the tree, or pan to a person if we arrived via "View in org chart".
}) // End of onMounted.

/**
 * Move/zoom the tree to a new position.
 * @param {number} x - Horizontal shift in pixels.
 * @param {number} y - Vertical shift in pixels.
 * @param {number} k - Zoom level (1 = 100%).
 */
function moveTo(x, y, k) { // Shared by Reset, Fit and the search pan.
  select(viewport.value).call(zoomBehavior.transform, zoomIdentity.translate(x, y).scale(k)) // Tell d3, so later drags continue from here.
} // End of moveTo.

/** Back to 100%, tree centred at the top. */
function reset() { // Reset button and first load.
  moveTo((viewport.value.clientWidth - content.value.offsetWidth) / 2, 24, 1) // Centre horizontally, 24px from the top.
} // End of reset.

/** Zoom out (never in past 100%) so the whole visible tree fits. */
function fit() { // Fit button.
  const width = content.value.offsetWidth // Tree size at 100%.
  const height = content.value.offsetHeight // Tree height at 100%.
  const k = Math.min(1, (viewport.value.clientWidth - 48) / width, (viewport.value.clientHeight - 48) / height) // Largest zoom where it still fits, with 24px margins.
  moveTo((viewport.value.clientWidth - width * k) / 2, 24, k) // Centre it at that zoom.
} // End of fit.

watch(highlightedId, async (id) => { // When search highlights someone...
  if (!id) return // ...(ignore the highlight being cleared)...
  await nextTick() // ...wait for Vue to draw the newly expanded path...
  panTo(id) // ...then pan to their card.
}) // End of the highlight watcher.

/**
 * Pan and zoom so one person's card is centred in the visible area.
 * @param {string} id - Whose card.
 */
function panTo(id) { // Used by the watcher and on first mount.
  const card = content.value.querySelector(`[data-id="${CSS.escape(id)}"]`) // ...find their card...
  if (!card) return // ...(not drawn: nothing to do)...
  const k = Math.max(transform.value.k, 0.8) // ...zoom in to at least 80% so it's readable...
  const box = card.getBoundingClientRect() // ...where the card is on screen right now...
  const tree = content.value.getBoundingClientRect() // ...and where the tree's top-left corner is...
  const x = (box.left - tree.left + box.width / 2) / transform.value.k // ...card centre in un-zoomed tree pixels (divide out the current zoom)...
  const y = (box.top - tree.top + box.height / 2) / transform.value.k // ...same vertically...
  const visibleWidth = viewport.value.clientWidth - (selectedId.value ? 384 : 0) // ...the drawer (384 px wide) covers the right side when open...
  moveTo(visibleWidth / 2 - x * k, viewport.value.clientHeight / 3 - y * k, k) // ...so centre it in the uncovered area, a third of the way down.
} // End of panTo.
</script> <!-- End of the JavaScript part. -->

<template> <!-- What the canvas shows. -->
  <div class="relative h-full w-full overflow-hidden"> <!-- Fills its parent; hides whatever is panned outside. -->
    <div ref="viewport" class="h-full w-full cursor-grab select-none active:cursor-grabbing"> <!-- Drag/zoom area (ref lets the script reach it). -->
      <div ref="content" class="relative w-max origin-top-left" :style="{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }"> <!-- The tree, moved and scaled by CSS. relative = measure card positions from here. -->
        <slot /> <!-- Whatever the parent puts inside (the tree). -->
      </div> <!-- End of tree. -->
    </div> <!-- End of drag/zoom area. -->
    <div class="absolute right-4 top-4 flex gap-2"> <!-- Toolbar, floating top-right. -->
      <button type="button" class="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" @click="fit">Fit</button> <!-- Fit everything visible. -->
      <button type="button" class="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" @click="reset">Reset</button> <!-- Back to 100%. -->
      <button type="button" class="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" @click="collapseAll(); nextTick(reset)">Collapse all</button> <!-- Back to the starting view, then re-centre. -->
    </div> <!-- End of toolbar. -->
  </div> <!-- End of canvas. -->
</template> <!-- End of what the canvas shows. -->
