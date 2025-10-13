import type { Middleware } from '../core.js'

export type GhostHooks = {
   ghost?: HTMLElement
}

export function createGhostMiddleware(): Middleware {
   let ghostElement: HTMLElement | null = null
   let currentDataCallback: any = null
   let isDragging = false
   const emptyImg = new Image()
   emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='

   function updateGhostPosition(event: MouseEvent | DragEvent) {
      if (ghostElement && isDragging) {
         ghostElement.style.left = event.clientX + 10 + 'px'
         ghostElement.style.top = event.clientY + 10 + 'px'
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
         currentDataCallback = dataCallback

         // Hide default drag image IMMEDIATELY
         if (event.dataTransfer) {
            event.dataTransfer.setDragImage(emptyImg, 0, 0)
         }

         // Use custom ghost from dataCallback
         ghostElement = (dataCallback as any).ghost
         isDragging = true

         if (ghostElement) {
            // Reset positioning and set up for current drag
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

         // Add global drag listener to the dragged element itself
         element.addEventListener('drag', handleGlobalDrag)
      },

      dragover(event, element, dropCallback, dataCallback) {
         // Check if ghost was swapped
         const newGhost = (currentDataCallback as any)?.ghost
         if (newGhost && newGhost !== ghostElement) {
            // Remove old ghost
            if (ghostElement && document.body.contains(ghostElement)) {
               document.body.removeChild(ghostElement)
            }

            // Add new ghost
            ghostElement = newGhost
            if (ghostElement) {
               ghostElement.style.position = 'fixed'
               ghostElement.style.pointerEvents = 'none'
               ghostElement.style.zIndex = '9999'

               if (!document.body.contains(ghostElement)) {
                  document.body.appendChild(ghostElement)
               }
            }
         }

         // Update position
         updateGhostPosition(event)
      },

      dragend(event, element, dataCallback) {
         isDragging = false
         currentDataCallback = null

         // Remove global drag listener
         element.removeEventListener('drag', handleGlobalDrag)

         if (ghostElement && document.body.contains(ghostElement)) {
            document.body.removeChild(ghostElement)
            ghostElement = null
         }
      }
   }
}

// Backward compatibility export
export const ghostMiddleware = createGhostMiddleware()
