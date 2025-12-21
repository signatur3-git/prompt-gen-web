import { test, expect } from '@playwright/test';

test.describe('Click Bug Test - Simplified', () => {
  test('Verify editor shows and selection updates on first click after manual setup', async ({ page }) => {
    // Go to app
    await page.goto('/');
    await page.waitForSelector('text=Prompt Generator - Web Edition');

    // Create a new package
    await page.click('button:has-text("Create Package")');

    // Should be in editor - wait for the editor to be fully loaded
    await page.waitForSelector('text=Package Editor', { timeout: 10000 });

    // Wait for the "+ Add Namespace" button to be available
    await page.waitForSelector('button:has-text("+ Add Namespace")', { timeout: 10000 });

    // Add a namespace (will open a modal, not a browser prompt)
    await page.click('button:has-text("+ Add Namespace")');

    // Wait for the modal to appear
    await page.waitForSelector('.modal-overlay', { timeout: 10000 });

    // Fill in the namespace ID in the modal
    await page.fill('input[placeholder="e.g., core or my_namespace"]', 'main');

    // Click the Add button in the modal
    await page.click('.modal button.btn-primary:has-text("Add")');

    // Wait for modal to close
    await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 10000 });

    // Wait until the namespace button exists
    await page.waitForSelector('button.namespace-button:has-text("main")', { timeout: 10000 });
    await page.click('button.namespace-button:has-text("main")');

    // Datatypes tab
    await page.click('button:has-text("Datatypes")');

    const idInput = page.locator('input[placeholder="e.g., character_class"]');
    const editorPanel = page.locator('.datatype-details');

    // Helper to add a datatype quickly
    const addDatatype = async (id: string, name: string, firstValue: string) => {
      await page.click('button:has-text("+ Add Datatype")');
      await expect(editorPanel).toBeVisible({ timeout: 5000 });

      await idInput.fill(id);
      await page.fill('input[placeholder="e.g., Character Classes"]', name);

      await page.click('button:has-text("+ Add Value")');
      await page.locator('input[placeholder="e.g., warrior"]').fill(firstValue);

      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(500);
    };

    await addDatatype('colors', 'Colors', 'red');
    await addDatatype('shapes', 'Shapes', 'circle');
    await addDatatype('weapons', 'Weapons', 'sword');

    // NOW TEST CLICKING
    const cases = [
      { displayName: 'Colors', expectedId: 'colors' },
      { displayName: 'Shapes', expectedId: 'shapes' },
      { displayName: 'Weapons', expectedId: 'weapons' },
    ];

    for (const c of cases) {
      const header = page.locator('.datatype-item', { hasText: c.displayName }).locator('.datatype-header');
      await header.waitFor({ state: 'visible', timeout: 5000 });
      await header.click();

      await expect(editorPanel).toBeVisible({ timeout: 5000 });
      await expect(idInput).toHaveValue(c.expectedId, { timeout: 5000 });
    }

    // If the last click was swallowed, this would still show the previous datatype ID.
    await expect(idInput).toHaveValue('weapons');
  });
});
