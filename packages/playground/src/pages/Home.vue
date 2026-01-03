<script setup lang="ts">
import { resolve } from '@vuedi/core';
import { BinanceService } from '../services/Binance.service';
import { AppService } from '../App.service';

const binanceService = resolve(BinanceService);

const appService = resolve(AppService);
</script>

<template>
  <main class="container">
    <h2>Binance WebSocket Test</h2>
    <article>
      <p>
        <strong>Status:</strong>
        <span v-if="binanceService.connected">🟢 Connected</span>
        <span v-else>🔴 Disconnected</span>
      </p>

      <p>
        <strong>Socket state:</strong>
        {{ binanceService.socket?.readyState ?? 'N/A' }}
      </p>
    </article>

    <article v-if="binanceService.lastMessage">
      <header>
        <strong>Last Message</strong>
      </header>

      <pre style="max-height: 300px; overflow: auto"
        >{{ binanceService.lastMessage.value }}
      </pre>
    </article>

    <article v-else>
      <p>Waiting for data…</p>
    </article>

    <button @click="appService.isUnmounted.value = true">Unmount the app</button>
  </main>
</template>
