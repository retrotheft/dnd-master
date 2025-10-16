# DnD Master

**Important: I haven't published this to npm yet. Will do so in the next 24 hours.**

Limitless, extensible drag and drop for Svelte.


## Installation

```sh
npm install dnd-master
```

## Quickstart

If you just want to get started with a simple drag and drop, you can import the `dnd` singleton. This has no middleware.

```ts
import { dnd } from 'dnd-master'

const data = { name: 'Alice' }
```

### Data Attachments

To pass data, create a data attachment using `dnd.draggable`, like this:

```ts
const dataAttachment = dnd.draggable(data)
```

Then attach it to an element:

```html
<div {@attach dataAttachment}>{data.name}</div>
```

Now, we're ready to drop.

### Dropzone Attachments

The same way we do with data, here we create a dropzone attachment, this time passing a callback that receives a `data` parameter:

```ts
let lastDropped = $state()

const dropzone = dnd.dropzone(data => {
   lastDropped = data
})
```

Then attach the dropzone to an element:

```svelte
<div {@attach dropzone}>Drop Here</div>
```

## Hooks

In addition to passing and receiving data, you might want to run side effects of your drag and drop operations. For instance, maybe you want to keep a count of how many drops have happened, but on the data side. For this, you can set up hooks like this:

```ts
let timesDropped = $state(0)

const dataAttachment = dnd.draggable(data, {
   drop: () => timesDropped++
})
```

This lets you run logic on either the drag or drop side of the operation cleanly.

There are hooks for each drag event: `dragstart`, `dragover`, `dragenter`, `dragexit`, `dragend`, and `drop`. There are also: `stop`, and `cancel`. (More on those in a moment.)

All hooks run *before* middleware runs, with the exception of the Data Attachment `drop` hook. This will only run on a successful drop, which happens after the middleware. For cancellations, use the `cancel` hook, and for interrupted drops, (i.e. validation refused the drop) use `stop`.

If you want to run logic on the dropzone side only on a successful drop, put that logic into your drop callback itself, not into the `drop` hook.

## Middleware

You can extend **dnd-master** with middleware, and it ships with two included: **validate** and **ghost**. Middlewares work by attaching extension functions to the `dnd` instance, and can also provide new hooks that you can add to you your data and dropzone attachments.

In order to use middleware, you need to import `createDnd` and create a `dnd` instance, then import the middleware you'd like and pass it into `dnd.use`, like this:

```ts
import { createDnd } from 'dnd-master'
import { validate, ghost } from 'dnd-master/middleware'

const dnd = createDnd()
   .use(ghost)
   .use(validate) // you can chain .use calls!
```

### Validate

Validate lets you set up validation logic on both the drag and drop sides of the operation, so that you can control when data is allowed to drop.

```ts
import { createDnd } from 'dnd-master'
import { validate } from 'dnd-master/middleware'

const dnd = createDnd().use(validate)
```

#### CSS Classes

The default css classes are `valid` and `invalid`. If you'd like to override them, you can call `dnd.classes`. Note that the validate middleware needs to have been added to dnd first for the `classes` function to be available.

```ts
const dnd = createDnd().use(validate)

dnd.classes('myValidClass', 'myInvalidClass')
````

#### Validating Data & Dropzones

To use validation, you can use the functions `assertData` and `assertZone`. These functions receive a predicate (which can also be a type assertion) and return a validator function which also has a builder on it. That's a bit confusing, so let's see it in action and then explain what's happening.

```ts
let lastDropped = $state('')

// the type assertion here is optional but highly encouraged
const isString = dnd.assertData((data): data is string =>
   typeof data === "string"
)

isString("Hello there") // returns true
isString(1) // returns false

// soDrop is a property on isString, that we can use to create a dropzone:
const dropzone = isString.soDrop(data => lastDropped = data)
// data will be correctly typed as a string from the type assertion!
```

Internally, `soDrop` just calls `dnd.dropzone`, so you can also pass hooks if you like.

Now let's see the same for creating the draggable. For that we use `assertZone`, which receives an `HTMLElement`:

```ts
const isPremiumZone = dnd.assertZone(element =>
   element.dataset.zone === "premium"
)

const premiumItem = isPremiumZone.soGive("Premium Item")
```

`soGive` uses `dnd.draggable` internally, so again, you can use hooks.

There's no need to make the zone predicate a type assertion.

### Ghost

**Ghost** sets up a ghost image to replace the browser default, and even allows you to dynamically update it during the drag. We'll look at a simple ghost image here, and later in the advanced usage examples there's a dynamic ghost implementation.

To do this, you can either create an element programmatically or bind one from inside a template. Then use the `dragstart` hook to attach the ghost:

```ts
import { createDnd } from 'dnd-master'
import { ghost } from 'dnd-master/middleware'

const dnd = createDnd().use(ghost)

const ghostElement = document.createElement('div')
ghostElement.textContent = "👻 Ghost Item"
ghostElement.style.cssText = `
   background: #ff5722;
   color: white;
   padding: 0.5rem;
   border-radius: 4px;
   box-shadow: 0 2px 8px rgba(0,0,0,0.3);
`

const itemWithGhost = dnd.draggable("My Item", {
   dragstart: () => dnd.setGhost(ghostElement)
})
```

Or alternatively:

```ts
import { createDnd } from 'dnd-master'
import { ghost } from 'dnd-master/middleware'

const dnd = createDnd().use(ghost)

let ghostElement = $state<HTMLDivElement>()

const itemWithGhost = dnd.draggable("My Item", {
   dragstart: () => dnd.setGhost(ghostElement)
})
```
```html
<template>
   <div class="ghost" bind:this={ghostElement}>👻 Ghost Item</div>
</template>
```
```css
div.ghost {
   background: #7022ff;
   color: white;
   padding: 0.5rem;
   border-radius: 4px;
   box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
```

## Advanced Usage Examples

### Dynamic Ghosts

If you want to have a dynamic ghost that updates on valid or invalid dropzones, you can do the following:

```ts
let defaultGhost = $state<HTMLDivElement>()
let validGhost = $state<HTMLDivElement>()
let invalidGhost = $state<HTMLDivElement>()

const isValidZone = dnd.assertZone(element =>
   element.dataset.zone === "valid"
)

const dynamicItem = isValidZone.soGive("Item with Dynamic Ghost", {
   dragstart: () => dnd.setGhost(defaultGhost),
   dragleave: () => dnd.setGhost(defaultGhost),
   dragover: (_event, element) => {
      isValidZone(element) ? dnd.setGhost(validGhost) : dnd.setGhost(invalidGhost)
   }
})
```

This allows you to dynamically update your ghost image, and without the ghost and validate middlewares needing to talk to each other at all!
