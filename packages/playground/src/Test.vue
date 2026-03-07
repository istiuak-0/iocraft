<script setup lang="ts">
import { obtain } from 'iocraft';
import { Nav } from 'iocraft/common';

const nav = obtain(Nav);
</script>

<template>
  <main class="container">
    <h1>Test Page</h1>

    <article>
      <header>Current Route</header>
      <p>path: <code>{{ nav.path }}</code></p>
      <p>fullPath: <code>{{ nav.fullPath }}</code></p>
    </article>

    <article>
      <header>Navigation</header>
      <button @click="nav.push('/')">Go Home</button>
      <button @click="nav.back()">Back</button>
      <button @click="nav.replace('/')">Replace Home</button>
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
