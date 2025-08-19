<script lang="ts">
   // Create an isolated DND instance for this test
   import { createDnd } from '$lib/core.js'
   import { createValidationMiddleware, classes, type ValidateCallback } from '$lib/middleware/validate.js'

   const dnd = createDnd() // Create isolated instance
   const validation = createValidationMiddleware() // Create isolated validation
   dnd.use(validation.middleware) // Add validation middleware to THIS instance only

   let dropCount = $state(0)
   let validDrops = $state(0)
   let rejectedDrops = $state(0)
   let lastDropped = $state<string>("")

   // Data callback
   const allowedData = () => "Allowed Item"
   allowedData.drop = () => {
      dropCount++
      validDrops++
      console.log("Allowed item was dropped!")
   }
   allowedData.stop = () => {
      dropCount++
      rejectedDrops++
      console.log("Allowed item drop was rejected")
   }

   const rejectedData = () => "Rejected Item"
   rejectedData.drop = () => {
      dropCount++
      validDrops++
      console.log("Rejected item was dropped!")
   }
   rejectedData.stop = () => {
      dropCount++
      rejectedDrops++
      console.log("Rejected item drop was rejected")
   }

   // Validation callback with visual feedback
   const validate: ValidateCallback = (getData) => {
      const data = getData()
      if (data === "Rejected Item") {
         return // Validation failed - return undefined
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
   <h3>Core + Validation Test</h3>
   <p>Drag and drop with validation (green = valid, red = invalid)</p>

   <div class="draggable allowed" {@attach dnd.draggable(allowedData)}>
      Drag me (allowed) ✅
   </div>

   <div class="draggable rejected" {@attach dnd.draggable(rejectedData)}>
      Drag me (will be rejected) ❌
   </div>

   <div class="dropzone" {@attach validation.validatingDropzone(dnd, validate)}>
      Drop here: {lastDropped || "empty"}
   </div>

   <div class="stats">
      <p>Total attempts: {dropCount}</p>
      <p>Valid drops: {validDrops}</p>
      <p>Rejected drops: {rejectedDrops}</p>
   </div>
</div>

<style>
   .container {
      border: 2px solid #4caf50;
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
      background: #c8e6c9;
      color: #1b5e20;
      font-weight: 500;
      border-color: #4caf50;
   }

   .draggable.rejected {
      background: #ffcdd2;
      color: #b71c1c;
      font-weight: 500;
      border-color: #f44336;
   }

   .dropzone {
      background: #f1f8e9;
      color: #1b5e20;
      font-weight: 500;
      padding: 2rem;
      margin: 0.5rem;
      border: 2px dashed #4caf50;
      min-height: 60px;
      transition: all 0.2s;
   }

   .dropzone:global(.valid) {
      background: #c8e6c9;
      border-color: #2e7d32;
   }

   .dropzone:global(.invalid) {
      background: #ffcdd2;
      border-color: #d32f2f;
   }

   .stats {
      margin-top: 1rem;
      padding: 0.5rem;
      background: #e8f5e8;
      color: #1b5e20;
      font-weight: 600;
      border-radius: 4px;
   }

   .stats p {
      margin: 0.25rem 0;
   }
</style>
