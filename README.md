# DnD Master

Limitless, extensible drag and drop for Svelte.

## Installation

```sh
npm install dnd-master
```

## Quickstart

```ts
import { dnd } from 'dnd-master'

const data = { suit: 'Hearts', rank: 'A', name: "Ace of Hearts" }
```

### Data Callbacks

To pass data, create a **data callback**. This is just a function that returns your data, like this:

```ts
const dataCallback = () => data
```

The reason for this is that later, we will attach hooks to this callback, so we need to wrap the data.

### Draggable

Now, you're ready to make an element draggable:

```svelte
<div {@attach dnd.draggable(dataCallback)}>{data.name}</div>
```

Now, we're ready to drop.

### Drop Callbacks

The same way we do with data, here we create a drop callback:

```ts
let lastDropped = $state()

const dropCallback = (data) => {
   lastDropped = data
}
```

And to create a dropzone:

```svelte
<div {@attach dnd.dropzone(dropCallback)}>Drop Here</div>
```

## Hooks

In addition to passing and receiving data, you might want to run side effects of your drag and drop operations. For instance, maybe you want your draggable component to keep a count of how many drops have happened. For this, you can put hooks onto your callbacks, like this:

```ts
let timesDropped = $state(0)

const dataCallback = () => data

dataCallback.drop = () => timesDropped++
```

This lets you run logic on either the drag or drop side of the operation cleanly.

There are hooks for each drag event: `dragstart`, `dragover`, `dragenter`, `dragexit`, `dragend`, and `drop`. There is also `stop`, which will run if any middleware cancels the drag operation. `stop` does not run if the user cancels the drag operation.

## Middleware

You can extend **dnd-master** with middleware, and it ships with two included: **validate** and **ghost**.

### Validate

Validate lets you set up validation logic on both the drag and drop sides of the operation, so that you can control when data is allowed to drop.

```ts
import { createDnd } from 'dnd-master'
import { validate } from 'dnd-master/middleware'

const dnd = createDnd()
dnd.use(validate)
```

#### classes

The `classes` helper function lets you set up your own classNames for valid and invalid drops.

#### Predicate

`Predicate` is a helper class that lets you set up your validation condition, and then create a typed callback.

### Ghost

**Ghost** sets up a ghost image to replace the browser default, and even allows you to dynamically update it during the drag. We'll look at a simple ghost image here, and later in the advanced usage examples there's a dynamic ghost implementation.

```ts
import { createDnd } from 'dnd-master'
import { ghost } from 'dnd-master/middleware'

const dnd = createDnd()
dnd.use(ghost)
```

## Advanced Usage Examples

### Dynamic Ghosts
