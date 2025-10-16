<script lang="ts">
   import { createDnd } from '$lib/core.js'
   import { ghost } from '$lib/middleware/ghost.js'

   const dnd = createDnd().use(ghost)

   let dropCount = $state(0)
   let lastDropped = $state("")

   let ghostElement2 = $state<HTMLDivElement>()

   // Create ghost element
   const ghostElement = document.createElement('div')
   ghostElement.textContent = "👻 Ghost Item"
   ghostElement.style.cssText = `
      background: #ff5722;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
   `

   const item = dnd.draggable("Ghost Item", {
      dragstart: () => dnd.setGhost(ghostElement2 || ghostElement),
      drop: () => {
         dropCount++
         console.log("Ghost item was dropped!")
      },
      stop: () => {
         console.log("Ghost drop was cancelled")
      }
   })

   // const itemWithGhost = dnd.ghost(item, ghost)

   const dropzone = dnd.dropzone(data => {
      lastDropped = "Ghost Item"
      console.log("Dropzone received ghost item")
   })
</script>

<template>
   <div class="ghost" bind:this={ghostElement2}>👻 Ghost Item</div>
</template>

<div class="container">
   <h3>Core + Ghost Test</h3>
   <p>Drag and drop with custom ghost image</p>

   <div class="draggable" {@attach item}>
      Drag me (with ghost) 👻
   </div>

   <div class="dropzone" {@attach dropzone}>
      Drop here: {lastDropped || "empty"}
   </div>

   <p>Drops: {dropCount}</p>
   <p><small>You should see a custom ghost when dragging!</small></p>
</div>

<style>
   div.ghost {
      background: #7022ff;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
   }

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
