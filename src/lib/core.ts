import { type Attachment } from "svelte/attachments"

export type BaseHooks = {
   dragstart?: (event: DragEvent, element: HTMLElement) => void,
   dragend?: (event: DragEvent, element: HTMLElement) => void,
   dragenter?: (event: DragEvent, element: HTMLElement) => void,
   dragover?: (event: DragEvent, element: HTMLElement) => void,
   dragleave?: (event: DragEvent, element: HTMLElement) => void,
   drop?: (event: DragEvent, element: HTMLElement) => void
   stop?: (event: DragEvent, element: HTMLElement) => void
}

export type DropzoneBaseHooks = {
   dragenter?: (event: DragEvent, element: HTMLElement, data: unknown) => void,
   dragover?: (event: DragEvent, element: HTMLElement, data: unknown) => void,
   dragleave?: (event: DragEvent, element: HTMLElement, data: unknown) => void,
   drop?: (event: DragEvent, element: HTMLElement, data: unknown) => void
}

export type DataCallback<TMiddlewareHooks = {}> = (() => unknown) & BaseHooks & TMiddlewareHooks

export type DropCallback<TMiddlewareHooks = {}> =
   ((data: unknown) => void) & DropzoneBaseHooks & TMiddlewareHooks

export type Draggable<TMiddlewareHooks = {}> = (
   data: unknown,
   hooks?: Partial<BaseHooks & TMiddlewareHooks>
) => Attachment<HTMLElement>

export type Dropzone<TMiddlewareHooks = {}> = (
   dropCallback?: (data: unknown) => void,
   hooks?: Partial<DropzoneBaseHooks & TMiddlewareHooks>
) => Attachment<HTMLElement>

export type Middleware<THooks = {}, TExtensions = {}> = {
   extensions?: (draggable: Draggable<{}>, dropzone: Dropzone<{}>) => TExtensions,
   dragstart?: (event: DragEvent, element: HTMLElement, dataCallback: DataCallback) => void | false,
   dragend?: (event: DragEvent, element: HTMLElement, dataCallback: DataCallback) => void | false,
   dragenter?: (event: DragEvent, element: HTMLElement, dropCallback: DropCallback | undefined, dataCallback: DataCallback) => void | false,
   dragover?: (event: DragEvent, element: HTMLElement, dropCallback: DropCallback | undefined, dataCallback: DataCallback) => void | false,
   dragleave?: (event: DragEvent, element: HTMLElement, dropCallback: DropCallback | undefined, dataCallback: DataCallback) => void | false,
   drop?: (event: DragEvent, element: HTMLElement, dropCallback: DropCallback | undefined, dataCallback: DataCallback) => void | boolean
   __hooks?: THooks  // Phantom type parameter for type inference
}

export type DndInstance<TMiddlewareHooks = {}, TExtensions = {}> = {
   draggable: Draggable<TMiddlewareHooks>,
   dropzone: Dropzone<TMiddlewareHooks>,
   use: <TNewHooks, TNewExtensions = {}>(
      middleware: Middleware<TNewHooks, TNewExtensions>
   ) => DndInstance<TMiddlewareHooks & TNewHooks, TExtensions & TNewExtensions> & TExtensions & TNewExtensions,
} & TExtensions

let count = 0
// Factory function to create DND instances
export function createDnd<TMiddlewareHooks = {}, TExtensions = {}>(): DndInstance<TMiddlewareHooks, TExtensions> {
   let dataCallback: DataCallback | (() => void) & BaseHooks = () => { }
   let middlewares: Middleware<any, any>[] = []
   let allExtensions: any = {}

   function use<TNewHooks, TNewExtensions = {}>(
         middleware: Middleware<TNewHooks, TNewExtensions>
      ): DndInstance<TMiddlewareHooks & TNewHooks, TExtensions & TNewExtensions> & TExtensions & TNewExtensions {
         middlewares.push(middleware)

         const instance = {
            draggable,
            dropzone,
            use,
         } as DndInstance<TMiddlewareHooks & TNewHooks, TExtensions & TNewExtensions>

         // Get extensions from this middleware
         const newExtensions = middleware.extensions?.(draggable as any, dropzone as any) || {} as TNewExtensions

         // Accumulate extensions
         allExtensions = {
            ...allExtensions,
            ...newExtensions
         }

         return {
            ...instance,
            ...allExtensions // Return ALL accumulated extensions
         } as DndInstance<TMiddlewareHooks & TNewHooks, TExtensions & TNewExtensions> & TExtensions & TNewExtensions
      }

   /* ===================== Factories ===================== */

   function draggable(
      data: unknown,
      hooks?: Partial<BaseHooks & TMiddlewareHooks>
   ): Attachment<HTMLElement> {
      return (element: HTMLElement) => {
         element.draggable = true
         element.style.cursor = "grab"

         // Create the data callback internally
         const _dataCallback: DataCallback<TMiddlewareHooks> = Object.assign(
            () => data,
            hooks || {}
         ) as DataCallback<TMiddlewareHooks>

         const handleDragStart = (e: DragEvent) => dragStart(e, element, _dataCallback)
         const handleDragEnd = (e: DragEvent) => dragEnd(e, element, _dataCallback)

         element.addEventListener("dragstart", handleDragStart)
         element.addEventListener("dragend", handleDragEnd)
      }
   }

   function dropzone(
      _dropCallback?: (data: unknown) => void,
      hooks?: Partial<DropzoneBaseHooks & TMiddlewareHooks>
   ): Attachment<HTMLElement> {
      return (element: HTMLElement) => {
         // Create the drop callback internally
         let normalizedCallback: DropCallback<TMiddlewareHooks> | undefined

         if (_dropCallback) {
            normalizedCallback = Object.assign(
               _dropCallback,
               hooks || {}
            ) as DropCallback<TMiddlewareHooks>
         }

         const handleDragEnter = (e: DragEvent) => dragEnter(e, element, normalizedCallback)
         const handleDragOver = (e: DragEvent) => dragOver(e, element, normalizedCallback)
         const handleDragLeave = (e: DragEvent) => dragLeave(e, element, normalizedCallback)
         const handleDrop = (e: DragEvent) => drop(e, element, normalizedCallback)

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
   } as DndInstance<TMiddlewareHooks, TExtensions>
}

// Helper function to define middlewares with type inference
export function defineMiddleware<THooks, TExtensions = {}>(
   middleware: Middleware<THooks, TExtensions>
): Middleware<THooks, TExtensions> {
   return middleware
}

// Default singleton instance for backward compatibility
const dnd = createDnd()

// Named exports for the singleton
export const { draggable, dropzone, use } = dnd

// Default export is the singleton
export default dnd
