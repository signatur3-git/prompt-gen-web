<template>
  <div class="library-view">
    <AppNav />

    <div class="library-container">
      <div class="library-header">
        <h1>📚 Library</h1>
        <p class="library-subtitle">Manage your prompt generation packages</p>
      </div>

      <!-- Tabs for different sections -->
      <div class="library-tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'created' }"
          @click="activeTab = 'created'"
        >
          ✏️ Created
          <span class="tab-count">{{ createdPackages.length }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'imported' }"
          @click="activeTab = 'imported'"
        >
          📥 Imported
          <span class="tab-count">{{ importedPackages.length }}</span>
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'marketplace' }"
          @click="activeTab = 'marketplace'"
        >
          🏪 Marketplace
          <span class="tab-count">{{ marketplacePackages.length }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Created Packages -->
        <div v-if="activeTab === 'created'" class="package-section">
          <div class="section-header">
            <h2>Created Packages</h2>
            <button class="btn-primary" @click="createNewPackage">➕ Create New</button>
          </div>
          <p class="section-description">Packages you've authored in this application</p>

          <div v-if="createdPackages.length === 0" class="empty-state">
            <div class="empty-icon">✏️</div>
            <p>No created packages yet</p>
            <button class="btn-secondary" @click="createNewPackage">
              Create Your First Package
            </button>
          </div>

          <div v-else class="package-grid">
            <PackageCard
              v-for="pkg in createdPackages"
              :key="pkg.id"
              :package-info="pkg"
              :source="'created'"
              @edit="editPackage"
              @generate="generateFromPackage"
              @export="exportPackage"
              @delete="deletePackageConfirm"
            />
          </div>
        </div>

        <!-- Imported Packages -->
        <div v-if="activeTab === 'imported'" class="package-section">
          <div class="section-header">
            <h2>Imported Packages</h2>
            <button class="btn-primary" @click="importPackages">📥 Import Files</button>
          </div>
          <p class="section-description">Packages loaded from YAML/JSON files</p>

          <div v-if="importedPackages.length === 0" class="empty-state">
            <div class="empty-icon">📥</div>
            <p>No imported packages yet</p>
            <button class="btn-secondary" @click="importPackages">Import Package Files</button>
          </div>

          <div v-else class="package-grid">
            <PackageCard
              v-for="pkg in importedPackages"
              :key="pkg.id"
              :package-info="pkg"
              :source="'imported'"
              @edit="editPackage"
              @generate="generateFromPackage"
              @export="exportPackage"
              @delete="deletePackageConfirm"
            />
          </div>
        </div>

        <!-- Marketplace Packages -->
        <div v-if="activeTab === 'marketplace'" class="package-section">
          <div class="section-header">
            <h2>Marketplace Packages</h2>
            <button class="btn-primary" @click="router.push('/marketplace')">
              🌐 Browse Marketplace
            </button>
          </div>
          <p class="section-description">Packages installed from the community marketplace</p>

          <div v-if="marketplacePackages.length === 0" class="empty-state">
            <div class="empty-icon">🏪</div>
            <p>No marketplace packages installed yet</p>
            <button class="btn-secondary" @click="router.push('/marketplace')">
              Explore Marketplace
            </button>
          </div>

          <div v-else class="package-grid">
            <PackageCard
              v-for="pkg in marketplacePackages"
              :key="pkg.id"
              :package-info="pkg"
              :source="'marketplace'"
              @generate="generateFromPackage"
              @export="exportPackage"
              @delete="deletePackageConfirm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Import Dialog -->
    <div v-if="showImportDialog" class="modal" @click.self="showImportDialog = false">
      <div class="modal-content">
        <h2>Import Packages</h2>
        <p>Select YAML or JSON files to import. Dependencies will be resolved automatically.</p>
        <input
          ref="fileInput"
          type="file"
          accept=".yaml,.yml,.json"
          multiple
          @change="handleFileImport"
        />
        <div class="modal-actions">
          <button class="btn-secondary" @click="showImportDialog = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteDialog" class="modal" @click.self="showDeleteDialog = false">
      <div class="modal-content modal-danger">
        <h2>⚠️ Delete Package?</h2>
        <p v-if="packageToDelete">
          Are you sure you want to delete <strong>{{ packageToDelete.name }}</strong
          >?
        </p>
        <p v-if="packageToDelete?.source === 'marketplace'" class="warning-note">
          This package can be re-installed from the marketplace later.
        </p>
        <p v-else class="warning-note">
          This action cannot be undone. The package will be permanently deleted.
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteDialog = false">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePackageStore } from '../stores/packageStore';
import AppNav from '../components/AppNav.vue';
import PackageCard from '../components/PackageCard.vue';

const router = useRouter();
const packageStore = usePackageStore();

const activeTab = ref<'created' | 'imported' | 'marketplace'>('created');
const showImportDialog = ref(false);
const showDeleteDialog = ref(false);
const packageToDelete = ref<any>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// Computed properties for package lists
const createdPackages = computed(() => {
  return packageStore.packages.filter((pkg: any) => pkg.source === 'created' || !pkg.source);
});

const importedPackages = computed(() => {
  return packageStore.packages.filter((pkg: any) => pkg.source === 'imported');
});

const marketplacePackages = computed(() => {
  return packageStore.packages.filter((pkg: any) => pkg.source === 'marketplace');
});

// Actions
function createNewPackage() {
  packageStore.createNew();
  router.push('/editor');
}

function editPackage(packageId: string) {
  packageStore.loadPackage(packageId);
  router.push('/editor');
}

function generateFromPackage(packageId: string) {
  packageStore.loadPackage(packageId);
  router.push('/preview');
}

async function exportPackage(packageId: string) {
  try {
    const pkg = await packageStore.loadPackageData(packageId);
    const yaml = await import('js-yaml');
    const content = yaml.dump(pkg);
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pkg.id}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export package:', error);
    alert('Failed to export package');
  }
}

function deletePackageConfirm(packageId: string) {
  const pkg = packageStore.packages.find((p: any) => p.id === packageId);
  if (pkg) {
    packageToDelete.value = pkg;
    showDeleteDialog.value = true;
  }
}

async function confirmDelete() {
  if (packageToDelete.value) {
    try {
      await packageStore.deletePackage(packageToDelete.value.id);
      showDeleteDialog.value = false;
      packageToDelete.value = null;
    } catch (error) {
      console.error('Failed to delete package:', error);
      alert('Failed to delete package');
    }
  }
}

function importPackages() {
  showImportDialog.value = true;
  // Trigger file input click after dialog is shown
  setTimeout(() => {
    fileInput.value?.click();
  }, 100);
}

async function handleFileImport(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files || files.length === 0) {
    showImportDialog.value = false;
    return;
  }

  try {
    const yaml = await import('js-yaml');
    for (const file of Array.from(files)) {
      const content = await file.text();
      const pkg = file.name.endsWith('.json') ? JSON.parse(content) : yaml.load(content);
      // Mark as imported
      if (pkg) {
        pkg.source = 'imported';
        await packageStore.importPackage(pkg);
      }
    }
    showImportDialog.value = false;
    await packageStore.loadPackageList();
  } catch (error) {
    console.error('Failed to import packages:', error);
    alert(
      'Failed to import packages: ' + (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}

onMounted(async () => {
  await packageStore.loadPackageList();
});
</script>

<style scoped>
.library-view {
  min-height: 100vh;
  background: var(--color-background);
}

.library-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.library-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.library-header h1 {
  font-size: 3rem;
  margin: 0 0 0.5rem 0;
}

.library-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.library-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.tab {
  background: transparent;
  border: none;
  color: white;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tab.active {
  border-bottom-color: white;
  font-weight: 600;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
}

.tab.active .tab-count {
  background: var(--color-surface);
  color: var(--color-primary);
}

.tab-content {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow-md);
}

.package-section {
  min-height: 400px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  margin: 0;
  color: var(--color-text-primary);
}

.section-description {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: var(--color-danger-hover);
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-surface);
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: var(--shadow-lg);
}

.modal-content h2 {
  margin-top: 0;
  color: var(--color-text-primary);
}

.modal-content p {
  color: var(--color-text-secondary);
}

.modal-danger h2 {
  color: var(--color-danger);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.warning-note {
  color: var(--color-danger);
  font-size: 0.9rem;
  margin-top: 1rem;
}

input[type='file'] {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  margin: 1rem 0;
  background: var(--color-surface);
  color: var(--color-text-primary);
}

</style>
