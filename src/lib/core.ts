/* ============================================================
   Core Types
============================================================ */

export type ExtensionRecord = Record<string, any>;

export type HookFn = (event: DragEvent, element: HTMLElement) => void;

export type BaseHooks = {
  dragstart?: HookFn;
  dragend?: HookFn;
  dragenter?: HookFn;
  dragover?: HookFn;
  dragleave?: HookFn;
  drop?: HookFn;
  stop?: HookFn;
};

export type DataCallback = (() => unknown) & BaseHooks;

export type DropCallback = ((data: unknown) => void) & BaseHooks;

export type Middleware = Partial<{
  dragstart: (event: DragEvent, el: HTMLElement, dataCallback: DataCallback) => void;
  dragend: (event: DragEvent, el: HTMLElement, dataCallback: DataCallback) => void;
  dragenter: (
    event: DragEvent,
    el: HTMLElement,
    dropCallback?: DropCallback,
    dataCallback?: DataCallback
  ) => void;
  dragover: (
    event: DragEvent,
    el: HTMLElement,
    dropCallback?: DropCallback,
    dataCallback?: DataCallback
  ) => void;
  dragleave: (
    event: DragEvent,
    el: HTMLElement,
    dropCallback?: DropCallback,
    dataCallback?: DataCallback
  ) => void;
  drop: (
    event: DragEvent,
    el: HTMLElement,
    dropCallback?: DropCallback,
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
    dataCallback = _dataCallback;
    _dataCallback.dragstart?.(event, element);
    console.log("dragstart data", _dataCallback)
    console.log(middlewares)
    for (const m of middlewares) m.dragstart?.(event, element, _dataCallback);
  }

  function dragEnd(event: DragEvent, element: HTMLElement, _dataCallback: DataCallback) {
    event.preventDefault();
    _dataCallback.dragend?.(event, element);
    for (const m of middlewares) m.dragend?.(event, element, _dataCallback);
    // dataCallback = () => {};
  }

  function dragEnter(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
    event.preventDefault();
    const data = dataCallback();
    console.log("Drag Enter data callback", dataCallback)
    dropCallback?.dragenter?.(event, element, data);
    dataCallback.dragenter?.(event, element);
    for (const m of middlewares) m.dragenter?.(event, element, dropCallback, dataCallback);
  }

  function dragOver(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
    event.preventDefault();
    const data = dataCallback();
    console.log("Data", data)
    dropCallback?.dragover?.(event, element, data);
    dataCallback.dragover?.(event, element);
    console.log("Core Dragover Data callback", dataCallback)
    for (const m of middlewares) m.dragover?.(event, element, dropCallback, dataCallback);
  }

  function dragLeave(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
    const data = dataCallback();
    dropCallback?.dragleave?.(event, element, data);
    dataCallback.dragleave?.(event, element);
    for (const m of middlewares) m.dragleave?.(event, element, dropCallback, dataCallback);
  }

  function drop(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
    event.stopPropagation();
    const data = dataCallback();
    dropCallback?.drop?.(event, element, data);

    for (const m of middlewares) {
      const result = m.drop?.(event, element, dropCallback, dataCallback);
      if (result === false) {
        dataCallback.stop?.(event, element);
        return;
      }
    }

    dataCallback.drop?.(event, element);
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


// // change function signature and make extensions mutable
// export function createDnd<Ext extends ExtensionRecord = {}>(
//   initialExtensions?: Ext
// ): DndInstance<Ext> {
//   // shared state
//   let dataCallback: DataCallback | (() => void) & BaseHooks = () => "Hello there";

//   // make extensions mutable and default to empty object
//   let extensions = (initialExtensions || ({} as Ext));

//   // middlewares that belong to THIS instance/closure
//   const middlewares: Middleware[] = [];


//   /* ========== Middleware Registration ========== */
//   function use<NewExt extends ExtensionRecord>(
//     middlewareFactory: (
//       instance: DndInstance<Ext>
//     ) => { middleware: Middleware; extensions?: NewExt }
//   ): DndInstance<Ext & NewExt> {
//     // Build the current instance object that middleware factories expect
//     const currentInstance = {
//       draggable,
//       dropzone,
//       use,
//       ...extensions,
//     } as DndInstance<Ext & NewExt>;

//     // Call the factory with the current instance to get middleware + extensions
//     const { middleware, extensions: newExtensions } = middlewareFactory(currentInstance);

//     // Register middleware into the current instance's middleware list
//     if (middleware) middlewares.push(middleware);

//     // Merge new extensions into the existing extensions object (mutate in-place)
//     if (newExtensions) {
//       Object.assign(extensions, newExtensions);
//     }

//     // IMPORTANT: return the same instance (not createDnd again)
//     return currentInstance as DndInstance<Ext & NewExt>;
//   }


//   /* ========== Factories ========== */

//   function draggable(
//     data: unknown,
//     hooks?: Partial<BaseHooks>
//   ): Attachment<HTMLElement> {
//     return (element: HTMLElement) => {
//       element.draggable = true;
//       element.style.cursor = "grab";
//       console.log(data, hooks)
//       const _dataCallback: DataCallback = Object.assign(
//         () => data,
//         hooks || {}
//       ) as DataCallback;

//       const handleDragStart = (e: DragEvent) => dragStart(e, element, _dataCallback);
//       const handleDragEnd = (e: DragEvent) => dragEnd(e, element, _dataCallback);

//       element.addEventListener("dragstart", handleDragStart);
//       element.addEventListener("dragend", handleDragEnd);
//     };
//   }

//   function dropzone(
//     _dropCallback?: (data: unknown) => void,
//     hooks?: Partial<BaseHooks>
//   ): Attachment<HTMLElement> {
//     return (element: HTMLElement) => {
//       let normalizedCallback: DropCallback | undefined;

//       if (_dropCallback) {
//         normalizedCallback = Object.assign(
//           _dropCallback,
//           hooks || {}
//         ) as DropCallback;
//       }

//       const handleDragEnter = (e: DragEvent) => dragEnter(e, element, normalizedCallback);
//       const handleDragOver = (e: DragEvent) => dragOver(e, element, normalizedCallback);
//       const handleDragLeave = (e: DragEvent) => dragLeave(e, element, normalizedCallback);
//       const handleDrop = (e: DragEvent) => drop(e, element, normalizedCallback);

//       element.addEventListener("dragenter", handleDragEnter);
//       element.addEventListener("dragover", handleDragOver);
//       element.addEventListener("dragleave", handleDragLeave);
//       element.addEventListener("drop", handleDrop);
//     };
//   }

//   /* ========== Drag/Drop Event Handlers ========== */

//   function dragStart(event: DragEvent, element: HTMLElement, _dataCallback: DataCallback) {
//     dataCallback = _dataCallback;
//     _dataCallback.dragstart?.(event, element);
//     console.log("dragstart data", _dataCallback)
//     console.log(middlewares)
//     for (const m of middlewares) m.dragstart?.(event, element, _dataCallback);
//   }

//   function dragEnd(event: DragEvent, element: HTMLElement, _dataCallback: DataCallback) {
//     event.preventDefault();
//     _dataCallback.dragend?.(event, element);
//     for (const m of middlewares) m.dragend?.(event, element, _dataCallback);
//     // dataCallback = () => {};
//   }

//   function dragEnter(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
//     event.preventDefault();
//     const data = dataCallback();
//     console.log("Drag Enter data callback", dataCallback)
//     dropCallback?.dragenter?.(event, element, data);
//     dataCallback.dragenter?.(event, element);
//     for (const m of middlewares) m.dragenter?.(event, element, dropCallback, dataCallback);
//   }

//   function dragOver(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
//     event.preventDefault();
//     const data = dataCallback();
//     console.log("Data", data)
//     dropCallback?.dragover?.(event, element, data);
//     dataCallback.dragover?.(event, element);
//     console.log("Core Dragover Data callback", dataCallback)
//     for (const m of middlewares) m.dragover?.(event, element, dropCallback, dataCallback);
//   }

//   function dragLeave(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
//     const data = dataCallback();
//     dropCallback?.dragleave?.(event, element, data);
//     dataCallback.dragleave?.(event, element);
//     for (const m of middlewares) m.dragleave?.(event, element, dropCallback, dataCallback);
//   }

//   function drop(event: DragEvent, element: HTMLElement, dropCallback?: DropCallback) {
//     event.stopPropagation();
//     const data = dataCallback();
//     dropCallback?.drop?.(event, element, data);

//     for (const m of middlewares) {
//       const result = m.drop?.(event, element, dropCallback, dataCallback);
//       if (result === false) {
//         dataCallback.stop?.(event, element);
//         return;
//       }
//     }

//     dataCallback.drop?.(event, element);
//     dropCallback?.(data);
//   }

//   /* ========== Return Instance ========== */

//   return {
//     draggable,
//     dropzone,
//     use,
//     ...extensions,
//   } as DndInstance<Ext>;
// }

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
