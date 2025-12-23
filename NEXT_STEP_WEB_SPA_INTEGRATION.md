# Next Step: prompt-gen-web (SPA) OAuth Integration

**Date:** 2025-12-23  
**Status:** Planning  
**Estimated Time:** 6-8 hours

⚠️ **IMPORTANT:** This plan is for the **WEB SPA** (prompt-gen-web, GitHub Pages).  
📋 **For the DESKTOP APP:** See `NEXT_STEP_WEB_INTEGRATION.md` (different OAuth flow)

---

## 🎯 Goal

Connect the **prompt-gen-web** browser-based SPA to the deployed marketplace using OAuth 2.0 authentication flow, enabling users to:

- Sign in to marketplace from the web app
- Browse marketplace packages
- Install packages (download YAML)
- Publish packages from the web UI

---

## 🔍 Key Differences from Desktop App

### Pure SPA Constraints

- ❌ **No backend server** - Deployed to GitHub Pages (static hosting)
- ❌ **No callback server** - Can't run Express or Node.js
- ✅ **Browser-based OAuth** - Use redirect flow with PKCE
- ✅ **LocalStorage** - Store tokens in browser
- ✅ **Hash fragment or query params** - Receive OAuth callback

### Correct OAuth Flow for SPA

**Authorization Code Flow with PKCE + Browser Redirect:**

1. User clicks "Connect to Marketplace"
2. App generates PKCE challenge, stores verifier in sessionStorage
3. App redirects to marketplace authorization page (full page redirect)
4. User approves on marketplace
5. Marketplace redirects back to app with `code` in URL
6. App extracts code from URL, retrieves verifier from sessionStorage
7. App exchanges code for token (client-side fetch)
8. App stores token in localStorage

---

## ✅ What's Already Done (Marketplace Side)

- ✅ OAuth 2.0 authorization server with PKCE
- ✅ Authorization endpoint: `GET /api/v1/oauth/authorize`
- ✅ Token exchange endpoint: `POST /api/v1/oauth/token`
- ✅ Token revocation endpoint: `POST /api/v1/oauth/revoke`
- ✅ CORS configured (verify for GitHub Pages domain)

---

## 📋 What Needs to Be Done (prompt-gen-web Side)

### Phase 1: OAuth Client Setup (1 hour)

#### 1.1 Register OAuth Client in Marketplace Database

**Action:** Add prompt-gen-web SPA as an OAuth client

```sql
-- Run on marketplace database
INSERT INTO oauth_clients (id, client_id, client_name, redirect_uris, created_at)
VALUES (
  gen_random_uuid(),
  'prompt-gen-web-spa',
  'Prompt Gen Web',
  ARRAY[
    'https://signatur3-git.github.io/prompt-gen-web/oauth/callback',
    'https://signatur3-git.github.io/prompt-gen-web/',
    'http://localhost:5173/oauth/callback',  -- for local dev
    'http://localhost:5173/'
  ],
  NOW()
);
```

**Important Notes:**

- SPA uses HTTPS redirect URIs (GitHub Pages URL)
- Include root path as fallback
- Include localhost for development
- No custom URL schemes (browser-only)

#### 1.2 Verify CORS Configuration

**Marketplace Side:** Ensure CORS allows requests from GitHub Pages

```typescript
// In marketplace backend (already configured?)
app.use(
  cors({
    origin: ['https://signatur3-git.github.io', 'http://localhost:5173'],
    credentials: true,
  })
);
```

#### 1.3 Store OAuth Configuration

**File:** `prompt-gen-web/src/config/marketplace.config.ts`

```typescript
export const marketplaceConfig = {
  authorizationEndpoint: 'https://your-marketplace.railway.app/api/v1/oauth/authorize',
  tokenEndpoint: 'https://your-marketplace.railway.app/api/v1/oauth/token',
  revokeEndpoint: 'https://your-marketplace.railway.app/api/v1/oauth/revoke',
  clientId: 'prompt-gen-web-spa',
  redirectUri: window.location.origin + '/oauth/callback',
  scope: 'read:packages write:packages',
};
```

---

### Phase 2: Implement Browser-Based PKCE Flow (3-4 hours)

#### 2.1 Create OAuth Service (Browser-Compatible)

**File:** `prompt-gen-web/src/services/oauth.service.ts`

```typescript
import { marketplaceConfig } from '../config/marketplace.config';

export class OAuthService {
  // Generate PKCE challenge (browser-compatible)
  async generatePKCEChallenge(): Promise<{ verifier: string; challenge: string }> {
    // Generate random verifier
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Generate challenge from verifier
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return { verifier, challenge };
  }

  // Generate random state for CSRF protection
  generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Start OAuth flow - redirects browser to authorization page
  async startAuthFlow(): Promise<void> {
    // Generate PKCE challenge
    const { verifier, challenge } = await this.generatePKCEChallenge();
    const state = this.generateState();

    // Store verifier and state in sessionStorage (survives redirect)
    sessionStorage.setItem('oauth_verifier', verifier);
    sessionStorage.setItem('oauth_state', state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: marketplaceConfig.clientId,
      redirect_uri: marketplaceConfig.redirectUri,
      response_type: 'code',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      scope: marketplaceConfig.scope,
      state,
    });

    // Redirect to marketplace authorization page
    window.location.href = `${marketplaceConfig.authorizationEndpoint}?${params}`;
  }

  // Handle OAuth callback - call this on redirect back
  async handleCallback(): Promise<{ success: boolean; error?: string }> {
    // Extract code and state from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      return { success: false, error };
    }

    if (!code || !state) {
      return { success: false, error: 'Missing code or state' };
    }

    // Verify state (CSRF protection)
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      return { success: false, error: 'State mismatch' };
    }

    // Get stored verifier
    const verifier = sessionStorage.getItem('oauth_verifier');
    if (!verifier) {
      return { success: false, error: 'Missing verifier' };
    }

    // Exchange code for token
    try {
      const response = await fetch(marketplaceConfig.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: marketplaceConfig.redirectUri,
          client_id: marketplaceConfig.clientId,
          code_verifier: verifier,
        }),
      });

      if (!response.ok) {
        return { success: false, error: 'Token exchange failed' };
      }

      const data = await response.json();
      const accessToken = data.access_token;

      // Store token in localStorage
      localStorage.setItem('marketplace_token', accessToken);

      // Clean up session storage
      sessionStorage.removeItem('oauth_verifier');
      sessionStorage.removeItem('oauth_state');

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('marketplace_token');
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('marketplace_token');
  }

  // Logout - revoke token and clear storage
  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(marketplaceConfig.revokeEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error('Token revocation failed:', err);
      }
    }
    localStorage.removeItem('marketplace_token');
  }
}

export const oauthService = new OAuthService();
```

---

### Phase 3: UI Integration (2-3 hours)

#### 3.1 Add OAuth Callback Route

**File:** `prompt-gen-web/src/router/index.ts` (or wherever routes are defined)

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import OAuthCallback from '../views/OAuthCallback.vue';

const routes = [
  // ...existing routes...
  {
    path: '/oauth/callback',
    name: 'OAuthCallback',
    component: OAuthCallback,
  },
];
```

#### 3.2 Create OAuth Callback Page

**File:** `prompt-gen-web/src/views/OAuthCallback.vue`

```vue
<template>
  <div class="oauth-callback">
    <div v-if="loading">
      <h2>Completing authentication...</h2>
      <p>Please wait while we connect to the marketplace.</p>
    </div>

    <div v-else-if="error">
      <h2>Authentication Failed</h2>
      <p>{{ error }}</p>
      <button @click="goHome">Return to Home</button>
    </div>

    <div v-else>
      <h2>Success!</h2>
      <p>You're now connected to the marketplace.</p>
      <button @click="goToMarketplace">Browse Packages</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { oauthService } from '../services/oauth.service';

const router = useRouter();
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  const result = await oauthService.handleCallback();
  loading.value = false;

  if (!result.success) {
    error.value = result.error || 'Unknown error';
  } else {
    // Redirect to marketplace after 2 seconds
    setTimeout(() => {
      router.push('/marketplace');
    }, 2000);
  }
});

function goHome() {
  router.push('/');
}

function goToMarketplace() {
  router.push('/marketplace');
}
</script>
```

#### 3.3 Add "Connect to Marketplace" Button

**File:** `prompt-gen-web/src/components/MarketplaceConnect.vue` (or add to existing settings)

```vue
<template>
  <div class="marketplace-connect">
    <div v-if="!isAuthenticated">
      <h3>Connect to Marketplace</h3>
      <p>Browse and install packages from the Prompt Gen Marketplace.</p>
      <button @click="connect" :disabled="connecting">
        {{ connecting ? 'Connecting...' : 'Connect to Marketplace' }}
      </button>
    </div>

    <div v-else>
      <h3>Connected to Marketplace</h3>
      <p>✅ You're connected!</p>
      <button @click="disconnect">Disconnect</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { oauthService } from '../services/oauth.service';

const isAuthenticated = ref(false);
const connecting = ref(false);

onMounted(() => {
  isAuthenticated.value = oauthService.isAuthenticated();
});

async function connect() {
  connecting.value = true;
  // This will redirect the browser
  await oauthService.startAuthFlow();
  // Note: code below won't execute because of redirect
}

async function disconnect() {
  await oauthService.logout();
  isAuthenticated.value = false;
}
</script>
```

---

### Phase 4: Marketplace API Integration (2 hours)

#### 4.1 Create Marketplace Client

**File:** `prompt-gen-web/src/services/marketplace-client.ts`

```typescript
import { oauthService } from './oauth.service';
import { marketplaceConfig } from '../config/marketplace.config';

export class MarketplaceClient {
  private baseUrl = marketplaceConfig.tokenEndpoint.replace('/oauth/token', '');

  private async fetch(path: string, options: RequestInit = {}) {
    const token = oauthService.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Browse packages
  async searchPackages(query?: string) {
    const params = query ? `?search=${encodeURIComponent(query)}` : '';
    return this.fetch(`/api/v1/packages${params}`);
  }

  // Get package details
  async getPackage(namespace: string, name: string) {
    return this.fetch(`/api/v1/packages/${namespace}/${name}`);
  }

  // Download package YAML
  async downloadPackage(namespace: string, name: string, version: string): Promise<string> {
    const token = oauthService.getToken();
    const response = await fetch(
      `${this.baseUrl}/api/v1/packages/${namespace}/${name}/${version}/download`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return response.text();
  }

  // Publish package (requires authentication)
  async publishPackage(formData: FormData) {
    const token = oauthService.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/api/v1/packages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Publish failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user's packages
  async getMyPackages() {
    return this.fetch('/api/v1/packages/me');
  }
}

export const marketplaceClient = new MarketplaceClient();
```

---

## 🚀 Implementation Checklist

### Setup

- [ ] Register OAuth client in marketplace database (`prompt-gen-web-spa`)
- [ ] Verify CORS configuration allows GitHub Pages origin
- [ ] Add marketplace config to prompt-gen-web

### OAuth Flow

- [ ] Implement browser-compatible PKCE generation
- [ ] Implement startAuthFlow (redirect to marketplace)
- [ ] Implement handleCallback (process redirect back)
- [ ] Create /oauth/callback route
- [ ] Create OAuthCallback.vue page
- [ ] Test full flow in development

### UI Integration

- [ ] Add "Connect to Marketplace" button
- [ ] Show connection status
- [ ] Add disconnect functionality
- [ ] Handle authentication state across page loads

### Marketplace Integration

- [ ] Implement MarketplaceClient
- [ ] Add package browser UI
- [ ] Add package installation (download YAML)
- [ ] Add package publishing UI
- [ ] Test all marketplace operations

### Polish

- [ ] Error handling for network failures
- [ ] Loading states for async operations
- [ ] Token expiration handling
- [ ] User feedback (success/error messages)
- [ ] Deploy and test on GitHub Pages

---

## 🔒 Security Notes (SPA-Specific)

1. **PKCE is mandatory** - Without backend, this is your only protection
2. **State parameter** - Use for CSRF protection
3. **Token storage** - localStorage is acceptable for SPA (no better option)
4. **HTTPS only** - Never use OAuth over HTTP in production
5. **Token expiration** - Implement token refresh or re-authentication
6. **CORS** - Marketplace must explicitly allow your domain

---

## 📊 Testing Plan

### Local Development

1. Start dev server (`npm run dev`)
2. Click "Connect to Marketplace"
3. Browser redirects to marketplace auth page
4. Approve authorization
5. Browser redirects back to `/oauth/callback`
6. Token stored in localStorage
7. Browse packages works
8. Download package works
9. Publish package works
10. Disconnect works

### Production (GitHub Pages)

1. Deploy to GitHub Pages
2. Test full flow from deployed URL
3. Verify CORS works
4. Verify redirects work with HTTPS

### Edge Cases

- User denies authorization
- Network timeout during token exchange
- Invalid/expired token
- State mismatch (CSRF attempt)
- Code exchange fails

---

## 🎯 Success Criteria

✅ User can connect web SPA to marketplace  
✅ User can browse marketplace packages  
✅ User can download packages (YAML files)  
✅ User can publish packages to marketplace  
✅ User can disconnect from marketplace  
✅ All operations work with proper authentication  
✅ Works on both localhost and GitHub Pages

---

**Status:** Ready to implement  
**Next Step:** Register OAuth client and start Phase 1  
**Key Difference:** Pure browser-based flow, no callback server needed
