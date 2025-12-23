<template>
  <div class="loading-spinner" :class="{ inline }">
    <div class="spinner" />
    <p v-if="message" class="loading-message">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string;
  inline?: boolean;
}>();
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.loading-spinner.inline {
  padding: 0.5rem;
  flex-direction: row;
  gap: 0.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.inline .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-message {
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.loading-spinner.inline .loading-message {
  margin-top: 0;
}
</style>
