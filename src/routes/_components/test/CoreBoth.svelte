<script lang="ts">
   import { createDnd } from '$lib/core.js'
   import { ghost } from '$lib/middleware/ghost.js'
   import { validate } from '$lib/middleware/validate.js'

   const dnd = createDnd()
      .use(ghost)
      .use(validate)

   let dropCount = $state(0)
   let validDrops = $state(0)
   let rejectedDrops = $state(0)
   let lastDropped = $state<string>("")

   // Create ghost elements
   const allowedGhost = document.createElement('div')
   allowedGhost.textContent = "✨ Premium Item"
   allowedGhost.style.cssText = `
      background: #4caf50;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
   `

   const rejectedGhost = document.createElement('div')
   rejectedGhost.textContent = "🚫 Forbidden Item"
   rejectedGhost.style.cssText = `
      background: #f44336;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
   `

   const allowedData = dnd.draggable("Premium Item", {
      dragstart: () => dnd.setGhost(allowedGhost),
      drop: () => {
         dropCount++
         validDrops++
         console.log("Premium item was dropped!")
      },
      stop:() => {
         dropCount++
         rejectedDrops++
         console.log("Premium item drop was rejected")
      }
   })

   // Rejected item data callback
   const rejectedData = dnd.draggable("Forbidden Item", {
      dragstart: () => dnd.setGhost(rejectedGhost),
      drop: () => {
         dropCount++
         validDrops++
         console.log("Forbidden item was dropped!")
      },
      stop: () => {
         dropCount++
         rejectedDrops++
         console.log("Forbidden item drop was rejected")
      }
   })

   const isString = dnd.assertData((data): data is string =>
      typeof data === "string" && data !== "Forbidden Item"
   )

   const dropzone = isString.soDrop(data => lastDropped = data)
</script>

<div class="container">
   <h3>Core + Ghost + Validation Test</h3>
   <p>Full-featured drag and drop with custom ghosts and validation</p>

   <div class="draggable allowed" {@attach allowedData}>
      Drag me (premium) ✨
   </div>

   <div class="draggable rejected" {@attach rejectedData}>
      Drag me (forbidden) 🚫
   </div>

   <div class="dropzone" {@attach dropzone}>
      Drop here: {lastDropped || "empty"}
   </div>

   <div class="stats">
      <p>Total attempts: {dropCount}</p>
      <p>Valid drops: {validDrops}</p>
      <p>Rejected drops: {rejectedDrops}</p>
   </div>

   <p><small>
      Watch for: custom ghost images, color changes on hover (green=valid, red=invalid)
   </small></p>
</div>
<style>
   .container {
      border: 2px solid #9c27b0;
      padding: 1rem;
      margin: 1rem;
   }

   .draggable {
      padding: 1rem;
      margin: 0.5rem;
      cursor: grab;
      border: 1px solid;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
   }

   .draggable:active {
      cursor: grabbing;
   }

   .draggable.allowed {
      background: #e1bee7;
      color: #4a148c;
      font-weight: 500;
      border-color: #9c27b0;
   }

   .draggable.rejected {
      background: #ffcdd2;
      color: #b71c1c;
      font-weight: 500;
      border-color: #f44336;
   }

   .dropzone {
      background: #f3e5f5;
      color: #4a148c;
      font-weight: 500;
      padding: 2rem;
      margin: 0.5rem;
      border: 2px dashed #9c27b0;
      min-height: 60px;
      transition: all 0.2s;
   }

   .dropzone:global(.valid) {
      background: #c8e6c9;
      border-color: #2e7d32;
      transform: scale(1.02);
   }

   .dropzone:global(.invalid) {
      background: #ffcdd2;
      border-color: #d32f2f;
      transform: scale(0.98);
   }

   .stats {
      margin-top: 1rem;
      padding: 0.5rem;
      background: #f3e5f5;
      color: #4a148c;
      font-weight: 600;
      border-radius: 4px;
   }

   .stats p {
      margin: 0.25rem 0;
   }
</style>
