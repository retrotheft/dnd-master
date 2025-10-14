<script lang="ts">
   import { createDnd } from '$lib/core.js'
   import { validationMiddleware } from '$lib/middleware/validate.js'

   const dnd = createDnd().use(validationMiddleware)

   let dropCount = $state(0)
   let validDrops = $state(0)
   let rejectedDrops = $state(0)
   let lastDropped = $state<string>("")

   // Define what data is valid (dropzone-side validation)
   const isString = dnd.assertData((data: unknown): data is string =>
      typeof data === "string" && data !== "Forbidden Item"
   )

   const dropCallback = isString.soDrop((data: string) => {
      lastDropped = data
   })

   // Define what can drop on "premium" zones (draggable-side validation)
   const canDropOnPremium = dnd.assertZone((element: HTMLElement) =>
      element.dataset.zone === "premium"
   )

   const premiumItem = canDropOnPremium.soGive("Premium Item", {
      drop: (event: DragEvent, element: HTMLElement) => {
         dropCount++
         validDrops++
         console.log("Premium item was dropped!")
      },
      stop: (event: DragEvent, element: HTMLElement) => {
         dropCount++
         rejectedDrops++
         console.log("Premium item was rejected - wrong zone!")
      }
   })

   // Regular item with no draggable-side validation
   const regularItem = dnd.draggable("Regular Item", {
      drop: (event: DragEvent, element: HTMLElement) => {
         dropCount++
         validDrops++
         console.log("Regular item was dropped!")
      },
      stop: (event: DragEvent, element: HTMLElement) => {
         dropCount++
         rejectedDrops++
         console.log("Regular item was rejected!")
      }
   })

   // Forbidden item that will fail dropzone validation
   const forbiddenItem = dnd.draggable("Forbidden Item", {
      drop: (event: DragEvent, element: HTMLElement) => {
         dropCount++
         validDrops++
         console.log("Forbidden item was dropped!")
      },
      stop: (event: DragEvent, element: HTMLElement) => {
         dropCount++
         rejectedDrops++
         console.log("Forbidden item was rejected!")
      }
   })
</script>

<div class="container">
   <h3>Two-Way Validation Test</h3>
   <p>Tests both draggable validation (can I drop here?) and dropzone validation (do I accept this?)</p>

   <div class="items">
      <h4>Draggable Items:</h4>
      <div class="draggable premium" {@attach premiumItem}>
         💎 Premium Item (only drops on premium zones)
      </div>

      <div class="draggable regular" {@attach regularItem}>
         📦 Regular Item (drops anywhere)
      </div>

      <div class="draggable forbidden" {@attach forbiddenItem}>
         🚫 Forbidden Item (rejected by dropzone)
      </div>
   </div>

   <div class="zones">
      <h4>Drop Zones:</h4>
      <div class="dropzone premium" data-zone="premium" {@attach dropCallback}>
         <strong>Premium Zone</strong><br>
         Only accepts: Premium items + valid strings<br>
         Last dropped: {lastDropped || "empty"}
      </div>

      <div class="dropzone regular" data-zone="regular" {@attach dropCallback}>
         <strong>Regular Zone</strong><br>
         Accepts: Regular items + valid strings (not Premium)<br>
         Last dropped: {lastDropped || "empty"}
      </div>
   </div>

   <div class="stats">
      <p><strong>Expected behavior:</strong></p>
      <ul>
         <li>💎 Premium → Premium Zone = ✅ (both validations pass)</li>
         <li>💎 Premium → Regular Zone = ❌ (draggable validation fails)</li>
         <li>📦 Regular → Either Zone = ✅ (no draggable validation, passes dropzone)</li>
         <li>🚫 Forbidden → Either Zone = ❌ (dropzone validation fails)</li>
      </ul>
      <p>Total attempts: {dropCount}</p>
      <p>Valid drops: {validDrops}</p>
      <p>Rejected drops: {rejectedDrops}</p>
   </div>
</div>

<!-- styles remain the same -->

<style>
   .container {
      border: 2px solid #673ab7;
      padding: 1rem;
      margin: 1rem;
   }

   h4 {
      margin-top: 0;
      color: #4a148c;
   }

   .items, .zones {
      margin: 1rem 0;
   }

   .draggable {
      padding: 1rem;
      margin: 0.5rem 0;
      cursor: grab;
      border: 2px solid;
      user-select: none;
      border-radius: 4px;
   }

   .draggable:active {
      cursor: grabbing;
   }

   .draggable.premium {
      background: #e1bee7;
      color: #4a148c;
      border-color: #9c27b0;
      font-weight: 600;
   }

   .draggable.regular {
      background: #bbdefb;
      color: #0d47a1;
      border-color: #2196f3;
   }

   .draggable.forbidden {
      background: #ffcdd2;
      color: #b71c1c;
      border-color: #f44336;
   }

   .dropzone {
      padding: 1.5rem;
      margin: 0.5rem 0;
      border: 2px dashed;
      min-height: 80px;
      transition: all 0.2s;
      border-radius: 4px;
   }

   .dropzone.premium {
      background: #f3e5f5;
      color: #4a148c;
      border-color: #9c27b0;
   }

   .dropzone.regular {
      background: #e3f2fd;
      color: #0d47a1;
      border-color: #2196f3;
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
      padding: 1rem;
      background: #f3e5f5;
      color: #4a148c;
      border-radius: 4px;
   }

   .stats ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
   }

   .stats li {
      margin: 0.25rem 0;
      font-family: monospace;
   }

   .stats p {
      margin: 0.25rem 0;
   }
</style>
