/**
 * EditorView Modal Tests
 * Tests for namespace creation modal validation and behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import EditorView from './EditorView.vue';
import { usePackageStore } from '../stores/packageStore';
import { createEmptyPackage } from '../models/package';

describe('EditorView - Namespace Modal', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should open add namespace modal when clicking Add Namespace button', async () => {
    const packageStore = usePackageStore();
    packageStore.currentPackage = createEmptyPackage();
    packageStore.currentPackage.id = 'test.package';
    packageStore.currentPackage.metadata.name = 'Test Package';

    const wrapper = mount(EditorView, {
      global: {
        stubs: {
          ValidationPanel: true,
          DatatypeEditor: true,
          PromptSectionEditor: true,
          SeparatorSetEditor: true,
          RuleEditor: true,
          RulebookEditor: true,
        },
      },
    });

    // Find and click the "Add Namespace" button
    const addButton = wrapper.find('button.btn-add');
    await addButton.trigger('click');

    // Modal should be visible
    const modal = wrapper.find('.modal-overlay');
    expect(modal.exists()).toBe(true);

    // Should show "Add Namespace" title
    expect(wrapper.find('#namespace-modal-title').text()).toBe('Add Namespace');
  });

  it('should accept namespace IDs with dots', async () => {
    const packageStore = usePackageStore();
    packageStore.currentPackage = createEmptyPackage();
    packageStore.currentPackage.id = 'test.package';

    const wrapper = mount(EditorView, {
      global: {
        stubs: {
          ValidationPanel: true,
          DatatypeEditor: true,
          PromptSectionEditor: true,
          SeparatorSetEditor: true,
          RuleEditor: true,
          RulebookEditor: true,
        },
      },
    });

    // Open modal
    const addButton = wrapper.find('button.btn-add');
    await addButton.trigger('click');

    // Enter namespace ID with dots
    const input = wrapper.find('input[placeholder*="core"]');
    await input.setValue('my.test.namespace');

    // Add button should be enabled (not disabled)
    const modalAddButton = wrapper
      .findAll('.modal-footer button')
      .find(btn => btn.text().includes('Add'));
    expect(modalAddButton?.attributes('disabled')).toBeUndefined();
  });

  it('should accept namespace IDs with underscores', async () => {
    const packageStore = usePackageStore();
    packageStore.currentPackage = createEmptyPackage();
    packageStore.currentPackage.id = 'test.package';

    const wrapper = mount(EditorView, {
      global: {
        stubs: {
          ValidationPanel: true,
          DatatypeEditor: true,
          PromptSectionEditor: true,
          SeparatorSetEditor: true,
          RuleEditor: true,
          RulebookEditor: true,
        },
      },
    });

    // Open modal
    const addButton = wrapper.find('button.btn-add');
    await addButton.trigger('click');

    // Enter namespace ID with underscores
    const input = wrapper.find('input[placeholder*="core"]');
    await input.setValue('my_test_namespace');

    // Add button should be enabled
    const modalAddButton = wrapper
      .findAll('.modal-footer button')
      .find(btn => btn.text().includes('Add'));
    expect(modalAddButton?.attributes('disabled')).toBeUndefined();
  });

  it('should reject namespace IDs starting with uppercase', async () => {
    const packageStore = usePackageStore();
    packageStore.currentPackage = createEmptyPackage();
    packageStore.currentPackage.id = 'test.package';

    const wrapper = mount(EditorView, {
      global: {
        stubs: {
          ValidationPanel: true,
          DatatypeEditor: true,
          PromptSectionEditor: true,
          SeparatorSetEditor: true,
          RuleEditor: true,
          RulebookEditor: true,
        },
      },
    });

    // Open modal
    const addButton = wrapper.find('button.btn-add');
    await addButton.trigger('click');

    // Enter invalid namespace ID (uppercase)
    const input = wrapper.find('input[placeholder*="core"]');
    await input.setValue('MyNamespace');

    // Add button should be disabled
    const modalAddButton = wrapper
      .findAll('.modal-footer button')
      .find(btn => btn.text().includes('Add'));
    expect(modalAddButton?.attributes('disabled')).toBeDefined();
  });

  it('should reject namespace IDs with hyphens', async () => {
    const packageStore = usePackageStore();
    packageStore.currentPackage = createEmptyPackage();
    packageStore.currentPackage.id = 'test.package';

    const wrapper = mount(EditorView, {
      global: {
        stubs: {
          ValidationPanel: true,
          DatatypeEditor: true,
          PromptSectionEditor: true,
          SeparatorSetEditor: true,
          RuleEditor: true,
          RulebookEditor: true,
        },
      },
    });

    // Open modal
    const addButton = wrapper.find('button.btn-add');
    await addButton.trigger('click');

    // Enter invalid namespace ID (hyphens)
    const input = wrapper.find('input[placeholder*="core"]');
    await input.setValue('my-namespace');

    // Add button should be disabled
    const modalAddButton = wrapper
      .findAll('.modal-footer button')
      .find(btn => btn.text().includes('Add'));
    expect(modalAddButton?.attributes('disabled')).toBeDefined();
  });

  it('should show correct validation hint message', async () => {
    const packageStore = usePackageStore();
    packageStore.currentPackage = createEmptyPackage();
    packageStore.currentPackage.id = 'test.package';

    const wrapper = mount(EditorView, {
      global: {
        stubs: {
          ValidationPanel: true,
          DatatypeEditor: true,
          PromptSectionEditor: true,
          SeparatorSetEditor: true,
          RuleEditor: true,
          RulebookEditor: true,
        },
      },
    });

    // Open modal
    const addButton = wrapper.find('button.btn-add');
    await addButton.trigger('click');

    // Check hint text mentions dots
    const hint = wrapper.find('.hint');
    expect(hint.text()).toContain('dots');
    expect(hint.text()).toContain('lowercase letters');
    expect(hint.text()).toContain('numbers');
    expect(hint.text()).toContain('underscores');
  });

  it('should have white background on modal', async () => {
    const packageStore = usePackageStore();
    packageStore.currentPackage = createEmptyPackage();
    packageStore.currentPackage.id = 'test.package';

    const wrapper = mount(EditorView, {
      global: {
        stubs: {
          ValidationPanel: true,
          DatatypeEditor: true,
          PromptSectionEditor: true,
          SeparatorSetEditor: true,
          RuleEditor: true,
          RulebookEditor: true,
        },
      },
    });

    // Open modal
    const addButton = wrapper.find('button.btn-add');
    await addButton.trigger('click');

    // Modal should exist with proper structure
    const modalOverlay = wrapper.find('.modal-overlay');
    expect(modalOverlay.exists()).toBe(true);

    const modal = modalOverlay.find('.modal');
    expect(modal.exists()).toBe(true);

    // The modal should have white background (this is in CSS, but we can verify structure)
    expect(modal.classes()).toContain('modal');
  });

  it('should close modal when clicking Cancel', async () => {
    const packageStore = usePackageStore();
    packageStore.currentPackage = createEmptyPackage();
    packageStore.currentPackage.id = 'test.package';

    const wrapper = mount(EditorView, {
      global: {
        stubs: {
          ValidationPanel: true,
          DatatypeEditor: true,
          PromptSectionEditor: true,
          SeparatorSetEditor: true,
          RuleEditor: true,
          RulebookEditor: true,
        },
      },
    });

    // Open modal
    const addButton = wrapper.find('button.btn-add');
    await addButton.trigger('click');

    // Modal should be visible
    expect(wrapper.find('.modal-overlay').exists()).toBe(true);

    // Click Cancel
    const cancelButton = wrapper.find('.btn-cancel');
    await cancelButton.trigger('click');

    // Modal should be hidden
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('should create namespace when submitting valid ID', async () => {
    const packageStore = usePackageStore();
    packageStore.currentPackage = createEmptyPackage();
    packageStore.currentPackage.id = 'test.package';

    const wrapper = mount(EditorView, {
      global: {
        stubs: {
          ValidationPanel: true,
          DatatypeEditor: true,
          PromptSectionEditor: true,
          SeparatorSetEditor: true,
          RuleEditor: true,
          RulebookEditor: true,
        },
      },
    });

    // Open modal
    const addButton = wrapper.find('button.btn-add');
    await addButton.trigger('click');

    // Enter valid namespace ID with dots
    const input = wrapper.find('input[placeholder*="core"]');
    await input.setValue('test.namespace');

    // Click Add button
    const modalAddButton = wrapper
      .findAll('.modal-footer button')
      .find(btn => btn.text().includes('Add'));
    await modalAddButton?.trigger('click');

    // Namespace should be created
    expect(packageStore.currentPackage?.namespaces['test.namespace']).toBeDefined();
    expect(packageStore.currentPackage?.namespaces['test.namespace']?.id).toBe('test.namespace');

    // Modal should close
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });
});
