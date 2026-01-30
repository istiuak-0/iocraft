<script setup lang="ts">
import { Inject } from 'vuedi';
import { Nav } from 'vuedi/helpers';
import { CountStore } from '../services/Count.service';

const store = Inject(CountStore);

const { push } = Inject(Nav);
</script>
<template>
<p>{{store.select('name')}}</p>
<p>{{store.getState()}}</p>
  <button @click="push('/')">navigate</button>
</template>
