<script setup lang="ts">
import { resolve } from '@vuedi/core';
import { AppService } from './App.service';
import { onMounted, onUnmounted } from 'vue';

const appService = resolve(AppService);

onMounted(() => {
  console.log(appService);
});

onUnmounted(() => {
  console.log('component is unmounted');
});
</script>
<template>
  <p>{{ appService.data }}</p>
</template>
