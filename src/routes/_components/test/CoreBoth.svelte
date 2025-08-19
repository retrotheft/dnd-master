<script lang="ts">
   // Create an isolated DND instance for this test
   import { createDnd } from '$lib/core.js'
   import { createGhostMiddleware } from '$lib/middleware/ghost.js'
   import { createValidationMiddleware, classes, type ValidateCallback } from '$lib/middleware/validate.js'

   const dnd = createDnd() // Create isolated instance
   const validation = createValidationMiddleware() // Create isolated validation
   dnd.use(createGhostMiddleware()) // Add ghost middleware
   dnd.use(validation.middleware) // Add validation middleware

   let dropCount = $state(0)
   let validDrops = $state(0)
   let rejectedDrops = $state(0)
   let lastDropped = $state<string>("")

   // Create ghost elements
   const allowedGhost = document.createElement('div')
   allowedGhost.style.cssText = `
      background: #4caf50;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
   `

   const rejectedGhost = document.createElement('div')
   rejectedGhost.style.cssText = `
      background: #f44336;
      color: white;
      padding: 0.5rem;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
   `

   // Allowed item data callback
   const allowedData = () => "Premium Item"
   allowedData.ghost = allowedGhost
   allowedData.dragstart = () => {
      allowedGhost.textContent = "✨ Premium Item"
   }
   allowedData.drop = () => {
      dropCount++
      validDrops++
      console.log("Premium item was dropped!")
   }
   allowedData.stop = () => {
      dropCount++
      rejectedDrops++
      console.log("Premium item drop was rejected")
   }

   // Rejected item data callback
   const rejectedData = () => "Forbidden Item"
   rejectedData.ghost = rejectedGhost
   rejectedData.dragstart = () => {
      rejectedGhost.textContent = "🚫 Forbidden Item"
   }
   rejectedData.drop = () => {
      dropCount++
      validDrops++
      console.log("Forbidden item was dropped!")
   }
   rejectedData.stop = () => {
      dropCount++
      rejectedDrops++
      console.log("Forbidden item drop was rejected")
   }

   // Validation callback with visual feedback
   const validate: ValidateCallback = (getData) => {
      const data = getData()
      if (data === "Forbidden Item") {
         return // Validation failed
      }
      return () => {
         lastDropped = data as string
         console.log(`Validation passed for: ${data}`)
         return true
      }
   }

   // Add visual feedback classes
   const setupClasses = classes('valid', 'invalid')
   setupClasses(validate)
</script>

<div class="container">
   <h3>Core + Ghost + Validation Test</h3>
   <p>Full-featured drag and drop with custom ghosts and validation</p>

   <div class="draggable allowed" {@attach dnd.draggable(allowedData)}>
      Drag me (premium) ✨
   </div>

   <div class="draggable rejected" {@attach dnd.draggable(rejectedData)}>
      Drag me (forbidden) 🚫
   </div>

   <div class="dropzone" {@attach validation.validatingDropzone(dnd, validate)}>
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
