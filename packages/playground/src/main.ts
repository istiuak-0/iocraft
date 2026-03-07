import { createApp } from 'vue';
import { router } from './router';
import { iocraft } from 'iocraft';
import App from './App.vue';

createApp(App).use(router).use(iocraft, { router }).mount('#app');
