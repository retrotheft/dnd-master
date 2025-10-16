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
  ) => ((data: unknown) => data is T) & {
    soDrop: (
      onDrop: (data: T) => void,
      hooks?: Partial<BaseHooks & ValidationHooks>
    ) => Attachment<HTMLElement>;
  };

  assertZone: (
    validate: (element: HTMLElement) => boolean
  ) => ((el: HTMLElement) => boolean) & {
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

export function validate(instance: DndInstance) {
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
         validate.pass = (_e: DragEvent, el: HTMLElement) => {
            el.classList.remove(classes.invalid);
            el.classList.add(classes.valid);
         };
      }
      if (!validate.fail) {
         validate.fail = (_e: DragEvent, el: HTMLElement) => {
            el.classList.remove(classes.valid);
            el.classList.add(classes.invalid);
         };
      }
      if (!validate.exit) {
         validate.exit = (_e: DragEvent, el: HTMLElement) => {
            el.classList.remove(classes.valid, classes.invalid);
         };
      }
   };

   /* ============================================================
      Middleware Behavior
   ============================================================ */
   const middleware: Middleware = {
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
         if (!dataCallback) return console.warn("No data callback passed to validate dragover handler!")
         const data = dataCallback();
         const cached = validationCache.get(element);

         if (!cached || cached.data !== data) {
            const itemValidate = (dataCallback as any).validate;
            let isValid = true;

            if (itemValidate && !itemValidate(data, element)) isValid = false;

            // if (itemValidate && !itemValidate(element)) isValid = false;
            if (isValid && !validate(data, element)) isValid = false;

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
      assertData: <T>(validate: (data: unknown) => data is T) => {
         const validator = ((data: unknown): data is T => validate(data)) as typeof validate & {
            soDrop: (
               onDrop: (data: T) => void,
               hooks?: Partial<BaseHooks & ValidationHooks>
            ) => ReturnType<typeof dropzone>
         }

         validator.soDrop = (
            onDrop: (data: T) => void,
            hooks?: Partial<BaseHooks & ValidationHooks>
         ) => {
            applyDefaultClassHooks(validate)
            return dropzone(onDrop as any, { ...hooks, validate } as any)
         }

         return validator
      },

      assertZone: (validate: (element: HTMLElement) => boolean) => {
         const zoneValidator = ((element: HTMLElement) => validate(element)) as typeof validate & {
            soGive: (
               data: unknown,
               hooks?: Partial<BaseHooks & ValidationHooks>
            ) => ReturnType<typeof draggable>
         }

         zoneValidator.soGive = (data: unknown, hooks?: Partial<BaseHooks & ValidationHooks>) => {
            const wrappedValidate = (_: unknown, el: HTMLElement) => validate(el)
            applyDefaultClassHooks(wrappedValidate as any)
            return draggable(data, { ...hooks, validate: wrappedValidate } as any)
         }

         return zoneValidator
      },


      classes(newValid = "valid", newInvalid = "invalid") {
         classes.valid = newValid;
         classes.invalid = newInvalid;
      },
   };

   return { middleware, extensions };
};
