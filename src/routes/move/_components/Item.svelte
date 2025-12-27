<script lang="ts">
   import dnd from "$lib/core.js";

   let { item } = $props()
</script>

<div {@attach dnd.draggable(item)}>
   {item.name}
</div>

<style>
   div {
      border: 1px solid white;
      padding: 1em;
      text-align: center;
   }
</style>
