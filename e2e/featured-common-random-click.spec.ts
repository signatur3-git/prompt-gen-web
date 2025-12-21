import { test, expect } from '@playwright/test';

// Repro scenario based on packages/featured.common/featured.common.yaml
// Namespace: common.base
// Datatypes: prepositions, spatial_verbs, weather_conditions, times_of_day

test.setTimeout(120_000);

const FEATURED_COMMON_PACKAGE = {
  id: 'featured.common',
  version: '1.0.0',
  metadata: {
    name: 'Featured Common Package',
    description: 'Seeded from repo packages/featured.common/featured.common.yaml',
    authors: ['E2E Test'],
  },
  namespaces: {
    'common.base': {
      id: 'common.base',
      datatypes: {
        prepositions: {
          name: 'prepositions',
          values: [
            { text: 'atop', weight: 1, tags: { article: 'a', type: 'spatial' } },
            { text: 'before', weight: 1, tags: { article: 'a', type: 'spatial' } },
          ],
        },
        spatial_verbs: {
          name: 'spatial_verbs',
          values: [
            { text: 'perched', weight: 1, tags: { article: 'a', requires_elevated: true } },
            { text: 'standing', weight: 1, tags: { article: 'a', stance: 'upright' } },
          ],
        },
        weather_conditions: {
          name: 'weather_conditions',
          values: [
            { text: 'in clear weather', weight: 1, tags: { article: 'a', weather: 'clear', visibility: 'high' } },
            { text: 'during a rainstorm', weight: 1, tags: { article: 'a', weather: 'rain', dramatic: true } },
          ],
        },
        times_of_day: {
          name: 'times_of_day',
          values: [
            { text: 'at dawn', weight: 1, tags: { article: 'a', time: 'morning' } },
            { text: 'at noon', weight: 1, tags: { article: 'a', time: 'midday' } },
          ],
        },
      },
      prompt_sections: {},
      separator_sets: {},
      rules: {},
      decisions: [],
      rulebooks: {},
    },
  },
};

async function seedLocalStorage(page: any) {
  await page.evaluate((pkg: any) => {
    localStorage.setItem(
      'rpg-packages',
      JSON.stringify({
        version: '1.0.0',
        packages: {
          [pkg.id]: pkg,
        },
      })
    );
  }, FEATURED_COMMON_PACKAGE);
}

async function loadPackageThroughUI(page: any) {
  await page.goto('/');
  await page.waitForSelector('text=Random Prompt Generator', { timeout: 10000 });

  await seedLocalStorage(page);

  await page.reload();
  await page.waitForSelector('text=Random Prompt Generator', { timeout: 10000 });

  await page.click('button:has-text("Load Package")');
  await page.waitForSelector('.modal', { timeout: 5000 });

  const pkgRow = page.locator('.package-item-content').filter({ hasText: 'Featured Common Package' });
  await pkgRow.waitFor({ state: 'visible', timeout: 5000 });
  await pkgRow.click();

  await page.waitForSelector('text=Package Editor', { timeout: 10000 });

  // Ensure common.base namespace is selected
  const nsButton = page.locator('button.namespace-button:has-text("common.base")');
  await nsButton.waitFor({ state: 'visible', timeout: 10000 });
  await nsButton.click();

  // Ensure we are on Datatypes tab
  await page.click('button:has-text("Datatypes")');
}

function shuffle<T>(arr: T[]) {
  // Fisher-Yates
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

test.describe('Featured common package - random datatype clicking', () => {
  test('random order clicking should always select the clicked datatype (verify ID input)', async ({ page }) => {
    await loadPackageThroughUI(page);

    const idInput = page.locator('input[placeholder="e.g., character_class"]');
    const editorPanel = page.locator('.datatype-details');

    const datatypes = [
      { displayName: 'prepositions', expectedId: 'prepositions' },
      { displayName: 'spatial_verbs', expectedId: 'spatial_verbs' },
      { displayName: 'weather_conditions', expectedId: 'weather_conditions' },
      { displayName: 'times_of_day', expectedId: 'times_of_day' },
    ];

    // Test with random order to verify clicking works regardless of sequence
    const ROUNDS = 5;

    for (let round = 1; round <= ROUNDS; round++) {
      const order = shuffle(datatypes);
      // eslint-disable-next-line no-console
      console.log(`\n=== ROUND ${round}/${ROUNDS} ===`);

      for (const dt of order) {
        const header = page.locator('.datatype-item', { hasText: dt.displayName }).locator('.datatype-header');
        await header.waitFor({ state: 'visible', timeout: 5000 });

        await header.click();

        await expect(editorPanel).toBeVisible({ timeout: 5000 });
        await expect(idInput).toHaveValue(dt.expectedId, { timeout: 5000 });

        // Brief pause between clicks
        await page.waitForTimeout(200);
      }
    }
  });
});
