<script lang="ts">
   import { createDnd } from '$lib/core.js'
   import { ghostMiddleware } from '$lib/middleware/ghost.js'

   const dnd = createDnd().use(ghostMiddleware)

   let dropCount = $state(0)
   let lastDropped = $state("")

   // Create ghost element
   const ghost = document.createElement('div')
   ghost.style.cssText = `
      background: #ff5722;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
   `

   // Data callback with ghost
   const itemData = () => "Ghost Item"
   itemData.ghost = ghost
   itemData.dragstart = (event: DragEvent, element: HTMLElement) => {
      ghost.textContent = "👻 Ghost Item"
   }
   itemData.drop = (event: DragEvent, element: HTMLElement) => {
      dropCount++
      console.log("Ghost item was dropped!")
   }
   itemData.stop = (event: DragEvent, element: HTMLElement) => {
      console.log("Ghost drop was cancelled")
   }

   const dropCallback = (data: unknown) => {
      lastDropped = "Ghost Item"
      console.log("Dropzone received ghost item")
   }
</script>

<div class="container">
   <h3>Core + Ghost Test</h3>
   <p>Drag and drop with custom ghost image</p>

   <div class="draggable" {@attach dnd.draggable(itemData)}>
      Drag me (with ghost) 👻
   </div>

   <div class="dropzone" {@attach dnd.dropzone(dropCallback)}>
      Drop here: {lastDropped || "empty"}
   </div>

   <p>Drops: {dropCount}</p>
   <p><small>You should see a custom ghost when dragging!</small></p>
</div>

<style>
   .container {
      border: 2px solid #ff9800;
      padding: 1rem;
      margin: 1rem;
   }

   .draggable {
      background: #ffe0b2;
      color: #e65100;
      font-weight: 500;
      padding: 1rem;
      margin: 0.5rem;
      cursor: grab;
      border: 1px solid #ff9800;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
   }

   .draggable:active {
      cursor: grabbing;
   }

   .dropzone {
      background: #fff3e0;
      color: #e65100;
      font-weight: 500;
      padding: 2rem;
      margin: 0.5rem;
      border: 2px dashed #ff9800;
      min-height: 60px;
   }
</style>
