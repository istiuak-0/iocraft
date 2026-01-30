<script setup lang="ts">
import { Inject } from 'vuedi';
import { CountStore } from '../services/Count.service';

const service = Inject(CountStore);
</script>
<template>
  <p>{{ service }}</p>
</template>
