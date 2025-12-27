<script lang="ts">
   import '../../app.css'
   import OLMovable from "./_components/OLMovable.svelte"
   import Item from "./_components/Item.svelte";

   const array = $state([
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" }
   ]);
</script>

<OLMovable {array}>
   {#snippet listItem(item: any)}
      <Item {item} />
   {/snippet}
</OLMovable>
