<script lang="ts">
   import dnd from '$lib/core.js'

   let { callback, children = undefined } = $props()

   const moveZone = dnd.dropzone(data =>
      callback(data)
   )
</script>

<div {@attach moveZone}>
   {@render children?.()}
</div>

<style>
   div {
      /*border: 1px solid white;*/
      background-color: yellow;
      height: 2em;
   }
</style>
