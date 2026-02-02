<script setup lang="ts">
import { InjectInstance } from 'iocraft';
import { LifecycleTestService } from '../services/Count.service';

InjectInstance(LifecycleTestService);

// Simulate async operation
await new Promise(resolve => setTimeout(resolve, 100));
</script>

<template>
  <div style="background: lightyellow; padding: 10px">
    <h3>Async Component</h3>
    <p>This component loaded asynchronously</p>
  </div>
</template>
