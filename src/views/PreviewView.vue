<template>
  <div class="preview-view">
    <AppNav />
    <header class="preview-header">
      <h1>Prompt Generator</h1>
      <div class="header-actions">
        <button
          v-if="packageStore.currentPackage"
          class="btn-secondary"
          @click="router.push('/editor')"
        >
          Back to Editor
        </button>
        <button class="btn-secondary" @click="router.push('/')">Home</button>
      </div>
    </header>

    <div class="preview-container">
      <aside class="preview-sidebar">
        <div class="controls">
          <h2>Select Rulebook</h2>

          <!-- Search box -->
          <div class="form-group">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search rulebooks..."
              class="search-input"
            />
          </div>

          <!-- Rulebook list -->
          <div v-if="filteredRulebooks.length === 0" class="empty-state-small">
            <p v-if="allRulebooks.length === 0">
              No rulebooks found in local storage. Create packages with rulebooks first.
            </p>
            <p v-else>No rulebooks match your search.</p>
          </div>

          <div v-else class="rulebook-list">
            <div
              v-for="rb in filteredRulebooks"
              :key="`${rb.packageId}:${rb.namespaceId}:${rb.rulebookId}`"
              class="rulebook-item"
              :class="{ active: isSelected(rb) }"
              @click="selectRulebook(rb)"
            >
              <div class="rulebook-name">
                {{ rb.rulebookId }}
              </div>
              <div class="rulebook-meta">
                <span class="package-badge">{{ rb.packageName }}</span>
                <span class="namespace-badge">{{ rb.namespaceId }}</span>
              </div>
              <div class="entry-points-info">
                {{ rb.entryPointCount }} entry point{{ rb.entryPointCount !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>

          <!-- Generation settings -->
          <div v-if="selectedRulebook" class="generation-settings">
            <h3>Generation Settings</h3>

            <div class="form-group">
              <label>Seed:</label>
              <div class="seed-input-group">
                <input v-model.number="seed" type="number" class="seed-input" />
                <button class="btn-small" @click="randomSeed">Random</button>
              </div>
            </div>

            <div class="form-group">
              <label>Count:</label>
              <input v-model.number="batchCount" type="number" min="1" max="50" />
            </div>

            <button class="btn-primary" @click="generate">Generate</button>
          </div>
        </div>
      </aside>

      <main class="preview-main">
        <h2>Generated Prompts</h2>

        <div v-if="results.length === 0 && !error" class="empty-results">
          <p>Select a rulebook and click Generate to see results</p>
        </div>

        <div v-else-if="results.length > 0" class="results">
          <div v-for="(result, index) in results" :key="index" class="result-card">
            <div class="result-header">
              <span class="result-number">#{{ index + 1 }}</span>
              <span class="result-seed">Seed: {{ result.seed }}</span>
              <button class="btn-copy" @click="copyResult(result.text)">📋 Copy</button>
            </div>
            <div class="result-text">
              {{ result.text }}
            </div>
          </div>

          <div class="results-actions">
            <button class="btn-secondary" @click="copyAllResults">Copy All Results</button>
            <button class="btn-secondary" @click="exportResults">Export as Text</button>
          </div>
        </div>

        <p v-if="error" class="error">
          {{ error }}
        </p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePackageStore } from '../stores/packageStore';
import { platformService } from '../services/localStorage';
import { RenderingEngineV2 } from '../services/rendering-v2';
import AppNav from '../components/AppNav.vue';
import type { RenderResult } from '../services/platform';
import type { Package } from '../models/package';

const router = useRouter();
const packageStore = usePackageStore();

interface RulebookInfo {
  packageId: string;
  packageName: string;
  namespaceId: string;
  rulebookId: string;
  entryPointCount: number;
  pkg: Package;
}

const allRulebooks = ref<RulebookInfo[]>([]);
const searchQuery = ref('');
const selectedRulebook = ref<RulebookInfo | null>(null);
const seed = ref(Math.floor(Math.random() * 1000000));
const batchCount = ref(1);
const results = ref<RenderResult[]>([]);
const error = ref('');

const filteredRulebooks = computed(() => {
  if (!searchQuery.value) return allRulebooks.value;

  const query = searchQuery.value.toLowerCase();
  return allRulebooks.value.filter(
    rb =>
      rb.rulebookId.toLowerCase().includes(query) ||
      rb.packageName.toLowerCase().includes(query) ||
      rb.namespaceId.toLowerCase().includes(query)
  );
});

function isSelected(rb: RulebookInfo): boolean {
  if (!selectedRulebook.value) return false;
  return (
    selectedRulebook.value.packageId === rb.packageId &&
    selectedRulebook.value.namespaceId === rb.namespaceId &&
    selectedRulebook.value.rulebookId === rb.rulebookId
  );
}

function selectRulebook(rb: RulebookInfo) {
  selectedRulebook.value = rb;
  results.value = [];
  error.value = '';
}

function randomSeed() {
  seed.value = Math.floor(Math.random() * 1000000);
}

async function generate() {
  if (!selectedRulebook.value) return;

  try {
    error.value = '';
    results.value = [];

    // Load dependencies for this package
    console.log('[generate] Loading dependencies for package:', selectedRulebook.value.pkg.id);
    console.log('[generate] Package has dependencies:', selectedRulebook.value.pkg.dependencies);

    const dependencies: Package[] = [];
    if (selectedRulebook.value.pkg.dependencies) {
      for (const dep of selectedRulebook.value.pkg.dependencies) {
        try {
          // Handle both 'package' (TypeScript) and 'package' (YAML) field names
          const depId = dep.package || (dep as any).package;
          console.log('[generate] Loading dependency:', depId);
          const depPkg = await platformService.loadPackage(depId);
          console.log(
            '[generate] Loaded dependency:',
            depId,
            'with namespaces:',
            Object.keys(depPkg.namespaces)
          );
          dependencies.push(depPkg);
        } catch (err) {
          const depId = dep.package || (dep as any).package;
          console.warn(`Failed to load dependency ${depId}:`, err);
          // Continue anyway - renderer will throw specific error if needed
        }
      }
    }

    console.log('[generate] Total dependencies loaded:', dependencies.length);
    console.log(
      '[generate] Dependency package IDs:',
      dependencies.map(d => d.id)
    );

    for (let i = 0; i < batchCount.value; i++) {
      const currentSeed = seed.value + i;

      // Use new V2 renderer with dependencies
      const engine = new RenderingEngineV2(selectedRulebook.value.pkg, currentSeed, dependencies);
      const result = await engine.renderRulebook(
        selectedRulebook.value.namespaceId,
        selectedRulebook.value.rulebookId
      );

      results.value.push(result);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to render';
  }
}

function copyResult(text: string) {
  navigator.clipboard.writeText(text);
}

function copyAllResults() {
  const allText = results.value
    .map((r, i) => `#${i + 1} (Seed: ${r.seed})\n${r.text}`)
    .join('\n\n---\n\n');
  navigator.clipboard.writeText(allText);
}

function exportResults() {
  const allText = results.value
    .map((r, i) => `#${i + 1} (Seed: ${r.seed})\n${r.text}`)
    .join('\n\n---\n\n');
  const blob = new Blob([allText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompts-${selectedRulebook.value?.rulebookId || 'export'}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function loadAllRulebooks() {
  try {
    // Load all packages from localStorage
    await packageStore.loadPackageList();
    const packageList = packageStore.packages;

    const rulebooks: RulebookInfo[] = [];

    for (const pkgMeta of packageList) {
      try {
        const pkg = await platformService.loadPackage(pkgMeta.id);

        // Iterate through all namespaces
        for (const [namespaceId, namespace] of Object.entries(pkg.namespaces)) {
          // Iterate through all rulebooks in this namespace
          if (namespace.rulebooks) {
            for (const [rulebookId, rulebook] of Object.entries(namespace.rulebooks)) {
              rulebooks.push({
                packageId: pkg.id,
                packageName: pkg.metadata.name || pkg.id,
                namespaceId,
                rulebookId,
                entryPointCount: rulebook.entry_points?.length || 0,
                pkg,
              });
            }
          }
        }
      } catch (err) {
        console.error(`Failed to load package ${pkgMeta.id}:`, err);
      }
    }

    allRulebooks.value = rulebooks;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load rulebooks';
  }
}

onMounted(() => {
  loadAllRulebooks();
});
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
  flex-shrink: 0;
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
  width: 400px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.controls h2 {
  margin: 0;
  font-size: 1.2rem;
}

.controls h3 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1rem;
  color: #666;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: bold;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
}

.search-input {
  width: 100%;
}

.seed-input-group {
  display: flex;
  gap: 0.5rem;
}

.seed-input {
  flex: 1;
}

.btn-small {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
}

.btn-small:hover {
  background: #e0e0e0;
}

.empty-state-small {
  padding: 2rem 1rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.empty-state-small p {
  margin: 0;
}

.rulebook-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.25rem;
}

.rulebook-item {
  background: white;
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.rulebook-item:hover {
  border-color: #42b983;
  background: #f8f9fa;
}

.rulebook-item.active {
  border-color: #42b983;
  background: #e8f5f0;
}

.rulebook-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.rulebook-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.package-badge,
.namespace-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
}

.package-badge {
  background: #e3f2fd;
  color: #1976d2;
}

.namespace-badge {
  background: #f3e5f5;
  color: #7b1fa2;
}

.entry-points-info {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.generation-settings {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #ddd;
}

.preview-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.preview-main h2 {
  margin: 0 0 1.5rem 0;
}

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
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.result-number {
  font-weight: bold;
  color: #42b983;
  font-size: 1.1rem;
}

.result-seed {
  color: #666;
  font-size: 0.9rem;
}

.btn-copy {
  padding: 0.4rem 0.75rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-copy:hover {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.result-text {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #2c3e50;
  white-space: pre-wrap;
}

.results-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #eee;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #42b983;
  color: white;
  width: 100%;
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
  flex: 1;
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
