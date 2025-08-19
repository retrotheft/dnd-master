import { type Attachment } from "svelte/attachments"

type Hooks = {
   dragstart?: (event: DragEvent, element: HTMLElement) => void,
   dragend?: (event: DragEvent, element: HTMLElement) => void,
   dragenter?: (event: DragEvent, element: HTMLElement) => void,
   dragover?: (event: DragEvent, element: HTMLElement) => void,
   dragleave?: (event: DragEvent, element: HTMLElement) => void,
   drop?: (event: DragEvent, element: HTMLElement) => void
   stop?: (event: DragEvent, element: HTMLElement) => void
}

export type DataCallback = (() => unknown) & Hooks
// Generic dropzone callback - no validation semantics in core
export type DropzoneCallback = Hooks

export type Draggable = (dataCallback: DataCallback) => Attachment<HTMLElement>
export type Dropzone = (dropzoneCallback?: DropzoneCallback) => Attachment<HTMLElement>

export type Middleware = {
   dragstart?: (event: DragEvent, element: HTMLElement, dataCallback: DataCallback) => void,
   dragend?: (event: DragEvent, element: HTMLElement, dataCallback: DataCallback) => void,
   dragenter?: (event: DragEvent, element: HTMLElement, dropzoneCallback: DropzoneCallback | undefined, dataCallback: DataCallback) => void,
   dragover?: (event: DragEvent, element: HTMLElement, dropzoneCallback: DropzoneCallback | undefined, dataCallback: DataCallback) => void,
   dragleave?: (event: DragEvent, element: HTMLElement, dropzoneCallback: DropzoneCallback | undefined, dataCallback: DataCallback) => void,
   drop?: (event: DragEvent, element: HTMLElement, dropzoneCallback: DropzoneCallback | undefined, dataCallback: DataCallback) => void
}

export type DndInstance = {
   draggable: Draggable,
   dropzone: Dropzone,
   use: (middleware: Middleware) => void
}

// Factory function to create DND instances
export function createDnd(): DndInstance {
   let dataCallback: DataCallback | (() => void) & Hooks = () => { }
   let middlewares: Middleware[] = []

   function use(middleware: Middleware) {
      middlewares.push(middleware)
   }

   /* ===================== Drag Events ===================== */

   function draggable(_dataCallback: DataCallback): Attachment<HTMLElement> {
      return (element: HTMLElement) => {
         element.draggable = true
         element.style.cursor = "grab"

         const handleDragStart = (e: DragEvent) => dragStart(e, element, _dataCallback)
         const handleDragEnd = (e: DragEvent) => dragEnd(e, element, _dataCallback)

         element.addEventListener("dragstart", handleDragStart)
         element.addEventListener("dragend", handleDragEnd)

         // Attachments don't need to return cleanup functions like actions do
         // The cleanup happens automatically when the element is removed
      }
   }

   function dragStart(event: DragEvent, element: HTMLElement, _dataCallback: DataCallback) {
      dataCallback = _dataCallback
      for (const middleware of middlewares) middleware.dragstart?.(event, element, _dataCallback)
      _dataCallback.dragstart?.(event, element)
   }

   function dragEnd(event: DragEvent, element: HTMLElement, _dataCallback: DataCallback) {
      event.preventDefault()
      for (const middleware of middlewares) middleware.dragend?.(event, element, _dataCallback)
      dataCallback.dragend?.(event, element)
      dataCallback = () => { }
   }

   /* ===================== Drop Events ===================== */

   function dropzone(dropzoneCallback?: DropzoneCallback): Attachment<HTMLElement> {
      return (element: HTMLElement) => {
         const handleDragEnter = (e: DragEvent) => dragEnter(e, element, dropzoneCallback)
         const handleDragOver = (e: DragEvent) => dragOver(e, element, dropzoneCallback)
         const handleDragLeave = (e: DragEvent) => dragLeave(e, element, dropzoneCallback)
         const handleDrop = (e: DragEvent) => drop(e, element, dropzoneCallback)

         element.addEventListener("dragenter", handleDragEnter)
         element.addEventListener("dragover", handleDragOver)
         element.addEventListener("dragleave", handleDragLeave)
         element.addEventListener("drop", handleDrop)

         // Attachments don't need to return cleanup functions like actions do
         // The cleanup happens automatically when the element is removed
      }
   }

   function dragEnter(event: DragEvent, element: HTMLElement, dropzoneCallback?: DropzoneCallback) {
      event.preventDefault()
      for (const middleware of middlewares) middleware.dragenter?.(event, element, dropzoneCallback, dataCallback)
      dropzoneCallback?.dragenter?.(event, element)
      dataCallback.dragenter?.(event, element)
   }

   function dragOver(event: DragEvent, element: HTMLElement, dropzoneCallback?: DropzoneCallback) {
      event.preventDefault()
      for (const middleware of middlewares) middleware.dragover?.(event, element, dropzoneCallback, dataCallback)
      dropzoneCallback?.dragover?.(event, element)
      dataCallback.dragover?.(event, element)
   }

   function dragLeave(event: DragEvent, element: HTMLElement, dropzoneCallback?: DropzoneCallback) {
      for (const middleware of middlewares) middleware.dragleave?.(event, element, dropzoneCallback, dataCallback)
      dropzoneCallback?.dragleave?.(event, element)
      dataCallback.dragleave?.(event, element)
   }

   function drop(event: DragEvent, element: HTMLElement, dropzoneCallback?: DropzoneCallback) {
      event.stopPropagation()

      // Let middleware handle all logic
      for (const middleware of middlewares) {
         middleware.drop?.(event, element, dropzoneCallback, dataCallback)
      }

      // Call dropzone callback's drop hook if it exists
      dropzoneCallback?.drop?.(event, element)

      // Always call the dataCallback's drop hook
      dataCallback.drop?.(event, element)
   }

   return {
      draggable,
      dropzone,
      use
   }
}

// Default singleton instance for backward compatibility
const dnd = createDnd()

// Named exports for the singleton
export const { draggable, dropzone, use } = dnd

// Default export is the singleton
export default dnd
