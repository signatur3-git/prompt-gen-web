<template>
  <div class="home">
    <AppNav />
    <!-- Hero Section -->
    <div class="hero">
      <h1>Random Prompt Generator</h1>
      <p class="hero-subtitle">Create dynamic, randomized prompts for AI image generation</p>
      <p class="hero-description">
        Build complex prompt templates with datatypes, rules, and dependencies. Generate
        deterministic, seeded prompts perfect for Stable Diffusion, Midjourney, and other AI art
        tools.
      </p>
      <button v-if="packages.length > 0" class="btn-hero" @click="router.push('/preview')">
        ⚡ Start Generating Prompts
      </button>
    </div>

    <!-- Getting Started Section -->
    <section v-if="packages.length === 0" class="getting-started">
      <h2>✨ Getting Started</h2>
      <p class="section-intro">New here? Try the sample package to see what this tool can do!</p>

      <div class="action-card action-card-hero">
        <div class="card-icon">🎁</div>
        <h3>Load Sample Package</h3>
        <p>
          Explore featured.common with ready-to-use rulebooks for fantasy scenes, lighting,
          characters, and more
        </p>
        <button
          class="btn-primary btn-large"
          :disabled="isLoadingSample"
          @click="loadSamplePackage"
        >
          {{ isLoadingSample ? 'Loading...' : 'Load Sample & Start Generating' }}
        </button>
      </div>
    </section>

    <!-- Quick Actions Section -->
    <section v-if="packages.length > 0" class="quick-actions">
      <h2>🚀 Generate Prompts</h2>
      <p class="section-intro">Use your packages to create randomized prompts</p>

      <div class="action-card action-card-primary">
        <div class="card-icon">⚡</div>
        <h3>Preview & Generate</h3>
        <p>Generate prompts from any rulebook in your collection</p>
        <button class="btn-primary" @click="router.push('/preview')">Open Generator</button>
      </div>
    </section>

    <!-- Marketplace Section -->
    <section class="marketplace-section">
      <h2>🏪 Community Marketplace</h2>
      <p class="section-intro">Discover and install packages from the community</p>

      <div class="action-card action-card-marketplace">
        <div class="card-icon">🌐</div>
        <h3>Browse Marketplace</h3>
        <p>Connect to the marketplace to browse, download, and publish packages</p>
        <button class="btn-marketplace" @click="router.push('/marketplace')">
          Open Marketplace
        </button>
      </div>
    </section>

    <!-- Package Management Section -->
    <section class="package-management">
      <h2>📦 Package Management</h2>
      <p class="section-intro">All your package management tools in one place</p>

      <div class="action-card">
        <div class="card-icon">📚</div>
        <h3>Library</h3>
        <p>
          View, organize, and manage all your packages. Create new packages, import from files, or
          browse marketplace packages.
        </p>
        <button class="btn-secondary" @click="router.push('/library')">Go to Library</button>
      </div>
    </section>

    <!-- Load Dialog -->
    <div v-if="showLoadDialog" class="modal" @click.self="showLoadDialog = false">
      <div class="modal-content">
        <h2>Load Package</h2>
        <div v-if="packages.length === 0" class="empty-state">
          <p>No packages found in storage</p>
        </div>
        <div v-else class="package-list">
          <div
            v-for="pkg in packages"
            :key="pkg.id"
            class="package-item"
            :class="{ 'is-dependency': pkg.isBasePackage }"
          >
            <div class="package-item-content" @click="loadPackage(pkg.id)">
              <div class="package-header">
                <h3>{{ pkg.name }}</h3>
                <span v-if="pkg.isBasePackage" class="badge badge-base">Base Package</span>
                <span
                  v-if="pkg.dependencyCount > 0 && pkg.missingDependencies.length === 0"
                  class="badge badge-deps"
                >
                  {{ pkg.dependencyCount }}
                  {{ pkg.dependencyCount === 1 ? 'dependency' : 'dependencies' }} ✓
                </span>
                <span v-if="pkg.missingDependencies.length > 0" class="badge badge-error">
                  {{ pkg.missingDependencies.length }} MISSING!
                </span>
              </div>
              <p class="package-version">v{{ pkg.version }}</p>
              <p class="package-id">ID: {{ pkg.id }}</p>
              <p v-if="pkg.description" class="package-description">
                {{ pkg.description }}
              </p>

              <!-- Present dependencies -->
              <div
                v-if="pkg.presentDependencies && pkg.presentDependencies.length > 0"
                class="package-deps-present"
              >
                ✓ Dependencies present: {{ pkg.presentDependencies.join(', ') }}
              </div>

              <!-- Missing dependencies -->
              <div
                v-if="pkg.missingDependencies && pkg.missingDependencies.length > 0"
                class="package-deps-missing"
              >
                ❌ MISSING: {{ pkg.missingDependencies.join(', ') }} <br /><span
                  class="warning-text"
                  >⚠️ Package cannot be used until these are imported!</span
                >
              </div>
            </div>
            <div class="package-actions">
              <button
                class="btn-delete"
                title="Delete package"
                @click.stop="confirmDeletePackage(pkg.id, pkg.name)"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
        <button class="btn-cancel" @click="showLoadDialog = false">Cancel</button>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="modal" @click.self="cancelDelete">
      <div class="modal-content modal-small">
        <h2>⚠️ Delete Package?</h2>
        <p class="delete-warning">
          Are you sure you want to delete <strong>{{ packageToDelete?.name }}</strong
          >?
        </p>
        <p class="delete-id">
          Package ID: <code>{{ packageToDelete?.id }}</code>
        </p>
        <p class="delete-note">
          ⚠️ This action cannot be undone. If other packages depend on this one, they will break.
        </p>
        <div class="button-group">
          <button class="btn-danger" @click="deletePackageConfirmed">Delete Package</button>
          <button class="btn-cancel" @click="cancelDelete">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Import Dialog -->
    <div v-if="showImportDialog" class="modal" @click.self="showImportDialog = false">
      <div class="modal-content">
        <h2>Import Package</h2>

        <div class="import-tabs">
          <button
            :class="{ active: importMode === 'file' }"
            class="tab-button"
            @click="importMode = 'file'"
          >
            📁 From File
          </button>
          <button
            :class="{ active: importMode === 'text' }"
            class="tab-button"
            @click="importMode = 'text'"
          >
            📝 From Text
          </button>
        </div>

        <!-- File Import Mode -->
        <div v-if="importMode === 'file'" class="import-mode">
          <div class="form-group">
            <label>Select Package File(s):</label>
            <input
              type="file"
              accept=".yaml,.yml,.json"
              multiple
              class="file-input"
              @change="handleFileSelect"
            />
            <p class="hint">
              💡 Tip: Just select your main package file - dependencies will be automatically
              resolved from your selection and storage!
            </p>
          </div>

          <div v-if="selectedFiles.length > 0" class="file-list">
            <h4>Selected Files ({{ selectedFiles.length }}):</h4>
            <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">({{ formatFileSize(file.size) }})</span>
              <button class="btn-remove" @click="removeFile(index)">✕</button>
            </div>
          </div>

          <div class="form-group">
            <label>
              <input v-model="checkDependencies" type="checkbox" />
              Check for missing dependencies (recommended)
            </label>
            <p class="hint">
              <strong>Packages with missing dependencies cannot be used!</strong>
              <br />If checked, you'll be warned immediately about what's needed.
            </p>
          </div>
        </div>

        <!-- Text Import Mode -->
        <div v-if="importMode === 'text'" class="import-mode">
          <div class="form-group">
            <label>Format:</label>
            <select v-model="importFormat">
              <option value="yaml">YAML</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div class="form-group">
            <label>Package Content:</label>
            <textarea
              v-model="importContent"
              rows="15"
              placeholder="Paste your package YAML or JSON here..."
            />
          </div>
        </div>

        <div class="button-group">
          <button class="btn-primary" :disabled="!canImport" @click="importPackage">
            Import {{ selectedFiles.length > 1 ? `(${selectedFiles.length} files)` : '' }}
          </button>
          <button class="btn-cancel" @click="closeImportDialog">Cancel</button>
        </div>

        <div v-if="importProgress" class="progress-info">
          {{ importProgress }}
        </div>

        <p v-if="importError" class="error">
          {{ importError }}
        </p>
        <div
          v-if="importSuccess"
          :class="importSuccess.includes('ERROR:') ? 'error-result' : 'success'"
        >
          <pre class="result-message">{{ importSuccess }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePackageStore } from '../stores/packageStore';
import { platformService } from '../services/localStorage';
import AppNav from '../components/AppNav.vue';

const router = useRouter();
const packageStore = usePackageStore();

const showLoadDialog = ref(false);
const showImportDialog = ref(false);
const showDeleteConfirm = ref(false);
const packageToDelete = ref<{ id: string; name: string } | null>(null);
const isLoadingSample = ref(false);
const packages = ref<
  Array<{
    id: string;
    name: string;
    version: string;
    description?: string;
    isBasePackage: boolean;
    dependencyCount: number;
    dependencies: string[];
    presentDependencies: string[];
    missingDependencies: string[];
  }>
>([]);
const importContent = ref('');
const importFormat = ref<'yaml' | 'json'>('yaml');
const importError = ref('');
const importSuccess = ref('');
const importProgress = ref('');
const importMode = ref<'file' | 'text'>('file');
const selectedFiles = ref<File[]>([]);
const checkDependencies = ref(true);

const canImport = computed(() => {
  if (importMode.value === 'file') {
    return selectedFiles.value.length > 0;
  } else {
    return importContent.value.trim().length > 0;
  }
});

onMounted(async () => {
  await packageStore.loadPackageList();
  await loadPackageMetadata();
});

// Load full package metadata to analyze dependencies
async function loadPackageMetadata() {
  console.log('Loading package metadata for', packageStore.packages.length, 'packages');

  // Get all package IDs that exist in storage
  const allPackageIds = new Set(packageStore.packages.map(p => p.id));

  const allPackages = await Promise.all(
    packageStore.packages.map(async pkgInfo => {
      try {
        const fullPkg = await platformService.loadPackage(pkgInfo.id);

        // Handle both 'package' and 'package' field names
        const depIds =
          fullPkg.dependencies
            ?.map(d => (d as any).package || (d as any).package)
            .filter(Boolean) || [];
        const presentDeps = depIds.filter(depId => allPackageIds.has(depId));
        const missingDeps = depIds.filter(depId => !allPackageIds.has(depId));

        console.log('Loaded package:', fullPkg.id, {
          hasDeps: !!fullPkg.dependencies,
          depCount: depIds.length,
          present: presentDeps,
          missing: missingDeps,
        });

        return {
          id: fullPkg.id,
          name: fullPkg.metadata.name,
          version: fullPkg.version,
          description: fullPkg.metadata.description,
          isBasePackage: !fullPkg.dependencies || fullPkg.dependencies.length === 0,
          dependencyCount: fullPkg.dependencies?.length || 0,
          dependencies: depIds,
          presentDependencies: presentDeps,
          missingDependencies: missingDeps,
        };
      } catch (error) {
        console.error('Failed to load package:', pkgInfo.id, error);
        // If loading fails, return basic info
        return {
          ...pkgInfo,
          isBasePackage: false,
          dependencyCount: 0,
          dependencies: [] as string[],
          presentDependencies: [] as string[],
          missingDependencies: [] as string[],
        };
      }
    })
  );

  // Update packages with full metadata
  packages.value = allPackages;
}

async function loadPackage(id: string) {
  try {
    await packageStore.loadPackage(id);
    showLoadDialog.value = false;
    router.push('/editor');
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Failed to load package');
  }
}

async function loadSamplePackage() {
  isLoadingSample.value = true;
  try {
    // Fetch the featured.common.yaml from the desktop app repo
    const response = await fetch(
      'https://raw.githubusercontent.com/signatur3-git/prompt-gen-desktop/main/packages/featured.common/featured.common.yaml'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch sample package: ${response.statusText}`);
    }

    const yamlContent = await response.text();

    // Import the package
    await packageStore.importPackageFromString(yamlContent, 'yaml');

    // Save it to localStorage
    await packageStore.savePackage();

    // Refresh the package list
    await packageStore.loadPackageList();
    await loadPackageMetadata();

    // Show success message
    alert(
      '✅ Sample package "featured.common" loaded successfully!\n\nThis package includes:\n• Fantasy scenes & characters\n• Lighting & atmosphere\n• Landscape & nature\n• Style variations\n\nGo to Preview to generate prompts!'
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to load sample package';
    alert(
      `❌ ${errorMsg}\n\nYou can manually download featured.common.yaml from:\nhttps://github.com/signatur3-git/prompt-gen-desktop`
    );
  } finally {
    isLoadingSample.value = false;
  }
}

function confirmDeletePackage(id: string, name: string) {
  packageToDelete.value = { id, name };
  showDeleteConfirm.value = true;
}

async function deletePackageConfirmed() {
  if (!packageToDelete.value) return;

  try {
    await packageStore.deletePackage(packageToDelete.value.id);
    await loadPackageMetadata(); // Refresh the list
    showDeleteConfirm.value = false;
    packageToDelete.value = null;
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Failed to delete package');
  }
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  packageToDelete.value = null;
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    selectedFiles.value = Array.from(target.files);
    importError.value = '';
    importSuccess.value = '';
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function importPackage() {
  try {
    importError.value = '';
    importSuccess.value = '';
    importProgress.value = '';

    if (importMode.value === 'file') {
      await importFromFiles();
    } else {
      await importFromText();
    }
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Failed to import package';
    importProgress.value = '';
  }
}

async function importFromText() {
  await packageStore.importPackageFromString(importContent.value, importFormat.value);
  importSuccess.value = 'Package imported successfully!';
  setTimeout(() => {
    showImportDialog.value = false;
    router.push('/editor');
  }, 1000);
}

async function importFromFiles() {
  if (selectedFiles.value.length === 0) {
    throw new Error('No files selected');
  }

  const imported: string[] = [];
  const missingDeps: Array<{ packageId: string; requiredBy: string }> = [];

  // Read and parse files
  importProgress.value = 'Reading files...';
  const fileContents = await Promise.all(
    selectedFiles.value.map(async file => {
      const text = await file.text();
      const format = file.name.endsWith('.json') ? 'json' : 'yaml';
      return { file, text, format };
    })
  );

  // Parse packages
  const packagesToImport: Array<{ pkg: any; file: File }> = [];
  for (const { file, text, format } of fileContents) {
    try {
      const pkg = await platformService.importPackage(text, format as 'yaml' | 'json');
      packagesToImport.push({ pkg, file });
    } catch (error) {
      importError.value = `Failed to parse ${file.name}: ${error}`;
      throw error;
    }
  }

  // Check dependencies if requested
  if (checkDependencies.value) {
    const existingPkgs = await platformService.listPackages();
    const existingIds = new Set(existingPkgs.map(p => p.id));

    console.log('Existing package IDs:', Array.from(existingIds));

    for (const { pkg } of packagesToImport) {
      console.log('Checking dependencies for package:', pkg.id, 'Dependencies:', pkg.dependencies);
      if (pkg.dependencies) {
        for (const dep of pkg.dependencies) {
          // Handle both 'package' and 'package' field names
          const depId = dep.package || dep.package;
          console.log(
            'Checking dependency:',
            dep,
            'depId:',
            depId,
            'exists:',
            existingIds.has(depId)
          );
          if (depId && !existingIds.has(depId)) {
            missingDeps.push({
              packageId: depId,
              requiredBy: pkg.id,
            });
            console.log('Added missing dependency:', depId, 'required by:', pkg.id);
          }
        }
      }
    }

    console.log('All missing dependencies:', missingDeps);
  }

  // Import packages
  for (const { pkg, file } of packagesToImport) {
    importProgress.value = `Importing ${file.name}...`;

    const existingPkgs = await platformService.listPackages();
    const isUpdate = existingPkgs.some(p => p.id === pkg.id);

    await platformService.savePackage(pkg);

    if (isUpdate) {
      imported.push(`${pkg.metadata.name || pkg.id} (updated)`);
    } else {
      imported.push(pkg.metadata.name || pkg.id);
    }
  }

  // Reload package list
  await packageStore.loadPackageList();
  await loadPackageMetadata();

  // Load the last imported package into editor
  const lastPkg = packagesToImport[packagesToImport.length - 1];
  if (lastPkg) {
    await packageStore.loadPackage(lastPkg.pkg.id);
  }

  // Build success message
  let successMsg = `Successfully imported ${packagesToImport.length} package(s): ${imported.join(', ')}`;

  if (missingDeps.length > 0) {
    const uniqueMissing = Array.from(new Set(missingDeps.map(d => d.packageId)));
    console.log('Unique missing dependencies:', uniqueMissing);
    console.log(
      'uniqueMissing array:',
      uniqueMissing.map(id => `"${id}"`)
    );
    successMsg += `\n\n❌ ERROR: ${uniqueMissing.length} REQUIRED ${uniqueMissing.length === 1 ? 'DEPENDENCY' : 'DEPENDENCIES'} MISSING!`;
    successMsg += `\n   Missing: ${uniqueMissing.join(', ')}`;
    successMsg += '\n   ⚠️ This package CANNOT be used until dependencies are imported.';
    successMsg += '\n   Import the missing packages to make this functional.';
  }

  importSuccess.value = successMsg;
  importProgress.value = '';

  setTimeout(
    () => {
      showImportDialog.value = false;
      router.push('/editor');
    },
    missingDeps.length > 0 ? 5000 : 2000
  ); // Show error longer
}

function closeImportDialog() {
  showImportDialog.value = false;
  selectedFiles.value = [];
  importContent.value = '';
  importError.value = '';
  importSuccess.value = '';
  importProgress.value = '';
  importMode.value = 'file';
}
</script>

<style scoped>
.home {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0;
  color: white;
  margin-bottom: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  opacity: 0.95;
  font-weight: 500;
}

.hero-description {
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.9;
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: 2rem;
}

.btn-hero {
  background: var(--color-surface);
  color: var(--color-primary);
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2);
  background: var(--color-surface-hover);
}

/* Sections */
section {
  margin-bottom: 4rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 2rem;
}

section:first-of-type {
  padding-top: 3rem;
}

section h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-intro {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

/* Getting Started - Hero Card */
.getting-started .action-card {
  max-width: 700px;
  margin: 0 auto;
}

.action-card-hero {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 3rem;
  box-shadow: 0 12px 48px rgba(245, 87, 108, 0.3);
  transform: scale(1.02);
}

.action-card-hero h3 {
  color: white;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.action-card-hero p {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.1rem;
  line-height: 1.6;
}

/* Quick Actions - Primary Card */
.quick-actions .action-card {
  max-width: 700px;
  margin: 0 auto;
}

.action-card-primary {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border: none;
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(168, 237, 234, 0.3);
}

.action-card-primary h3 {
  color: #2c3e50;
  font-size: 1.6rem;
}

.action-card-primary p {
  color: #555;
  font-size: 1.05rem;
}

/* Marketplace Section - Special Card */
.marketplace-section .action-card {
  max-width: 700px;
  margin: 0 auto;
}

.action-card-marketplace {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.action-card-marketplace h3 {
  color: white;
  font-size: 1.6rem;
}

.action-card-marketplace p {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.05rem;
}

.btn-marketplace {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-marketplace:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.action-card {
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  background: var(--color-surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Remove confusing hover effect from card itself */
/* Users should click the buttons, not the card */

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.action-card h3 {
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
  color: #2c3e50;
}

.action-card p {
  color: #666;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

/* Buttons */
.btn-large {
  font-size: 1.1rem;
  padding: 1rem 2rem;
  font-weight: 600;
}

/* Buttons */
.btn-large {
  font-size: 1.1rem;
  padding: 1rem 2rem;
  font-weight: 600;
}

.btn-primary,
.btn-secondary,
.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-primary {
  background: #42b983;
  color: white;
  box-shadow: 0 2px 4px rgba(66, 185, 131, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: #359268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.btn-secondary {
  background: #667eea;
  color: white;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.btn-secondary:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-cancel {
  background: #ddd;
  color: #333;
  margin-left: 0.5rem;
}

.btn-cancel:hover {
  background: #ccc;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-surface);
  padding: 2rem;
  border-radius: 8px;
  max-width: 700px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
}

.package-list {
  margin: 1rem 0;
}

.package-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.package-item:hover {
  border-color: #42b983;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.package-item.is-dependency {
  border-left: 4px solid #3498db;
  background: #f8fcff;
}

.package-item.is-dependency:hover {
  background: #e8f4fd;
}

.package-item-content {
  flex: 1;
  padding: 1rem;
  cursor: pointer;
}

.package-item-content:hover {
  background: rgba(66, 185, 131, 0.05);
}

.package-actions {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-left: 1px solid #e9ecef;
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  cursor: pointer;
  color: #c33;
  font-size: 0.9rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-delete:hover {
  background: #fcc;
  color: #a00;
  transform: scale(1.05);
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #c0392b;
  transform: scale(1.02);
}

.modal-small {
  max-width: 500px;
}

.delete-warning {
  margin: 1rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
}

.delete-id {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}

.delete-id code {
  font-family: 'Courier New', monospace;
  background: var(--color-surface-hover);
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  border: 1px solid var(--color-border);
}

.delete-note {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-size: 0.9rem;
  line-height: 1.5;
}

.package-id {
  color: #999;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  margin: 0.25rem 0 0 0;
}

.package-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.package-header h3 {
  margin: 0;
  flex: 1;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-base {
  background: #e8f4fd;
  color: #3498db;
  border: 1px solid #3498db;
}

.badge-deps {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffc107;
}

.badge-error {
  background: #fee;
  color: #c33;
  border: 1px solid #e74c3c;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.package-version {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.package-description {
  color: #888;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
}

.package-deps {
  color: #666;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  font-style: italic;
  padding-left: 1rem;
  border-left: 2px solid #ddd;
}

.package-deps-present {
  color: #27ae60;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  padding: 0.5rem;
  background: #f0fdf4;
  border-radius: 4px;
  border-left: 3px solid #27ae60;
}

.package-deps-missing {
  color: #721c24;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  padding: 0.5rem;
  background: #fff3cd;
  border-radius: 4px;
  border-left: 3px solid #e74c3c;
  font-weight: 600;
}

.warning-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #856404;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.button-group {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.error {
  color: #e74c3c;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 4px;
  border-left: 4px solid #e74c3c;
}

.success {
  color: #27ae60;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border-radius: 4px;
  border-left: 4px solid #27ae60;
}

.error-result {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 4px;
  border-left: 6px solid #e74c3c;
  border: 2px solid #e74c3c;
}

.result-message {
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  color: #2c3e50;
}

.error-result .result-message {
  color: #721c24;
  font-weight: 500;
}

.success .result-message {
  color: #155724;
}

.import-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #eee;
}

.tab-button {
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #f5f5f5;
}

.tab-button.active {
  border-bottom-color: #42b983;
  color: #42b983;
  font-weight: bold;
}

.import-mode {
  min-height: 200px;
}

.file-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.file-input:hover {
  border-color: #42b983;
  background: #f8fffe;
}

.file-list {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.file-list h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.file-item:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-success);
}

.file-name {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #2c3e50;
  font-weight: 500;
}

.file-size {
  color: #999;
  font-size: 0.85rem;
}

.btn-remove {
  padding: 0.25rem 0.6rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  cursor: pointer;
  color: #c33;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fcc;
  color: #a00;
}

.hint {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
  font-style: italic;
  line-height: 1.4;
}

.progress-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #e8f4fd;
  border-left: 4px solid #3498db;
  border-radius: 4px;
  color: #2c3e50;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-info::before {
  content: '⏳';
  font-size: 1.2rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  /* Tablet */
  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .hero h1 {
    font-size: 2.5rem;
  }
}

@media (max-width: 768px) {
  /* Mobile */
  .home {
    padding: 1rem;
  }

  .hero {
    padding: 2rem 1.5rem;
    margin-bottom: 2rem;
  }

  .hero h1 {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  section {
    margin-bottom: 2.5rem;
  }

  section h2 {
    font-size: 1.5rem;
  }

  .section-intro {
    font-size: 1rem;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .action-card {
    padding: 1.5rem;
  }

  .action-card-hero {
    padding: 2rem;
  }

  .modal-content {
    padding: 1rem;
    width: 95%;
  }

  .import-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .import-row button {
    width: 100%;
  }

  /* Increase touch targets */
  button {
    min-height: 44px;
    padding: 0.75rem 1.5rem;
  }

  .btn-delete {
    padding: 0.5rem 1rem;
  }

  textarea {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

@media (max-width: 480px) {
  /* Extra small mobile */
  .home-header h1 {
    font-size: 1.25rem;
  }

  .package-card h3 {
    font-size: 1.1rem;
  }

  .package-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .stat-item {
    font-size: 0.85rem;
  }
}
</style>


