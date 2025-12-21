import { test, expect } from '@playwright/test';

const TEST_PACKAGE = {
  id: 'test.clicking',
  version: '1.0.0',
  metadata: {
    name: 'Click Test Package',
    description: 'Package for testing click behavior',
    authors: ['E2E Test'],
  },
  namespaces: {
    main: {
      id: 'main',
      datatypes: {
        colors: {
          name: 'Colors',
          values: [
            { text: 'red', weight: 1, tags: { article: 'a', phonetic: 'consonant' } },
            { text: 'blue', weight: 1, tags: { article: 'a', phonetic: 'consonant' } },
            { text: 'orange', weight: 1, tags: { article: 'an', phonetic: 'vowel' } },
          ],
        },
        shapes: {
          name: 'Shapes',
          values: [
            { text: 'circle', weight: 1, tags: { article: 'a' } },
            { text: 'square', weight: 1, tags: { article: 'a' } },
          ],
        },
        weapons: {
          name: 'Weapons',
          values: [
            { text: 'sword', weight: 1, tags: { article: 'a', class: 'melee' } },
            { text: 'bow', weight: 1, tags: { article: 'a', class: 'ranged' } },
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

async function loadTestPackage(page: any) {
  // Navigate to home page
  await page.goto('/');

  // Wait for app to be ready
  await page.waitForSelector('text=Random Prompt Generator', { timeout: 10000 });

  // Capture console output for debugging
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      // eslint-disable-next-line no-console
      console.log(`[browser console:${msg.type()}] ${msg.text()}`);
    }
  });

  // Inject test package directly into localStorage.
  // NOTE: The app's LocalStoragePlatformService expects `rpg-packages` to be a JSON object:
  //   { version: string, packages: Record<string, Package> }
  await page.evaluate((testPackage: any) => {
    const storageData = {
      version: '1.0.0',
      packages: {
        [testPackage.id]: testPackage,
      },
    };

    localStorage.setItem('rpg-packages', JSON.stringify(storageData));
  }, TEST_PACKAGE);

  // Reload to pick up localStorage
  await page.reload();
  await page.waitForSelector('text=Random Prompt Generator', { timeout: 10000 });

  // Load the package through the UI
  const loadButton = page.locator('button', { hasText: 'Load Package' });
  await loadButton.waitFor({ state: 'visible', timeout: 10000 });
  await loadButton.click();

  await page.waitForSelector('.modal', { timeout: 5000 });
  await page.waitForSelector('.package-list', { timeout: 5000 });

  const packageItem = page.locator('.package-item-content').filter({ hasText: 'Click Test Package' });
  await packageItem.waitFor({ state: 'visible', timeout: 5000 });
  await packageItem.click();

  // Verify we're in the editor
  await page.waitForSelector('text=Package Editor', { timeout: 10000 });
  await page.waitForSelector('text=Namespace: main', { timeout: 10000 });

  const datatypesTab = page.locator('button', { hasText: 'Datatypes' });
  await expect(datatypesTab).toBeVisible({ timeout: 5000 });

  // Ensure we are on the Datatypes tab
  await datatypesTab.click();

  return {
    idInput: page.locator('input[placeholder="e.g., character_class"]'),
    editorPanel: page.locator('.datatype-details'),
  };
}

async function clickDatatypeAndWaitForId(page: any, opts: { displayName: string; expectedId: string; idInput: any; editorPanel: any }) {
  const { displayName, expectedId, idInput, editorPanel } = opts;

  const header = page.locator('.datatype-item', { hasText: displayName }).locator('.datatype-header');
  await header.waitFor({ state: 'visible', timeout: 5000 });

  await header.click({ timeout: 5000 });

  await expect(editorPanel).toBeVisible({ timeout: 5000 });
  await expect(idInput).toHaveValue(expectedId, { timeout: 5000 });
}

test.describe('DatatypeEditor Click Behavior - REAL BROWSER', () => {
  test('Clicking a datatype should always select it (single click, correct ID)', async ({ page }) => {
    const { idInput, editorPanel } = await loadTestPackage(page);

    const cases = [
      { displayName: 'Colors', expectedId: 'colors' },
      { displayName: 'Shapes', expectedId: 'shapes' },
      { displayName: 'Weapons', expectedId: 'weapons' },
    ];

    // Test each datatype 3 times to verify consistent behavior
    const PASSES = 3;

    for (let pass = 1; pass <= PASSES; pass++) {
      // eslint-disable-next-line no-console
      console.log(`\n=== PASS ${pass}/${PASSES} ===`);

      for (const c of cases) {
        await clickDatatypeAndWaitForId(page, {
          displayName: c.displayName,
          expectedId: c.expectedId,
          idInput,
          editorPanel,
        });
      }
    }
  });

  test('Tags should display as visual key-value pairs, not JSON', async ({ page }) => {
    const { idInput, editorPanel } = await loadTestPackage(page);

    await clickDatatypeAndWaitForId(page, {
      displayName: 'Colors',
      expectedId: 'colors',
      idInput,
      editorPanel,
    });

    // There is one tags editor per value row.
    // Use `.first()` to avoid strict-mode violations.
    const tagsEditor = page.locator('.tags-editor').first();
    await expect(tagsEditor).toBeVisible({ timeout: 5000 });

    const tagPairs = page.locator('.tag-pair');
    const count = await tagPairs.count();
    expect(count).toBeGreaterThan(0);

    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();

    for (let i = 0; i < inputCount; i++) {
      const value = await allInputs.nth(i).inputValue();
      expect(value).not.toContain('[object Object]');
    }
  });
});
