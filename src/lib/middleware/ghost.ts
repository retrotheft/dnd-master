import type { DndInstance } from '../core.js'

export function ghost(instance: DndInstance) {
  let currentGhost: HTMLElement | null = null
  let isDragging = false
  const emptyImg = new Image()
  emptyImg.src =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='

  function updateGhostPosition(event: MouseEvent | DragEvent) {
    if (currentGhost && isDragging) {
      currentGhost.style.left = `${event.clientX + 10}px`
      currentGhost.style.top = `${event.clientY + 10}px`
    }
  }

  function showGhost(ghost: HTMLElement | null, event?: DragEvent) {
    // remove old ghost if needed
    if (currentGhost && currentGhost !== ghost && document.body.contains(currentGhost)) {
      document.body.removeChild(currentGhost)
    }

    currentGhost = ghost
    if (!currentGhost) return

    Object.assign(currentGhost.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '9999',
    })

    if (event) {
      currentGhost.style.left = `${event.clientX + 10}px`
      currentGhost.style.top = `${event.clientY + 10}px`
    }

    if (!document.body.contains(currentGhost)) {
      document.body.appendChild(currentGhost)
    }
  }

  function handleGlobalDrag(event: DragEvent) {
    if (isDragging) updateGhostPosition(event)
  }

  return {
    middleware: {
      dragstart(event: DragEvent, element: HTMLElement) {
        if (event.dataTransfer) {
          event.dataTransfer.setDragImage(emptyImg, 0, 0)
        }

        isDragging = true
        showGhost(currentGhost, event)
        element.addEventListener('drag', handleGlobalDrag)
      },

      dragover(event: DragEvent) {
        handleGlobalDrag(event)
      },

      dragend(_e: DragEvent, element: HTMLElement) {
        isDragging = false
        element.removeEventListener('drag', handleGlobalDrag)

        if (currentGhost && document.body.contains(currentGhost)) {
          document.body.removeChild(currentGhost)
        }

        currentGhost = null
      },
    },

    // 🔹 Expose the API as an extension
    extensions: {
      setGhost(ghost: HTMLElement | null) {
        // if dragging, immediately reflect changes
        if (isDragging) {
          showGhost(ghost)
        } else {
          currentGhost = ghost
        }
      },
    },
  }
}
