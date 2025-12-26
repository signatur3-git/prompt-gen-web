<template>
  <div class="rule-editor">
    <header class="editor-header">
      <h2>Rules</h2>
      <button class="btn-primary" @click="addRule">+ Add Rule</button>
    </header>

    <div v-if="rules.length === 0" class="empty-state">
      <p>No rules yet. Add rules to coordinate values between datatype selections.</p>
      <p class="hint-text">
        Rules extract tags from selected values and store them in context for use by other
        references.
      </p>
    </div>

    <div v-else class="rule-list">
      <div
        v-for="rule in rules"
        :key="rule.id"
        class="rule-item"
        :class="{ active: selectedRuleId === rule.id }"
        @click="selectRule(rule.id)"
      >
        <div class="rule-header">
          <span class="rule-name">{{ rule.id }}</span>
          <span class="rule-meta">
            when: {{ rule.when || '(none)' }} → set: {{ rule.set || '(none)' }}
          </span>
        </div>
        <button class="btn-delete" title="Delete rule" @click.stop="deleteRule(rule.id)">🗑️</button>
      </div>
    </div>

    <!-- Rule Editor Panel -->
    <div v-if="editingRule" class="rule-details">
      <h3>Edit Rule</h3>

      <div class="form-group">
        <label>ID: <span class="required">*</span></label>
        <div style="display: flex; gap: 0.5rem; align-items: start">
          <input
            v-model="editingRule.id"
            placeholder="e.g., compute_article"
            :readonly="!!originalId"
            :disabled="!!originalId"
            @input="markDirty"
            @blur="validateRuleId"
          />
          <button
            v-if="originalId"
            type="button"
            class="btn-secondary"
            title="Rename rule"
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
        <p class="hint">Unique identifier for this rule</p>
      </div>

      <div class="form-group">
        <label>When (trigger): <span class="required">*</span></label>
        <input
          v-model="editingRule.when"
          placeholder="e.g., ref:creature.tags.article"
          @input="markDirty"
        />
        <p class="hint">Field path that triggers this rule (e.g., ref:datatype.tags.tagname)</p>
      </div>

      <div class="form-group">
        <label>Logic (optional):</label>
        <input
          v-model="editingRule.logic"
          placeholder="Optional expression (leave empty to check field exists)"
          @input="markDirty"
        />
        <p class="hint">Optional condition expression. Empty means "field exists"</p>
      </div>

      <div class="form-group">
        <label>Set (target): <span class="required">*</span></label>
        <input
          v-model="editingRule.set"
          placeholder="e.g., context.prompt.article"
          @input="markDirty"
        />
        <p class="hint">Context field to write to (e.g., context.prompt.fieldname)</p>
      </div>

      <div class="form-group">
        <label>Value: <span class="required">*</span></label>
        <input
          v-model="editingRule.value"
          placeholder="e.g., ref:creature.tags.article"
          @input="markDirty"
        />
        <p class="hint">Value to write (literal string or reference path)</p>
      </div>

      <!-- Example Section -->
      <div class="example-section">
        <h4>💡 Example: Article Selection</h4>
        <div class="example-content">
          <p>
            <strong>Problem:</strong> Select correct article ("a" vs "an") based on word phonetics
          </p>
          <div class="example-code">
            <div class="code-line"><strong>When:</strong> ref:creature.tags.article</div>
            <div class="code-line"><strong>Logic:</strong> (empty - just check if tag exists)</div>
            <div class="code-line"><strong>Set:</strong> context.prompt.article</div>
            <div class="code-line"><strong>Value:</strong> ref:creature.tags.article</div>
          </div>
          <p class="example-result">
            <strong>Result:</strong> When "creature" is selected, if it has an "article" tag, copy
            that value to context so the {article} reference can use it.
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
        <button :disabled="!canSave" class="btn-primary" @click="saveRule">Save Changes</button>
        <button class="btn-secondary" @click="cancelEdit">Cancel</button>
      </div>
    </div>

    <!-- Rename Modal -->
    <div v-if="isRenameModalOpen" class="modal-overlay" @click.self="closeRenameModal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rename-modal-title">
        <div class="modal-header">
          <h3 id="rename-modal-title">Rename Rule</h3>
        </div>

        <div class="modal-body">
          <p class="modal-subtitle">
            Renaming changes the rule ID (the key used to reference it). This may affect references.
          </p>

          <div class="form-group">
            <label>Current ID</label>
            <input :value="renameModalCurrentId" disabled />
          </div>

          <div class="form-group">
            <label>New ID <span class="required">*</span></label>
            <input
              v-model="renameModalNextId"
              placeholder="e.g., compute_article_v2"
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
import type { Rule } from '../models/package';

const props = defineProps<{
  namespaceId: string;
  rules: Record<string, Rule>;
}>();

const emit = defineEmits<{
  update: [rules: Record<string, Rule>];
  change: [];
}>();

const selectedRuleId = ref<string | null>(null);
const editingRule = ref<(Rule & { id: string }) | null>(null);
const originalId = ref<string | null>(null);
const isDirty = ref(false);
const idError = ref('');
const validationError = ref('');
const saveMessage = ref('');

const isRenameModalOpen = ref(false);
const renameModalCurrentId = ref<string>('');
const renameModalNextId = ref<string>('');
const renameModalError = ref<string>('');

const rules = computed(() => {
  return Object.entries(props.rules).map(([id, rule]) => ({
    ...rule,
    id,
  }));
});

const canSave = computed(() => {
  if (!editingRule.value) return false;
  if (!editingRule.value.id.trim()) return false;
  if (!editingRule.value.when.trim()) return false;
  if (!editingRule.value.set.trim()) return false;
  if (!editingRule.value.value.trim()) return false;
  if (idError.value) return false;
  return isDirty.value;
});

const canApplyRename = computed(() => {
  if (!isRenameModalOpen.value) return false;
  const nextId = renameModalNextId.value.trim();
  if (!nextId) return false;
  if (!/^[a-z0-9_]+$/.test(nextId)) return false;
  if (nextId === renameModalCurrentId.value) return false;
  if (props.rules[nextId]) return false;
  return true;
});

function selectRule(id: string) {
  if (isDirty.value && !confirm('You have unsaved changes. Discard them?')) {
    return;
  }

  selectedRuleId.value = id;
  const rule = props.rules[id];
  if (!rule) return;

  editingRule.value = {
    id,
    when: rule.when,
    logic: rule.logic || '',
    set: rule.set,
    value: rule.value,
  };

  originalId.value = id;
  isDirty.value = false;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function addRule() {
  if (isDirty.value && !confirm('You have unsaved changes. Discard them?')) {
    return;
  }

  const newId = generateUniqueId('rule');
  selectedRuleId.value = newId;
  editingRule.value = {
    id: newId,
    when: '',
    logic: '',
    set: '',
    value: '',
  };
  originalId.value = null;
  isDirty.value = true;
  idError.value = '';
  validationError.value = '';
  saveMessage.value = '';
}

function deleteRule(id: string) {
  if (!confirm(`Delete rule "${id}"?`)) return;

  const updated = { ...props.rules };
  delete updated[id];

  emit('update', updated);
  emit('change');

  if (selectedRuleId.value === id) {
    selectedRuleId.value = null;
    editingRule.value = null;
  }
}

function generateUniqueId(prefix: string): string {
  let counter = 1;
  let id = `${prefix}_${counter}`;

  while (props.rules[id]) {
    counter++;
    id = `${prefix}_${counter}`;
  }

  return id;
}

function validateRuleId() {
  if (!editingRule.value) return;

  const id = editingRule.value.id.trim();

  if (!id) {
    idError.value = 'ID is required';
    return;
  }

  if (!/^[a-z][a-z0-9_]*$/.test(id)) {
    idError.value =
      'ID must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
    return;
  }

  if (id !== originalId.value && props.rules[id]) {
    idError.value = 'A rule with this ID already exists';
    return;
  }

  idError.value = '';
}

function markDirty() {
  isDirty.value = true;
  saveMessage.value = '';
}

function saveRule() {
  if (!editingRule.value) return;

  validateRuleId();
  if (idError.value) return;

  if (!editingRule.value.when.trim()) {
    validationError.value = 'When (trigger) is required';
    return;
  }

  if (!editingRule.value.set.trim()) {
    validationError.value = 'Set (target) is required';
    return;
  }

  if (!editingRule.value.value.trim()) {
    validationError.value = 'Value is required';
    return;
  }

  validationError.value = '';

  const rule: Rule = {
    when: editingRule.value.when.trim(),
    logic: editingRule.value.logic?.trim() || undefined,
    set: editingRule.value.set.trim(),
    value: editingRule.value.value.trim(),
  };

  const updated = { ...props.rules };

  // If ID changed, delete old entry
  if (originalId.value && originalId.value !== editingRule.value.id) {
    delete updated[originalId.value];
  }

  updated[editingRule.value.id] = rule;

  emit('update', updated);
  emit('change');

  originalId.value = editingRule.value.id;
  isDirty.value = false;
  saveMessage.value = '✓ Rule saved successfully!';

  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);
}

function cancelEdit() {
  if (isDirty.value && !confirm('Discard unsaved changes?')) {
    return;
  }

  selectedRuleId.value = null;
  editingRule.value = null;
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
  if (props.rules[nextId]) {
    renameModalError.value = 'A rule with this ID already exists';
    return false;
  }

  renameModalError.value = '';
  return true;
}

function applyRename() {
  if (!editingRule.value) return;
  if (!originalId.value) return;
  if (!validateRenameModal()) return;

  const currentId = originalId.value;
  const nextId = renameModalNextId.value.trim();

  const currentRule = props.rules[currentId];
  if (!currentRule) return;

  const updated = { ...props.rules };
  delete updated[currentId];
  updated[nextId] = currentRule;

  // Update local editor state + selection tracking
  originalId.value = nextId;
  selectedRuleId.value = nextId;
  editingRule.value.id = nextId;

  emit('update', updated);
  emit('change');

  isDirty.value = false;
  saveMessage.value = '✓ Rule renamed successfully!';
  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);

  closeRenameModal();
}
</script>

<style>
.rule-editor {
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
  border-bottom: 2px solid var(--color-border);
}

.editor-header h2 {
  margin: 0;
  color: var(--color-text-primary);
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.rule-item:hover {
  background: var(--color-border);
  border-color: var(--color-border-hover);
}

.rule-item.active {
  background: var(--color-primary-light);
  border-color: var(--color-success);
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.rule-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.rule-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.rule-meta {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-family: monospace;
}

.rule-details {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rule-details h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

/* Let the global form-control baseline handle colors. Keep only spacing/typography here. */
.form-group input {
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-family: monospace;
}

.hint,
.hint-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.error-message {
  padding: 0.75rem;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-danger);
  border-radius: 4px;
  color: var(--color-danger);
}

.success-message {
  padding: 0.75rem;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-success);
  border-radius: 4px;
  color: var(--color-success);
}

.example-section {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1rem;
}

.example-section h4 {
  margin: 0 0 0.75rem 0;
  color: var(--color-text-primary);
}

.example-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.example-content p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.example-code {
  background: var(--color-surface);
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-family: monospace;
  font-size: 0.875rem;
}

.code-line {
  margin: 0.25rem 0;
  color: var(--color-text-primary);
}

.code-line strong {
  color: var(--color-success);
  display: inline-block;
  min-width: 4rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.editor-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
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

.btn-secondary {
  padding: 0.5rem 1rem;
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-delete {
  padding: 0.25rem 0.5rem;
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete:hover {
  background: var(--color-danger-hover);
}

.required {
  color: var(--color-danger);
}

.error {
  color: var(--color-danger);
  font-size: 0.875rem;
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

.btn-cancel {
  padding: 0.5rem 1rem;
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: var(--color-border);
}
</style>
