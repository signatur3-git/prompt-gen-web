<template>
  <nav class="app-nav">
    <div class="nav-container">
      <div class="nav-brand" @click="router.push('/')">
        <span class="nav-logo">🎲</span>
        <span class="nav-title">Prompt Gen</span>
      </div>

      <div class="nav-links">

        <router-link
          to="/preview"
          class="nav-link"
          :class="{ active: $route?.path === '/preview' }"
        >
          <span class="nav-icon">⚡</span>
          <span class="nav-text">Generate</span>
        </router-link>

        <router-link to="/editor" class="nav-link" :class="{ active: $route?.path === '/editor' }">
          <span class="nav-icon">✏️</span>
          <span class="nav-text">Editor</span>
        </router-link>

        <router-link
          to="/marketplace"
          class="nav-link"
          :class="{ active: $route?.path === '/marketplace' }"
        >
          <span class="nav-icon">🏪</span>
          <span class="nav-text">Marketplace</span>
        </router-link>
      </div>

      <div class="nav-actions">
        <div v-if="isAuthenticated" class="nav-status" @click="handleDisconnect">
          <span class="status-indicator connected"></span>
          <span class="status-text">Connected</span>
          <span class="disconnect-icon" title="Disconnect from marketplace">×</span>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { oauthService } from '../services/oauth.service';

const router = useRouter();
const isAuthenticated = ref(false);

onMounted(() => {
  isAuthenticated.value = oauthService.isAuthenticated();
});

// Update auth status when storage changes (from other tabs/windows)
window.addEventListener('storage', () => {
  isAuthenticated.value = oauthService.isAuthenticated();
});

async function handleDisconnect() {
  if (confirm('Disconnect from marketplace? You can reconnect anytime.')) {
    await oauthService.logout();
    isAuthenticated.value = false;
  }
}
</script>

<style scoped>
.app-nav {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

/* Brand */
.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
}

.nav-brand:hover {
  opacity: 0.8;
}

.nav-logo {
  font-size: 1.75rem;
}

.nav-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: -0.025em;
}

/* Links */
.nav-links {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
}

.nav-link:hover {
  background: #f1f5f9;
  color: #2c3e50;
}

.nav-link.active {
  color: #667eea;
  background: #eef2ff;
}

.nav-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.nav-text {
  font-size: 0.95rem;
}

/* Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f0fdf4;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #15803d;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.nav-status:hover {
  background: #dcfce7;
}

.nav-status:hover .disconnect-icon {
  opacity: 1;
}

.disconnect-icon {
  font-size: 1.25rem;
  line-height: 1;
  opacity: 0.5;
  transition: opacity 0.2s;
  margin-left: 0.25rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.status-indicator.connected {
  background: #22c55e;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
  }

  .nav-links {
    gap: 0.25rem;
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
  }

  .nav-text {
    display: none;
  }

  .nav-icon {
    font-size: 1.5rem;
  }

  .nav-title {
    font-size: 1.1rem;
  }

  .status-text {
    display: none;
  }
}
</style>
