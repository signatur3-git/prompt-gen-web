<template>
  <div class="package-card">
    <div class="package-card-header">
      <div class="package-title">
        <h3>{{ packageInfo.name }}</h3>
        <span class="package-version">v{{ packageInfo.version }}</span>
      </div>
      <div class="package-badges">
        <span v-if="packageInfo.isBasePackage" class="badge badge-base">Base</span>
        <span v-if="source === 'marketplace'" class="badge badge-marketplace">Marketplace</span>
        <span v-if="source === 'imported'" class="badge badge-imported">Imported</span>
      </div>
    </div>

    <div class="package-body">
      <p v-if="packageInfo.description" class="package-description">
        {{ packageInfo.description }}
      </p>
      <p v-else class="package-description empty">No description provided</p>

      <!-- Entity badges (M12 spec) -->
      <div v-if="packageInfo.content_counts" class="entity-badges">
        <span
          v-if="packageInfo.content_counts.rulebooks > 0"
          class="entity-badge entity-badge-rb"
          title="Rulebooks"
          >RB:{{ packageInfo.content_counts.rulebooks }}</span
        >
        <span
          v-if="packageInfo.content_counts.rules > 0"
          class="entity-badge entity-badge-r"
          title="Rules"
          >R:{{ packageInfo.content_counts.rules }}</span
        >
        <span
          v-if="packageInfo.content_counts.prompt_sections > 0"
          class="entity-badge entity-badge-ps"
          title="Prompt Sections"
          >PS:{{ packageInfo.content_counts.prompt_sections }}</span
        >
        <span
          v-if="packageInfo.content_counts.datatypes > 0"
          class="entity-badge entity-badge-dt"
          title="Datatypes"
          >DT:{{ packageInfo.content_counts.datatypes }}</span
        >
      </div>

      <div class="package-meta">
        <div class="meta-item">
          <span class="meta-label">ID:</span>
          <span class="meta-value">{{ packageInfo.id }}</span>
        </div>
        <div
          v-if="packageInfo.dependencyCount && packageInfo.dependencyCount > 0"
          class="meta-item"
        >
          <span class="meta-label">Dependencies:</span>
          <span class="meta-value">{{ packageInfo.dependencyCount }}</span>
        </div>
      </div>

      <div
        v-if="packageInfo.missingDependencies && packageInfo.missingDependencies.length > 0"
        class="package-warning"
      >
        ⚠️ Missing {{ packageInfo.missingDependencies?.length || 0 }} dependencies
      </div>
    </div>

    <div class="package-actions">
      <button
        v-if="source !== 'marketplace'"
        class="btn-action btn-edit"
        @click="emit('edit', packageInfo.id)"
      >
        ✏️ Edit
      </button>
      <button class="btn-action btn-generate" @click="emit('generate', packageInfo.id)">
        ⚡ Generate
      </button>
      <button class="btn-action btn-export" @click="emit('export', packageInfo.id)">
        📤 Export
      </button>
      <button class="btn-action btn-delete" @click="emit('delete', packageInfo.id)">
        🗑️ Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PackageInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  isBasePackage?: boolean;
  dependencyCount?: number;
  missingDependencies?: string[];
  // M12: Entity counts for package cards
  content_counts?: {
    rulebooks: number;
    rules: number;
    prompt_sections: number;
    datatypes: number;
  };
}

interface Props {
  packageInfo: PackageInfo;
  source: 'created' | 'imported' | 'marketplace';
}

defineProps<Props>();

const emit = defineEmits<{
  edit: [packageId: string];
  generate: [packageId: string];
  export: [packageId: string];
  delete: [packageId: string];
}>();
</script>

<style scoped>
.package-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.package-card-header {
  margin-bottom: 1rem;
}

.package-title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.package-title h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

.package-version {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: normal;
}

.package-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-base {
  background: #ffd700;
  color: #333;
}

.badge-marketplace {
  background: #667eea;
  color: white;
}

.badge-imported {
  background: #28a745;
  color: white;
}

.package-body {
  flex: 1;
  margin-bottom: 1rem;
}

.package-description {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.package-description.empty {
  font-style: italic;
  color: var(--color-text-tertiary);
}

/* Entity badges (M12 spec) */
.entity-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.entity-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.entity-badge-rb {
  background: #667eea;
  color: white;
}

.entity-badge-r {
  background: #48bb78;
  color: white;
}

.entity-badge-ps {
  background: #ed8936;
  color: white;
}

.entity-badge-dt {
  background: #38b2ac;
  color: white;
}

.package-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.meta-item {
  display: flex;
  gap: 0.5rem;
}

.meta-label {
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.meta-value {
  color: var(--color-text-secondary);
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

.package-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-top: 1rem;
}

.package-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-action {
  flex: 1;
  min-width: 80px;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.btn-edit:hover {
  background: var(--color-border);
}

.btn-generate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-generate:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.btn-export {
  background: var(--color-success);
  color: white;
}

.btn-export:hover {
  background: var(--color-success-hover);
}

.btn-delete {
  background: var(--color-danger);
  color: white;
}

.btn-delete:hover {
  background: var(--color-danger-hover);
}

/* Dark Theme */
</style>
