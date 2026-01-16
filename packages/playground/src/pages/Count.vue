<script setup lang="ts">
import { resolve } from '@vuedi/core';
import { CountService } from '../services/Count.service';

const { data, computedData, plus, minus } = resolve(CountService);


console.log(plus);
console.log(minus);

</script>
<template>
  <button @click="plus()">plus</button>
  <p>data: {{ data }}</p>
  <p>computed data : {{ computedData }}</p>
  <button @click="minus()">minus</button>
</template>
