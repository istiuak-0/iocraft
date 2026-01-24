<script setup lang="ts">
import { obtain } from 'vuedi';
import { CountService } from '../services/Count.service';

const { data, computedData, plus, minus, navigate } = obtain(CountService);
</script>
<template>
  <button @click="plus()">plus</button>
  <p>data: {{ data }}</p>
  <p>computed data : {{ computedData }}</p>
  <button @click="minus()">minus</button>

  <button @click="navigate()">navigate</button>
</template>
