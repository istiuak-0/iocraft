<script setup lang="ts">
import { ref, onErrorCaptured, Suspense, KeepAlive } from 'vue';
import {  InjectInstance } from 'iocraft';
import { LifecycleTestService } from '../services/Count.service';
import ChildComponent from '../components/ChildComponent.vue';
import ComponentA from '../components/ComponentA.vue';
import ComponentB from '../components/ComponentB.vue';
import AsyncComponent from '../components/AsyncComponent.vue';


InjectInstance(LifecycleTestService);

const showChild = ref(true);
const counter = ref(0);
const showKeepAlive = ref(true);
const activeComponent = ref<'ComponentA' | 'ComponentB'>('ComponentA');
const triggerError = ref(false);

// This will trigger onErrorCaptured in the service
onErrorCaptured((err) => {
  console.log('[Parent] Error captured:', err);
  triggerError.value = false;
  return false; // Prevent propagation
});

function toggleChild() {
  showChild.value = !showChild.value;
}

function updateCounter() {
  counter.value++;
}

function toggleKeepAlive() {
  showKeepAlive.value = !showKeepAlive.value;
}

function switchComponent() {
  activeComponent.value = activeComponent.value === 'ComponentA' ? 'ComponentB' : 'ComponentA';
}

function throwError() {
  triggerError.value = true;
}
</script>

<template>
  <div class="lifecycle-tester">
    <h1>Lifecycle Test Component</h1>
    
    <div class="controls">
      <h2>Test Controls:</h2>
      
      <!-- Test onMounted/onUnmounted/onBeforeMount/onBeforeUnmount -->
      <button @click="toggleChild">
        {{ showChild ? 'Unmount Child' : 'Mount Child' }}
      </button>
      
      <!-- Test onUpdated/onBeforeUpdate -->
      <button @click="updateCounter">
        Update Counter ({{ counter }})
      </button>
      
      <!-- Test onActivated/onDeactivated with KeepAlive -->
      <button @click="toggleKeepAlive">
        {{ showKeepAlive ? 'Hide' : 'Show' }} KeepAlive Component
      </button>
      
      <button @click="switchComponent">
        Switch KeepAlive Component ({{ activeComponent }})
      </button>
      
      <!-- Test onErrorCaptured -->
      <button @click="throwError">
        Trigger Error
      </button>
    </div>

    <!-- Component that will mount/unmount -->
    <div v-if="showChild" class="child-component">
      <ChildComponent :counter="counter" :should-error="triggerError" />
    </div>

    <!-- KeepAlive for testing onActivated/onDeactivated -->
    <div v-if="showKeepAlive" class="keepalive-section">
      <KeepAlive>
        <ComponentA v-if="activeComponent === 'ComponentA'" />
        <ComponentB v-else />
      </KeepAlive>
    </div>

    <!-- Suspense for testing onServerPrefetch (if applicable) -->
    <Suspense>
      <template #default>
        <AsyncComponent />
      </template>
      <template #fallback>
        <div>Loading async component...</div>
      </template>
    </Suspense>
  </div>
</template>

<style scoped>
.lifecycle-tester {
  padding: 20px;
  font-family: sans-serif;
}

.controls {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.controls button {
  margin: 5px;
  padding: 10px 15px;
  cursor: pointer;
}

.child-component,
.keepalive-section {
  margin: 20px 0;
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
}
</style>