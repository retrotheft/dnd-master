# Dnd-Master Todo

## Fix Ghost Middleware

- [ ] Remove validation complexity related to Dynamic Ghost
- [ ] correctly pass hooks from a


## Dynamic Ghost Example:

```ts
const isPremiumZone = dnd.assertZone(element => element.dataset.zone === "premium")

const premiumItem = isPremiumZone.soGive("Premium Item", {
   dragstart: () => dnd.setGhost(premiumGhost),
   dragleave: () => dnd.setGhost(premiumGhost),
   dragover: (_, element) => isPremiumZone(element) ? dnd.setGhost(validGhost) : dnd.setGhost(invalidGhost)
})
```

```html
<div {@attach premiumItem}>Premium Item</div>
```
