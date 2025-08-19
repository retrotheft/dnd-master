<script lang="ts">
   // Create an isolated DND instance for this test
   import { createDnd } from '$lib/core.js'

   const dnd = createDnd() // Clean instance with no middleware

   let dropCount = $state(0)
   let lastDropped = $state("")

   // Simple data callback
   const itemData = () => "Basic Item"
   itemData.drop = () => {
      dropCount++
      console.log("Item was dropped!")
   }
   itemData.stop = () => {
      console.log("Drop was rejected")
   }

   // Simple dropzone callback
   const dropzoneCallbacks = {
      drop: () => {
         lastDropped = "Basic Item"
         console.log("Dropzone received item")
      }
   }
</script>

<div class="container">
   <h3>Core Only Test</h3>
   <p>Basic drag and drop without any middleware</p>

   <div class="draggable" {@attach dnd.draggable(itemData)}>
      Drag me (basic)
   </div>

   <div class="dropzone" {@attach dnd.dropzone(dropzoneCallbacks)}>
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
