<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast" :class="type">
        <span class="toast-icon">{{ icon }}</span>
        <span class="toast-message">{{ message }}</span>
        <button class="toast-close" aria-label="Close" @click="close">×</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

const props = withDefaults(
  defineProps<{
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    show?: boolean;
  }>(),
  {
    type: 'info',
    duration: 3000,
    show: false,
  }
);

const emit = defineEmits<{
  close: [];
}>();

const visible = ref(false);
let timeoutId: number | null = null;

const icon = computed(() => {
  switch (props.type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return 'ℹ';
  }
});

function close() {
  visible.value = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  emit('close');
}

function openToast() {
  visible.value = true;
  if (props.duration > 0) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      close();
    }, props.duration);
  }
}

watch(
  () => props.show,
  newShow => {
    if (newShow) {
      openToast();
    } else {
      close();
    }
  }
);

onMounted(() => {
  if (props.show) {
    openToast();
  }
});
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  min-width: 300px;
  max-width: 500px;
}

.toast.success {
  border-left: 4px solid #28a745;
}

.toast.error {
  border-left: 4px solid #dc3545;
}

.toast.warning {
  border-left: 4px solid #ffc107;
}

.toast.info {
  border-left: 4px solid #17a2b8;
}

.toast-icon {
  font-size: 20px;
  font-weight: bold;
}

.toast.success .toast-icon {
  color: #28a745;
}

.toast.error .toast-icon {
  color: #dc3545;
}

.toast.warning .toast-icon {
  color: #ffc107;
}

.toast.info .toast-icon {
  color: #17a2b8;
}

.toast-message {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.toast-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #333;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .toast {
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }
}
</style>
