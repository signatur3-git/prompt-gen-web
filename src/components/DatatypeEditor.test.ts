import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DatatypeEditor from '../components/DatatypeEditor.vue';
import type { Datatype } from '../models/package';

describe('DatatypeEditor - Click Behavior', () => {
  const mockDatatypes: Record<string, Datatype> = {
    colors: {
      name: 'Colors',
      values: [
        {
          text: 'red',
          weight: 1.0,
          tags: { article: 'a', phonetic: 'consonant' },
        },
        {
          text: 'blue',
          weight: 1.0,
          tags: { article: 'a', phonetic: 'consonant' },
        },
        {
          text: 'orange',
          weight: 1.0,
          tags: { article: 'an', phonetic: 'vowel' },
        },
      ],
    },
    shapes: {
      name: 'Shapes',
      values: [
        {
          text: 'circle',
          weight: 1.0,
          tags: { article: 'a' },
        },
        {
          text: 'square',
          weight: 1.0,
          tags: { article: 'a' },
        },
      ],
    },
  };

  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(DatatypeEditor, {
      props: {
        namespaceId: 'test',
        datatypes: mockDatatypes,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should render datatype list', () => {
      const datatypeItems = wrapper.findAll('.datatype-item');
      expect(datatypeItems).toHaveLength(2);
    });

    it('should not show editor initially', () => {
      const editor = wrapper.find('.datatype-details');
      expect(editor.exists()).toBe(false);
    });
  });

  describe('Single Click Behavior', () => {
    it('should open editor on first click', async () => {
      // Find first datatype item
      const datatypeItems = wrapper.findAll('.datatype-item');
      const firstDatatype = datatypeItems[0];

      // Click it
      await firstDatatype.find('.datatype-header').trigger('click');
      await wrapper.vm.$nextTick();

      // Editor should be visible
      const editor = wrapper.find('.datatype-details');
      expect(editor.exists()).toBe(true);
      expect(editor.find('h3').text()).toBe('Edit Datatype');
    });

    it('should not require multiple clicks to open', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');
      const firstDatatype = datatypeItems[0];

      // Single click should be enough
      await firstDatatype.find('.datatype-header').trigger('click');
      await wrapper.vm.$nextTick();

      // Verify editor is open
      expect(wrapper.find('.datatype-details').exists()).toBe(true);

      // Verify correct datatype is loaded
      const idInput = wrapper.find('input[placeholder*="character_class"]');
      expect(idInput.element.value).toBe('colors');
    });

    it('should disable the ID field when editing an existing datatype', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');
      await datatypeItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      const idInput = wrapper.find('input[placeholder*="character_class"]');
      expect(idInput.exists()).toBe(true);
      expect((idInput.element as HTMLInputElement).disabled).toBe(true);
    });
  });

  describe('Rename Datatype', () => {
    it('should rename datatype via Rename button', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');
      await datatypeItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      const renameBtn = wrapper.find('button.btn-secondary');
      expect(renameBtn.exists()).toBe(true);

      await renameBtn.trigger('click');
      await wrapper.vm.$nextTick();

      const modal = wrapper.find('.modal');
      expect(modal.exists()).toBe(true);

      const inputs = modal.findAll('input');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
      await inputs[1].setValue('colors_renamed');
      await wrapper.vm.$nextTick();

      const modalRenameBtn = modal.find('button.btn-primary');
      await modalRenameBtn.trigger('click');
      await wrapper.vm.$nextTick();

      const updates = wrapper.emitted('update');
      expect(updates?.length).toBeGreaterThan(0);
      const latestDatatypes = updates![updates!.length - 1][0] as Record<string, Datatype>;

      expect(Object.keys(latestDatatypes)).toContain('colors_renamed');
      expect(Object.keys(latestDatatypes)).not.toContain('colors');
    });
  });

  describe('Switching Between Datatypes', () => {
    it('should switch to different datatype on single click', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');

      // Click first datatype
      await datatypeItems[0].find('.datatype-header').trigger('click');
      await wrapper.vm.$nextTick();

      // Verify first is loaded
      let idInput = wrapper.find('input[placeholder*="character_class"]');
      expect(idInput.element.value).toBe('colors');

      // Click second datatype - should switch immediately
      await datatypeItems[1].find('.datatype-header').trigger('click');
      await wrapper.vm.$nextTick();

      // Verify second is now loaded
      idInput = wrapper.find('input[placeholder*="character_class"]');
      expect(idInput.element.value).toBe('shapes');
    });

    it('should not require confirm dialog when no changes made', async () => {
      const confirmMock = vi.fn();
      vi.stubGlobal('confirm', confirmMock);

      const datatypeItems = wrapper.findAll('.datatype-item');

      // Click first
      await datatypeItems[0].find('.datatype-header').trigger('click');
      await wrapper.vm.$nextTick();

      // Click second - no confirm should appear
      await datatypeItems[1].find('.datatype-header').trigger('click');
      await wrapper.vm.$nextTick();

      expect(confirmMock).not.toHaveBeenCalled();
    });

    it('should show confirm dialog when switching with unsaved changes', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const datatypeItems = wrapper.findAll('.datatype-item');

      // Click first datatype (click handler is on .datatype-item, not .datatype-header)
      await datatypeItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      // Make a change to mark as dirty
      const nameInput = wrapper.find('input[placeholder*="Character Classes"]');
      await nameInput.setValue('Modified Name');
      await wrapper.vm.$nextTick();

      // Click second datatype - should show confirm
      await datatypeItems[1].trigger('click');
      await wrapper.vm.$nextTick();

      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('unsaved changes'));
    });
  });

  describe('Clicking Same Datatype', () => {
    it('should not reload when clicking same datatype', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');
      const firstDatatype = datatypeItems[0];

      // Click first time (handler is on .datatype-item)
      await firstDatatype.trigger('click');
      await wrapper.vm.$nextTick();

      const initialEditor = wrapper.find('.datatype-details').html();

      // Click same datatype again
      await firstDatatype.trigger('click');
      await wrapper.vm.$nextTick();

      const afterEditor = wrapper.find('.datatype-details').html();

      expect(wrapper.find('.datatype-details').exists()).toBe(true);
      expect(afterEditor).toBe(initialEditor);
    });

    it('should not show confirm when clicking same datatype with changes', async () => {
      const findColorsRow = () => wrapper.findAll('.datatype-item').find((w: any) => w.text().includes('Colors'));

      const firstColors = findColorsRow();
      expect(firstColors).toBeTruthy();

      await firstColors!.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.datatype-details').exists()).toBe(true);

      const nameInput = wrapper.find('input[placeholder*="Character Classes"]');
      await nameInput.setValue('Modified Name');
      await wrapper.vm.$nextTick();

      const colorsAgain = findColorsRow();
      expect(colorsAgain).toBeTruthy();
      await colorsAgain!.trigger('click');
      await wrapper.vm.$nextTick();

      // Contract: must still be editing the same datatype (no switch)
      const idInput = wrapper.find('input[placeholder*="character_class"]');
      expect(idInput.element.value).toBe('colors');

      const nameInputAfter = wrapper.find('input[placeholder*="Character Classes"]');
      expect(nameInputAfter.element.value).toBe('Modified Name');
    });
  });

  describe('Tags Display', () => {
    it('should display tags as key-value pairs', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');

      // Click first datatype
      await datatypeItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      // Check for tags editor
      const tagsEditor = wrapper.find('.tags-editor');
      expect(tagsEditor.exists()).toBe(true);

      // Check for tag pairs
      const tagPairs = wrapper.findAll('.tag-pair');
      expect(tagPairs.length).toBeGreaterThan(0);

      // Check first tag
      const firstTag = tagPairs[0];
      const keyInput = firstTag.find('.tag-key');
      const valueInput = firstTag.find('.tag-value');

      expect(keyInput.exists()).toBe(true);
      expect(valueInput.exists()).toBe(true);
      expect(keyInput.element.value).toBe('article');
      expect(valueInput.element.value).toBe('a');
    });

    it('should not display tags as JSON strings', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');

      // Click first datatype
      await datatypeItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      // Should NOT find any input with JSON-like content
      const inputs = wrapper.findAll('input');
      for (const input of inputs) {
        const value = input.element.value;
        expect(value).not.toMatch(/^\{.*\}$/);
        expect(value).not.toContain('[object Object]');
      }
    });
  });

  describe('Click Count Test - REAL WORLD SIMULATION', () => {
    it('should ALWAYS open on first click - no swallowed clicks', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');
      const MAX_CLICKS = 5; // If it takes more than 5 clicks, something is wrong

      // Test clicking EACH datatype from scratch
      for (let i = 0; i < datatypeItems.length; i++) {
        const datatype = datatypeItems[i];
        const datatypeName = datatype.find('.datatype-name').text();

        console.log(`\n=== Testing datatype: ${datatypeName} ===`);

        let clicksRequired = 0;
        let editorOpened = false;

        // Keep clicking until editor opens (up to MAX_CLICKS)
        for (let attempt = 1; attempt <= MAX_CLICKS; attempt++) {
          console.log(`  Attempt ${attempt}: Clicking...`);

          await datatype.find('.datatype-header').trigger('click');
          await wrapper.vm.$nextTick();

          clicksRequired = attempt;
          editorOpened = wrapper.find('.datatype-details').exists();

          console.log(`  Editor opened: ${editorOpened}`);

          if (editorOpened) {
            break;
          }
        }

        // FAIL if editor didn't open at all
        if (!editorOpened) {
          throw new Error(`FAIL: Datatype "${datatypeName}" - Editor never opened after ${MAX_CLICKS} clicks!`);
        }

        // FAIL if it took more than 1 click
        if (clicksRequired > 1) {
          throw new Error(`FAIL: Datatype "${datatypeName}" - Required ${clicksRequired} clicks (should be 1). This is the swallowed click bug!`);
        }

        console.log(`  ✓ SUCCESS: Opened on first click`);

        // Verify correct datatype is loaded
        const idInput = wrapper.find('input[placeholder*="character_class"]');
        expect(idInput.exists()).toBe(true);

        // Close editor for next iteration (click elsewhere or reset)
        if (i < datatypeItems.length - 1) {
          // Reset by clicking a different datatype
          const nextDatatype = datatypeItems[i + 1];
          await nextDatatype.find('.datatype-header').trigger('click');
          await wrapper.vm.$nextTick();
        }
      }
    });

    it('should handle clicking same datatype 10 times without breaking', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');
      const firstDatatype = datatypeItems[0];

      // Open it first
      await firstDatatype.find('.datatype-header').trigger('click');
      await wrapper.vm.$nextTick();

      let editorOpenCount = wrapper.find('.datatype-details').exists() ? 1 : 0;

      // Click same datatype 10 more times
      for (let i = 0; i < 10; i++) {
        await firstDatatype.find('.datatype-header').trigger('click');
        await wrapper.vm.$nextTick();

        // Editor should still exist after each click
        const stillOpen = wrapper.find('.datatype-details').exists();
        if (stillOpen) {
          editorOpenCount++;
        }
      }

      // Editor should have stayed open the whole time
      expect(editorOpenCount).toBe(11); // Initial + 10 more clicks
    });

    it('should handle rapid random clicking between datatypes', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');

      // Simulate user frantically clicking different datatypes
      const clickSequence = [0, 1, 0, 1, 1, 0, 1, 0, 0, 1]; // Random pattern

      for (const index of clickSequence) {
        await datatypeItems[index].find('.datatype-header').trigger('click');
        await wrapper.vm.$nextTick();
      }

      // Editor should still be open and functional after all that clicking
      expect(wrapper.find('.datatype-details').exists()).toBe(true);

      // Should be showing the last clicked datatype (index 1)
      const idInput = wrapper.find('input[placeholder*="character_class"]');
      expect(idInput.element.value).toBe('shapes');
    });

    it('STRESS TEST: Click each datatype 5 times and track when it actually opens', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');
      const results: Array<{name: string, openedOnClick: number}> = [];

      for (let i = 0; i < datatypeItems.length; i++) {
        const datatype = datatypeItems[i];
        const datatypeName = datatype.find('.datatype-name').text();

        let openedOnClick = -1;

        // Try clicking up to 5 times
        for (let clickNum = 1; clickNum <= 5; clickNum++) {
          await datatype.find('.datatype-header').trigger('click');
          await wrapper.vm.$nextTick();

          if (wrapper.find('.datatype-details').exists() && openedOnClick === -1) {
            openedOnClick = clickNum;
            break;
          }
        }

        results.push({ name: datatypeName, openedOnClick });

        // Switch to next datatype to reset state
        if (i < datatypeItems.length - 1) {
          await datatypeItems[i + 1].find('.datatype-header').trigger('click');
          await wrapper.vm.$nextTick();
        }
      }

      console.log('\n=== STRESS TEST RESULTS ===');
      results.forEach(r => {
        console.log(`${r.name}: Opened on click #${r.openedOnClick}`);
      });

      // ALL datatypes should open on first click (openedOnClick === 1)
      const failedDatatypes = results.filter(r => r.openedOnClick !== 1);

      if (failedDatatypes.length > 0) {
        const failureReport = failedDatatypes
          .map(r => `  - ${r.name}: Took ${r.openedOnClick} clicks`)
          .join('\n');

        throw new Error(
          `SWALLOWED CLICK BUG DETECTED!\n` +
          `${failedDatatypes.length} datatype(s) required multiple clicks:\n` +
          failureReport
        );
      }

      // If we get here, all passed
      console.log('✓ All datatypes opened on FIRST click!');
    });
  });

  describe('Add Tag Functionality', () => {
    it('should add new tag when clicking Add Tag button', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');

      // Click first datatype
      await datatypeItems[0].find('.datatype-header').trigger('click');
      await wrapper.vm.$nextTick();

      // Count initial tags
      const initialTagCount = wrapper.findAll('.tag-pair').length;

      // Click Add Tag button
      const addButton = wrapper.find('.btn-add-tag');
      expect(addButton.exists()).toBe(true);

      await addButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Should have one more tag
      const finalTagCount = wrapper.findAll('.tag-pair').length;
      expect(finalTagCount).toBe(initialTagCount + 1);
    });

    it('should have empty fields for new tag', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');

      // Click first datatype (click handler is on .datatype-item, not .datatype-header)
      await datatypeItems[0].trigger('click');
      await wrapper.vm.$nextTick();

      // Get the first value's container
      const valueItems = wrapper.findAll('.value-item');
      const firstValueItem = valueItems[0];

      // Get initial tag count for first value only
      const initialTagPairs = firstValueItem.findAll('.tag-pair');
      const initialCount = initialTagPairs.length;

      // Add new tag to first value
      const addTagButton = firstValueItem.find('.btn-add-tag');
      await addTagButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Get tag pairs for first value after adding
      const allTagPairs = firstValueItem.findAll('.tag-pair');
      expect(allTagPairs.length).toBe(initialCount + 1);

      // Get the newly added tag (last one in this value's tags)
      const newTag = allTagPairs[allTagPairs.length - 1];

      const keyInput = newTag.find('.tag-key');
      const valueInput = newTag.find('.tag-value');

      expect(keyInput.element.value).toBe('');
      expect(valueInput.element.value).toBe('');
    });
  });

  describe('Remove Tag Functionality', () => {
    it('should remove tag when clicking remove button', async () => {
      const datatypeItems = wrapper.findAll('.datatype-item');

      // Click first datatype
      await datatypeItems[0].find('.datatype-header').trigger('click');
      await wrapper.vm.$nextTick();

      // Count initial tags
      const initialTagCount = wrapper.findAll('.tag-pair').length;
      expect(initialTagCount).toBeGreaterThan(0);

      // Click remove button on first tag
      const firstRemoveButton = wrapper.find('.btn-remove-tag');
      await firstRemoveButton.trigger('click');
      await wrapper.vm.$nextTick();

      // Should have one less tag
      const finalTagCount = wrapper.findAll('.tag-pair').length;
      expect(finalTagCount).toBe(initialTagCount - 1);
    });
  });
});

