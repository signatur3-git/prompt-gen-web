<template>
  <div class="rulebook-editor">
    <header class="editor-header">
      <h2>Rulebooks</h2>
      <button class="btn-primary" @click="addRulebook">+ Add Rulebook</button>
    </header>

    <div v-if="rulebooks.length === 0" class="empty-state">
      <p>No rulebooks yet. Add a rulebook to define entry points for prompt generation.</p>
      <p class="hint-text">
        Rulebooks allow weighted selection from multiple prompt sections for batch variety.
      </p>
    </div>

    <div v-else class="rulebook-list">
      <div
        v-for="rulebook in rulebooks"
        :key="rulebook.id"
        class="rulebook-item"
        :class="{ active: selectedRulebookId === rulebook.id }"
        @click="selectRulebook(rulebook.id)"
      >
        <div class="rulebook-header">
          <span class="rulebook-name">{{ rulebook.name || rulebook.id }}</span>
          <span class="rulebook-meta"> {{ rulebook.entry_points.length }} entry point(s) </span>
        </div>
        <button
          class="btn-delete"
          title="Delete rulebook"
          @click.stop="deleteRulebook(rulebook.id)"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- Rulebook Editor Panel -->
    <div v-if="editingRulebook" class="rulebook-details">
      <h3>Edit Rulebook</h3>

      <div class="form-group">
        <label>ID: <span class="required">*</span></label>
        <div style="display: flex; gap: 0.5rem; align-items: start">
          <input
            v-model="editingRulebook.id"
            placeholder="e.g., fantasy_scenes"
            :readonly="!!originalId"
            :disabled="!!originalId"
            @input="markDirty"
            @blur="validateRulebookId"
          />
          <button
            v-if="originalId"
            type="button"
            class="btn-secondary"
            title="Rename rulebook"
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
        <label>Name: <span class="required">*</span></label>
        <input
          v-model="editingRulebook.name"
          placeholder="e.g., Fantasy Scenes"
          @input="markDirty"
        />
        <p class="hint">Display name for this rulebook</p>
      </div>

      <div class="entry-points-section">
        <h4>Entry Points</h4>
        <p class="hint">
          Define which prompt sections can be used as starting points, with optional weights for
          selection probability.
        </p>

        <div
          v-if="!editingRulebook.entry_points || editingRulebook.entry_points.length === 0"
          class="empty-state-small"
        >
          <p>No entry points yet. Add at least one entry point.</p>
        </div>

        <div v-else class="entry-points-list">
          <div
            v-for="(entryPoint, index) in editingRulebook.entry_points"
            :key="index"
            class="entry-point-item"
          >
            <div class="entry-point-fields">
              <div class="field-group">
                <label>Target Prompt Section: <span class="required">*</span></label>
                <input
                  v-model="entryPoint.target"
                  placeholder="e.g., namespace:promptsection or promptsection_id"
                  @input="markDirty"
                />
                <p class="hint">
                  Reference to a prompt section (namespace:name or just name for same namespace)
                </p>
              </div>

              <div class="field-group field-small">
                <label>Weight:</label>
                <input
                  v-model.number="entryPoint.weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="1.0"
                  @input="markDirty"
                />
                <p class="hint">Selection probability (higher = more likely)</p>
              </div>
            </div>

            <button class="btn-remove" title="Remove entry point" @click="removeEntryPoint(index)">
              ✕ Remove
            </button>
          </div>
        </div>

        <button class="btn-secondary" @click="addEntryPoint">+ Add Entry Point</button>
      </div>

      <!-- Context Initialization (Optional) -->
      <div class="context-section">
        <h4>Context Defaults (Optional)</h4>
        <p class="hint">Initialize context values before rendering. Format: key = value</p>

        <div v-if="contextEntries.length === 0" class="empty-state-small">
          <p>No context defaults. Add context values if needed.</p>
        </div>

        <div v-else class="context-list">
          <div v-for="(entry, index) in contextEntries" :key="index" class="context-item">
            <input
              v-model="entry.key"
              placeholder="context key (e.g., style)"
              class="context-key"
              @input="markDirty"
            />
            <span class="context-equals">=</span>
            <input
              v-model="entry.value"
              placeholder="value"
              class="context-value"
              @input="markDirty"
            />
            <button class="btn-remove-small" title="Remove" @click="removeContextEntry(index)">
              ✕
            </button>
          </div>
        </div>

        <button class="btn-secondary btn-small" @click="addContextEntry">
          + Add Context Default
        </button>
      </div>

      <!-- Example Section -->
      <div class="example-section">
        <h4>💡 Example: Fantasy Scene Generator</h4>
        <div class="example-content">
          <div class="example-code">
            <div class="code-line"><strong>ID:</strong> fantasy_scenes</div>
            <div class="code-line"><strong>Name:</strong> Fantasy Scenes</div>
            <div class="code-line">
              <strong>Entry Points:</strong>
            </div>
            <div class="code-line indent">• forest_scene (weight: 2.0) - 50% chance</div>
            <div class="code-line indent">• dungeon_scene (weight: 1.0) - 25% chance</div>
            <div class="code-line indent">• tavern_scene (weight: 1.0) - 25% chance</div>
          </div>
          <p class="example-result">
            <strong>Result:</strong> Batch generation randomly selects from these prompt sections
            based on weights, providing variety in generated prompts.
          </p>
        </div>
      </div>

      <div v-if="validationError" class="error-message">
        {{ validationError }}
      </div>

      <div v-if="saveMessage" class="success-message">
        {{ saveMessage }}
      </div>

      <div class="editor-actions">
        <button :disabled="!canSave" class="btn-primary" @click="saveRulebook">Save Changes</button>
        <button class="btn-secondary" @click="cancelEdit">Cancel</button>
      </div>
    </div>

    <!-- Rename Modal -->
    <div v-if="isRenameModalOpen" class="modal-overlay" @click.self="closeRenameModal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rename-modal-title">
        <div class="modal-header">
          <h3 id="rename-modal-title">Rename Rulebook</h3>
        </div>

        <div class="modal-body">
          <p class="modal-subtitle">
            Renaming changes the rulebook ID (the key used to reference it). This may affect
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
              placeholder="e.g., fantasy_scenes_v2"
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
import type { Rulebook } from '../models/package';

const props = defineProps<{
  namespaceId: string;
  rulebooks: Record<string, Rulebook>;
}>();

const emit = defineEmits<{
  update: [rulebooks: Record<string, Rulebook>];
  change: [];
}>();

interface ContextEntry {
  key: string;
  value: string;
}

const selectedRulebookId = ref<string | null>(null);
const editingRulebook = ref<(Rulebook & { id: string }) | null>(null);
const contextEntries = ref<ContextEntry[]>([]);
const originalId = ref<string | null>(null);
const isDirty = ref(false);
const idError = ref('');
const validationError = ref('');
const saveMessage = ref('');

const isRenameModalOpen = ref(false);
const renameModalCurrentId = ref<string>('');
const renameModalNextId = ref<string>('');
const renameModalError = ref<string>('');

const rulebooks = computed(() => {
  return Object.entries(props.rulebooks).map(([id, rulebook]) => ({
    ...rulebook,
    id,
  }));
});

const canSave = computed(() => {
  if (!editingRulebook.value) return false;
  if (!editingRulebook.value.id.trim()) return false;
  if (!editingRulebook.value.name.trim()) return false;
  if (!editingRulebook.value.entry_points || editingRulebook.value.entry_points.length === 0)
    return false;
  if (idError.value) return false;
  return isDirty.value;
});

const canApplyRename = computed(() => {
  if (!isRenameModalOpen.value) return false;
  const nextId = renameModalNextId.value.trim();
  if (!nextId) return false;
  if (!/^[a-z0-9_]+$/.test(nextId)) return false;
  if (nextId === renameModalCurrentId.value) return false;
  return !props.rulebooks[nextId];
});

function selectRulebook(id: string) {
  if (isDirty.value && !confirm('You have unsaved changes. Discard them?')) return;

  selectedRulebookId.value = id;
  const rulebook = props.rulebooks[id];
  if (!rulebook) return;

  editingRulebook.value = {
    id,
    name: rulebook.name,
    entry_points: rulebook.entry_points.map(ep => ({ ...ep })),
    context: rulebook.context ? { ...rulebook.context } : undefined,
  };

  contextEntries.value = rulebook.context
    ? Object.entries(rulebook.context).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    : [];

  originalId.value = id;
  isDirty.value = false;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function addRulebook() {
  if (isDirty.value && !confirm('You have unsaved changes. Discard them?')) {
    return;
  }

  const newId = generateUniqueId('rulebook');
  selectedRulebookId.value = newId;
  editingRulebook.value = {
    id: newId,
    name: '',
    entry_points: [],
    context: undefined,
  };
  contextEntries.value = [];
  originalId.value = null;
  isDirty.value = true;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function addEntryPoint() {
  if (!editingRulebook.value) return;

  editingRulebook.value.entry_points.push({
    target: '',
    weight: 1.0,
  });

  isDirty.value = true;
}

function removeEntryPoint(index: number) {
  if (!editingRulebook.value) return;

  editingRulebook.value.entry_points.splice(index, 1);
  isDirty.value = true;
}

function addContextEntry() {
  contextEntries.value.push({ key: '', value: '' });
  isDirty.value = true;
}

function removeContextEntry(index: number) {
  contextEntries.value.splice(index, 1);
  isDirty.value = true;
}

function deleteRulebook(id: string) {
  if (!confirm(`Delete rulebook "${id}"?`)) return;

  const updated = { ...props.rulebooks };
  delete updated[id];

  emit('update', updated);
  emit('change');

  if (selectedRulebookId.value === id) {
    selectedRulebookId.value = null;
    editingRulebook.value = null;
    contextEntries.value = [];
  }
}

function generateUniqueId(prefix: string): string {
  let counter = 1;
  let id = `${prefix}_${counter}`;

  while (props.rulebooks[id]) {
    counter++;
    id = `${prefix}_${counter}`;
  }

  return id;
}

function validateRulebookId() {
  if (!editingRulebook.value) return;

  const id = editingRulebook.value.id.trim();

  if (!id) {
    idError.value = 'ID is required';
    return;
  }

  if (!/^[a-z][a-z0-9_]*$/.test(id)) {
    idError.value =
      'ID must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
    return;
  }

  if (id !== originalId.value && props.rulebooks[id]) {
    idError.value = 'A rulebook with this ID already exists';
    return;
  }

  idError.value = '';
}

function markDirty() {
  isDirty.value = true;
  saveMessage.value = '';
}

function saveRulebook() {
  if (!editingRulebook.value) return;

  validateRulebookId();
  if (idError.value) return;

  if (!editingRulebook.value.name.trim()) {
    validationError.value = 'Name is required';
    return;
  }

  if (!editingRulebook.value.entry_points || editingRulebook.value.entry_points.length === 0) {
    validationError.value = 'At least one entry point is required';
    return;
  }

  // Validate entry points
  for (let i = 0; i < editingRulebook.value.entry_points.length; i++) {
    const ep = editingRulebook.value.entry_points[i];
    if (!ep) continue;
    if (!ep.target || !ep.target.trim()) {
      validationError.value = `Entry point ${i + 1}: Target is required`;
      return;
    }
    if (ep.weight !== undefined && ep.weight <= 0) {
      validationError.value = `Entry point ${i + 1}: Weight must be positive`;
      return;
    }
  }

  validationError.value = '';

  // Convert context entries back to object
  const context: Record<string, unknown> | undefined =
    contextEntries.value.length > 0
      ? Object.fromEntries(
          contextEntries.value
            .filter(e => e.key.trim() && e.value.trim())
            .map(e => [e.key.trim(), e.value.trim()])
        )
      : undefined;

  const rulebook: Rulebook = {
    name: editingRulebook.value.name.trim(),
    entry_points: editingRulebook.value.entry_points
      .filter((ep): ep is NonNullable<typeof ep> => !!ep && !!ep.target)
      .map(ep => ({
        target: ep.target!.trim(),
        weight: ep.weight || 1.0,
      })),
    context,
  };

  const updated = { ...props.rulebooks };

  // If ID changed, delete old entry
  if (originalId.value && originalId.value !== editingRulebook.value.id) {
    delete updated[originalId.value];
  }

  updated[editingRulebook.value.id] = rulebook;

  emit('update', updated);
  emit('change');

  originalId.value = editingRulebook.value.id;
  isDirty.value = false;
  saveMessage.value = '✓ Rulebook saved successfully!';

  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);
}

function cancelEdit() {
  if (isDirty.value && !confirm('Discard unsaved changes?')) {
    return;
  }

  selectedRulebookId.value = null;
  editingRulebook.value = null;
  contextEntries.value = [];
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
  if (props.rulebooks[nextId]) {
    renameModalError.value = 'A rulebook with this ID already exists';
    return false;
  }

  renameModalError.value = '';
  return true;
}

function applyRename() {
  if (!editingRulebook.value) return;
  if (!originalId.value) return;
  if (!validateRenameModal()) return;

  const currentId = originalId.value;
  const nextId = renameModalNextId.value.trim();

  const currentRulebook = props.rulebooks[currentId];
  if (!currentRulebook) return;

  const updated = { ...props.rulebooks };
  delete updated[currentId];
  updated[nextId] = currentRulebook;

  // Update local editor state + selection tracking
  originalId.value = nextId;
  selectedRulebookId.value = nextId;
  editingRulebook.value.id = nextId;

  emit('update', updated);
  emit('change');

  isDirty.value = false;
  saveMessage.value = '✓ Rulebook renamed successfully!';
  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);

  closeRenameModal();
}
</script>

<style scoped>
.rulebook-editor {
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

.rulebook-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rulebook-item {
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

.rulebook-item:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.rulebook-item.active {
  background: #e3f2fd;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.rulebook-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.rulebook-name {
  font-weight: 600;
  color: #333;
}

.rulebook-meta {
  font-size: 0.875rem;
  color: #666;
}

.rulebook-details {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rulebook-details h3,
.rulebook-details h4 {
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
}

.entry-points-section,
.context-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.entry-points-list,
.context-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.entry-point-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.entry-point-fields {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-small {
  max-width: 150px;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.context-key,
.context-value {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: monospace;
}

.context-key {
  flex: 1;
}

.context-value {
  flex: 2;
}

.context-equals {
  font-weight: bold;
  color: #666;
}

.indent {
  padding-left: 2rem;
}

.hint,
.hint-text {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.hint-text {
  text-align: center;
  margin-top: 0.5rem;
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

.example-section {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
}

.example-section h4 {
  margin: 0 0 0.75rem 0;
}

.example-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.example-code {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  font-family: monospace;
  font-size: 0.875rem;
}

.code-line {
  margin: 0.25rem 0;
  color: #333;
}

.code-line strong {
  color: #42b983;
  display: inline-block;
  min-width: 8rem;
}

.example-result {
  padding: 0.5rem;
  background: #e3f2fd;
  border-left: 3px solid #42b983;
  border-radius: 3px;
  margin: 0;
  font-size: 0.9rem;
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
.btn-remove,
.btn-remove-small {
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

.btn-small {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
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

.btn-remove-small {
  background: #dc3545;
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-remove-small:hover {
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
  background: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}
</style>
