export function applyThemeDebugFlags() {
  // Optional helpers for debugging the cascade.
  // In devtools, set:
  //   localStorage.theme = 'dark' | 'light'
  //   localStorage.themeDebug = 'true'
  // then reload.

  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    document.documentElement.dataset.theme = storedTheme;
  } else {
    // Ensure we don't accidentally pin a theme
    delete document.documentElement.dataset.theme;
  }

  const debug = localStorage.getItem('themeDebug');
  if (debug === 'true') {
    document.documentElement.dataset.themeDebug = 'true';
  } else {
    delete document.documentElement.dataset.themeDebug;
  }
}

