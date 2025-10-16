<script lang="ts">
   // Create an isolated DND instance for this test
   import { createDnd } from '$lib/core.js'
   import { touch } from '$lib/middleware/touch.js';

   const dnd = createDnd().use(touch) // Clean instance with no middleware

   let dropCount = $state(0)
   let lastDropped = $state("")

   const item = dnd.draggable("Basic Item", {
      drop: () => {
         dropCount++
         console.log("Item was dropped!")
      },
      cancel: () => {
         console.log("Drag was cancelled")
      }
   })

   const dropzone = dnd.dropzone(data => {
      if (typeof data === "string") lastDropped = data
      console.log("Dropzone received item")
   })
</script>

<div class="container">
   <h3>Core Only Test</h3>
   <p>Basic drag and drop without any middleware</p>

   <div class="draggable" {@attach item}>
      Drag me (basic)
   </div>

   <div class="dropzone" {@attach dropzone}>
      Drop here: {lastDropped || "empty"}
   </div>

   <p>Drops: {dropCount}</p>
</div>

<style>
   .container {
      border: 2px solid #ccc;
      padding: 1rem;
      margin: 1rem;
   }

   .draggable {
      background: #e3f2fd;
      color: #0d47a1;
      font-weight: 600;
      padding: 1rem;
      margin: 0.5rem;
      cursor: grab;
      border: 1px solid #2196f3;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
   }

   .draggable:active {
      cursor: grabbing;
   }

   .dropzone {
      background: #f3e5f5;
      color: #4a148c;
      font-weight: 600;
      padding: 2rem;
      margin: 0.5rem;
      border: 2px dashed #9c27b0;
      min-height: 60px;
   }
</style>
