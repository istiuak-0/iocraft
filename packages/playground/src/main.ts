import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { VuediPlugin } from 'vuedi';

const app = createApp(App);
app.use(VuediPlugin, {
  router: true,
});
app.use(createPinia());
app.use(router);
app.mount('#app');
