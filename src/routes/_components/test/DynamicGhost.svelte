<script lang="ts">
   import { createDnd, type DataCallback, type DropCallback } from '$lib/core.js'
   import { ghostMiddleware, type GhostHooks } from '$lib/middleware/ghost.js'
   import { validationMiddleware, classes, type ValidationHooks, DataPredicate, DropPredicate } from '$lib/middleware/validate.js'

   const dnd = createDnd()
      .use<GhostHooks>(ghostMiddleware)
      .use<ValidationHooks>(validationMiddleware)

   let dropCount = $state(0)
   let validDrops = $state(0)
   let rejectedDrops = $state(0)
   let lastDropped = $state<string>("")

   const premiumGhost = document.createElement('div')
   premiumGhost.textContent = "💎 Premium Item"
   premiumGhost.style.cssText = `
      background: #2196f3;
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: 600;
      border: 2px solid #1976d2;
   `

   const validGhost = document.createElement('div')
   validGhost.textContent = "✅ Can drop here!"
   validGhost.style.cssText = `
      background: #4caf50;
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: 600;
      border: 2px solid #2e7d32;
   `

   const invalidGhost = document.createElement('div')
   invalidGhost.textContent = "❌ Wrong zone!"
   invalidGhost.style.cssText = `
      background: #f44336;
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: 600;
      border: 2px solid #c62828;
   `

   // Dropzone validation
   const isString = DataPredicate((data): data is string =>
      typeof data === "string" && data !== "Forbidden Item"
   )

   const dropCallback = isString.soDrop(data => {
      lastDropped = data
   })
   classes('valid', 'invalid')(dropCallback.validate)

   // Draggable validation + dynamic ghost switching!
   const canDropOnPremium = DropPredicate(element =>
      element.dataset.zone === "premium"
   )

   const premiumItem = canDropOnPremium.soGive(() => "Premium Item") as DataCallback<GhostHooks & ValidationHooks>
   premiumItem.ghost = premiumGhost

   // Dynamic ghost switching based on validation!
   premiumItem.dragover = (event: DragEvent, element: HTMLElement) => {
      // const dropzone = (event.target as HTMLElement).closest('[data-zone]') as HTMLElement
      const dropzone = true
      if (dropzone && canDropOnPremium(element)) {
         premiumItem.ghost = validGhost

      } else if (dropzone) {
         premiumItem.ghost = invalidGhost
      }
   }

   premiumItem.dragleave = (event, element) => {
      premiumItem.ghost = premiumGhost
   }

   premiumItem.drop = (event: DragEvent, element: HTMLElement) => {
      dropCount++
      validDrops++
      console.log("Premium item was dropped!")
   }
   premiumItem.stop = (event: DragEvent, element: HTMLElement) => {
      dropCount++
      rejectedDrops++
      console.log("Premium item was rejected!")
   }

   // Regular item
   const regularGhost = document.createElement('div')
   regularGhost.style.cssText = `
      background: #2196f3;
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: 600;
   `

   const regularItem: DataCallback<GhostHooks & ValidationHooks> = () => "Regular Item"
   regularItem.ghost = regularGhost
   regularItem.dragstart = (event: DragEvent, element: HTMLElement) => {
      regularGhost.textContent = "📦 Regular Item"
   }
   regularItem.drop = (event: DragEvent, element: HTMLElement) => {
      dropCount++
      validDrops++
      console.log("Regular item was dropped!")
   }
   regularItem.stop = (event: DragEvent, element: HTMLElement) => {
      dropCount++
      rejectedDrops++
      console.log("Regular item was rejected!")
   }

   // Forbidden item with dynamic ghost
   const forbiddenGhost = document.createElement('div')
   forbiddenGhost.style.cssText = `
      background: #9e9e9e;
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: 600;
   `

   const forbiddenItem: DataCallback<GhostHooks & ValidationHooks> = () => "Forbidden Item"
   forbiddenItem.ghost = forbiddenGhost
   forbiddenItem.dragstart = (event: DragEvent, element: HTMLElement) => {
      forbiddenGhost.textContent = "🚫 Forbidden Item"
   }
   // Changes to red X over dropzones
   forbiddenItem.dragenter = (event: DragEvent, element: HTMLElement) => {
      forbiddenItem.ghost = invalidGhost
      invalidGhost.textContent = "🚫 Not allowed!"
   }
   forbiddenItem.drop = (event: DragEvent, element: HTMLElement) => {
      dropCount++
      validDrops++
      console.log("Forbidden item was dropped!")
   }
   forbiddenItem.stop = (event: DragEvent, element: HTMLElement) => {
      dropCount++
      rejectedDrops++
      console.log("Forbidden item was rejected!")
   }
</script>

<div class="container">
   <h3>🎨 Complete Two-Way Validation + Dynamic Ghosts</h3>
   <p>Watch the ghost images change based on validation state!</p>

   <div class="items">
      <h4>Draggable Items:</h4>
      <div class="draggable premium" {@attach dnd.draggable(premiumItem)}>
         💎 Premium Item
         <small>(ghost changes: ✅ over premium, ❌ over regular)</small>
      </div>

      <div class="draggable regular" {@attach dnd.draggable(regularItem)}>
         📦 Regular Item
         <small>(static blue ghost)</small>
      </div>

      <div class="draggable forbidden" {@attach dnd.draggable(forbiddenItem)}>
         🚫 Forbidden Item
         <small>(turns red ❌ over any zone)</small>
      </div>
   </div>

   <div class="zones">
      <h4>Drop Zones:</h4>
      <div class="dropzone premium" data-zone="premium" {@attach dnd.dropzone(dropCallback)}>
         <strong>💎 Premium Zone</strong><br>
         Requires: Premium validation + valid data<br>
         Last: {lastDropped || "empty"}
      </div>

      <div class="dropzone regular" data-zone="regular" {@attach dnd.dropzone(dropCallback)}>
         <strong>📦 Regular Zone</strong><br>
         Requires: No draggable validation + valid data<br>
         Last: {lastDropped || "empty"}
      </div>
   </div>

   <div class="stats">
      <p><strong>🎯 Expected behavior:</strong></p>
      <ul>
         <li>💎 → Premium Zone: ✅ green ghost → success</li>
         <li>💎 → Regular Zone: ❌ red ghost → rejected</li>
         <li>📦 → Any Zone: 📦 blue ghost → success</li>
         <li>🚫 → Any Zone: 🚫 red ghost → rejected</li>
      </ul>
      <p>Attempts: {dropCount} | Valid: {validDrops} | Rejected: {rejectedDrops}</p>
   </div>
</div>

<style>
   .container {
      border: 3px solid #ff6f00;
      padding: 1rem;
      margin: 1rem;
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
   }

   h3 {
      color: #e65100;
      margin-top: 0;
   }

   h4 {
      color: #bf360c;
      margin: 0.5rem 0;
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
      border-radius: 8px;
      transition: transform 0.2s;
   }

   .draggable:hover {
      transform: translateX(4px);
   }

   .draggable:active {
      cursor: grabbing;
   }

   .draggable small {
      display: block;
      margin-top: 0.25rem;
      opacity: 0.8;
      font-size: 0.85em;
   }

   .draggable.premium {
      background: linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%);
      color: #4a148c;
      border-color: #9c27b0;
      font-weight: 600;
   }

   .draggable.regular {
      background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
      color: #0d47a1;
      border-color: #2196f3;
      font-weight: 500;
   }

   .draggable.forbidden {
      background: linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%);
      color: #b71c1c;
      border-color: #f44336;
      font-weight: 500;
   }

   .dropzone {
      padding: 1.5rem;
      margin: 0.5rem 0;
      border: 3px dashed;
      min-height: 100px;
      transition: all 0.3s;
      border-radius: 12px;
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
      transform: scale(1.03);
      box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
   }

   .dropzone:global(.invalid) {
      background: #ffcdd2;
      border-color: #d32f2f;
      transform: scale(0.97);
      box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
   }

   .stats {
      margin-top: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
   }

   .stats ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
   }

   .stats li {
      margin: 0.5rem 0;
      font-family: 'Courier New', monospace;
      font-size: 0.95em;
   }

   .stats p {
      margin: 0.5rem 0;
      color: #bf360c;
      font-weight: 600;
   }
</style>
