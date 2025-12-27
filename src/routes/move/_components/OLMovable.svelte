<script lang="ts">
   import { type Snippet } from "svelte";
   import LIMove from "./LIMove.svelte";

   let { listItem, array }: { listItem: Snippet<[any]>; array: any[] } = $props();

   function moveItem(itemToMove: any, targetItem: any, offset: number) {
      const fromIndex = array.indexOf(itemToMove);
      const targetIndex = array.indexOf(targetItem);
      if (fromIndex === -1 || targetIndex === -1) return;

      const [element] = array.splice(fromIndex, 1);
      const newTargetIndex = fromIndex < targetIndex
         ? targetIndex - 1 + offset
         : targetIndex + offset;
      array.splice(newTargetIndex, 0, element);
   }

   const moveBefore = (itemToMove: any, targetItem: any) =>
      moveItem(itemToMove, targetItem, 0);

   const moveAfter = (itemToMove: any, targetItem: any) =>
      moveItem(itemToMove, targetItem, 1);
</script>

<ol>
   {#each array as item}
      <LIMove callback={(draggedItem: any) => moveBefore(draggedItem, item)} />
      <li>{@render listItem(item)}</li>
   {/each}
   <LIMove callback={(draggedItem: any) => moveAfter(draggedItem, array.at(-1))} />
</ol>

<style>
   ol {
      padding-inline-start: 0;
      display: inline-grid;
   }
   li {
      list-style-type: none;
   }
</style>
