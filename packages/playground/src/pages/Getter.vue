<script setup lang="ts">

import { obtain } from 'vuedi';
import { CountService } from '../services/Count.service';

const service = obtain(CountService);

</script>
<template>
<p>{{service}}</p>



</template>
