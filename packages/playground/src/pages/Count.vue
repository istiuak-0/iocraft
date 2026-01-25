<script setup lang="ts">
import { obtain } from 'vuedi';
import { CountService } from '../services/Count.service';
import { Nav } from 'vuedi/helpers';

const { data, computedData, plus, minus } = obtain(CountService);

const { push } = obtain(Nav);
</script>
<template>
  <button @click="plus">plus</button>
  <p>data: {{ data }}</p>
  <p>computed data : {{ computedData }}</p>
  <button @click="minus">minus</button>
  <button @click="data = data + 10">update from outside</button>
  <button @click="push('/')">navigate</button>
</template>
