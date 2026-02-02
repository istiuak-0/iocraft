<script setup lang="ts">
import { InjectInstance } from 'iocraft';
import { LifecycleTestService } from '../services/Count.service';

InjectInstance(LifecycleTestService);
</script>

<template>
  <div style="background: lightgreen; padding: 10px;">
    <h3>Component B (KeepAlive)</h3>
    <p>This component is cached by KeepAlive</p>
  </div>
</template>