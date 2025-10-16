/* ============================================================
   Core Types
============================================================ */

export type ExtensionRecord = Record<string, any>;

export type HookFn = (event: DragEvent, element: HTMLElement) => void;

export type DataCallback = (() => unknown) & BaseHooks;

export type DropCallback = ((data: unknown) => void) & BaseHooks;

export type BaseHooks = {
   dragstart?: (event: DragEvent, element: HTMLElement, dataCallback?: DataCallback) => void;
   dragend?: (event: DragEvent, element: HTMLElement, dataCallback?: DataCallback) => void;
   dragenter?: (event: DragEvent, element: HTMLElement, dataCallback?: DataCallback, dropCallback?: DropCallback) => void;
   dragover?: (event: DragEvent, element: HTMLElement, dataCallback?: DataCallback, dropCallback?: DropCallback) => void;
   dragleave?: (event: DragEvent, element: HTMLElement, dataCallback?: DataCallback, dropCallback?: DropCallback) => void;
   drop?: (event: DragEvent, element: HTMLElement, dataCallback?: DataCallback, dropCallback?: DropCallback) => void;
   stop?: (event: DragEvent, element: HTMLElement, dataCallback?: DataCallback, dropCallback?: DropCallback) => void;
   cancel?: (event: DragEvent, element: HTMLElement, dataCallback?: DataCallback) => void;
};



export type Middleware = Partial<{
   dragstart: (event: DragEvent, el: HTMLElement, dataCallback: DataCallback) => void;
   dragend: (event: DragEvent, el: HTMLElement, dataCallback: DataCallback) => void;
   dragenter: (
      event: DragEvent,
      el: HTMLElement,
      dataCallback?: DataCallback,
      dropCallback?: DropCallback
   ) => void;
   dragover: (
      event: DragEvent,
      el: HTMLElement,
      dataCallback?: DataCallback,
      dropCallback?: DropCallback
   ) => void;
   dragleave: (
      event: DragEvent,
      el: HTMLElement,
      dataCallback?: DataCallback,
      dropCallback?: DropCallback
   ) => void;
   drop: (
      event: DragEvent,
      el: HTMLElement,
      dataCallback?: DataCallback,
      dropCallback?: DropCallback
   ) => boolean | void;
   stop: (
      event: DragEvent,
      el: HTMLElement,
      dataCallback?: DataCallback,
      dropCallback?: DropCallback
   ) => boolean | void;
   cancel: (
      event: DragEvent,
      el: HTMLElement,
      dataCallback?: DataCallback
   ) => boolean | void;
}>;

export type Attachment<T> = (el: T) => void;

export type DndInstance<Ext extends ExtensionRecord = {}> = {
   draggable: (
      data: unknown,
      hooks?: Partial<BaseHooks>
   ) => Attachment<HTMLElement>;
   dropzone: (
      dropCallback?: (data: unknown) => void,
      hooks?: Partial<BaseHooks>
   ) => Attachment<HTMLElement>;
   use: <NewExt extends ExtensionRecord>(
      middlewareFactory: (
         instance: DndInstance<Ext>
      ) => { middleware: Middleware; extensions?: NewExt }
   ) => DndInstance<Ext & NewExt>;
} & Ext;

/* ============================================================
   createDnd Implementation (Refactored)
============================================================ */

export function createDnd<Ext extends ExtensionRecord = {}>(
   initialExtensions?: Ext
): DndInstance<Ext> {
   let dataCallback: DataCallback = Object.assign(() => undefined, {} as BaseHooks);
   const middlewares: Middleware[] = [];
   const extensions: Ext = (initialExtensions || {}) as Ext;

   // placeholder that we’ll assign below
   let instance: DndInstance<Ext>;
   let cancellable = true

   function draggable(
      data: unknown,
      hooks?: Partial<BaseHooks>
   ): Attachment<HTMLElement> {
      return (element) => {
         element.draggable = true;
         const _dataCallback: DataCallback = Object.assign(() => data, hooks || {}) as DataCallback;
         const handleDragStart = (e: DragEvent) => dragStart(e, element, _dataCallback);
         const handleDragEnd = (e: DragEvent) => dragEnd(e, element, _dataCallback);
         element.addEventListener("dragstart", handleDragStart);
         element.addEventListener("dragend", handleDragEnd);
      };
   }

   function dropzone(
      _dropCallback?: (data: unknown) => void,
      hooks?: Partial<BaseHooks>
   ): Attachment<HTMLElement> {
      return (element) => {
         const normalized = _dropCallback
            ? (Object.assign(_dropCallback, hooks || {}) as DropCallback)
            : undefined;

         element.addEventListener("dragenter", (e) => dragEnter(e, element, normalized));
         element.addEventListener("dragover", (e) => dragOver(e, element, normalized));
         element.addEventListener("dragleave", (e) => dragLeave(e, element, normalized));
         element.addEventListener("drop", (e) => drop(e, element, normalized));
      };
   }

   /* ========== Drag/Drop Event Handlers ========== */

   function dragStart(event: DragEvent, element: HTMLElement, _dataCallback: DataCallback) {
      cancellable = true
      dataCallback = _dataCallback;
      _dataCallback.dragstart?.(event, element);
      for (const m of middlewares) m.dragstart?.(event, element, _dataCallback);
   }

   function dragEnd(event: DragEvent, element: HTMLElement, _dataCallback: DataCallback) {
      event.preventDefault();
      _dataCallback.dragend?.(event, element);
      for (const m of middlewares) m.dragend?.(event, element, _dataCallback);
      if (cancellable) _dataCallback.cancel?.(event, element, _dataCallback)
   }

   function dragEnter(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
      event.preventDefault();
      dropCallback?.dragenter?.(event, element);
      dataCallback.dragenter?.(event, element);
      for (const m of middlewares) m.dragenter?.(event, element, dataCallback, dropCallback);
   }

   function dragOver(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
      event.preventDefault();
      dropCallback?.dragover?.(event, element);
      dataCallback.dragover?.(event, element);
      for (const m of middlewares) m.dragover?.(event, element, dataCallback, dropCallback);
   }

   function dragLeave(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
      dropCallback?.dragleave?.(event, element);
      dataCallback.dragleave?.(event, element);
      for (const m of middlewares) m.dragleave?.(event, element, dataCallback, dropCallback);
   }

   function drop(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
      event.stopPropagation();
      cancellable = false
      dropCallback?.drop?.(event, element);

      for (const m of middlewares) {
         const result = m.drop?.(event, element, dataCallback, dropCallback);
         if (result === false) {
            dataCallback.stop?.(event, element, dataCallback, dropCallback);
            return;
         }
      }

      dataCallback.drop?.(event, element);

      const data = dataCallback();
      dropCallback?.(data);
   }

   function use<NewExt extends ExtensionRecord>(
      middlewareFactory: (
         instance: DndInstance<Ext>
      ) => { middleware: Middleware; extensions?: NewExt }
   ): DndInstance<Ext & NewExt> {
      const { middleware, extensions: newExtensions } = middlewareFactory(instance);

      if (middleware) middlewares.push(middleware);
      if (newExtensions) {
         Object.assign(extensions, newExtensions);
         Object.assign(instance, newExtensions);
      }

      return instance as DndInstance<Ext & NewExt>;
   }

   instance = {
      draggable,
      dropzone,
      use,
      ...extensions,
   } as DndInstance<Ext>;

   return instance;
}

/* ============================================================
   Middleware Helper
============================================================ */

export function defineMiddleware<
   Ext extends ExtensionRecord = {},
   NewExt extends ExtensionRecord = {}
>(
   factory: (
      instance: DndInstance<Ext>
   ) => { middleware: Middleware; extensions?: NewExt }
) {
   return factory;
}

/* ============================================================
   Singleton Export (Backward Compatible)
============================================================ */

const dnd = createDnd();
export const { draggable, dropzone, use } = dnd;
export default dnd;
