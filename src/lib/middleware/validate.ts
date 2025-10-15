import type {
  DndInstance,
  Middleware,
  BaseHooks,
  DropCallback,
  DataCallback,
  Attachment,
} from "../core.js";

/* ============================================================
   Validation Hook & Extension Types
============================================================ */

export type ValidationHooks = {
  validate?: (((data: unknown) => boolean) | ((element: HTMLElement) => boolean)) & {
    pass?: (event: DragEvent, element: HTMLElement) => void;
    fail?: (event: DragEvent, element: HTMLElement) => void;
    exit?: (event: DragEvent, element: HTMLElement) => void;
    enter?: (event: DragEvent, element: HTMLElement) => void;
    dragover?: (event: DragEvent, element: HTMLElement) => void;
    dragleave?: (event: DragEvent, element: HTMLElement) => void;
    drop?: (event: DragEvent, element: HTMLElement) => void;
  };
};

export type ValidationExtensions = {
  assertData: <T>(
    validate: (data: unknown) => data is T
  ) => {
    soDrag: (data: T, hooks?: Partial<ValidationHooks>) => Attachment<HTMLElement>;
    soDrop: (
      onDrop: (data: T) => void,
      hooks?: Partial<BaseHooks & ValidationHooks>
    ) => Attachment<HTMLElement>;
  };
  assertZone: (
    validate: (element: HTMLElement) => boolean
  ) => {
    soGive: (
      data: unknown,
      hooks?: Partial<BaseHooks & ValidationHooks>
    ) => Attachment<HTMLElement>;
  };
  classes: (validClass?: string, invalidClass?: string) => void;
};

/* ============================================================
   Validation Middleware
============================================================ */

export function validationMiddleware(instance: DndInstance) {
  // Cache validation results during drag operations
  let validationCache = new WeakMap<
    HTMLElement,
    { data: unknown; isValid: boolean }
  >();

  let classes = {
    valid: "valid",
    invalid: "invalid",
  };

  const { draggable, dropzone } = instance;

  const applyDefaultClassHooks = (validate: any) => {
    if (!validate.pass) {
      validate.pass = (_e, el) => {
        el.classList.remove(classes.invalid);
        el.classList.add(classes.valid);
      };
    }
    if (!validate.fail) {
      validate.fail = (_e, el) => {
        el.classList.remove(classes.valid);
        el.classList.add(classes.invalid);
      };
    }
    if (!validate.exit) {
      validate.exit = (_e, el) => {
        el.classList.remove(classes.valid, classes.invalid);
      };
    }
  };

  /* ============================================================
     Middleware Behavior
  ============================================================ */
  const middleware: Middleware = {
     dragstart(event, element, dataCallback) {
        console.log("validate dragstart data callback", dataCallback)
     },
    dragend() {
      // Clear cache when drag ends
      validationCache = new WeakMap();
    },

    dragenter(event, element, dropCallback) {
      const validate = (dropCallback as any)?.validate;
      validate?.enter?.(event, element);
    },

    dragover(event, element, dropCallback, dataCallback) {
      const validate = (dropCallback as any)?.validate;
      if (!validate) return;
      console.log("data callback", dataCallback)
      const data = dataCallback();
      console.log("Data", data)
      const cached = validationCache.get(element);

      if (!cached || cached.data !== data) {
        const itemValidate = (dataCallback as any).validate;
        let isValid = true;

        if (itemValidate && !itemValidate(data)) isValid = false;

        // if (itemValidate && !itemValidate(element)) isValid = false;
        if (isValid && !validate(data)) isValid = false;

        validationCache.set(element, { data, isValid });

        if (isValid) {
          validate.pass?.(event, element);
          if (!validate.pass) {
            element.classList.remove(classes.invalid);
            element.classList.add(classes.valid);
          }
        } else {
          validate.fail?.(event, element);
          if (!validate.fail) {
            element.classList.remove(classes.valid);
            element.classList.add(classes.invalid);
          }
        }
      }

      validate.dragover?.(event, element);
    },

    dragleave(event, element, dropCallback) {
      const validate = (dropCallback as any)?.validate;
      if (validate) {
        validationCache.delete(element);
        validate.exit?.(event, element);
        validate.dragleave?.(event, element);
      }
    },

    drop(event, element, dropCallback, dataCallback) {
      const cached = validationCache.get(element);
      const validate = (dropCallback as any)?.validate;

      if (validate) {
        validate.exit?.(event, element);
        validate.drop?.(event, element);
      }

      validationCache.delete(element);

      if (cached && !cached.isValid) {
        return false; // Core will call dataCallback.stop()
      }

      return true;
    },
  };

  /* ============================================================
     Extensions (API additions)
  ============================================================ */
  const extensions: ValidationExtensions = {
    assertData: <T>(validate: (data: unknown) => data is T) => ({
      soDrag: (data: T, hooks?: Partial<ValidationHooks>) => {
        applyDefaultClassHooks(validate);
        return draggable(data, { ...hooks, validate } as any);
      },
      soDrop: (
        onDrop: (data: T) => void,
        hooks?: Partial<BaseHooks & ValidationHooks>
      ) => {
         console.log(onDrop, hooks)
        applyDefaultClassHooks(validate);
        return dropzone(onDrop as any, { ...hooks, validate } as any);
      },
    }),

    assertZone: (validate: (element: HTMLElement) => boolean) => ({
      soGive: (data: unknown, hooks?: Partial<BaseHooks & ValidationHooks>) => {
        applyDefaultClassHooks(validate);
        return draggable(data, { ...hooks, validate } as any);
      },
    }),

    classes(newValid = "valid", newInvalid = "invalid") {
      classes.valid = newValid;
      classes.invalid = newInvalid;
    },
  };

  return { middleware, extensions };
};
