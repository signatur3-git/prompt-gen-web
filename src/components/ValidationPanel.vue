<template>
  <div class="validation-panel" :class="{ collapsed: isCollapsed }">
    <div class="validation-header" @click="toggleCollapsed">
      <div class="validation-title">
        <span class="validation-icon" :class="severityClass">
          {{ severityIcon }}
        </span>
        <span>Validation Issues</span>
        <span v-if="totalCount > 0" class="validation-count"> ({{ totalCount }}) </span>
      </div>
      <button class="collapse-btn" :aria-label="isCollapsed ? 'Expand' : 'Collapse'">
        {{ isCollapsed ? '▲' : '▼' }}
      </button>
    </div>

    <div v-if="!isCollapsed" class="validation-content">
      <div v-if="totalCount === 0" class="validation-empty">✅ No validation issues</div>

      <div v-else class="validation-list">
        <!-- Errors -->
        <div v-if="errors.length > 0" class="validation-section">
          <div class="validation-section-header error-header">❌ Errors ({{ errors.length }})</div>
          <div
            v-for="(error, index) in errors"
            :key="`error-${index}`"
            class="validation-item error-item"
            @click="$emit('jump-to', error.location)"
          >
            <div class="validation-message">
              {{ error.message }}
            </div>
            <div v-if="error.location" class="validation-location">📍 {{ error.location }}</div>
            <div v-if="error.suggestion" class="validation-suggestion">
              💡 {{ error.suggestion }}
            </div>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="warnings.length > 0" class="validation-section">
          <div class="validation-section-header warning-header">
            ⚠️ Warnings ({{ warnings.length }})
          </div>
          <div
            v-for="(warning, index) in warnings"
            :key="`warning-${index}`"
            class="validation-item warning-item"
            @click="$emit('jump-to', warning.location)"
          >
            <div class="validation-message">
              {{ warning.message }}
            </div>
            <div v-if="warning.location" class="validation-location">📍 {{ warning.location }}</div>
            <div v-if="warning.suggestion" class="validation-suggestion">
              💡 {{ warning.suggestion }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ValidationResult } from '../validator/types';

const props = defineProps<{
  result: ValidationResult;
}>();

defineEmits<{
  'jump-to': [location: string | undefined];
}>();

const errors = computed(() => props.result.errors || []);
const warnings = computed(() => props.result.warnings || []);
const totalCount = computed(() => errors.value.length + warnings.value.length);

// Start collapsed if no issues, expanded if there are issues
const isCollapsed = ref(totalCount.value === 0);

// Auto-expand when issues are found, auto-collapse when all issues are cleared
watch(totalCount, (newCount, oldCount) => {
  if (newCount > 0 && oldCount === 0) {
    // Issues appeared - expand
    isCollapsed.value = false;
  } else if (newCount === 0 && oldCount > 0) {
    // All issues cleared - collapse
    isCollapsed.value = true;
  }
});

const severityClass = computed(() => {
  if (errors.value.length > 0) return 'has-errors';
  if (warnings.value.length > 0) return 'has-warnings';
  return 'no-issues';
});

const severityIcon = computed(() => {
  if (errors.value.length > 0) return '❌';
  if (warnings.value.length > 0) return '⚠️';
  return '✅';
});

function toggleCollapsed() {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<style scoped>
.validation-panel {
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  margin-bottom: 20px;
}

.validation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.validation-header:hover {
  background: #e9ecef;
}

.validation-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.validation-icon {
  font-size: 18px;
}

.validation-icon.has-errors {
  color: #dc3545;
}

.validation-icon.has-warnings {
  color: #ffc107;
}

.validation-icon.no-issues {
  color: #28a745;
}

.validation-count {
  color: #6c757d;
  font-weight: normal;
}

.collapse-btn {
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  color: #6c757d;
}

.collapse-btn:hover {
  color: #495057;
}

.validation-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.validation-empty {
  text-align: center;
  color: #28a745;
  padding: 20px;
  font-size: 16px;
}

.validation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.validation-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.validation-section-header {
  font-weight: 600;
  font-size: 14px;
  padding: 4px 0;
}

.error-header {
  color: #dc3545;
}

.warning-header {
  color: #ffc107;
}

.validation-item {
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.error-item {
  background: #fff5f5;
  border-left: 3px solid #dc3545;
}

.error-item:hover {
  background: #ffe5e5;
  transform: translateX(2px);
}

.warning-item {
  background: #fffbf0;
  border-left: 3px solid #ffc107;
}

.warning-item:hover {
  background: #fff4d6;
  transform: translateX(2px);
}

.validation-message {
  font-size: 14px;
  color: #212529;
  margin-bottom: 4px;
}

.validation-location {
  font-size: 12px;
  color: #6c757d;
  font-family: 'Courier New', monospace;
  margin-bottom: 4px;
}

.validation-suggestion {
  font-size: 12px;
  color: #0d6efd;
  font-style: italic;
}

.collapsed .validation-content {
  display: none;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .validation-content {
    max-height: 300px;
  }

  .validation-item {
    padding: 10px;
  }
}
</style>
