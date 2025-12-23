// M11: Web Application - Package Store
// Pinia store for managing packages

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Package } from '../models/package';
import { createEmptyPackage } from '../models/package';
import { platformService } from '../services/localStorage';
import { fixInvalidRulebookEntryPoints } from '../utils/rulebookFixer';

export const usePackageStore = defineStore('package', () => {
  // State
  const currentPackage = ref<Package | null>(null);
  const packages = ref<Array<{ id: string; name: string; version: string; description?: string }>>(
    []
  );
  const loadedPackages = ref<Package[]>([]); // All loaded packages (for dependency resolution)
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const hasPackage = computed(() => currentPackage.value !== null);
  const packageId = computed(() => currentPackage.value?.id);
  const packageName = computed(() => currentPackage.value?.metadata.name);
  const allPackages = computed(() => {
    const all = [...loadedPackages.value];
    if (currentPackage.value && !all.some(p => p.id === currentPackage.value?.id)) {
      all.push(currentPackage.value);
    }
    return all;
  });

  // Actions
  async function loadPackageList() {
    try {
      isLoading.value = true;
      error.value = null;
      packages.value = await platformService.listPackages();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load packages';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadPackage(id: string) {
    try {
      isLoading.value = true;
      error.value = null;
      const pkg = await platformService.loadPackage(id);

      // Inspect rulebook entry points for debugging
      const { fixed, changes } = fixInvalidRulebookEntryPoints(pkg);
      if (changes.length > 0) {
        console.warn('Rulebook inspection results:', changes);
        if (fixed) {
          console.warn('NOTE: Issues found but NOT auto-fixing. Use inspection tools to review.');
        }
      }

      currentPackage.value = pkg;
      // Add to loaded packages if not already there
      if (currentPackage.value && !loadedPackages.value.some(p => p.id === id)) {
        loadedPackages.value.push(currentPackage.value);
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : `Failed to load package: ${id}`;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function savePackage() {
    if (!currentPackage.value) {
      throw new Error('No package to save');
    }

    try {
      isLoading.value = true;
      error.value = null;
      await platformService.savePackage(currentPackage.value);
      await loadPackageList(); // Refresh list
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save package';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePackage(id: string) {
    try {
      isLoading.value = true;
      error.value = null;
      await platformService.deletePackage(id);
      if (currentPackage.value?.id === id) {
        currentPackage.value = null;
      }
      await loadPackageList(); // Refresh list
    } catch (e) {
      error.value = e instanceof Error ? e.message : `Failed to delete package: ${id}`;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function createNewPackage() {
    currentPackage.value = createEmptyPackage();
  }

  function clearPackage() {
    currentPackage.value = null;
  }

  async function importPackageFromString(content: string, format: 'yaml' | 'json') {
    try {
      isLoading.value = true;
      error.value = null;
      const pkg = await platformService.importPackage(content, format);
      currentPackage.value = pkg;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to import package';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function exportPackageToString(format: 'yaml' | 'json'): Promise<string> {
    if (!currentPackage.value) {
      throw new Error('No package to export');
    }

    try {
      isLoading.value = true;
      error.value = null;
      return await platformService.exportPackage(currentPackage.value, format);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to export package';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    currentPackage,
    packages,
    loadedPackages,
    isLoading,
    error,

    // Getters
    hasPackage,
    packageId,
    packageName,
    allPackages,

    // Actions
    loadPackageList,
    loadPackage,
    savePackage,
    deletePackage,
    createNewPackage,
    clearPackage,
    importPackageFromString,
    exportPackageToString,
  };
});
