import type { Middleware, DataCallback } from '../core.js'

export type GhostHooks = {
   ghost?: HTMLElement
}

export function createGhostMiddleware(): Middleware<GhostHooks> {
   let ghostElement: HTMLElement | null = null
   let isDragging = false
   const emptyImg = new Image()
   emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='

   function updateGhostPosition(event: MouseEvent | DragEvent) {
      if (ghostElement && isDragging) {
         ghostElement.style.left = event.clientX + 10 + 'px'
         ghostElement.style.top = event.clientY + 10 + 'px'
      }
   }

   function swapGhost(newGhost: HTMLElement | undefined, event: DragEvent) {
      // If no new ghost or same ghost, just update position
      if (!newGhost || newGhost === ghostElement) {
         updateGhostPosition(event)
         return
      }

      // Remove old ghost
      if (ghostElement && document.body.contains(ghostElement)) {
         document.body.removeChild(ghostElement)
      }

      // Set up new ghost
      ghostElement = newGhost
      ghostElement.style.position = 'fixed'
      ghostElement.style.pointerEvents = 'none'
      ghostElement.style.zIndex = '9999'
      ghostElement.style.left = event.clientX + 10 + 'px'
      ghostElement.style.top = event.clientY + 10 + 'px'

      // Only add to DOM if not already there
      if (!document.body.contains(ghostElement)) {
         document.body.appendChild(ghostElement)
      }
   }

   // Global drag listener for when dragging over non-dropzones
   function handleGlobalDrag(event: DragEvent) {
      if (isDragging) {
         updateGhostPosition(event)
      }
   }

   return {
      dragstart(event, element, dataCallback) {
         const typedCallback = dataCallback as DataCallback<GhostHooks>

         // Hide default drag image IMMEDIATELY
         if (event.dataTransfer) {
            event.dataTransfer.setDragImage(emptyImg, 0, 0)
         }

         isDragging = true

         // Set up ghost if provided
         if (typedCallback.ghost) {
            swapGhost(typedCallback.ghost, event)
         }

         // Add global drag listener to the dragged element itself
         element.addEventListener('drag', handleGlobalDrag)
      },

      dragover(event, element, dropCallback, dataCallback) {
         const typedCallback = dataCallback as DataCallback<GhostHooks>
         swapGhost(typedCallback.ghost, event)
      },

      dragleave(event, element, dropCallback, dataCallback) {
         const typedCallback = dataCallback as DataCallback<GhostHooks>
         swapGhost(typedCallback.ghost, event)
      },

      dragend(event, element, dataCallback) {
         isDragging = false

         // Remove global drag listener
         element.removeEventListener('drag', handleGlobalDrag)

         // Clean up ghost
         if (ghostElement && document.body.contains(ghostElement)) {
            document.body.removeChild(ghostElement)
            ghostElement = null
         }
      }
   }
}

// Backward compatibility export
export const ghostMiddleware = createGhostMiddleware()
