<script setup lang="ts">
import { obtain } from 'iocraft';
import { Nav } from 'iocraft/common';

const nav = obtain(Nav);
const { push } = obtain(Nav)

console.log(push);

</script>

<template>
  <main class="container">
    <h1>Home</h1>

    <article>
      <header>Current Route</header>
      <p>path: <code>{{ nav.path }}</code></p>
      <p>name: <code>{{ nav.name?.toString() ?? '-' }}</code></p>
      <p>fullPath: <code>{{ nav.fullPath }}</code></p>
    </article>

    <header>Navigation</header>
    <article class="grid">
      <button @click="nav.push('/test')">Go to /test</button>
      <button @click="nav.back()">Back</button>
      <button @click="nav.forward()">Forward</button>
    </article>

    <article>
      <header>Routes</header>
      <p>Count: {{ nav.getRoutes().length }}</p>
    </article>
  </main>
</template>

<style>
code {
  background: var(--pico-code-background-color);
  padding: 0.2em 0.4em;
  border-radius: 4px;
}
</style>
