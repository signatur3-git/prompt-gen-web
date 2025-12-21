<template>
  <div class="datatype-editor">
    <header class="editor-header">
      <h2>Datatypes</h2>
      <button
        class="btn-primary"
        @click="addDatatype"
      >
        + Add Datatype
      </button>
    </header>

    <div
      v-if="datatypes.length === 0"
      class="empty-state"
    >
      <p>No datatypes yet. Add your first datatype to get started.</p>
    </div>

    <div
      v-else
      class="datatype-list"
    >
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
    <div
      v-if="editingDatatype"
      class="datatype-details"
    >
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
          >
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
        <p
          v-if="originalId"
          class="hint"
        >
          IDs are immutable while editing. Use Rename for a safe key change.
        </p>
        <p
          v-if="idError"
          class="error"
        >
          {{ idError }}
        </p>
      </div>

      <div class="form-group">
        <label>Name (optional):</label>
        <input
          v-model="editingDatatype.name"
          placeholder="e.g., Character Classes"
          @input="markDirty"
        >
      </div>

      <div class="values-section">
        <div class="section-header">
          <h4>Values <span class="required">*</span></h4>
          <button
            class="btn-sm"
            @click="addValue"
          >
            + Add Value
          </button>
        </div>

        <div
          v-if="!editingDatatype.values || editingDatatype.values.length === 0"
          class="empty-hint"
        >
          No values yet. Add at least one value.
        </div>

        <div
          v-else
          class="values-list"
        >
          <div
            v-for="(value, index) in editingDatatype.values"
            :key="index"
            class="value-item"
          >
            <div class="value-fields">
              <div class="field-group">
                <label>Text: <span class="required">*</span></label>
                <input
                  v-model="value.text"
                  placeholder="e.g., warrior"
                  @input="markDirty"
                >
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
                >
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
                    >
                    <span class="separator">:</span>
                    <input
                      v-model="value.tagsObject[tagKey]!.value"
                      placeholder="value"
                      class="tag-value"
                      @input="markDirty"
                    >
                    <button
                      class="btn-remove-tag"
                      type="button"
                      title="Remove tag"
                      @click="removeTag(index, tagKey)"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    class="btn-add-tag"
                    type="button"
                    @click="addTag(index)"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>

            <button
              class="btn-delete-small"
              title="Delete value"
              @click="deleteValue(index)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div class="button-group">
        <button
          class="btn-primary"
          :disabled="!canSave"
          @click="saveDatatype"
        >
          Save Changes
        </button>
        <button
          class="btn-cancel"
          @click="cancelEdit"
        >
          Cancel
        </button>
      </div>

      <p
        v-if="saveMessage"
        class="success"
      >
        {{ saveMessage }}
      </p>
      <p
        v-if="validationError"
        class="error"
      >
        {{ validationError }}
      </p>
    </div>

    <!-- Rename Modal -->
    <div
      v-if="isRenameModalOpen"
      class="modal-overlay"
      @click.self="closeRenameModal"
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-modal-title"
      >
        <div class="modal-header">
          <h3 id="rename-modal-title">
            Rename Datatype
          </h3>
        </div>

        <div class="modal-body">
          <p class="modal-subtitle">
            Renaming changes the datatype ID (the key used to reference it). This may affect references in the future.
          </p>

          <div class="form-group">
            <label>Current ID</label>
            <input
              :value="renameModalCurrentId"
              disabled
            >
          </div>

          <div class="form-group">
            <label>New ID <span class="required">*</span></label>
            <input
              v-model="renameModalNextId"
              placeholder="e.g., colors_v2"
              @keydown.enter.prevent="applyRename"
            >
            <p
              v-if="renameModalError"
              class="error"
            >
              {{ renameModalError }}
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-cancel"
            @click="closeRenameModal"
          >
            Cancel
          </button>
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
    values: datatype.values?.map(v => {
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

<style scoped>
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
  border-bottom: 1px solid #e0e0e0;
}

.editor-header h2 {
  margin: 0;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #666;
}

.datatype-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
  border-bottom: 1px solid #e0e0e0;
}

.datatype-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.datatype-item:hover {
  background: #e8f4fd;
  border-color: #42b983;
}

.datatype-item.active {
  background: #e8f4fd;
  border-color: #42b983;
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
  color: #2c3e50;
}

.datatype-meta {
  font-size: 0.85rem;
  color: #666;
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
  background: white;
  border-radius: 4px;
  flex: 1;
  overflow-y: auto;
}

.datatype-details h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #42b983;
}

.required {
  color: #e74c3c;
}

.values-section {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  color: #2c3e50;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-sm:hover {
  background: #359268;
}

.empty-hint {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 4px;
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
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
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
  color: #666;
  margin-bottom: 0.25rem;
}

.field-group input {
  padding: 0.4rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
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
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.tag-pair {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-key,
.tag-value {
  padding: 0.4rem;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 0.9rem;
  background: white;
}

.tag-key {
  flex: 0 0 120px;
  font-weight: 600;
}

.tag-value {
  flex: 1;
}

.separator {
  color: #999;
  font-weight: bold;
}

.btn-remove-tag {
  padding: 0.25rem 0.5rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 3px;
  cursor: pointer;
  color: #c33;
  font-size: 0.9rem;
  line-height: 1;
}

.btn-remove-tag:hover {
  background: #fcc;
}

.btn-add-tag {
  padding: 0.4rem 0.8rem;
  background: #e8f4fd;
  border: 1px solid #42b983;
  border-radius: 3px;
  cursor: pointer;
  color: #42b983;
  font-size: 0.85rem;
  font-weight: 600;
  align-self: flex-start;
}

.btn-add-tag:hover {
  background: #d0ebf7;
}

.id-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.hint {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

.btn-secondary {
  padding: 0.5rem 0.75rem;
  background: #ddd;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.btn-secondary:hover {
  background: #ccc;
}

.btn-delete-small {
  padding: 0.5rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  cursor: pointer;
  color: #c33;
  font-size: 1rem;
  line-height: 1;
  align-self: center;
}

.btn-delete-small:hover {
  background: #fcc;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:hover:not(:disabled) {
  background: #359268;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: #ddd;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #ccc;
}

.success {
  color: #27ae60;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border-radius: 4px;
  border-left: 4px solid #27ae60;
}

.error {
  color: #e74c3c;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  background: #fef2f2;
  padding: 0.5rem;
  border-radius: 4px;
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

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
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
</style>
