import type { Middleware, Draggable, Dropzone, BaseHooks, DropzoneBaseHooks } from "../core.js"
import type { Attachment } from "svelte/attachments"

export type ValidationHooks = {
   validate?: (((data: unknown) => boolean) | ((element: HTMLElement) => boolean)) & {
      pass?: (event: DragEvent, element: HTMLElement) => void
      fail?: (event: DragEvent, element: HTMLElement) => void
      exit?: (event: DragEvent, element: HTMLElement) => void
      enter?: (event: DragEvent, element: HTMLElement) => void
      dragover?: (event: DragEvent, element: HTMLElement) => void
      dragleave?: (event: DragEvent, element: HTMLElement) => void
      drop?: (event: DragEvent, element: HTMLElement) => void
   }
}

export type ValidationExtensions = {
   assertData: <T>(validate: (data: unknown) => data is T) => {
      soDrag: (data: T, hooks?: Partial<ValidationHooks>) => Attachment<HTMLElement>
      soDrop: (onDrop: (data: T) => void, hooks?: Partial<DropzoneBaseHooks & ValidationHooks>) => Attachment<HTMLElement>
   },
   assertZone: (validate: (element: HTMLElement) => boolean) => {
      soGive: (data: unknown, hooks?: Partial<BaseHooks & ValidationHooks>) => Attachment<HTMLElement>
   },
   classes: (validClass?: string, invalidClass?: string) => void
}

// Validation middleware - extends DND with validation hooks
export const validationMiddleware: Middleware<ValidationHooks, ValidationExtensions> = (() => {
   // Cache validation results during drag operations
   let validationCache = new WeakMap<HTMLElement, {
      data: unknown,
      isValid: boolean
   }>()
   let classes = {
      valid: 'valid',
      invalid: 'invalid'
   }

   return {
      extensions(draggable: Draggable<any>, dropzone: Dropzone<any>) {
         const applyDefaultClassHooks = (validate: any) => {
            if (!validate.pass) {
               validate.pass = (event: DragEvent, element: HTMLElement) => {
                  element.classList.remove(classes.invalid)
                  element.classList.add(classes.valid)
               }
            }
            if (!validate.fail) {
               validate.fail = (event: DragEvent, element: HTMLElement) => {
                  element.classList.remove(classes.valid)
                  element.classList.add(classes.invalid)
               }
            }
            if (!validate.exit) {
               validate.exit = (event: DragEvent, element: HTMLElement) => {
                  element.classList.remove(classes.valid, classes.invalid)
               }
            }
         }

         return {
            assertData: <T>(validate: (data: unknown) => data is T) => ({
               soDrag: (data: T, hooks?: Partial<ValidationHooks>) => {
                  applyDefaultClassHooks(validate)
                  return draggable(data, { ...hooks, validate } as any)
               },
               soDrop: (onDrop: (data: T) => void, hooks?: Partial<ValidationHooks>) => {
                  applyDefaultClassHooks(validate)
                  return dropzone(onDrop as any, { ...hooks, validate } as any)
               }
            }),
            assertZone: (validate: (element: HTMLElement) => boolean) => ({
               soGive: (data: unknown, hooks?: Partial<ValidationHooks>) => {
                  applyDefaultClassHooks(validate)
                  return draggable(data, { ...hooks, validate } as any)
               }
            }),
            classes: (newValidClass = 'valid', newInvalidClass = 'invalid') => {
               classes.valid = newValidClass
               classes.invalid = newInvalidClass
            }
         }
      },

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
               if (!validate.pass) {
                  element.classList.remove(classes.invalid)
                  element.classList.add(classes.valid)
               }
            } else {
               validate.fail?.(event, element)
               if (!validate.fail) {
                  element.classList.remove(classes.valid)
                  element.classList.add(classes.invalid)
               }
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
