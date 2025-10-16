# Dnd-Master: Lightweight, Powerful Drag-and-Drop for Svelte

Have you ever noticed that when it comes to drag and drop options, the choices seem to be:

- Use the Native Drag and Drop API (which everyone should do exactly once), or;
- Use this fully-featured library with a big detailed API to learn, and we hope you want to animate lists

There doesn't really seem to be a middle-ground: something that abstracts over the painful parts of the native experience, but that is also dead simple to use and flexible. Powerful, even.

So I made Dnd-Master; a minimal hooks-based solution that is extendable via middleware. And it's typesafe. In this article, I'll go over the basics of how it works and then show examples of two-way validation and a dynamic ghost element.

This is just meant to be a quick read so you can decide if it's right for you; for the full README, visit the [github repo](https://github.com/retrotheft/dnd-master).

## Dragging

To pass some data, use `dnd.draggable` to create an attachment, and attach it to an element:

```ts
const draggable = dnd.draggable("My data")
```

```html
<div {@attach draggable}>My data</div>
```

Creating a dropzone is almost the same, but pass it a callback instead of an object:

```ts
const dropzone = dnd.dropzone(data => console.log(data))
```

```html
<div {@attach dropzone}>Drop here</div>
```

That's pretty straightforward, but the real fun begins when we start using hooks:

```ts
let timesDropped = $state(0)

const draggable = dnd.draggable("My data", {
   drop: () => timesDropped++
})
```

Notice that here, we're running some drop-aware logic on the *data* side of things, without needing to connect anything to the drop callback, which might very well be in a different component.

Both the data and drop attachments can implement all the native drag events as hooks, as well as a couple of others, and middlewares can provide more.

## Middleware

**Dnd-Master** comes with two middlewares: **Validate** and **Ghost**. Let's quickly look at how to validate data, then we'll create a ghost element, and then we'll finish by implementing two-way validation and a dynamic ghost that responds to different dropzones.

### Validation

To validate data, use `assertData`. This function takes a predicate, and returns a validator function that also has a builder on it that replaces `dnd.draggable`. Like this:

```ts
const isString = dnd.assertData(data => typeof data === "string")

const dropzone = isString.soDrop(data => lastDropped = data)
// this will only run your drop callback if the predicate is true
```

You can also make your drop callback typesafe by using a type assertion in `assertData`:

```ts
const isString = dnd.assertData(
   (data): data is string => typeof data === "string"
)

const dropzone = isString.soDrop(data => lastDropped = data)
// now typescript knows data is a string!
```

I like this approach because it encourages me to use a feature that I always forget exists, without abstracting over it.

### Ghost

First, let's create an element to use as our ghost. We'll wrap it in `<template>` so it doesn't appear in the DOM:

```html
<template>
   <div class="ghost" bind:this={ghostElement}>👻 Ghost</div>
</template>
```

You could style this however you like. Now here's how to add it to the dragged element:

```ts
let ghostElement = $state<HTMLDivElement>()

const draggable = dnd.draggable("My item", {
   dragstart: () => dnd.setGhost(ghostElement)
})
```

We can just use the `dragstart` hook, as well as the `setGhost` function provided by the `ghost` middleware. Painless.

## Advanced Examples

### Two-way Validation

We already saw how to validate data. Here's how to validate a dropzone:

```ts
const isValidZone = dnd.assertZone(
   element => element.dataset.zone === "valid"
)

const draggable = isValidZone.soGive("My item")

// and let's validate some data again:
const isString = dnd.assertData(
   (data): data is string => typeof data === "string"
)

const dropzone = isString.soDrop(data => lastDropped = data)
```

```html
<div {@attach draggable}>My item</div>

<div data-zone="valid" {@attach dropzone}>Valid Dropzone</div>
```

Now both sides of the drag and drop flow will validate before passing the data.

### Dynamic Ghost

Here we want a ghost that will update when over different dropzones.

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
      isValidZone(element)
         ? dnd.setGhost(validGhost)
         : dnd.setGhost(invalidGhost)
   }
})

const dropzone = dnd.dropzone(data => console.log(data))
```

```html
<div {@attach draggable}>My item</div>

<div data-zone="valid" {@attach dropzone}>Valid Dropzone</div>
<div data-zone="invalid" {@attach dropzone}>Invalid Dropzone</div>

<template>
   <div bind:this={defaultGhost}>👻 Ghost</div>
   <div bind:this={validGhost}>✅ Drop here!</div>
   <div bind:this={invalidGhost}>❌ Can't park here mate</div>
</template>
```

And that's it! Notice that we didn't need to create two separate dropzones; all our validation is data-based in the element data attributes. You could of course choose a different method, the data attribute approach is nothing to do with the library itself, just an idiomatic way of doing it.

---

Hopefully that's enough to make you interested in trying out **Dnd-Master**. You can find it on [github](https://github.com/retrotheft/dnd-master) and npm. It's open source, MIT Licensed, and ready to be expanded with more middleware!

If you use it, let me know how it goes!
