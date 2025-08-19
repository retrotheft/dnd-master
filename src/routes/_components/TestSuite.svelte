<script lang="ts">
   import CoreOnly from './test/CoreOnly.svelte'
   import CoreGhost from './test/CoreGhost.svelte'
   import CoreValidation from './test/CoreValidation.svelte'
   import CoreBoth from './test/CoreBoth.svelte'
</script>

<main>
   <h1>DND Library Test Suite</h1>
   <p>Testing all combinations of core functionality with middleware</p>
   
   <CoreOnly />
   <CoreGhost />
   <CoreValidation />
   <CoreBoth />
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
