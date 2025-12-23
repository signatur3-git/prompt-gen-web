// Marketplace OAuth Configuration
// This configuration is for the pure frontend SPA OAuth flow

// Use localhost marketplace for development, production URL for builds
const MARKETPLACE_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5174'
  : 'https://prompt-gen-marketplace-production.up.railway.app';

// Determine the redirect URI based on environment
const getRedirectUri = (): string => {
  if (typeof window !== 'undefined') {
    const { origin } = window.location;
    const basePath = import.meta.env.BASE_URL || '/';
    // Ensure we use the correct base path for GitHub Pages
    const callbackPath = basePath === '/' ? '/oauth/callback' : `${basePath}oauth/callback`;
    return `${origin}${callbackPath}`;
  }
  // Fallback for SSR or build time
  return 'http://localhost:5173/oauth/callback';
};

export const marketplaceConfig = {
  baseUrl: MARKETPLACE_BASE_URL,
  // Try frontend OAuth page instead of API endpoint
  // The authorization page should be a web UI, not an API endpoint
  authorizationEndpoint: `${MARKETPLACE_BASE_URL}/oauth/authorize`,
  tokenEndpoint: `${MARKETPLACE_BASE_URL}/api/v1/oauth/token`,
  revokeEndpoint: `${MARKETPLACE_BASE_URL}/api/v1/oauth/revoke`,
  clientId: 'prompt-gen-web',
  redirectUri: getRedirectUri(),
  scope: 'read:packages write:packages',
} as const;
