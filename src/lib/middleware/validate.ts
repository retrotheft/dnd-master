import type { Middleware, DataCallback, DropzoneCallback, DndInstance } from "./core.js"

// Validation types (moved from core)
export type DropCallback = (() => boolean) & DropzoneCallback
export type ValidateCallback = ((dataCallback: DataCallback) => DropCallback | void) & DropzoneCallback

// Create validation middleware factory that works with individual DND instances
export function createValidationMiddleware() {
   // Store validation callbacks on elements
   const validationCallbacks = new WeakMap<HTMLElement, ValidateCallback>()

   // Validation middleware that adds all validation semantics
   const middleware: Middleware = (() => {
      let validationCache = new WeakMap<HTMLElement, { data: unknown, isValid: boolean, dropCallback?: DropCallback | void }>()

      return {
         dragend(event, element, dataCallback) {
            validationCache = new WeakMap()
         },

         dragenter(event, element, dropzoneCallback, dataCallback) {
            const validateCallback = validationCallbacks.get(element)
            if (validateCallback) {
               validateCallback.dragenter?.(event, element)
            }
         },

         dragover(event, element, dropzoneCallback, dataCallback) {
            const validateCallback = validationCallbacks.get(element)
            if (!validateCallback) return

            const target = event.target as HTMLElement
            const currentData = dataCallback()
            const cached = validationCache.get(target)

            if (!cached || cached.data !== currentData) {
               const dropCallback = validateCallback(dataCallback)
               const isValid = dropCallback !== undefined
               validationCache.set(target, { data: currentData, isValid, dropCallback })

               const func = isValid ? 'pass' : 'fail'
               ;(validateCallback as any)[`_${func}`]?.(event, element)
               ;(validateCallback as any)[func]?.(event, element)
            }

            validateCallback.dragover?.(event, element)
         },

         dragleave(event, element, dropzoneCallback, dataCallback) {
            const validateCallback = validationCallbacks.get(element)
            if (validateCallback) {
               validationCache.delete(element)
               ;(validateCallback as any)._exit?.(event, element)
               ;(validateCallback as any).exit?.(event, element)
               validateCallback.dragleave?.(event, element)
            }
         },

         drop(event, element, dropzoneCallback, dataCallback) {
            const validateCallback = validationCallbacks.get(element)
            if (!validateCallback) return

            const cached = validationCache.get(element)

            // Execute validation and drop logic
            if (cached?.isValid && cached.dropCallback && typeof cached.dropCallback === 'function') {
               const success = cached.dropCallback()
               if (!success) {
                  dataCallback.stop?.(event, element)
               }
            } else {
               dataCallback.stop?.(event, element)
            }

            // Clean up
            validateCallback.drop?.(event, element)
            ;(validateCallback as any)._exit?.(event, element)
            ;(validateCallback as any).exit?.(event, element)
            validationCache.delete(element)
         }
      }
   })()

   // Helper to create validation-enabled dropzones for this instance
   function validatingDropzone(dnd: DndInstance, validateCallback: ValidateCallback) {
      return (element: HTMLElement) => {
         // Store the validation callback for this element
         validationCallbacks.set(element, validateCallback)

         // Also attach the basic dropzone functionality
         const dropzoneAttachment = dnd.dropzone()
         dropzoneAttachment(element)

         // Attachments don't need to return cleanup functions like actions do
         // The cleanup happens automatically when the element is removed
      }
   }

   return { middleware, validatingDropzone }
}

// Default singleton instance for backward compatibility
const defaultValidation = createValidationMiddleware()
export const validationMiddleware = defaultValidation.middleware

// This is a simplified version for backward compatibility
// For full functionality, use createValidationMiddleware() with isolated instances
export function validatingDropzone(validateCallback: ValidateCallback) {
   return (element: HTMLElement) => {
      console.warn('Using legacy validatingDropzone - consider using createValidationMiddleware() for better isolation')
      // Basic implementation without proper dropzone attachment
      // This is for backward compatibility only
   }
}

// Classes utility for validation middleware
export function classes(validClass = 'valid', invalidClass = 'invalid') {
   return (func: Function) => {
      Object.assign(func, {
         _pass: (event: DragEvent, element: HTMLElement) => {
            element.classList.remove(invalidClass)
            element.classList.add(validClass)
         },
         _fail: (event: DragEvent, element: HTMLElement) => {
            element.classList.remove(validClass)
            element.classList.add(invalidClass)
         },
         _exit: (event: DragEvent, element: HTMLElement) => {
            element.classList.remove(validClass, invalidClass)
         }
      })
   }
}
