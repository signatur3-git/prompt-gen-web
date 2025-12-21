<template>
  <div class="promptsection-editor">
    <header class="editor-header">
      <h2>Prompt Sections</h2>
      <button
        class="btn-primary"
        @click="addPromptSection"
      >
        + Add Prompt Section
      </button>
    </header>

    <div
      v-if="promptSections.length === 0"
      class="empty-state"
    >
      <p>No prompt sections yet. Add your first prompt section to get started.</p>
    </div>

    <div
      v-else
      class="promptsection-list"
    >
      <div
        v-for="section in promptSections"
        :key="section.id"
        class="promptsection-item"
        :class="{ active: selectedPromptSectionId === section.id }"
        @click="selectPromptSection(section.id)"
      >
        <div class="promptsection-header">
          <span class="promptsection-name">{{ section.name || section.id }}</span>
          <span class="promptsection-meta">
            {{ Object.keys(section.references || {}).length }} reference(s)
          </span>
        </div>
        <button
          class="btn-delete"
          title="Delete prompt section"
          @click.stop="deletePromptSection(section.id)"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- Prompt Section Editor Panel -->
    <div
      v-if="editingPromptSection"
      class="promptsection-details"
    >
      <h3>Edit Prompt Section</h3>

      <div class="form-group">
        <label>ID: <span class="required">*</span></label>
        <div style="display: flex; gap: 0.5rem; align-items: start;">
          <input
            v-model="editingPromptSection.id"
            placeholder="e.g., character_description"
            :readonly="!!originalId"
            :disabled="!!originalId"
            @input="markDirty"
            @blur="validatePromptSectionId"
          >
          <button
            v-if="originalId"
            type="button"
            class="btn-secondary"
            title="Rename prompt section"
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
          v-model="editingPromptSection.name"
          placeholder="e.g., Character Description"
          @input="markDirty"
        >
      </div>

      <div class="form-group">
        <label>Template: <span class="required">*</span></label>
        <textarea
          v-model="editingPromptSection.template"
          placeholder="e.g., A {character} wearing {clothing} in {location}"
          rows="6"
          class="template-editor"
          @input="markDirty"
        />
        <p class="hint">
          Use {reference_name} to insert references
        </p>
      </div>

      <div class="references-section">
        <h4>References</h4>

        <div
          v-if="!editingPromptSection.references || Object.keys(editingPromptSection.references).length === 0"
          class="empty-state-small"
        >
          <p>No references yet. Add references that appear in your template.</p>
        </div>

        <div
          v-else
          class="references-list"
        >
          <div
            v-for="(refData, refName) in editingPromptSection.references"
            :key="refName"
            class="reference-item"
          >
            <div class="reference-fields">
              <div class="field-group field-small">
                <label>Name: <span class="required">*</span></label>
                <input
                  :value="refName"
                  placeholder="e.g., character"
                  @input="updateReferenceName(refName, ($event.target as HTMLInputElement).value)"
                >
              </div>

              <div class="field-group">
                <label>Target: <span class="required">*</span></label>
                <input
                  v-model="refData.target"
                  placeholder="e.g., character_class or core:weapon"
                  @input="markDirty"
                >
                <p class="hint">
                  Format: datatype_id or namespace:datatype_id
                </p>
              </div>

              <div class="field-group field-small">
                <label>Min:</label>
                <input
                  v-model.number="refData.min"
                  type="number"
                  min="0"
                  placeholder="0"
                  @input="markDirty"
                >
              </div>

              <div class="field-group field-small">
                <label>Max:</label>
                <input
                  v-model.number="refData.max"
                  type="number"
                  min="1"
                  placeholder="1"
                  @input="markDirty"
                >
              </div>

              <div class="field-group">
                <label>Filter:</label>
                <input
                  v-model="refData.filter"
                  placeholder="e.g., phonetic:vowel"
                  @input="markDirty"
                >
                <p class="hint">
                  Optional tag filter
                </p>
              </div>

              <div class="field-group field-small">
                <label>Separator:</label>
                <input
                  v-model="refData.separator"
                  placeholder="e.g., comma"
                  @input="markDirty"
                >
              </div>

              <div class="field-group field-small">
                <label>
                  <input
                    v-model="refData.unique"
                    type="checkbox"
                    @change="markDirty"
                  >
                  Unique
                </label>
              </div>
            </div>

            <button
              class="btn-remove"
              title="Remove reference"
              @click="removeReference(refName)"
            >
              ✕ Remove
            </button>
          </div>
        </div>

        <button
          class="btn-secondary"
          @click="addReference"
        >
          + Add Reference
        </button>
      </div>

      <div
        v-if="validationError"
        class="error-message"
      >
        {{ validationError }}
      </div>

      <div
        v-if="saveMessage"
        class="success-message"
      >
        {{ saveMessage }}
      </div>

      <div class="editor-actions">
        <button
          :disabled="!canSave"
          class="btn-primary"
          @click="savePromptSection"
        >
          Save Changes
        </button>
        <button
          class="btn-secondary"
          @click="cancelEdit"
        >
          Cancel
        </button>
      </div>
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
            Rename Prompt Section
          </h3>
        </div>

        <div class="modal-body">
          <p class="modal-subtitle">
            Renaming changes the prompt section ID (the key used to reference it). This may affect references.
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
              placeholder="e.g., character_description_v2"
              @keydown.enter.prevent="applyRename"
              @keydown.escape="closeRenameModal"
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
import { ref, computed } from 'vue';
import type { PromptSection } from '../models/package';

const props = defineProps<{
  namespaceId: string;
  promptSections: Record<string, PromptSection>;
}>();

const emit = defineEmits<{
  update: [promptSections: Record<string, PromptSection>];
  change: [];
}>();

const selectedPromptSectionId = ref<string | null>(null);
const editingPromptSection = ref<PromptSection & { id: string } | null>(null);
const originalId = ref<string | null>(null);
const isDirty = ref(false);
const idError = ref('');
const validationError = ref('');
const saveMessage = ref('');

const isRenameModalOpen = ref(false);
const renameModalCurrentId = ref<string>('');
const renameModalNextId = ref<string>('');
const renameModalError = ref<string>('');

const promptSections = computed(() => {
  return Object.entries(props.promptSections).map(([id, section]) => ({
    ...section,
    id,
  }));
});

const canSave = computed(() => {
  if (!editingPromptSection.value) return false;
  if (!editingPromptSection.value.id.trim()) return false;
  if (!editingPromptSection.value.template.trim()) return false;
  if (idError.value) return false;
  return isDirty.value;
});

const canApplyRename = computed(() => {
  if (!isRenameModalOpen.value) return false;
  const nextId = renameModalNextId.value.trim();
  if (!nextId) return false;
  if (!/^[a-z0-9_]+$/.test(nextId)) return false;
  if (nextId === renameModalCurrentId.value) return false;
  if (props.promptSections[nextId]) return false;
  return true;
});

function selectPromptSection(id: string) {
  if (isDirty.value && !confirm('You have unsaved changes. Discard them?')) {
    return;
  }

  selectedPromptSectionId.value = id;
  const section = props.promptSections[id];
  if (!section) return;

  editingPromptSection.value = {
    id,
    name: section.name,
    template: section.template,
    references: { ...section.references },
  };

  originalId.value = id;
  isDirty.value = false;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function addPromptSection() {
  if (isDirty.value && !confirm('You have unsaved changes. Discard them?')) {
    return;
  }

  const newId = generateUniqueId('new_prompt');
  selectedPromptSectionId.value = newId;
  editingPromptSection.value = {
    id: newId,
    name: '',
    template: '',
    references: {},
  };
  originalId.value = null;
  isDirty.value = true;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function addReference() {
  if (!editingPromptSection.value) return;

  const newRefName = generateUniqueId('ref');

  if (!editingPromptSection.value.references) {
    editingPromptSection.value.references = {};
  }

  editingPromptSection.value.references[newRefName] = {
    target: '',
    min: 1,
    max: 1,
  };

  isDirty.value = true;
}

function removeReference(refName: string) {
  if (!editingPromptSection.value?.references) return;

  delete editingPromptSection.value.references[refName];
  isDirty.value = true;
}

function updateReferenceName(oldName: string, newName: string) {
  if (!editingPromptSection.value?.references || oldName === newName) return;

  const refValue = editingPromptSection.value.references[oldName];
  if (!refValue) return;

  delete editingPromptSection.value.references[oldName];
  editingPromptSection.value.references[newName] = refValue;

  isDirty.value = true;
}

function deletePromptSection(id: string) {
  if (!confirm(`Delete prompt section "${id}"?`)) return;

  const updated = { ...props.promptSections };
  delete updated[id];

  emit('update', updated);
  emit('change');

  if (selectedPromptSectionId.value === id) {
    selectedPromptSectionId.value = null;
    editingPromptSection.value = null;
  }
}

function generateUniqueId(prefix: string): string {
  let counter = 1;
  let id = `${prefix}_${counter}`;

  while (props.promptSections[id]) {
    counter++;
    id = `${prefix}_${counter}`;
  }

  return id;
}

function validatePromptSectionId() {
  if (!editingPromptSection.value) return;

  const id = editingPromptSection.value.id.trim();

  if (!id) {
    idError.value = 'ID is required';
    return;
  }

  if (!/^[a-z][a-z0-9_]*$/.test(id)) {
    idError.value = 'ID must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
    return;
  }

  // Check for duplicates (excluding current if editing existing)
  if (id !== originalId.value && props.promptSections[id]) {
    idError.value = 'A prompt section with this ID already exists';
    return;
  }

  idError.value = '';
}

function markDirty() {
  isDirty.value = true;
  saveMessage.value = '';
}

function savePromptSection() {
  if (!editingPromptSection.value) return;

  validatePromptSectionId();
  if (idError.value) return;

  // Validate template
  if (!editingPromptSection.value.template.trim()) {
    validationError.value = 'Template is required';
    return;
  }

  // Validate references
  if (editingPromptSection.value.references) {
    for (const [refName, ref] of Object.entries(editingPromptSection.value.references)) {
      if (!refName.trim()) {
        validationError.value = 'All references must have a name';
        return;
      }
      if (!ref.target.trim()) {
        validationError.value = `Reference "${refName}" must have a target`;
        return;
      }
    }
  }

  validationError.value = '';

  const section: PromptSection = {
    name: (editingPromptSection.value.name ?? '').trim() || editingPromptSection.value.id,
    template: editingPromptSection.value.template.trim(),
    references: editingPromptSection.value.references || {},
  };

  const updated = { ...props.promptSections };

  // If ID changed, delete old entry
  if (originalId.value && originalId.value !== editingPromptSection.value.id) {
    delete updated[originalId.value];
  }

  updated[editingPromptSection.value.id] = section;

  emit('update', updated);
  emit('change');

  originalId.value = editingPromptSection.value.id;
  isDirty.value = false;
  saveMessage.value = '✓ Prompt section saved successfully!';

  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);
}

function cancelEdit() {
  if (isDirty.value && !confirm('Discard unsaved changes?')) {
    return;
  }

  selectedPromptSectionId.value = null;
  editingPromptSection.value = null;
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
  if (props.promptSections[nextId]) {
    renameModalError.value = 'A prompt section with this ID already exists';
    return false;
  }

  renameModalError.value = '';
  return true;
}

function applyRename() {
  if (!editingPromptSection.value) return;
  if (!originalId.value) return;
  if (!validateRenameModal()) return;

  const currentId = originalId.value;
  const nextId = renameModalNextId.value.trim();

  const currentSection = props.promptSections[currentId];
  if (!currentSection) return;

  const updated = { ...props.promptSections };
  delete updated[currentId];
  updated[nextId] = currentSection;

  // Update local editor state + selection tracking
  originalId.value = nextId;
  selectedPromptSectionId.value = nextId;
  editingPromptSection.value.id = nextId;

  emit('update', updated);
  emit('change');

  isDirty.value = false;
  saveMessage.value = '✓ Prompt section renamed successfully!';
  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);

  closeRenameModal();
}
</script>

<style scoped>
.promptsection-editor {
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

.promptsection-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.promptsection-item {
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

.promptsection-item:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.promptsection-item.active {
  background: #e3f2fd;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.promptsection-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.promptsection-name {
  font-weight: 600;
  color: #333;
}

.promptsection-meta {
  font-size: 0.875rem;
  color: #666;
}

.promptsection-details {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.promptsection-details h3 {
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

.form-group input,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.template-editor {
  font-family: 'Courier New', monospace;
  resize: vertical;
}

.references-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.references-section h4 {
  margin: 0;
  color: #333;
}

.references-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reference-item {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reference-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.field-small {
  grid-column: span 1;
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
.btn-delete,
.btn-remove {
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

.btn-remove {
  background: #dc3545;
  color: white;
  align-self: flex-start;
}

.btn-remove:hover {
  background: #bb2d3b;
}

.empty-state,
.empty-state-small {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state-small {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}
</style>

