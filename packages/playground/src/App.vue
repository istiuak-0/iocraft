<script setup lang="ts">
import { ref } from 'vue';
import Test from './Test.vue';

const toggle = ref(true);
</script>
<template>
  Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quas voluptatum alias ex iste quaerat nobis animi totam
  dolores nam, cum, veritatis cumque architecto nostrum natus magnam. Dolor voluptatem odio labore.

  <button @click="toggle = !toggle">toggle</button>

  <Test v-if="toggle" />
</template>
