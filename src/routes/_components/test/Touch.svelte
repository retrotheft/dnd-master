<script lang="ts">
   // Create an isolated DND instance with touch support
   import { createDnd } from '$lib/core.js'
   import { touch } from '$lib/middleware/touch.js'

   const dnd = createDnd().use(touch({
      longPressDuration: 200,
      scrollThreshold: 10,
      autoGhost: true // Enable automatic ghost creation
   }))

   let dropCount = $state(0)
   let lastDropped = $state("")
   let dragStatus = $state("Ready")
   let touchInfo = $state("")

   const item = dnd.draggable("Touch Item", {
      dragstart: () => {
         dragStatus = "Dragging..."
         console.log("Touch drag started!")
      },
      dragend: () => {
         dragStatus = "Drag ended"
         console.log("Touch drag ended!")
         setTimeout(() => dragStatus = "Ready", 1000)
      },
      drop: () => {
         dropCount++
         dragStatus = "Dropped!"
         console.log("Item was dropped!")
      },
      cancel: () => {
         dragStatus = "Cancelled"
         console.log("Drag was cancelled")
         setTimeout(() => dragStatus = "Ready", 1000)
      }
   })

   const dropzone = dnd.dropzone(data => {
      if (typeof data === "string") lastDropped = data
      console.log("Dropzone received item:", data)
   }, {
      dragenter: (e, el) => {
         touchInfo = "Over" // ✅ Set
         el.style.background = "#e1bee7"
         el.style.borderColor = "#7b1fa2"
      },
      dragover: (e, el) => {
         touchInfo = "Over"
         el.style.background = "lightgreen"  // Keep the hover color active
         el.style.borderColor = "#7b1fa2"
      },
      dragleave: (e, el) => {
         touchInfo = "" // ✅ Clear instead of "Left dropzone"
         el.style.background = "#f3e5f5"
         el.style.borderColor = "#9c27b0"
      }
   })
</script>

<div class="container">
   <h3>Touch Support Test</h3>
   <p>Long-press (200ms) to start dragging on mobile</p>

   <div class="status">
      <strong>Status:</strong> {dragStatus}
      {#if touchInfo}
         <span class="touch-info">({touchInfo})</span>
      {/if}
   </div>

   <div class="draggable" {@attach item}>
      📱 Long-press me
   </div>

   <div class="dropzone" {@attach dropzone}>
      Drop here: {lastDropped || "empty"}
   </div>

   <p>Drops: {dropCount}</p>

   <div class="instructions">
      <h4>Instructions:</h4>
      <ul>
         <li><strong>Desktop:</strong> Click and drag normally</li>
         <li><strong>Mobile:</strong> Long-press for 200ms, then drag</li>
         <li>Release over the dropzone to drop</li>
         <li>Release outside to cancel</li>
      </ul>
   </div>
</div>

<style>
   .container {
      border: 2px solid #ccc;
      padding: 1rem;
      margin: 1rem;
      max-width: 600px;
   }

   .status {
      background: #fff3e0;
      padding: 0.75rem;
      margin: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ff9800;
      font-weight: 600;
   }

   .touch-info {
      color: #f57c00;
      font-size: 0.9em;
   }

   .draggable {
      background: #e3f2fd;
      color: #0d47a1;
      font-weight: 600;
      padding: 1.5rem;
      margin: 0.5rem;
      cursor: grab;
      border: 2px solid #2196f3;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      touch-action: none; /* Prevent default touch behaviors */
      text-align: center;
      font-size: 1.2em;
      border-radius: 8px;
   }

   .draggable:active {
      cursor: grabbing;
      background: #bbdefb;
   }

   .dropzone {
      background: #f3e5f5;
      color: #4a148c;
      font-weight: 600;
      padding: 2rem;
      margin: 0.5rem;
      border: 3px dashed #9c27b0;
      min-height: 80px;
      text-align: center;
      border-radius: 8px;
      transition: all 0.2s ease;
   }

   .dropzone:hover {
      background: #e1bee7;
      border-color: #7b1fa2;
   }

   .instructions {
      background: #f5f5f5;
      padding: 1rem;
      margin-top: 1rem;
      border-radius: 4px;
      font-size: 0.9em;
   }

   .instructions h4 {
      margin-top: 0;
      color: #424242;
   }

   .instructions ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
   }

   .instructions li {
      margin: 0.25rem 0;
      color: #616161;
   }

   .instructions strong {
      color: #1976d2;
   }
</style>
