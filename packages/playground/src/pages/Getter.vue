<script setup lang="ts">
import { obtain } from 'iocraft';
import { TestService } from '../services/Test.service';
import { computed } from 'vue';



const { data } = obtain(TestService);
const double = computed(() => data.value * 2)


</script>
<template>
  <p>{{ data }}</p>
  <p>{{ double }}</p>
  <button @click="data++">update</button>
</template>