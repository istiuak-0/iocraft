<script setup lang="ts">
import { Inject } from 'vuedi';
import { BinanceService } from '../services/Binance.service';

const { connected, socket, lastMessage } = Inject(BinanceService);
</script>

<template>
  <main class="container">
    <h2>Binance WebSocket Test</h2>
    <article>
      <p>
        <strong>Status:</strong>
        <span v-if="connected">🟢 Connected</span>
        <span v-else>🔴 Disconnected</span>
      </p>

      <p>
        <strong>Socket state:</strong>
        {{ socket?.readyState ?? 'N/A' }}
      </p>
    </article>

    <article v-if="lastMessage">
      <header>
        <strong>Last Message</strong>
      </header>

      <pre style="max-height: 300px; overflow: auto"
        >{{ lastMessage }}
      </pre>
    </article>

    <article v-else>
      <p>Waiting for data…</p>
    </article>

    <!-- <button @click="appService.isUnmounted.value = true">Unmount the app</button> -->
  </main>
</template>
