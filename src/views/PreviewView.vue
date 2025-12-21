<template>
  <div class="preview-view">
    <header class="preview-header">
      <h1>Live Preview</h1>
      <div class="header-actions">
        <button
          class="btn-secondary"
          @click="router.push('/editor')"
        >
          Back to Editor
        </button>
        <button
          class="btn-secondary"
          @click="router.push('/')"
        >
          Home
        </button>
      </div>
    </header>

    <div
      v-if="!currentPackage"
      class="empty-state"
    >
      <p>No package loaded. Please create or load a package.</p>
      <button
        class="btn-primary"
        @click="router.push('/')"
      >
        Go to Home
      </button>
    </div>

    <div
      v-else
      class="preview-container"
    >
      <aside class="preview-sidebar">
        <div class="controls">
          <h2>Render Settings</h2>

          <div class="form-group">
            <label>Namespace:</label>
            <select v-model="selectedNamespace">
              <option value="">
                Select namespace...
              </option>
              <option
                v-for="(_ns, id) in currentPackage.namespaces"
                :key="id"
                :value="id"
              >
                {{ id }}
              </option>
            </select>
          </div>

          <div
            v-if="selectedNamespace"
            class="form-group"
          >
            <label>Target Type:</label>
            <select v-model="targetType">
              <option value="promptsection">
                Prompt Section
              </option>
              <option value="rulebook">
                Rulebook
              </option>
            </select>
          </div>

          <div
            v-if="selectedNamespace && targetType === 'promptsection'"
            class="form-group"
          >
            <label>Prompt Section:</label>
            <select v-model="selectedPromptSection">
              <option value="">
                Select prompt section...
              </option>
              <option
                v-for="(_ps, name) in namespace?.prompt_sections"
                :key="name"
                :value="name"
              >
                {{ name }}
              </option>
            </select>
          </div>

          <div
            v-if="selectedNamespace && targetType === 'rulebook'"
            class="form-group"
          >
            <label>Rulebook:</label>
            <select v-model="selectedRulebook">
              <option value="">
                Select rulebook...
              </option>
              <option
                v-for="(_rb, name) in namespace?.rulebooks"
                :key="name"
                :value="name"
              >
                {{ name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Seed:</label>
            <input
              v-model.number="seed"
              type="number"
            >
            <button
              class="btn-small"
              @click="randomSeed"
            >
              Random
            </button>
          </div>

          <div class="form-group">
            <label>Count:</label>
            <input
              v-model.number="batchCount"
              type="number"
              min="1"
              max="50"
            >
          </div>

          <button
            class="btn-primary"
            :disabled="!canRender"
            @click="render"
          >
            Generate
          </button>
        </div>
      </aside>

      <main class="preview-main">
        <h2>Output</h2>

        <div
          v-if="results.length === 0"
          class="empty-results"
        >
          <p>Configure settings and click Generate to see results</p>
        </div>

        <div
          v-else
          class="results"
        >
          <div
            v-for="(result, index) in results"
            :key="index"
            class="result-card"
          >
            <div class="result-header">
              <span class="result-number">#{{ index + 1 }}</span>
              <span class="result-seed">Seed: {{ result.seed }}</span>
              <button
                class="btn-copy"
                @click="copyResult(result.text)"
              >
                Copy
              </button>
            </div>
            <div class="result-text">
              {{ result.text }}
            </div>
          </div>
        </div>

        <p
          v-if="error"
          class="error"
        >
          {{ error }}
        </p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePackageStore } from '../stores/packageStore';
import { renderingService } from '../services/rendering';
import type { RenderResult } from '../services/platform';

const router = useRouter();
const packageStore = usePackageStore();

const currentPackage = computed(() => packageStore.currentPackage);
const selectedNamespace = ref('');
const targetType = ref<'promptsection' | 'rulebook'>('promptsection');
const selectedPromptSection = ref('');
const selectedRulebook = ref('');
const seed = ref(Math.floor(Math.random() * 1000000));
const batchCount = ref(1);
const results = ref<RenderResult[]>([]);
const error = ref('');

const namespace = computed(() => {
  if (!currentPackage.value || !selectedNamespace.value) return null;
  return currentPackage.value.namespaces[selectedNamespace.value];
});

const canRender = computed(() => {
  if (!selectedNamespace.value) return false;
  if (targetType.value === 'promptsection') {
    return !!selectedPromptSection.value;
  } else {
    return !!selectedRulebook.value;
  }
});

function randomSeed() {
  seed.value = Math.floor(Math.random() * 1000000);
}

async function render() {
  if (!currentPackage.value || !canRender.value) return;

  try {
    error.value = '';
    results.value = [];

    for (let i = 0; i < batchCount.value; i++) {
      const currentSeed = seed.value + i;
      let result: RenderResult;

      if (targetType.value === 'promptsection') {
        result = await renderingService.render(
          currentPackage.value,
          selectedNamespace.value,
          selectedPromptSection.value,
          currentSeed
        );
      } else {
        result = await renderingService.renderRulebook(
          currentPackage.value,
          selectedNamespace.value,
          selectedRulebook.value,
          currentSeed
        );
      }

      results.value.push(result);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to render';
  }
}

function copyResult(text: string) {
  navigator.clipboard.writeText(text);
  // Could add a toast notification here
}
</script>

<style scoped>
.preview-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.preview-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.preview-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.preview-sidebar {
  width: 350px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  padding: 1rem;
  overflow-y: auto;
}

.controls h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.btn-small {
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-small:hover {
  background: #e0e0e0;
}

.preview-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.preview-main h2 {
  margin: 0 0 1rem 0;
}

.empty-state,
.empty-results {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.result-number {
  font-weight: bold;
  color: #42b983;
}

.result-seed {
  color: #666;
  font-size: 0.9rem;
}

.btn-copy {
  padding: 0.25rem 0.75rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-copy:hover {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.result-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #333;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
}

.btn-primary {
  background: #42b983;
  color: white;
  margin-top: 1rem;
}

.btn-primary:hover:not(:disabled) {
  background: #359268;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.error {
  color: #e74c3c;
  margin-top: 1rem;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 4px;
  border: 1px solid #fee;
}
</style>

