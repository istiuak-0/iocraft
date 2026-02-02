<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { InjectInstance } from 'iocraft';
import { LifecycleTestService } from '../services/Count.service';

InjectInstance(LifecycleTestService);

const props = defineProps<{
  counter: number;
  shouldError: boolean;
}>();

watch(() => props.counter, (newVal) => {
  console.log('[ChildComponent] Counter updated to:', newVal);
});

onMounted(() => {
  if (props.shouldError) {
    throw new Error('Intentional error for testing onErrorCaptured');
  }
});
</script>

<template>
  <div>
    <h3>Child Component</h3>
    <p>Counter: {{ counter }}</p>
  </div>
</template>