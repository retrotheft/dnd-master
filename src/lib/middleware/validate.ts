import type { Middleware, DataCallback, DropCallback } from "../core.js"

export type ValidationHooks = {
   validate?: ( ((data: unknown) => boolean) | ((element: HTMLElement) => boolean) ) & {
      pass?: (event: DragEvent, element: HTMLElement) => void
      fail?: (event: DragEvent, element: HTMLElement) => void
      exit?: (event: DragEvent, element: HTMLElement) => void
      enter?: (event: DragEvent, element: HTMLElement) => void
      dragover?: (event: DragEvent, element: HTMLElement) => void
      dragleave?: (event: DragEvent, element: HTMLElement) => void
      drop?: (event: DragEvent, element: HTMLElement) => void
   }
}

// Validation middleware - extends DND with validation hooks
export const validationMiddleware: Middleware = (() => {
   // Cache validation results during drag operations
   let validationCache = new WeakMap<HTMLElement, {
      data: unknown,
      isValid: boolean
   }>()

   return {
      dragend(event, element, dataCallback) {
         // Clear cache when drag ends
         validationCache = new WeakMap()
      },

      dragenter(event, element, dropCallback, dataCallback) {
         // Just call the enter hook if it exists
         const validate = (dropCallback as any)?.validate
         validate?.enter?.(event, element)
      },

      dragover(event, element, dropCallback, dataCallback) {
         const validate = (dropCallback as any)?.validate
         if (!validate) return

         const data = dataCallback()
         const cached = validationCache.get(element)

         // Only re-validate if data changed
         if (!cached || cached.data !== data) {
            // Check draggable validation
            const itemValidate = (dataCallback as any).validate
            let isValid = true

            if (itemValidate && !itemValidate(element)) {
               isValid = false
            }

            // Check dropzone validation
            if (isValid && !validate(data)) {
               isValid = false
            }

            // Cache result
            validationCache.set(element, { data, isValid })

            // Call visual feedback hooks
            if (isValid) {
               validate.pass?.(event, element)
            } else {
               validate.fail?.(event, element)
            }
         }

         // Always call dragover hook
         validate.dragover?.(event, element)
      },

      dragleave(event, element, dropCallback, dataCallback) {
         const validate = (dropCallback as any)?.validate
         if (validate) {
            validationCache.delete(element)
            validate.exit?.(event, element)
            validate.dragleave?.(event, element)
         }
      },

      drop(event, element, dropCallback, dataCallback) {
         const cached = validationCache.get(element)

         // Clean up first
         const validate = (dropCallback as any)?.validate
         if (validate) {
            validate.exit?.(event, element)
            validate.drop?.(event, element)
         }
         validationCache.delete(element)

         // If validation failed, abort drop
         if (cached && !cached.isValid) {
            return false  // Core will call dataCallback.stop()
         }

         // Validation passed or didn't exist - continue
         return true  // Core will call dataCallback.drop()
      }
   }
})()

// Utility to add visual feedback classes to validate hooks
export function classes(validClass = 'valid', invalidClass = 'invalid') {
   return (validate: Function) => {
      Object.assign(validate, {
         pass: (event: DragEvent, element: HTMLElement) => {
            element.classList.remove(invalidClass)
            element.classList.add(validClass)
         },
         fail: (event: DragEvent, element: HTMLElement) => {
            element.classList.remove(validClass)
            element.classList.add(invalidClass)
         },
         exit: (event: DragEvent, element: HTMLElement) => {
            element.classList.remove(validClass, invalidClass)
         }
      })
   }
}

export function validated<T>(
   validate: (data: unknown) => data is T,
   onDrop: (data: T) => void
): DropCallback {
   const dropCallback = onDrop as DropCallback<ValidationHooks>
   dropCallback.validate = validate
   return dropCallback
}
// For dropzone validation (checks data)
// export class DataPredicate<T> {
//    type!: T

//    constructor(public validate: (data: unknown) => data is T) {}

//    soDrop(onDrop: (data: T) => void): DropCallback<ValidationHooks> & { validate: (data: unknown) => data is T } {
//       const dropCallback = onDrop as DropCallback<ValidationHooks>
//       dropCallback.validate = this.validate
//       return dropCallback as DropCallback<ValidationHooks> & { validate: (data: unknown) => data is T }
//    }
// }

export function DataPredicate<T>(validate: (data: unknown) => data is T) {
   const predicate = validate as typeof validate & {
      soDrop: (onDrop: (data: T) => void) => DropCallback<ValidationHooks> & { validate: typeof validate }
   }

   predicate.soDrop = (onDrop: (data: T) => void) => {
      const dropCallback = onDrop as DropCallback<ValidationHooks>
      dropCallback.validate = validate
      return dropCallback as DropCallback<ValidationHooks> & { validate: typeof validate }
   }

   return predicate
}

// // Usage
// const isString = DataPredicate((data): data is string => typeof data === "string")
// if (isString(someData)) { ... }  // Call as function
// const drop = isString.soDrop(data => { ... })  // Use method

// For draggable validation (checks elements)
// export class DropPredicate {
//    constructor(public validate: (element: HTMLElement) => boolean) {}

//    soGive(getData: () => unknown): DataCallback<ValidationHooks> & { validate: (element: HTMLElement) => boolean } {
//       const dataCallback = getData as DataCallback<ValidationHooks>
//       dataCallback.validate = this.validate
//       return dataCallback as DataCallback<ValidationHooks> & { validate: (element: HTMLElement) => boolean }
//    }
// }

export function DropPredicate(validate: (element: HTMLElement) => boolean) {
   const predicate = validate as typeof validate & {
      soGive: (getData: () => unknown) => DataCallback<ValidationHooks> & { validate: typeof validate }
   }

   predicate.soGive = (getData: () => unknown) => {
      const dataCallback = getData as DataCallback<ValidationHooks>
      dataCallback.validate = validate
      return dataCallback as DataCallback<ValidationHooks> & { validate: typeof validate }
   }

   return predicate
}

// Usage
// const canDropOnPremium = DropPredicate(element => element.dataset.zone === "premium")
// if (canDropOnPremium(someElement)) { ... }  // Call as function
// const item = canDropOnPremium.soGive(() => "Premium Item")  // Use method
