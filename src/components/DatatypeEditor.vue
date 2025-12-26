<template>
  <div class="datatype-editor">
    <header class="editor-header">
      <h2>Datatypes</h2>
      <button class="btn-primary" @click="addDatatype">+ Add Datatype</button>
    </header>

    <div v-if="datatypes.length === 0" class="empty-state">
      <p>No datatypes yet. Add your first datatype to get started.</p>
    </div>

    <div v-else class="datatype-list">
      <div
        v-for="datatype in datatypes"
        :key="datatype.id"
        class="datatype-item"
        :class="{ active: selectedDatatypeId === datatype.id }"
        @click="selectDatatype(datatype.id)"
      >
        <div class="datatype-header">
          <span class="datatype-name">{{ datatype.name || datatype.id }}</span>
          <span class="datatype-meta">{{ datatype.values?.length || 0 }} values</span>
        </div>
        <button
          class="btn-delete"
          title="Delete datatype"
          @click.stop="deleteDatatype(datatype.id)"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- Datatype Editor Panel -->
    <div v-if="editingDatatype" class="datatype-details">
      <h3>Edit Datatype</h3>

      <div class="form-group">
        <label>ID: <span class="required">*</span></label>
        <div class="id-row">
          <input
            v-model="editingDatatype.id"
            placeholder="e.g., character_class"
            :readonly="!!originalId"
            :disabled="!!originalId"
            @input="markDirty"
            @blur="validateDatatypeId"
          />
          <button
            v-if="originalId"
            type="button"
            class="btn-secondary"
            title="Rename datatype"
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
          v-model="editingDatatype.name"
          placeholder="e.g., Character Classes"
          @input="markDirty"
        />
      </div>

      <div class="values-section">
        <div class="section-header">
          <h4>Values <span class="required">*</span></h4>
          <button class="btn-sm" @click="addValue">+ Add Value</button>
        </div>

        <div
          v-if="!editingDatatype.values || editingDatatype.values.length === 0"
          class="empty-hint"
        >
          No values yet. Add at least one value.
        </div>

        <div v-else class="values-list">
          <div v-for="(value, index) in editingDatatype.values" :key="index" class="value-item">
            <div class="value-fields">
              <div class="field-group">
                <label>Text: <span class="required">*</span></label>
                <input v-model="value.text" placeholder="e.g., warrior" @input="markDirty" />
              </div>

              <div class="field-group field-small">
                <label>Weight:</label>
                <input
                  v-model.number="value.weight"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="1.0"
                  @input="markDirty"
                />
              </div>

              <div class="field-group field-tags">
                <label>Tags:</label>
                <div class="tags-editor">
                  <div
                    v-for="(_tagData, tagKey) in value.tagsObject"
                    :key="tagKey"
                    class="tag-pair"
                  >
                    <input
                      v-model="value.tagsObject[tagKey]!.key"
                      placeholder="key"
                      class="tag-key"
                      @input="markDirty"
                    />
                    <span class="separator">:</span>
                    <input
                      v-model="value.tagsObject[tagKey]!.value"
                      placeholder="value"
                      class="tag-value"
                      @input="markDirty"
                    />
                    <button
                      class="btn-remove-tag"
                      type="button"
                      title="Remove tag"
                      @click="removeTag(index, tagKey)"
                    >
                      ✕
                    </button>
                  </div>
                  <button class="btn-add-tag" type="button" @click="addTag(index)">
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>

            <button class="btn-delete-small" title="Delete value" @click="deleteValue(index)">
              ✕
            </button>
          </div>
        </div>
      </div>

      <div class="button-group">
        <button class="btn-primary" :disabled="!canSave" @click="saveDatatype">Save Changes</button>
        <button class="btn-cancel" @click="cancelEdit">Cancel</button>
      </div>

      <p v-if="saveMessage" class="success">
        {{ saveMessage }}
      </p>
      <p v-if="validationError" class="error">
        {{ validationError }}
      </p>
    </div>

    <!-- Rename Modal -->
    <div v-if="isRenameModalOpen" class="modal-overlay" @click.self="closeRenameModal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rename-modal-title">
        <div class="modal-header">
          <h3 id="rename-modal-title">Rename Datatype</h3>
        </div>

        <div class="modal-body">
          <p class="modal-subtitle">
            Renaming changes the datatype ID (the key used to reference it). This may affect
            references in the future.
          </p>

          <div class="form-group">
            <label>Current ID</label>
            <input :value="renameModalCurrentId" disabled />
          </div>

          <div class="form-group">
            <label>New ID <span class="required">*</span></label>
            <input
              v-model="renameModalNextId"
              placeholder="e.g., colors_v2"
              @keydown.enter.prevent="applyRename"
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
import { ref, computed, nextTick } from 'vue';
import type { Datatype, DatatypeValue } from '../models/package';

// Extended type for editing with tagsObject for UI binding
interface EditingDatatypeValue {
  text: string;
  weight: number;
  tagsObject: Record<string, { key: string; value: any }>;
}

interface EditingDatatype {
  id: string;
  name: string;
  values: EditingDatatypeValue[];
}

const props = defineProps<{
  namespaceId: string;
  datatypes: Record<string, Datatype>;
}>();

const emit = defineEmits<{
  update: [datatypes: Record<string, Datatype>];
  change: [];
}>();

const selectedDatatypeId = ref<string | null>(null);
const editingDatatype = ref<EditingDatatype | null>(null);
const originalId = ref<string | null>(null);
const isDirty = ref(false);
const isLoading = ref(false); // Prevent concurrent loads
const idError = ref('');
const validationError = ref('');
const saveMessage = ref('');

const datatypes = computed(() => {
  return Object.entries(props.datatypes).map(([id, datatype]) => ({
    ...datatype,
    id,
  }));
});

const canSave = computed(() => {
  if (!editingDatatype.value) return false;
  if (!editingDatatype.value.id.trim()) return false;
  if (!editingDatatype.value.values || editingDatatype.value.values.length === 0) return false;
  if (editingDatatype.value.values.some(v => !v.text.trim())) return false;
  if (idError.value) return false;
  return isDirty.value;
});

const isRenameModalOpen = ref(false);
const renameModalCurrentId = ref<string>('');
const renameModalNextId = ref<string>('');
const renameModalError = ref<string>('');

const canApplyRename = computed(() => {
  if (!isRenameModalOpen.value) return false;
  const nextId = renameModalNextId.value.trim();
  if (!nextId) return false;
  if (!/^[a-z0-9_]+$/.test(nextId)) return false;
  if (nextId === renameModalCurrentId.value) return false;
  if (props.datatypes[nextId]) return false;
  return true;
});

async function selectDatatype(id: string) {
  // Prevent concurrent loads
  if (isLoading.value) {
    return;
  }

  if (selectedDatatypeId.value === id || originalId.value === id) {
    return;
  }

  if (isDirty.value) {
    // Check for unsaved changes if switching to different datatype
    if (!confirm('You have unsaved changes. Discard them?')) {
      console.log('  → CANCELLED by user');
      return;
    }
    console.log('  → CONFIRMED by user');
  }

  // Set immediately to avoid races with rapid clicking/tests
  selectedDatatypeId.value = id;

  // Load the datatype
  console.log('  → CALLING loadDatatype');
  await loadDatatype(id);
}

async function loadDatatype(id: string) {
  isLoading.value = true;
  console.log('=== loadDatatype START ===');
  console.log('  ID:', id);
  console.log('  editingDatatype BEFORE:', editingDatatype.value?.id);

  // selectedDatatypeId is set by selectDatatype
  const datatype = props.datatypes[id];

  if (!datatype) {
    console.error('Datatype not found:', id);
    isLoading.value = false;
    return;
  }

  console.log('  Found datatype:', !!datatype);
  console.log('  Values count:', datatype?.values?.length || 0);

  // Build the editing datatype object
  const newEditingDatatype: EditingDatatype = {
    id,
    name: datatype.name,
    values:
      datatype.values?.map(v => {
        // Convert tags object to editable format
        const tagsObject: Record<string, { key: string; value: any }> = {};

        if (v.tags && typeof v.tags === 'object' && !Array.isArray(v.tags)) {
          let index = 0;
          for (const [key, value] of Object.entries(v.tags)) {
            tagsObject[index.toString()] = { key, value };
            index++;
          }
        }

        return {
          text: v.text,
          weight: v.weight || 1.0,
          tagsObject,
        };
      }) || [],
  };

  // Set it
  editingDatatype.value = newEditingDatatype;

  console.log('  editingDatatype AFTER:', editingDatatype.value?.id);
  console.log('  editingDatatype ref:', !!editingDatatype.value);
  console.log('  Values mapped:', editingDatatype.value.values.length);

  originalId.value = id;
  isDirty.value = false;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';

  // Force Vue to process updates
  await nextTick();

  isLoading.value = false;

  console.log('=== loadDatatype END ===');
  console.log('  editingDatatype after nextTick:', !!editingDatatype.value);
}

function addDatatype() {
  if (isDirty.value && !confirm('You have unsaved changes. Discard them?')) {
    return;
  }

  const newId = generateUniqueId('new_datatype');
  selectedDatatypeId.value = newId;
  editingDatatype.value = {
    id: newId,
    name: '',
    values: [],
  };
  originalId.value = null;
  isDirty.value = true;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function addValue() {
  if (!editingDatatype.value) return;

  editingDatatype.value.values.push({
    text: '',
    weight: 1.0,
    tagsObject: {},
  });
  isDirty.value = true;
}

function addTag(valueIndex: number) {
  if (!editingDatatype.value?.values[valueIndex]) return;

  const value = editingDatatype.value.values[valueIndex];
  if (!value.tagsObject) {
    value.tagsObject = {};
  }

  // Find next available index
  const indexes = Object.keys(value.tagsObject).map(k => parseInt(k));
  const nextIndex = indexes.length > 0 ? Math.max(...indexes) + 1 : 0;

  value.tagsObject[nextIndex.toString()] = { key: '', value: '' };
  isDirty.value = true;
}

function removeTag(valueIndex: number, tagKey: string) {
  if (!editingDatatype.value?.values[valueIndex]) return;

  delete editingDatatype.value.values[valueIndex].tagsObject[tagKey];
  isDirty.value = true;
}

function deleteValue(index: number) {
  if (!editingDatatype.value?.values) return;
  if (!confirm('Delete this value?')) return;

  editingDatatype.value.values.splice(index, 1);
  isDirty.value = true;
}

function deleteDatatype(id: string) {
  if (!confirm(`Delete datatype "${id}"? This cannot be undone.`)) return;

  const updated = { ...props.datatypes };
  delete updated[id];
  emit('update', updated);
  emit('change');

  if (selectedDatatypeId.value === id) {
    selectedDatatypeId.value = null;
    editingDatatype.value = null;
  }
}

function validateDatatypeId() {
  if (!editingDatatype.value) return;

  const id = editingDatatype.value.id.trim();

  if (!id) {
    idError.value = 'ID is required';
    return;
  }

  if (!/^[a-z0-9_]+$/.test(id)) {
    idError.value = 'ID must contain only lowercase letters, numbers, and underscores';
    return;
  }

  // Check for duplicates (excluding current if editing existing)
  if (id !== originalId.value && props.datatypes[id]) {
    idError.value = 'A datatype with this ID already exists';
    return;
  }

  idError.value = '';
}

function markDirty() {
  isDirty.value = true;
  saveMessage.value = '';
}

function saveDatatype() {
  if (!editingDatatype.value) return;

  validateDatatypeId();
  if (idError.value) return;

  // Validate values
  if (!editingDatatype.value.values || editingDatatype.value.values.length === 0) {
    validationError.value = 'At least one value is required';
    return;
  }

  if (editingDatatype.value.values.some(v => !v.text.trim())) {
    validationError.value = 'All values must have text';
    return;
  }

  validationError.value = '';

  // Convert editing format back to package format
  const values: DatatypeValue[] = editingDatatype.value.values.map(v => {
    const tags: Record<string, unknown> = {};

    for (const tagData of Object.values(v.tagsObject ?? {})) {
      if (!tagData) continue;
      const key = typeof tagData.key === 'string' ? tagData.key.trim() : '';
      if (key) tags[key] = tagData.value;
    }

    return {
      text: v.text.trim(),
      weight: v.weight,
      tags,
    };
  });

  const datatype: Datatype = {
    // Datatype.name is required in the model
    name: (editingDatatype.value.name ?? '').trim() || editingDatatype.value.id,
    values,
  };

  const updated = { ...props.datatypes };

  // If ID changed, delete old entry
  if (originalId.value && originalId.value !== editingDatatype.value.id) {
    delete updated[originalId.value];
  }

  updated[editingDatatype.value.id] = datatype;

  emit('update', updated);
  emit('change');

  originalId.value = editingDatatype.value.id;
  isDirty.value = false;
  saveMessage.value = 'Datatype saved successfully!';

  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);
}

function cancelEdit() {
  if (isDirty.value && !confirm('Discard unsaved changes?')) {
    return;
  }

  selectedDatatypeId.value = null;
  editingDatatype.value = null;
  originalId.value = null;
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
  if (props.datatypes[nextId]) {
    renameModalError.value = 'A datatype with this ID already exists';
    return false;
  }

  renameModalError.value = '';
  return true;
}

function applyRename() {
  if (!editingDatatype.value) return;
  if (!originalId.value) return;
  if (!validateRenameModal()) return;

  const currentId = originalId.value;
  const nextId = renameModalNextId.value.trim();

  const currentDatatype = props.datatypes[currentId];
  if (!currentDatatype) return;

  const updated = { ...props.datatypes };
  delete updated[currentId];
  updated[nextId] = currentDatatype;

  // Update local editor state + selection tracking
  originalId.value = nextId;
  selectedDatatypeId.value = nextId;
  editingDatatype.value.id = nextId;

  emit('update', updated);
  emit('change');

  isDirty.value = false;
  saveMessage.value = 'Datatype renamed successfully!';
  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);

  closeRenameModal();
}

function generateUniqueId(base: string): string {
  let counter = 1;
  let id = base;
  while (props.datatypes[id]) {
    id = `${base}_${counter}`;
    counter++;
  }
  return id;
}
</script>

<style>
.datatype-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.editor-header h2 {
  margin: 0;
  color: var(--color-text-primary);
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.datatype-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
  border-bottom: 1px solid var(--color-border);
}

.datatype-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.datatype-item:hover {
  background: var(--color-primary-light);
  border-color: var(--color-success);
}

.datatype-item.active {
  background: var(--color-primary-light);
  border-color: var(--color-success);
  border-width: 2px;
}

.datatype-header {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.datatype-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.datatype-meta {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.btn-delete {
  padding: 0.25rem 0.5rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  cursor: pointer;
  color: #c33;
  font-size: 0.9rem;
}

.btn-delete:hover {
  background: #fcc;
}

.datatype-details {
  padding: 1rem;
  background: var(--color-surface);
  border-radius: 4px;
  flex: 1;
  overflow-y: auto;
  color: var(--color-text-primary);
}

.datatype-details h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Keep spacing/typography only; global form-control baseline sets colors/borders */
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group input::placeholder {
  color: var(--control-placeholder);
}

.values-section {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  color: var(--color-text-primary);
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-sm:hover {
  background: var(--color-success-hover);
}

.empty-hint {
  color: var(--color-text-secondary);
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
}

.values-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.value-item {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.value-fields {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: end;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.field-group input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.field-group input::placeholder {
  color: var(--control-placeholder);
}

/* Ensure tag editor uses same padding and width */
.tag-key,
.tag-value {
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
}

.field-small {
  max-width: 100px;
}

.field-tags {
  flex: 1;
  min-width: 0;
}

.tags-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.tag-pair {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-key,
.tag-value {
  padding: 0.5rem;
  border-radius: 6px;
}

/* ...existing styles... */

.btn-remove-tag {
  padding: 0.25rem 0.5rem;
  background: var(--color-danger);
  border: none;
  border-radius: 3px;
  cursor: pointer;
  color: white;
  font-size: 0.9rem;
  line-height: 1;
}

.btn-remove-tag:hover {
  background: var(--color-danger-hover);
}

.btn-add-tag {
  padding: 0.4rem 0.8rem;
  background: var(--color-primary-light);
  border: 1px solid var(--color-success);
  border-radius: 3px;
  cursor: pointer;
  color: var(--color-success);
  font-size: 0.85rem;
  font-weight: 600;
  align-self: flex-start;
}

.btn-add-tag:hover {
  background: var(--color-surface-hover);
}

.id-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.btn-secondary {
  padding: 0.5rem 0.75rem;
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.btn-secondary:hover {
  background: var(--color-success-hover);
}

.button-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--color-danger-hover);
}

.btn-delete {
  padding: 0.25rem 0.5rem;
  background: var(--color-danger);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  font-size: 0.9rem;
}

.btn-delete:hover {
  background: var(--color-danger-hover);
}

.btn-delete-small {
  padding: 0.5rem;
  background: var(--color-danger);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  font-size: 1rem;
  line-height: 1;
  align-self: center;
}

.btn-delete-small:hover {
  background: var(--color-danger-hover);
}

.success {
  color: var(--color-success);
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--color-primary-light);
  border-radius: 4px;
  border-left: 4px solid var(--color-success);
}

.error {
  color: var(--color-danger);
  margin-top: 0.5rem;
  font-size: 0.9rem;
  background: var(--color-surface-hover);
  padding: 0.5rem;
  border-radius: 4px;
}

.required {
  color: var(--color-danger);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-surface);
  border-radius: 8px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.modal-body {
  padding: 1rem;
}

.modal-subtitle {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-success-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
