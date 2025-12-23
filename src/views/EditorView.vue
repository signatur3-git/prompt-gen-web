<template>
  <div class="editor-view">
    <header class="editor-header">
      <h1>Package Editor</h1>
      <div class="header-actions">
        <button
          class="btn-primary"
          :disabled="isSaving"
          aria-label="Save package (Ctrl+S)"
          title="Save package (Ctrl+S)"
          @click="savePackage"
        >
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
        <button
          class="btn-secondary"
          aria-label="Export package"
          title="Export package"
          @click="exportPackage"
        >
          Export
        </button>
        <button
          class="btn-secondary"
          aria-label="Preview package"
          title="Preview package"
          @click="router.push('/preview')"
        >
          Preview
        </button>
        <button
          class="btn-secondary"
          aria-label="Go to home"
          title="Go to home"
          @click="router.push('/')"
        >
          Home
        </button>
      </div>
    </header>

    <!-- Save status message -->
    <div v-if="saveMessage" class="save-message" :class="saveMessage.type">
      {{ saveMessage.text }}
    </div>

    <div v-if="!currentPackage" class="empty-state">
      <p>No package loaded. Please create or load a package.</p>
      <button class="btn-primary" @click="router.push('/')">Go to Home</button>
    </div>

    <div v-else class="editor-container">
      <aside class="sidebar">
        <h2>Package Structure</h2>
        <div class="package-info">
          <h3>{{ currentPackage.metadata.name || 'Untitled' }}</h3>
          <p class="version">v{{ currentPackage.version }}</p>
        </div>

        <div class="section">
          <h3>Metadata</h3>
          <button
            :class="{ active: selectedSection === 'metadata' }"
            @click="selectedSection = 'metadata'"
          >
            Edit Metadata
          </button>
        </div>

        <div class="section">
          <h3>Namespaces</h3>
          <div v-if="Object.keys(currentPackage.namespaces).length === 0" class="empty-hint">
            No namespaces yet
          </div>
          <div v-else class="namespace-list">
            <button
              v-for="(ns, id) in currentPackage.namespaces"
              :key="id"
              :class="{ active: selectedNamespace === id }"
              class="namespace-button"
              @click="selectNamespace(id)"
            >
              <span class="namespace-name">{{ ns.id }}</span>
              <span class="entity-counts">
                <span
                  v-if="Object.keys(ns.datatypes || {}).length > 0"
                  class="count-badge"
                  title="Datatypes"
                >
                  D:{{ Object.keys(ns.datatypes || {}).length }}
                </span>
                <span
                  v-if="Object.keys(ns.prompt_sections || {}).length > 0"
                  class="count-badge"
                  title="Prompt Sections"
                >
                  P:{{ Object.keys(ns.prompt_sections || {}).length }}
                </span>
                <span
                  v-if="Object.keys(ns.separator_sets || {}).length > 0"
                  class="count-badge"
                  title="Separator Sets"
                >
                  S:{{ Object.keys(ns.separator_sets || {}).length }}
                </span>
                <span
                  v-if="Object.keys(ns.rules || {}).length > 0"
                  class="count-badge"
                  title="Rules"
                >
                  R:{{ Object.keys(ns.rules || {}).length }}
                </span>
              </span>
            </button>
          </div>
          <button class="btn-add" @click="addNamespace">+ Add Namespace</button>
        </div>
      </aside>

      <main class="editor-main">
        <!-- Validation Panel -->
        <ValidationPanel :result="validationResult" @jump-to="handleJumpToLocation" />

        <!-- Show namespace management when namespace selected but no metadata -->
        <div v-if="selectedNamespace && selectedSection !== 'metadata'" class="namespace-header">
          <div class="namespace-actions">
            <button
              class="btn-secondary"
              title="Rename namespace"
              @click="openRenameNamespaceModal"
            >
              ✏️ Rename
            </button>
            <button class="btn-delete" title="Delete namespace" @click="deleteNamespace">
              🗑️ Delete
            </button>
          </div>
        </div>

        <div v-if="selectedSection === 'metadata'">
          <h2>Package Metadata</h2>
          <div class="form-group">
            <label>Package ID:</label>
            <input v-model="currentPackage.id" placeholder="e.g., my.awesome.package" />
          </div>
          <div class="form-group">
            <label>Name:</label>
            <input v-model="currentPackage.metadata.name" placeholder="e.g., My Awesome Package" />
          </div>
          <div class="form-group">
            <label>Version:</label>
            <input v-model="currentPackage.version" placeholder="e.g., 1.0.0" />
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea v-model="currentPackage.metadata.description" rows="3" />
          </div>
          <div class="form-group">
            <label>Authors (one per line):</label>
            <textarea
              :value="currentPackage.metadata.authors.join('\n')"
              rows="3"
              @input="updateAuthors"
            />
          </div>
        </div>

        <div v-else-if="selectedNamespace">
          <h2>Namespace: {{ selectedNamespace }}</h2>

          <!-- Entity Type Tabs -->
          <div class="entity-tabs">
            <button
              :class="{ active: selectedEntityType === 'datatypes' }"
              @click="selectedEntityType = 'datatypes'"
            >
              Datatypes ({{ Object.keys(namespace?.datatypes || {}).length }})
            </button>
            <button
              :class="{ active: selectedEntityType === 'prompt_sections' }"
              @click="selectedEntityType = 'prompt_sections'"
            >
              Prompt Sections ({{ Object.keys(namespace?.prompt_sections || {}).length }})
            </button>
            <button
              :class="{ active: selectedEntityType === 'separator_sets' }"
              @click="selectedEntityType = 'separator_sets'"
            >
              Separator Sets ({{ Object.keys(namespace?.separator_sets || {}).length }})
            </button>
            <button
              :class="{ active: selectedEntityType === 'rules' }"
              @click="selectedEntityType = 'rules'"
            >
              Rules ({{ Object.keys(namespace?.rules || {}).length }})
            </button>
            <button
              :class="{ active: selectedEntityType === 'rulebooks' }"
              @click="selectedEntityType = 'rulebooks'"
            >
              Rulebooks ({{ Object.keys(namespace?.rulebooks || {}).length }})
            </button>
          </div>

          <!-- Entity Editor -->
          <div class="entity-editor">
            <DatatypeEditor
              v-if="selectedEntityType === 'datatypes'"
              :namespace-id="selectedNamespace"
              :datatypes="namespace?.datatypes || {}"
              @update="updateDatatypes"
              @change="markPackageChanged"
            />

            <PromptSectionEditor
              v-else-if="selectedEntityType === 'prompt_sections'"
              :namespace-id="selectedNamespace"
              :prompt-sections="namespace?.prompt_sections || {}"
              @update="updatePromptSections"
              @change="markPackageChanged"
            />

            <SeparatorSetEditor
              v-else-if="selectedEntityType === 'separator_sets'"
              :namespace-id="selectedNamespace"
              :separator-sets="namespace?.separator_sets || {}"
              @update="updateSeparatorSets"
              @change="markPackageChanged"
            />

            <RuleEditor
              v-else-if="selectedEntityType === 'rules'"
              :namespace-id="selectedNamespace"
              :rules="namespace?.rules || {}"
              @update="updateRules"
              @change="markPackageChanged"
            />

            <RulebookEditor
              v-else-if="selectedEntityType === 'rulebooks'"
              :namespace-id="selectedNamespace"
              :rulebooks="namespace?.rulebooks || {}"
              @update="updateRulebooks"
              @change="markPackageChanged"
            />
          </div>
        </div>

        <div v-else>
          <div class="welcome">
            <h2>Welcome to the Package Editor</h2>
            <p>Select a section from the sidebar to start editing.</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Export Dialog -->
    <div v-if="showExportDialog" class="modal" @click.self="showExportDialog = false">
      <div class="modal-content">
        <h2>Export Package</h2>
        <div class="form-group">
          <label>Format:</label>
          <select v-model="exportFormat">
            <option value="yaml">YAML</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div class="form-group">
          <label>Package Content:</label>
          <textarea v-model="exportContent" rows="15" readonly />
        </div>
        <div class="button-group">
          <button class="btn-primary" @click="copyToClipboard">Copy to Clipboard</button>
          <button class="btn-cancel" @click="showExportDialog = false">Close</button>
        </div>
        <p v-if="exportMessage" class="success">
          {{ exportMessage }}
        </p>
      </div>
    </div>

    <!-- Namespace Modal (Add/Rename) -->
    <div v-if="isNamespaceModalOpen" class="modal-overlay" @click.self="closeNamespaceModal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="namespace-modal-title">
        <div class="modal-header">
          <h3 id="namespace-modal-title">
            {{ namespaceModalMode === 'add' ? 'Add Namespace' : 'Rename Namespace' }}
          </h3>
        </div>

        <div class="modal-body">
          <p v-if="namespaceModalMode === 'rename'" class="modal-subtitle">
            Renaming changes the namespace ID. References in other namespaces may need updating.
          </p>

          <div v-if="namespaceModalMode === 'rename'" class="form-group">
            <label>Current ID</label>
            <input :value="namespaceModalCurrentId" disabled />
          </div>

          <div class="form-group">
            <label
              >{{ namespaceModalMode === 'add' ? 'Namespace ID' : 'New ID' }}
              <span class="required">*</span></label
            >
            <input
              v-model="namespaceModalNextId"
              placeholder="e.g., core or my_namespace"
              @keydown.enter.prevent="applyNamespaceModal"
            />
            <p class="hint">Use lowercase letters, numbers, dots, and underscores only</p>
            <p v-if="namespaceModalError" class="error">
              {{ namespaceModalError }}
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="closeNamespaceModal">Cancel</button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!canApplyNamespaceModal"
            @click="applyNamespaceModal"
          >
            {{ namespaceModalMode === 'add' ? 'Add' : 'Rename' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePackageStore } from '../stores/packageStore';
import { createEmptyNamespace } from '../models/package';
import DatatypeEditor from '../components/DatatypeEditor.vue';
import PromptSectionEditor from '../components/PromptSectionEditor.vue';
import SeparatorSetEditor from '../components/SeparatorSetEditor.vue';
import RuleEditor from '../components/RuleEditor.vue';
import RulebookEditor from '../components/RulebookEditor.vue';
import ValidationPanel from '../components/ValidationPanel.vue';
import { PackageValidator } from '../validator/index';
import type { ValidationResult } from '../validator/types';
import { createValidationResult } from '../validator/types';
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts';

const router = useRouter();
const packageStore = usePackageStore();

const currentPackage = computed(() => packageStore.currentPackage);
const selectedSection = ref<string>('metadata');
const selectedNamespace = ref<string | null>(null);
const selectedEntityType = ref<string>('datatypes');
const showExportDialog = ref(false);
const exportFormat = ref<'yaml' | 'json'>('yaml');
const exportContent = ref('');
const exportMessage = ref('');

const isNamespaceModalOpen = ref(false);
const namespaceModalMode = ref<'add' | 'rename'>('add');
const namespaceModalCurrentId = ref<string>('');
const namespaceModalNextId = ref<string>('');
const namespaceModalError = ref<string>('');

// Validation state
const validationResult = ref<ValidationResult>(createValidationResult());
const validationDebounce = ref<number | null>(null);
const isSaving = ref(false);
const saveMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null);

const canApplyNamespaceModal = computed(() => {
  if (!isNamespaceModalOpen.value) return false;
  const nextId = namespaceModalNextId.value.trim();
  if (!nextId) return false;
  // Allow lowercase letters, numbers, dots, and underscores
  if (!/^[a-z][a-z0-9_.]*$/.test(nextId)) return false;
  if (namespaceModalMode.value === 'rename' && nextId === namespaceModalCurrentId.value)
    return false;
  if (currentPackage.value?.namespaces[nextId]) return false;
  return true;
});

const namespace = computed(() => {
  if (!currentPackage.value || !selectedNamespace.value) return null;
  return currentPackage.value.namespaces[selectedNamespace.value];
});

// Auto-select first namespace when package loads
watch(
  currentPackage,
  newPkg => {
    if (newPkg && Object.keys(newPkg.namespaces).length > 0 && !selectedNamespace.value) {
      const firstNamespace = Object.keys(newPkg.namespaces)[0];
      if (firstNamespace) selectNamespace(firstNamespace);
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (
    currentPackage.value &&
    Object.keys(currentPackage.value.namespaces).length > 0 &&
    !selectedNamespace.value
  ) {
    const firstNamespace = Object.keys(currentPackage.value.namespaces)[0];
    if (firstNamespace) selectNamespace(firstNamespace);
  }
});

function selectNamespace(id: string) {
  selectedSection.value = '';
  selectedNamespace.value = id;
  selectedEntityType.value = 'datatypes'; // Reset to datatypes tab
}

function updateDatatypes(datatypes: Record<string, any>) {
  if (!currentPackage.value || !selectedNamespace.value) return;
  const ns = currentPackage.value.namespaces[selectedNamespace.value];
  if (!ns) return;
  ns.datatypes = datatypes;
}

function updatePromptSections(promptSections: Record<string, any>) {
  if (!currentPackage.value || !selectedNamespace.value) return;
  const ns = currentPackage.value.namespaces[selectedNamespace.value];
  if (!ns) return;
  ns.prompt_sections = promptSections;
}

function updateSeparatorSets(separatorSets: Record<string, any>) {
  if (!currentPackage.value || !selectedNamespace.value) return;
  const ns = currentPackage.value.namespaces[selectedNamespace.value];
  if (!ns) return;
  ns.separator_sets = separatorSets;
}

function updateRules(rules: Record<string, any>) {
  if (!currentPackage.value || !selectedNamespace.value) return;
  const ns = currentPackage.value.namespaces[selectedNamespace.value];
  if (!ns) return;
  ns.rules = rules;
}

function updateRulebooks(rulebooks: Record<string, any>) {
  if (!currentPackage.value || !selectedNamespace.value) return;
  const ns = currentPackage.value.namespaces[selectedNamespace.value];
  if (!ns) return;
  ns.rulebooks = rulebooks;
}

function markPackageChanged() {
  // Mark package as having unsaved changes
  // Could add visual indicator later
}

function addNamespace() {
  if (!currentPackage.value) return;
  namespaceModalMode.value = 'add';
  namespaceModalCurrentId.value = '';
  namespaceModalNextId.value = '';
  namespaceModalError.value = '';
  isNamespaceModalOpen.value = true;
}

function openRenameNamespaceModal() {
  if (!currentPackage.value || !selectedNamespace.value) return;
  namespaceModalMode.value = 'rename';
  namespaceModalCurrentId.value = selectedNamespace.value;
  namespaceModalNextId.value = selectedNamespace.value;
  namespaceModalError.value = '';
  isNamespaceModalOpen.value = true;
}

function closeNamespaceModal() {
  isNamespaceModalOpen.value = false;
  namespaceModalError.value = '';
}

function validateNamespaceModal(): boolean {
  const nextId = namespaceModalNextId.value.trim();

  if (!nextId) {
    namespaceModalError.value = 'ID is required';
    return false;
  }
  if (!/^[a-z][a-z0-9_.]*$/.test(nextId)) {
    namespaceModalError.value =
      'ID must start with lowercase letter and contain only lowercase letters, numbers, dots, and underscores';
    return false;
  }
  if (namespaceModalMode.value === 'rename' && nextId === namespaceModalCurrentId.value) {
    namespaceModalError.value = 'New ID must be different from the current ID';
    return false;
  }
  if (currentPackage.value?.namespaces[nextId]) {
    namespaceModalError.value = 'A namespace with this ID already exists';
    return false;
  }

  namespaceModalError.value = '';
  return true;
}

function applyNamespaceModal() {
  if (!currentPackage.value) return;
  if (!validateNamespaceModal()) return;

  const nextId = namespaceModalNextId.value.trim();

  if (namespaceModalMode.value === 'add') {
    currentPackage.value.namespaces[nextId] = createEmptyNamespace(nextId);
    selectNamespace(nextId);
  } else if (namespaceModalMode.value === 'rename') {
    const currentId = namespaceModalCurrentId.value;
    const namespace = currentPackage.value.namespaces[currentId];
    if (!namespace) return;

    // Update namespace ID field
    namespace.id = nextId;

    // Move to new key
    currentPackage.value.namespaces[nextId] = namespace;
    delete currentPackage.value.namespaces[currentId];

    // Update selection
    selectedNamespace.value = nextId;
  }

  closeNamespaceModal();
  markPackageChanged();
}

function deleteNamespace() {
  if (!currentPackage.value || !selectedNamespace.value) return;

  const id = selectedNamespace.value;
  if (!confirm(`Delete namespace "${id}" and all its contents? This cannot be undone.`)) return;

  delete currentPackage.value.namespaces[id];

  // Select another namespace or clear selection
  const remainingNamespaces = Object.keys(currentPackage.value.namespaces);
  if (remainingNamespaces.length > 0) {
    const firstId = remainingNamespaces[0];
    if (firstId) selectNamespace(firstId);
  } else {
    selectedNamespace.value = null;
    selectedSection.value = 'metadata';
  }

  markPackageChanged();
}

// Validation functions
function validatePackage() {
  if (!currentPackage.value) {
    validationResult.value = createValidationResult();
    return;
  }

  // Get all loaded dependencies for validation
  const dependencies: Record<string, any> = {};
  const allPackages = packageStore.allPackages || [];

  for (const pkg of allPackages) {
    if (pkg.id && pkg.id !== currentPackage.value.id) {
      dependencies[pkg.id] = pkg;
    }
  }

  // Run validation with dependencies
  validationResult.value = PackageValidator.validateWithDependencies(
    currentPackage.value,
    dependencies
  );
}

function scheduleValidation() {
  // Debounce validation to avoid running on every keystroke
  if (validationDebounce.value) {
    clearTimeout(validationDebounce.value);
  }
  validationDebounce.value = window.setTimeout(() => {
    validatePackage();
  }, 500);
}

function handleJumpToLocation(location: string | undefined) {
  if (!location) return;

  // Parse location format: "namespace:entity_id" or more complex
  // For now, just log it - full implementation would navigate to the entity
  console.log('Jump to:', location);

  // Extract namespace from location
  const parts = location.split(':');
  if (parts.length >= 2) {
    const nsId = parts[0];
    if (nsId && currentPackage.value?.namespaces[nsId]) {
      selectNamespace(nsId);
      // Could also select the specific entity within the namespace
    }
  }
}

// Watch for changes and trigger validation (only when package exists)
watch(
  currentPackage,
  newPkg => {
    if (newPkg) {
      scheduleValidation();
    } else {
      // Clear validation when package is cleared
      validationResult.value = createValidationResult();
    }
  },
  { deep: true }
);

// Keyboard shortcuts
useKeyboardShortcuts([
  {
    key: 's',
    ctrl: true,
    handler: () => {
      if (currentPackage.value) {
        savePackage();
      }
    },
    description: 'Save package',
  },
  {
    key: 'n',
    ctrl: true,
    handler: () => {
      if (currentPackage.value) {
        addNamespace();
      }
    },
    description: 'Add new namespace',
  },
  {
    key: 'Escape',
    handler: () => {
      if (showExportDialog.value) {
        showExportDialog.value = false;
      } else if (isNamespaceModalOpen.value) {
        closeNamespaceModal();
      }
    },
    description: 'Close modals',
  },
]);

// Validate on mount (only if package exists)
onMounted(() => {
  if (currentPackage.value) {
    validatePackage();
  }
});

// Cleanup on unmount
onUnmounted(() => {
  if (validationDebounce.value) {
    clearTimeout(validationDebounce.value);
    validationDebounce.value = null;
  }
});

async function savePackage() {
  if (isSaving.value) return; // Prevent double-save

  try {
    isSaving.value = true;
    saveMessage.value = null;
    await packageStore.savePackage();
    saveMessage.value = { text: 'Package saved successfully!', type: 'success' };
    // Clear message after 3 seconds
    setTimeout(() => {
      saveMessage.value = null;
    }, 3000);
  } catch (error) {
    saveMessage.value = {
      text: error instanceof Error ? error.message : 'Failed to save package',
      type: 'error',
    };
  } finally {
    isSaving.value = false;
  }
}

async function exportPackage() {
  try {
    exportMessage.value = '';
    exportContent.value = await packageStore.exportPackageToString(exportFormat.value);
    showExportDialog.value = true;
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Failed to export package');
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(exportContent.value);
  exportMessage.value = 'Copied to clipboard!';
  setTimeout(() => {
    exportMessage.value = '';
  }, 2000);
}

function updateAuthors(event: Event) {
  if (!currentPackage.value) return;
  const target = event.target as HTMLTextAreaElement;
  currentPackage.value.metadata.authors = target.value
    .split('\n')
    .map(a => a.trim())
    .filter(a => a);
}
</script>

<style scoped>
.editor-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  padding: 1rem;
  overflow-y: auto;
}

.sidebar h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.package-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
}

.package-info h3 {
  margin: 0 0 0.5rem 0;
}

.version {
  color: #666;
  margin: 0;
}

.section {
  margin-bottom: 1.5rem;
}

.section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #666;
}

.namespace-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.namespace-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  text-align: left;
  padding: 0.75rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.namespace-button:hover {
  background: #f8f9fa;
  border-color: #42b983;
}

.namespace-button.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.namespace-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.entity-counts {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.count-badge {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  background: rgba(66, 185, 131, 0.1);
  border: 1px solid rgba(66, 185, 131, 0.3);
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2c3e50;
}

.namespace-button.active .count-badge {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
}

.section button:not(.namespace-button) {
  text-align: left;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.section button:not(.namespace-button):hover {
  background: #e8e8e8;
}

.section button:not(.namespace-button).active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.btn-add {
  margin-top: 0.5rem;
  color: #42b983;
  font-weight: bold;
}

.empty-hint {
  color: #999;
  font-size: 0.9rem;
  padding: 0.5rem;
}

.editor-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.hint {
  color: #666;
  font-style: italic;
  margin-bottom: 1rem;
}

.namespace-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.stat-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-card h3 {
  margin: 0;
  font-size: 2rem;
  color: #42b983;
}

.stat-card p {
  margin: 0.5rem 0 0 0;
  color: #666;
}

.welcome {
  text-align: center;
  padding: 4rem 2rem;
}

.welcome h2 {
  margin-bottom: 1rem;
}

.welcome p {
  color: #666;
}

.entity-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
  overflow-x: auto;
}

.entity-tabs button {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  white-space: nowrap;
  transition: all 0.2s;
}

.entity-tabs button:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.entity-tabs button.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.entity-editor {
  background: white;
  border-radius: 4px;
  padding: 1rem;
  min-height: 400px;
}

.coming-soon {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.coming-soon h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.coming-soon p {
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.btn-primary,
.btn-secondary,
.btn-cancel {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover {
  background: #359268;
}

.btn-primary:disabled {
  background: #9ec9b3;
  cursor: not-allowed;
  opacity: 0.6;
}

.save-message {
  padding: 12px 20px;
  text-align: center;
  font-weight: 500;
  animation: slideDown 0.3s ease-out;
}

.save-message.success {
  background: #d4edda;
  color: #155724;
  border-bottom: 2px solid #28a745;
}

.save-message.error {
  background: #f8d7da;
  color: #721c24;
  border-bottom: 2px solid #dc3545;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-cancel {
  background: #ddd;
  color: #333;
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
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

.modal-overlay .modal {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem 1rem 0.5rem 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
  background: white;
}

.modal-subtitle {
  margin-top: 0;
  color: #666;
  font-size: 0.9rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.hint {
  font-size: 0.85rem;
  color: #666;
  margin: 0.25rem 0 0 0;
}

.required {
  color: #dc3545;
}

.error {
  color: #dc3545;
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
}

.namespace-header {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 1rem;
  background: #f8f9fa;
}

.namespace-actions {
  display: flex;
  gap: 0.5rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  /* Tablet: Stack sidebar above main content */
  .editor-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-width: 100%;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .entity-tabs {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  /* Mobile: Compact layout */
  .editor-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .header-actions button {
    flex: 1;
    min-width: 120px;
  }

  .sidebar {
    padding: 1rem;
  }

  .editor-main {
    padding: 1rem;
  }

  .namespace-list button {
    padding: 0.75rem 1rem;
  }

  .entity-tabs button {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .form-group input,
  .form-group textarea {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  .modal-overlay {
    padding: 0.5rem;
  }

  .modal {
    max-width: 100%;
  }

  /* Increase touch targets */
  button {
    min-height: 44px;
    min-width: 44px;
  }

  .btn-add,
  .btn-delete {
    padding: 0.75rem 1.5rem;
  }
}

@media (max-width: 480px) {
  /* Extra small mobile */
  .editor-header h1 {
    font-size: 1.25rem;
  }

  .header-actions button {
    font-size: 0.85rem;
  }

  .entity-counts {
    font-size: 0.7rem;
  }

  .stat-card h3 {
    font-size: 1.5rem;
  }
}
</style>
