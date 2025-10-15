import type { DndInstance } from '../core.js'

export function ghostMiddleware(instance: DndInstance) {
   let currentGhost: HTMLElement | null = null
   let isDragging = false
   const emptyImg = new Image()
   emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='

   function updateGhostPosition(event: MouseEvent | DragEvent) {
      if (currentGhost && isDragging) {
         currentGhost.style.left = event.clientX + 10 + 'px'
         currentGhost.style.top = event.clientY + 10 + 'px'
      }
   }

   function showGhost(ghost: HTMLElement, event: DragEvent) {
      // Remove old ghost if different
      if (currentGhost && currentGhost !== ghost && document.body.contains(currentGhost)) {
         document.body.removeChild(currentGhost)
      }

      currentGhost = ghost
      currentGhost.style.position = 'fixed'
      currentGhost.style.pointerEvents = 'none'
      currentGhost.style.zIndex = '9999'
      currentGhost.style.left = event.clientX + 10 + 'px'
      currentGhost.style.top = event.clientY + 10 + 'px'

      // Only add to DOM if not already there
      if (!document.body.contains(currentGhost)) {
         document.body.appendChild(currentGhost)
      }
   }

   // Global drag listener for when dragging over non-dropzones
   function handleGlobalDrag(event: DragEvent) {
      if (isDragging) {
         updateGhostPosition(event)
      }
   }

   return {
      middleware: {
         dragstart(event, element, dataCallback) {
            // Hide default drag image IMMEDIATELY
            if (event.dataTransfer) {
               event.dataTransfer.setDragImage(emptyImg, 0, 0)
            }

            isDragging = true

            // Get the ghost from dataCallback
            const ghost = (dataCallback as any).__ghost
            if (ghost) {
               showGhost(ghost, event)
            }

            // Add global drag listener to the dragged element itself
            element.addEventListener('drag', handleGlobalDrag)
         },

         dragover(event, element, dropCallback, dataCallback) {
            // If no validation ghosts, just update position
            const validGhost = (dataCallback as any).__validGhost
            const invalidGhost = (dataCallback as any).__invalidGhost

            if (!validGhost && !invalidGhost) {
               updateGhostPosition(event)
            }
            // Otherwise validation middleware will handle ghost swapping via hooks
         },

         dragleave(event, element, dropCallback, dataCallback) {
            // Switch back to default ghost when leaving a dropzone
            const defaultGhost = (dataCallback as any).__ghost
            const validGhost = (dataCallback as any).__validGhost
            const invalidGhost = (dataCallback as any).__invalidGhost

            if ((validGhost || invalidGhost) && defaultGhost) {
               showGhost(defaultGhost, event)
            }
         },

         dragend(event, element, dataCallback) {
            isDragging = false

            // Remove global drag listener
            element.removeEventListener('drag', handleGlobalDrag)

            // Clean up ghost
            if (currentGhost && document.body.contains(currentGhost)) {
               document.body.removeChild(currentGhost)
               currentGhost = null
            }
         }
      },

      extensions: {
         ghost: (
            data: unknown,
            ghost: HTMLElement,
            validGhost?: HTMLElement,
            invalidGhost?: HTMLElement
         ) => {
            const hooks: any = {
               __ghost: ghost,
               __validGhost: validGhost,
               __invalidGhost: invalidGhost
            }

            // If validation ghosts provided, add validation hooks
            if (validGhost || invalidGhost) {
               hooks.validate = () => true // Placeholder, will be overridden

               if (validGhost) {
                  hooks.validate.pass = (event: DragEvent, element: HTMLElement) => {
                     showGhost(validGhost, event)
                  }
               }

               if (invalidGhost) {
                  hooks.validate.fail = (event: DragEvent, element: HTMLElement) => {
                     showGhost(invalidGhost, event)
                  }
               }
            }

            return instance.draggable(data, hooks)
         }
      }
   }
}
