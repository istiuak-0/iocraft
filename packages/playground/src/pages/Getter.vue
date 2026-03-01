<template>
  <div style="padding: 2rem; font-family: monospace; max-width: 600px">
    <h2>AbortController Test</h2>

    <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem">
      <button @click="startRequest" :disabled="status === 'loading'">
        Start Request
      </button>
      <button @click="cancelRequest" :disabled="status !== 'loading'">
        Cancel Request
      </button>
      <button @click="reset">Reset</button>
    </div>

    <div style="margin-bottom: 1rem">
      Status: <strong>{{ status }}</strong>
    </div>

    <div v-if="log.length" style="background: #f4f4f4; padding: 1rem; border-radius: 6px">
      <div v-for="(entry, i) in log" :key="i" :style="{ color: entry.color }">
        [{{ entry.time }}] {{ entry.msg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const status = ref<'idle' | 'loading' | 'success' | 'error' | 'aborted'>('idle')
const log = ref<{ msg: string; time: string; color: string }[]>([])

// This is what we're testing — does the same controller work after abort?
let controller = new AbortController()

function addLog(msg: string, color = '#333') {
  const time = new Date().toLocaleTimeString()
  log.value.push({ msg, time, color })
}

async function startRequest() {
  // KEY QUESTION: do we reuse old controller or create new one?
  // Test 1: reuse old controller (will fail if previously aborted)
  // Test 2: always create new (correct behavior)

  addLog(`controller.signal.aborted = ${controller.signal.aborted}`, '#888')

  if (controller.signal.aborted) {
    addLog('⚠️  signal already aborted — creating new controller', 'orange')
    controller = new AbortController()  // must create new one
  }

  status.value = 'loading'
  addLog('Starting request...', '#333')

  try {
    // simulate slow request using httpbin delay endpoint
    const res = await fetch('https://httpbin.org/delay/5', {
      signal: controller.signal
    })

    const data = await res.json()
    status.value = 'success'
    addLog('✅ Request succeeded', 'green')
    addLog(`Response: ${JSON.stringify(data).slice(0, 80)}...`, 'green')

  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      status.value = 'aborted'
      addLog('🚫 Request was aborted', 'red')
      addLog(`controller.signal.aborted after abort = ${controller.signal.aborted}`, 'red')
      addLog('⚠️  This controller is now useless — must create new one for next request', 'orange')
    } else {
      status.value = 'error'
      addLog(`❌ Error: ${(e as Error).message}`, 'red')
    }
  }
}

function cancelRequest() {
  addLog('Cancelling...', 'orange')
  controller.abort()
}

function reset() {
  controller = new AbortController()
  status.value = 'idle'
  log.value = []
  addLog('Reset — new controller created', '#888')
}
</script>