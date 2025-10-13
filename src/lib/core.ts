import { type Attachment } from "svelte/attachments"

type BaseHooks = {
   dragstart?: (event: DragEvent, element: HTMLElement) => void,
   dragend?: (event: DragEvent, element: HTMLElement) => void,
   dragenter?: (event: DragEvent, element: HTMLElement) => void,
   dragover?: (event: DragEvent, element: HTMLElement) => void,
   dragleave?: (event: DragEvent, element: HTMLElement) => void,
   drop?: (event: DragEvent, element: HTMLElement) => void
   stop?: (event: DragEvent, element: HTMLElement) => void
}

export type DataCallback<TMiddlewareHooks = {}> = (() => unknown) & BaseHooks & TMiddlewareHooks

export type DropCallback<TMiddlewareHooks = {}> =
   ((data: unknown) => void) & {
      dragenter?: (event: DragEvent, element: HTMLElement, data: unknown) => void,
      dragover?: (event: DragEvent, element: HTMLElement, data: unknown) => void,
      dragleave?: (event: DragEvent, element: HTMLElement, data: unknown) => void,
      drop?: (event: DragEvent, element: HTMLElement, data: unknown) => void
   } & TMiddlewareHooks

export type Draggable<TMiddlewareHooks = {}> = (dataCallback: DataCallback<TMiddlewareHooks>) => Attachment<HTMLElement>
export type Dropzone<TMiddlewareHooks = {}> = (dropCallback?: DropCallback<TMiddlewareHooks>) => Attachment<HTMLElement>

export type Middleware = {
   dragstart?: (event: DragEvent, element: HTMLElement, dataCallback: DataCallback) => void | false,
   dragend?: (event: DragEvent, element: HTMLElement, dataCallback: DataCallback) => void | false,
   dragenter?: (event: DragEvent, element: HTMLElement, dropCallback: DropCallback | undefined, dataCallback: DataCallback) => void | false,
   dragover?: (event: DragEvent, element: HTMLElement, dropCallback: DropCallback | undefined, dataCallback: DataCallback) => void | false,
   dragleave?: (event: DragEvent, element: HTMLElement, dropCallback: DropCallback | undefined, dataCallback: DataCallback) => void | false,
   drop?: (event: DragEvent, element: HTMLElement, dropCallback: DropCallback | undefined, dataCallback: DataCallback) => void | boolean
}

export type DndInstance<TMiddlewareHooks = {}> = {
   draggable: Draggable<TMiddlewareHooks>,
   dropzone: Dropzone<TMiddlewareHooks>,
   use: <TNewHooks>(middleware: Middleware) => DndInstance<TMiddlewareHooks & TNewHooks>,
}

// Factory function to create DND instances
export function createDnd<TMiddlewareHooks = {}>(): DndInstance<TMiddlewareHooks> {
   let dataCallback: DataCallback | (() => void) & BaseHooks = () => { }
   let middlewares: Middleware[] = []

   function use<TNewHooks>(middleware: Middleware): DndInstance<TMiddlewareHooks & TNewHooks> {
      middlewares.push(middleware)
      return {
         draggable,
         dropzone,
         use,
      } as DndInstance<TMiddlewareHooks & TNewHooks>
   }

   /* ===================== Factories ===================== */

   function draggable(_dataCallback: DataCallback<TMiddlewareHooks>): Attachment<HTMLElement> {
      return (element: HTMLElement) => {
         element.draggable = true
         element.style.cursor = "grab"

         const handleDragStart = (e: DragEvent) => dragStart(e, element, _dataCallback)
         const handleDragEnd = (e: DragEvent) => dragEnd(e, element, _dataCallback)

         element.addEventListener("dragstart", handleDragStart)
         element.addEventListener("dragend", handleDragEnd)
      }
   }

   function dropzone(dropCallback?: DropCallback<TMiddlewareHooks>): Attachment<HTMLElement> {
      return (element: HTMLElement) => {
         const handleDragEnter = (e: DragEvent) => dragEnter(e, element, dropCallback)
         const handleDragOver = (e: DragEvent) => dragOver(e, element, dropCallback)
         const handleDragLeave = (e: DragEvent) => dragLeave(e, element, dropCallback)
         const handleDrop = (e: DragEvent) => drop(e, element, dropCallback)

         element.addEventListener("dragenter", handleDragEnter)
         element.addEventListener("dragover", handleDragOver)
         element.addEventListener("dragleave", handleDragLeave)
         element.addEventListener("drop", handleDrop)
      }
   }

   /* ===================== Drag Events ===================== */

   function dragStart(event: DragEvent, element: HTMLElement, _dataCallback: DataCallback<TMiddlewareHooks>) {
      dataCallback = _dataCallback

      _dataCallback.dragstart?.(event, element)

      for (const middleware of middlewares) {
         middleware.dragstart?.(event, element, _dataCallback)
      }
   }

   function dragEnd(event: DragEvent, element: HTMLElement, _dataCallback: DataCallback<TMiddlewareHooks>) {
      event.preventDefault()

      _dataCallback.dragend?.(event, element)

      for (const middleware of middlewares) {
         middleware.dragend?.(event, element, _dataCallback)
      }

      dataCallback = () => { }
   }

   /* ===================== Drop Events ===================== */

   function dragEnter(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback<TMiddlewareHooks>) {
      event.preventDefault()
      const data = dataCallback()

      dropCallback?.dragenter?.(event, element, data)
      dataCallback.dragenter?.(event, element)

      for (const middleware of middlewares) {
         middleware.dragenter?.(event, element, dropCallback, dataCallback)
      }
   }

   function dragOver(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback<TMiddlewareHooks>) {
      event.preventDefault()
      const data = dataCallback()

      dropCallback?.dragover?.(event, element, data)
      dataCallback.dragover?.(event, element)

      for (const middleware of middlewares) {
         middleware.dragover?.(event, element, dropCallback, dataCallback)
      }
   }

   function dragLeave(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback<TMiddlewareHooks>) {
      const data = dataCallback()

      dropCallback?.dragleave?.(event, element, data)
      dataCallback.dragleave?.(event, element)

      for (const middleware of middlewares) {
         middleware.dragleave?.(event, element, dropCallback, dataCallback)
      }
   }

   function drop(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback<TMiddlewareHooks>) {
      event.stopPropagation()
      const data = dataCallback()

      dropCallback?.drop?.(event, element, data)

      for (const middleware of middlewares) {
         const result = middleware.drop?.(event, element, dropCallback, dataCallback)
         if (result === false) {
            dataCallback.stop?.(event, element)
            return
         }
      }

      dataCallback.drop?.(event, element)
      // Call the main drop handler
      dropCallback?.(data)
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
