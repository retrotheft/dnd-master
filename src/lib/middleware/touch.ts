import type { Middleware, DndInstance, ExtensionRecord } from '../core.js';

export type TouchOptions = {
  longPressDuration?: number;
  scrollThreshold?: number;
  autoGhost?: boolean; // Automatically create a ghost from the dragged element
};

export function touch(options: TouchOptions = {}) {
  const longPressDuration = options.longPressDuration ?? 200;
  const scrollThreshold = options.scrollThreshold ?? 10;
  const autoGhost = options.autoGhost ?? true;

  let touchState: {
    active: boolean;
    element: HTMLElement | null;
    dataCallback: any;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    longPressTimer: number | null;
    hasMoved: boolean;
    ghost: HTMLElement | null;
  } = {
    active: false,
    element: null,
    dataCallback: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    longPressTimer: null,
    hasMoved: false,
    ghost: null,
  };

  let currentDropzone: HTMLElement | null = null;
  let lastDropzone: HTMLElement | null = null;
  let allDropzones = new WeakMap<HTMLElement, any>();

  function createSyntheticDragEvent(
    type: string,
    touch: Touch,
    original?: TouchEvent
  ): DragEvent {
    const event = new Event(type, { bubbles: true, cancelable: true }) as any;
    event.clientX = touch.clientX;
    event.clientY = touch.clientY;
    event.pageX = touch.pageX;
    event.pageY = touch.pageY;
    event.preventDefault = () => original?.preventDefault();
    event.stopPropagation = () => original?.stopPropagation();
    return event as DragEvent;
  }

  function createGhost(element: HTMLElement, touch: Touch): HTMLElement {
    const ghost = element.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '10000';
    ghost.style.opacity = '0.8';
    ghost.style.transform = 'scale(1.05)';
    ghost.style.transition = 'none';
    ghost.style.left = touch.clientX - element.offsetWidth / 2 + 'px';
    ghost.style.top = touch.clientY - element.offsetHeight / 2 + 'px';
    ghost.style.width = element.offsetWidth + 'px';
    ghost.style.height = element.offsetHeight + 'px';
    document.body.appendChild(ghost);
    return ghost;
  }

  function updateGhostPosition(touch: Touch, element: HTMLElement) {
    if (touchState.ghost) {
      touchState.ghost.style.left = touch.clientX - element.offsetWidth / 2 + 'px';
      touchState.ghost.style.top = touch.clientY - element.offsetHeight / 2 + 'px';
    }
  }

  function removeGhost() {
    if (touchState.ghost && document.body.contains(touchState.ghost)) {
      document.body.removeChild(touchState.ghost);
      touchState.ghost = null;
    }
  }

  function findDropzoneAtPoint(x: number, y: number): HTMLElement | null {
    // Get all elements at this point
    const elements = document.elementsFromPoint(x, y);

    // Find the first dropzone in the stack
    for (const el of elements) {
      if (allDropzones.has(el as HTMLElement)) {
        return el as HTMLElement;
      }
    }
    return null;
  }

  function handleTouchStart(e: TouchEvent, element: HTMLElement, dataCallback: any) {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchState = {
      active: false,
      element,
      dataCallback,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      longPressTimer: window.setTimeout(() => {
        touchState.active = true;
        touchState.hasMoved = false;

        // Create ghost if auto-ghost is enabled
        if (autoGhost) {
          touchState.ghost = createGhost(element, touch);
        }

        // Add visual feedback to original element
        element.style.opacity = '0.4';

        // Trigger dragstart
        const syntheticEvent = createSyntheticDragEvent('dragstart', touch, e);
        dataCallback.dragstart?.(syntheticEvent, element);
      }, longPressDuration),
      hasMoved: false,
      ghost: null,
    };
  }

  function handleTouchMove(e: TouchEvent) {
    if (!touchState.element || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);

    touchState.currentX = touch.clientX;
    touchState.currentY = touch.clientY;

    // Cancel long press if moved too much before activation
    if (!touchState.active && (deltaX > scrollThreshold || deltaY > scrollThreshold)) {
      if (touchState.longPressTimer) {
        clearTimeout(touchState.longPressTimer);
        touchState.longPressTimer = null;
      }
      return;
    }

    if (touchState.active) {
      e.preventDefault(); // Prevent scrolling while dragging
      touchState.hasMoved = true;

      // Update ghost position
      if (touchState.ghost) {
        updateGhostPosition(touch, touchState.element);
      }

      // Find dropzone under touch
      const dropzone = findDropzoneAtPoint(touch.clientX, touch.clientY);

      // Handle dropzone changes with debouncing
      if (dropzone !== currentDropzone) {
        // Only trigger leave if we actually had a dropzone before
        if (currentDropzone && currentDropzone !== dropzone) {
          const leaveEvent = createSyntheticDragEvent('dragleave', touch, e);
          const dropCallback = allDropzones.get(currentDropzone);
          touchState.dataCallback.dragleave?.(leaveEvent, currentDropzone);
          dropCallback?.dragleave?.(leaveEvent, currentDropzone);
        }

        // Only trigger enter if we have a new dropzone
        if (dropzone && dropzone !== lastDropzone) {
          const enterEvent = createSyntheticDragEvent('dragenter', touch, e);
          const dropCallback = allDropzones.get(dropzone);
          touchState.dataCallback.dragenter?.(enterEvent, dropzone);
          dropCallback?.dragenter?.(enterEvent, dropzone);
        }

        lastDropzone = currentDropzone;
        currentDropzone = dropzone;
      }

      // Always trigger dragover on current dropzone
      if (currentDropzone) {
        const overEvent = createSyntheticDragEvent('dragover', touch, e);
        const dropCallback = allDropzones.get(currentDropzone);
        touchState.dataCallback.dragover?.(overEvent, currentDropzone);
        dropCallback?.dragover?.(overEvent, currentDropzone);
      }
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!touchState.element) return;

    // Cancel long press timer if still pending
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
      touchState.longPressTimer = null;
    }

    // Restore original element opacity
    if (touchState.element) {
      touchState.element.style.opacity = '';
    }

    if (touchState.active) {
      e.preventDefault();

      const touch = e.changedTouches[0];

      // Final dropzone check at release point
      const finalDropzone = findDropzoneAtPoint(touch.clientX, touch.clientY);

      // Drop on current dropzone if we have one
      if (finalDropzone) {
        const syntheticEvent = createSyntheticDragEvent('drop', touch, e);
        const dropCallback = allDropzones.get(finalDropzone);

        touchState.dataCallback.drop?.(syntheticEvent, finalDropzone);
        dropCallback?.drop?.(syntheticEvent, finalDropzone);

        // Call the actual drop callback with data
        const data = touchState.dataCallback();
        dropCallback?.(data);
      } else {
        // Cancelled - dropped outside any dropzone
        touchState.dataCallback.cancel?.(
          createSyntheticDragEvent('dragend', touch, e),
          touchState.element
        );
      }

      // Dragend
      const endEvent = createSyntheticDragEvent('dragend', touch, e);
      touchState.dataCallback.dragend?.(endEvent, touchState.element);

      // Clean up ghost
      removeGhost();

      currentDropzone = null;
      lastDropzone = null;
    }

    // Reset state
    touchState = {
      active: false,
      element: null,
      dataCallback: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      longPressTimer: null,
      hasMoved: false,
      ghost: null,
    };
  }

  function handleTouchCancel(e: TouchEvent) {
    // Restore opacity
    if (touchState.element) {
      touchState.element.style.opacity = '';
    }

    // Clean up ghost
    removeGhost();

    handleTouchEnd(e);
  }

  return function <Ext extends ExtensionRecord>(
    instance: DndInstance<Ext>
  ): { middleware: Middleware; extensions?: {} } {
    // Wrap the original draggable to add touch listeners
    const originalDraggable = instance.draggable.bind(instance);
    instance.draggable = (data: unknown, hooks?: any) => {
      const attachment = originalDraggable(data, hooks);
      return (element: HTMLElement) => {
        attachment(element);

        const dataCallback = Object.assign(() => data, hooks || {});

        element.addEventListener('touchstart', (e) => handleTouchStart(e, element, dataCallback), { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        document.addEventListener('touchcancel', handleTouchCancel, { passive: false });
      };
    };

    // Wrap the original dropzone to track dropzones
    const originalDropzone = instance.dropzone.bind(instance);
    instance.dropzone = (dropCallback?: any, hooks?: any) => {
      const attachment = originalDropzone(dropCallback, hooks);
      return (element: HTMLElement) => {
        attachment(element);

        const normalized = dropCallback
          ? Object.assign(dropCallback, hooks || {})
          : hooks;

        allDropzones.set(element, normalized);
      };
    };

    return {
      middleware: {
        // Touch events are handled separately, middleware stays empty
      },
    };
  };
}

// Default export with standard options
export const touchMiddleware = touch();
