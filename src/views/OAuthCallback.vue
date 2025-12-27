<template>
  <div class="oauth-callback">
    <AppNav />
    <div class="callback-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <h2>Completing authentication...</h2>
        <p>Please wait while we connect to the marketplace.</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h2>Authentication Failed</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <p v-if="errorDescription" class="error-description">{{ errorDescription }}</p>
        <div class="actions">
          <button @click="retry" class="btn-primary">Try Again</button>
          <button @click="goHome" class="btn-secondary">Return to Home</button>
        </div>
      </div>

      <div v-else class="success-state">
        <div class="success-icon">✅</div>
        <h2>Successfully Connected!</h2>
        <p>You're now connected to the marketplace.</p>
        <p class="redirect-message">Redirecting to home page...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { oauthService } from '../services/oauth.service';
import AppNav from '../components/AppNav.vue';

const router = useRouter();
const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const errorDescription = ref('');

onMounted(async () => {
  console.log('[OAuthCallback] Processing OAuth callback...');
  console.log('[OAuthCallback] Current URL:', window.location.href);
  console.log('[OAuthCallback] Search params:', window.location.search);
  console.log('[OAuthCallback] Hash:', window.location.hash);
  console.log('[OAuthCallback] Pathname:', window.location.pathname);

  const result = await oauthService.handleCallback();
  loading.value = false;

  if (!result.success) {
    error.value = true;
    errorMessage.value = result.error || 'Unknown error occurred';
    errorDescription.value = result.errorDescription || '';
    console.error('[OAuthCallback] Authentication failed:', result);
  } else {
    console.log('[OAuthCallback] Authentication successful!');
    // Redirect to home after 2 seconds
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }
});

function retry() {
  oauthService.startAuthFlow();
}

function goHome() {
  router.push('/');
}
</script>

<style scoped>
.oauth-callback {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.callback-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: var(--color-surface);
  border-radius: 1rem;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

/* Loading State */
.loading-state {
  padding: 2rem 0;
}

.spinner {
  margin: 0 auto 2rem;
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state h2 {
  margin: 0 0 1rem;
  color: #333;
  font-size: 1.5rem;
}

.loading-state p {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

/* Error State */
.error-state {
  padding: 2rem 0;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h2 {
  margin: 0 0 1rem;
  color: #e53e3e;
  font-size: 1.5rem;
}

.error-message {
  color: #c53030;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-description {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

/* Success State */
.success-state {
  padding: 2rem 0;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.success-state h2 {
  margin: 0 0 1rem;
  color: #38a169;
  font-size: 1.5rem;
}

.success-state p {
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.redirect-message {
  color: var(--color-text-tertiary);
  font-size: 0.9rem;
  font-style: italic;
}

/* Actions */
.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
  transform: translateY(-2px);
}

.btn-primary:active,
.btn-secondary:active {
  transform: translateY(0);
}
</style>
