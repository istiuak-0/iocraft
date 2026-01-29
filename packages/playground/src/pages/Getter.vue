<script setup lang="ts">
import { Inject } from 'vuedi';
import { CountService } from '../services/Count.service';

const service = Inject(CountService);
</script>
<template>
  <p>{{ service }}</p>
</template>
