<script lang="ts">
   import CoreOnly from './test/CoreOnly.svelte'
   import CoreValidation from './test/CoreValidation.svelte'
   import CoreGhost from './test/CoreGhost.svelte'
   // import CoreBoth from './test/CoreBoth.svelte'
   import TwoWayValidation from './test/TwoWayValidation.svelte'
   import DynamicGhost from './test/DynamicGhost.svelte'
</script>

<main>
   <h1>DND Library Test Suite</h1>
   <p>Testing all combinations of core functionality with middleware</p>

   <!-- <CoreOnly /> -->
   <!-- <CoreValidation /> -->
   <CoreGhost />
   <!-- <CoreBoth /> -->
   <TwoWayValidation />
   <DynamicGhost />
</main>

<style>
   main {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
   }

   h1 {
      text-align: center;
      color: #333;
   }
</style>
