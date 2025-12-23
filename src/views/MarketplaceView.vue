<template>
  <div class="marketplace-view">
    <AppNav />

    <div class="marketplace-content-wrapper">
      <div class="marketplace-header">
        <h1>🏪 Marketplace</h1>
        <p v-if="!isAuthenticated" class="auth-notice">
          Connect to browse and install packages from the community
        </p>
        <p v-else class="auth-notice success">✅ Connected to marketplace</p>
      </div>

      <!-- Connection Panel -->
      <div v-if="!isAuthenticated" class="connection-panel">
        <div class="panel-content">
          <h2>Connect to Marketplace</h2>
          <p>Browse and install packages from the Prompt Gen community.</p>
          <ul class="features-list">
            <li>🔍 Discover community packages</li>
            <li>📦 Install packages with one click</li>
            <li>🚀 Publish your own packages</li>
            <li>🔐 Secure OAuth authentication</li>
          </ul>
          <button @click="connect" :disabled="connecting" class="btn-connect">
            {{ connecting ? 'Connecting...' : 'Connect to Marketplace' }}
          </button>
        </div>
      </div>

      <!-- Marketplace Content (when authenticated) -->
      <div v-else class="marketplace-content">
        <!-- Search Bar -->
        <div class="search-section">
          <div class="search-bar">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search packages..."
              @keyup.enter="search"
              class="search-input"
            />
            <button @click="search" class="btn-search">Search</button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-section">
          <div class="spinner"></div>
          <p>Loading packages...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="loadError" class="error-section">
          <div class="error-icon">⚠️</div>
          <h3>Cannot Connect to Marketplace</h3>
          <p class="error-message">{{ loadError }}</p>
          <div class="error-help">
            <p><strong>To use the marketplace:</strong></p>
            <ol>
              <li>Open a terminal in the marketplace project directory</li>
              <li>Run: <code>npm run dev</code></li>
              <li>Wait for it to start on <code>http://localhost:5174</code></li>
              <li>Click "Retry" below</li>
            </ol>
          </div>
          <button @click="loadPackages" class="btn-retry">Retry Connection</button>
        </div>

        <!-- Packages List -->
        <div v-else class="packages-section">
          <div class="packages-header">
            <h2>Available Packages</h2>
            <span class="package-count">{{ packages.length }} packages</span>
          </div>

          <div v-if="packages.length === 0" class="empty-state">
            <p>No packages found.</p>
            <p class="hint">Try a different search or be the first to publish!</p>
          </div>

          <div v-else class="packages-grid">
            <div v-for="pkg in packages" :key="pkg.id" class="package-card">
              <div class="package-header">
                <h3 class="package-name">{{ pkg.namespace }}/{{ pkg.name }}</h3>
                <span class="package-version">v{{ pkg.version }}</span>
              </div>
              <p class="package-description">
                {{ pkg.description || 'No description available' }}
              </p>
              <div class="package-footer">
                <span class="package-author">by {{ pkg.author || 'Unknown' }}</span>
                <button
                  @click="downloadPackage(pkg)"
                  class="btn-download"
                  :disabled="downloading[pkg.id]"
                >
                  {{ downloading[pkg.id] ? 'Downloading...' : 'Download' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Close marketplace-content-wrapper -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { oauthService } from '../services/oauth.service';
import { marketplaceClient, type Package } from '../services/marketplace-client';
import AppNav from '../components/AppNav.vue';

const isAuthenticated = ref(false);
const connecting = ref(false);
const loading = ref(false);
const loadError = ref('');
const searchQuery = ref('');
const packages = ref<Package[]>([]);
const downloading = ref<Record<string, boolean>>({});

onMounted(() => {
  isAuthenticated.value = oauthService.isAuthenticated();
  if (isAuthenticated.value) {
    loadPackages();
  }
});

async function connect() {
  connecting.value = true;
  try {
    console.log('[MarketplaceView] Starting OAuth flow...');
    await oauthService.startAuthFlow();
    // Note: This will redirect, so code below won't execute
    console.log('[MarketplaceView] This should not appear (redirect should happen)');
  } catch (error) {
    connecting.value = false;
    console.error('[MarketplaceView] Failed to start OAuth flow:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(
      `Failed to connect to marketplace.\n\nError: ${errorMessage}\n\nPlease ensure the marketplace is running on http://localhost:5174 (in development) and try again.`
    );
  }
}


async function loadPackages() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await marketplaceClient.searchPackages(searchQuery.value);
    packages.value = result.packages || [];
    console.log('[Marketplace] Loaded', packages.value.length, 'packages');
  } catch (error) {
    console.error('[Marketplace] Failed to load packages:', error);

    // Check if it's a connection error (marketplace not running)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      loadError.value =
        'Cannot connect to marketplace server. ' +
        'Make sure the marketplace is running on http://localhost:5174';
    } else {
      loadError.value = error instanceof Error ? error.message : 'Failed to load packages';
    }
  } finally {
    loading.value = false;
  }
}

async function search() {
  await loadPackages();
}

async function downloadPackage(pkg: Package) {
  downloading.value[pkg.id] = true;
  try {
    const content = await marketplaceClient.downloadPackage(pkg.namespace, pkg.name, pkg.version);

    // Create download link
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pkg.namespace}-${pkg.name}-${pkg.version}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('[Marketplace] Downloaded package:', pkg.namespace, '/', pkg.name);
  } catch (error) {
    console.error('[Marketplace] Download failed:', error);
    alert(
      `Failed to download package: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    downloading.value[pkg.id] = false;
  }
}
</script>

<style scoped>
.marketplace-view {
  min-height: 100vh;
  background: #f8f9fa;
}

.marketplace-content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.marketplace-header {
  text-align: center;
  margin-bottom: 3rem;
}

.marketplace-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.auth-notice {
  color: #666;
  font-size: 1.1rem;
}

.auth-notice.success {
  color: #38a169;
  font-weight: 600;
}

/* Connection Panel */
.connection-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  padding: 3rem;
  color: white;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.panel-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.panel-content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 2rem 0;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.features-list li {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
}

.btn-connect {
  background: white;
  color: #667eea;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-connect:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-connect:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Search Section */
.search-section {
  margin-bottom: 2rem;
}

.search-bar {
  display: flex;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-search {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-search:hover {
  background: #5568d3;
}

/* Loading/Error States */
.loading-section,
.error-section {
  text-align: center;
  padding: 3rem;
}

.error-section {
  max-width: 600px;
  margin: 0 auto;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-section h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.error-help {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: left;
  margin-bottom: 1.5rem;
}

.error-help p {
  margin-bottom: 0.5rem;
  color: #475569;
}

.error-help strong {
  color: #1e293b;
}

.error-help ol {
  margin: 1rem 0 0 1.5rem;
  color: #475569;
}

.error-help li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.error-help code {
  background: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #1e293b;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #5568d3;
}

.spinner {
  margin: 0 auto 1rem;
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

.error-message {
  color: #e53e3e;
  margin-bottom: 1rem;
}

.btn-retry {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

/* Packages Section */
.packages-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.package-count {
  color: #666;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.hint {
  font-size: 0.9rem;
  color: #999;
  margin-top: 0.5rem;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.package-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.package-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
}

.package-name {
  font-size: 1.1rem;
  color: #2d3748;
  margin: 0;
  word-break: break-word;
}

.package-version {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  white-space: nowrap;
}

.package-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.package-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.package-author {
  color: #999;
  font-size: 0.85rem;
}

.btn-download {
  padding: 0.5rem 1rem;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download:hover:not(:disabled) {
  background: #38a169;
}

.btn-download:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
