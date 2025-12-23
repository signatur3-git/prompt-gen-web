/**
 * Composable for handling keyboard shortcuts
 */
import { onMounted, onUnmounted } from 'vue';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  function handleKeyDown(event: KeyboardEvent) {
    for (const shortcut of shortcuts) {
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      // Handle Ctrl/Cmd interchangeably
      const modifierMatch =
        shortcut.ctrl || shortcut.meta
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;

      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        modifierMatch &&
        (!shortcut.shift || shiftMatch) &&
        (!shortcut.alt || altMatch)
      ) {
        event.preventDefault();
        shortcut.handler();
        break;
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    shortcuts,
  };
}

/**
 * Get platform-specific modifier key name
 */
export function getModifierKeyName(): string {
  return navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl';
}
