<template>
  <div class="separatorset-editor">
    <header class="editor-header">
      <h2>Separator Sets</h2>
      <button class="btn-primary" @click="addSeparatorSet">+ Add Separator Set</button>
    </header>

    <div v-if="separatorSets.length === 0" class="empty-state">
      <p>No separator sets yet. Add your first separator set to format lists naturally.</p>
    </div>

    <div v-else class="separatorset-list">
      <div
        v-for="sepSet in separatorSets"
        :key="sepSet.id"
        class="separatorset-item"
        :class="{ active: selectedSeparatorSetId === sepSet.id }"
        @click="selectSeparatorSet(sepSet.id)"
      >
        <div class="separatorset-header">
          <span class="separatorset-name">{{ sepSet.name || sepSet.id }}</span>
          <span class="separatorset-meta">
            {{ sepSet.primary || ',' }} • {{ sepSet.secondary || 'and' }}
          </span>
        </div>
        <button
          class="btn-delete"
          title="Delete separator set"
          @click.stop="deleteSeparatorSet(sepSet.id)"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- Separator Set Editor Panel -->
    <div v-if="editingSeparatorSet" class="separatorset-details">
      <h3>Edit Separator Set</h3>

      <div class="form-group">
        <label>ID: <span class="required">*</span></label>
        <div style="display: flex; gap: 0.5rem; align-items: start">
          <input
            v-model="editingSeparatorSet.id"
            placeholder="e.g., comma_and"
            :readonly="!!originalId"
            :disabled="!!originalId"
            @input="markDirty"
            @blur="validateSeparatorSetId"
          />
          <button
            v-if="originalId"
            type="button"
            class="btn-secondary"
            title="Rename separator set"
            @click="openRenameModal"
          >
            Rename
          </button>
        </div>
        <p v-if="originalId" class="hint">
          IDs are immutable while editing. Use Rename for a safe key change.
        </p>
        <p v-if="idError" class="error">
          {{ idError }}
        </p>
      </div>

      <div class="form-group">
        <label>Name (optional):</label>
        <input
          v-model="editingSeparatorSet.name"
          placeholder="e.g., Comma And"
          @input="markDirty"
        />
      </div>

      <div class="separator-fields">
        <div class="form-group">
          <label>Primary Separator: <span class="required">*</span></label>
          <input v-model="editingSeparatorSet.primary" placeholder='", "' @input="markDirty" />
          <p class="hint">Used between items in lists of 3+ (e.g., ", " for "a, b, c")</p>
        </div>

        <div class="form-group">
          <label>Secondary Separator: <span class="required">*</span></label>
          <input v-model="editingSeparatorSet.secondary" placeholder='" and "' @input="markDirty" />
          <p class="hint">
            Used for exactly 2 items and before last item (e.g., " and " for "a and b" or "a, b and
            c")
          </p>
        </div>

        <div class="form-group">
          <label>Tertiary Separator (optional):</label>
          <input
            v-model="editingSeparatorSet.tertiary"
            placeholder='Optional (e.g., "; ")'
            @input="markDirty"
          />
          <p class="hint">Alternative for complex lists (rarely used)</p>
        </div>
      </div>

      <!-- Preview Section -->
      <div class="preview-section">
        <h4>Preview</h4>
        <div class="preview-examples">
          <div class="preview-item">
            <span class="preview-label">1 item:</span>
            <span class="preview-result">{{ formatPreview(['red']) }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">2 items:</span>
            <span class="preview-result">{{ formatPreview(['red', 'blue']) }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">3 items:</span>
            <span class="preview-result">{{ formatPreview(['red', 'blue', 'green']) }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">4 items:</span>
            <span class="preview-result">{{
              formatPreview(['red', 'blue', 'green', 'yellow'])
            }}</span>
          </div>
        </div>
      </div>

      <div v-if="validationError" class="error-message">
        {{ validationError }}
      </div>

      <div v-if="saveMessage" class="success-message">
        {{ saveMessage }}
      </div>

      <div class="editor-actions">
        <button :disabled="!canSave" class="btn-primary" @click="saveSeparatorSet">
          Save Changes
        </button>
        <button class="btn-secondary" @click="cancelEdit">Cancel</button>
      </div>
    </div>

    <!-- Rename Modal -->
    <div v-if="isRenameModalOpen" class="modal-overlay" @click.self="closeRenameModal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rename-modal-title">
        <div class="modal-header">
          <h3 id="rename-modal-title">Rename Separator Set</h3>
        </div>

        <div class="modal-body">
          <p class="modal-subtitle">
            Renaming changes the separator set ID (the key used to reference it). This may affect
            references.
          </p>

          <div class="form-group">
            <label>Current ID</label>
            <input :value="renameModalCurrentId" disabled />
          </div>

          <div class="form-group">
            <label>New ID <span class="required">*</span></label>
            <input
              v-model="renameModalNextId"
              placeholder="e.g., comma_and_v2"
              @keydown.enter.prevent="applyRename"
              @keydown.escape="closeRenameModal"
            />
            <p v-if="renameModalError" class="error">
              {{ renameModalError }}
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="closeRenameModal">Cancel</button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!canApplyRename"
            @click="applyRename"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SeparatorSet } from '../models/package';

const props = defineProps<{
  namespaceId: string;
  separatorSets: Record<string, SeparatorSet>;
}>();

const emit = defineEmits<{
  update: [separatorSets: Record<string, SeparatorSet>];
  change: [];
}>();

const selectedSeparatorSetId = ref<string | null>(null);
const editingSeparatorSet = ref<(SeparatorSet & { id: string }) | null>(null);
const originalId = ref<string | null>(null);
const isDirty = ref(false);
const idError = ref('');
const validationError = ref('');
const saveMessage = ref('');

const isRenameModalOpen = ref(false);
const renameModalCurrentId = ref<string>('');
const renameModalNextId = ref<string>('');
const renameModalError = ref<string>('');

const separatorSets = computed(() => {
  return Object.entries(props.separatorSets).map(([id, sepSet]) => ({
    ...sepSet,
    id,
  }));
});

const canSave = computed(() => {
  if (!editingSeparatorSet.value) return false;
  if (!editingSeparatorSet.value.id.trim()) return false;
  if (!editingSeparatorSet.value.primary.trim()) return false;
  if (!editingSeparatorSet.value.secondary.trim()) return false;
  if (idError.value) return false;
  return isDirty.value;
});

const canApplyRename = computed(() => {
  if (!isRenameModalOpen.value) return false;
  const nextId = renameModalNextId.value.trim();
  if (!nextId) return false;
  if (!/^[a-z0-9_]+$/.test(nextId)) return false;
  if (nextId === renameModalCurrentId.value) return false;
  if (props.separatorSets[nextId]) return false;
  return true;
});

function selectSeparatorSet(id: string) {
  if (isDirty.value && !confirm('You have unsaved changes. Discard them?')) {
    return;
  }

  selectedSeparatorSetId.value = id;
  const sepSet = props.separatorSets[id];
  if (!sepSet) return;

  editingSeparatorSet.value = {
    id,
    name: sepSet.name,
    primary: sepSet.primary,
    secondary: sepSet.secondary,
    tertiary: sepSet.tertiary,
  };

  originalId.value = id;
  isDirty.value = false;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function addSeparatorSet() {
  if (isDirty.value && !confirm('You have unsaved changes. Discard them?')) {
    return;
  }

  const newId = generateUniqueId('separator');
  selectedSeparatorSetId.value = newId;
  editingSeparatorSet.value = {
    id: newId,
    name: '',
    primary: ', ',
    secondary: ' and ',
    tertiary: undefined,
  };
  originalId.value = null;
  isDirty.value = true;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function deleteSeparatorSet(id: string) {
  if (!confirm(`Delete separator set "${id}"?`)) return;

  const updated = { ...props.separatorSets };
  delete updated[id];

  emit('update', updated);
  emit('change');

  if (selectedSeparatorSetId.value === id) {
    selectedSeparatorSetId.value = null;
    editingSeparatorSet.value = null;
  }
}

function generateUniqueId(prefix: string): string {
  let counter = 1;
  let id = `${prefix}_${counter}`;

  while (props.separatorSets[id]) {
    counter++;
    id = `${prefix}_${counter}`;
  }

  return id;
}

function validateSeparatorSetId() {
  if (!editingSeparatorSet.value) return;

  const id = editingSeparatorSet.value.id.trim();

  if (!id) {
    idError.value = 'ID is required';
    return;
  }

  if (!/^[a-z][a-z0-9_]*$/.test(id)) {
    idError.value =
      'ID must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
    return;
  }

  if (id !== originalId.value && props.separatorSets[id]) {
    idError.value = 'A separator set with this ID already exists';
    return;
  }

  idError.value = '';
}

function markDirty() {
  isDirty.value = true;
  saveMessage.value = '';
}

function formatPreview(items: string[]): string {
  if (!editingSeparatorSet.value) return '';

  const { primary, secondary, tertiary } = editingSeparatorSet.value;

  if (items.length === 0) return '';
  if (items.length === 1) return items[0] ?? '';

  // 2 items: use secondary only
  if (items.length === 2) {
    return `${items[0]}${secondary}${items[1]}`;
  }

  // 3+ items: join all but last with primary, then tertiary (if defined) or secondary before last
  const allButLast = items.slice(0, -1).join(primary);
  const finalSep = tertiary || secondary;
  return `${allButLast}${finalSep}${items[items.length - 1]}`;
}

function saveSeparatorSet() {
  if (!editingSeparatorSet.value) return;

  validateSeparatorSetId();
  if (idError.value) return;

  // Validate that fields have content (but preserve spaces when saving)
  if (!editingSeparatorSet.value.primary || editingSeparatorSet.value.primary.trim() === '') {
    validationError.value = 'Primary separator is required (cannot be empty or only whitespace)';
    return;
  }

  if (!editingSeparatorSet.value.secondary || editingSeparatorSet.value.secondary.trim() === '') {
    validationError.value = 'Secondary separator is required (cannot be empty or only whitespace)';
    return;
  }

  validationError.value = '';

  const sepSet: SeparatorSet = {
    name: (editingSeparatorSet.value.name ?? '').trim() || editingSeparatorSet.value.id,
    // DON'T trim separators - preserve leading/trailing spaces!
    primary: editingSeparatorSet.value.primary,
    secondary: editingSeparatorSet.value.secondary,
    tertiary: editingSeparatorSet.value.tertiary || undefined,
  };

  const updated = { ...props.separatorSets };

  // If ID changed, delete old entry
  if (originalId.value && originalId.value !== editingSeparatorSet.value.id) {
    delete updated[originalId.value];
  }

  updated[editingSeparatorSet.value.id] = sepSet;

  emit('update', updated);
  emit('change');

  originalId.value = editingSeparatorSet.value.id;
  isDirty.value = false;
  saveMessage.value = '✓ Separator set saved successfully!';

  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);
}

function cancelEdit() {
  if (isDirty.value && !confirm('Discard unsaved changes?')) {
    return;
  }

  selectedSeparatorSetId.value = null;
  editingSeparatorSet.value = null;
  isDirty.value = false;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function openRenameModal() {
  if (!originalId.value) return;
  renameModalCurrentId.value = originalId.value;
  renameModalNextId.value = originalId.value;
  renameModalError.value = '';
  isRenameModalOpen.value = true;
}

function closeRenameModal() {
  isRenameModalOpen.value = false;
  renameModalError.value = '';
}

function validateRenameModal(): boolean {
  const currentId = renameModalCurrentId.value;
  const nextId = renameModalNextId.value.trim();

  if (!nextId) {
    renameModalError.value = 'ID is required';
    return false;
  }
  if (!/^[a-z0-9_]+$/.test(nextId)) {
    renameModalError.value = 'ID must contain only lowercase letters, numbers, and underscores';
    return false;
  }
  if (nextId === currentId) {
    renameModalError.value = 'New ID must be different from the current ID';
    return false;
  }
  if (props.separatorSets[nextId]) {
    renameModalError.value = 'A separator set with this ID already exists';
    return false;
  }

  renameModalError.value = '';
  return true;
}

function applyRename() {
  if (!editingSeparatorSet.value) return;
  if (!originalId.value) return;
  if (!validateRenameModal()) return;

  const currentId = originalId.value;
  const nextId = renameModalNextId.value.trim();

  const currentSet = props.separatorSets[currentId];
  if (!currentSet) return;

  const updated = { ...props.separatorSets };
  delete updated[currentId];
  updated[nextId] = currentSet;

  // Update local editor state + selection tracking
  originalId.value = nextId;
  selectedSeparatorSetId.value = nextId;
  editingSeparatorSet.value.id = nextId;

  emit('update', updated);
  emit('change');

  isDirty.value = false;
  saveMessage.value = '✓ Separator set renamed successfully!';
  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);

  closeRenameModal();
}
</script>

<style scoped>
.separatorset-editor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.editor-header h2 {
  margin: 0;
  color: #333;
}

.separatorset-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.separatorset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.separatorset-item:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.separatorset-item.active {
  background: #e3f2fd;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.separatorset-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.separatorset-name {
  font-weight: 600;
  color: #333;
}

.separatorset-meta {
  font-size: 0.875rem;
  color: #666;
  font-family: monospace;
}

.separatorset-details {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.separatorset-details h3 {
  margin: 0;
  color: #333;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  font-family: monospace;
}

.separator-fields {
  display: grid;
  gap: 1rem;
}

.preview-section {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
}

.preview-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.preview-examples {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preview-item {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.preview-label {
  font-weight: 600;
  color: #666;
  min-width: 5rem;
}

.preview-result {
  font-family: monospace;
  color: #333;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  border: 1px solid #dee2e6;
}

.hint {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.required {
  color: #dc3545;
}

.error {
  color: #dc3545;
  margin: 0;
  font-size: 0.875rem;
}

.error-message {
  padding: 0.75rem;
  background: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 4px;
  color: #842029;
}

.success-message {
  padding: 0.75rem;
  background: #d1e7dd;
  border: 1px solid #badbcc;
  border-radius: 4px;
  color: #0f5132;
}

.editor-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.btn-primary,
.btn-secondary,
.btn-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3aa876;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5c636a;
}

.btn-delete {
  background: #dc3545;
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-delete:hover {
  background: #bb2d3b;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
