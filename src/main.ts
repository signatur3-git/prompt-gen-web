import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { applyThemeDebugFlags } from './theme/debugTheme';
import './style.css';

applyThemeDebugFlags();

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
