import { useEffect } from 'react';

export type HotkeyAction = 'focusSearch' | 'escape' | 'addClient' | 'showHelp';

interface HotkeyConfig {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: HotkeyAction;
}

const DEFAULT_HOTKEYS: HotkeyConfig[] = [
  { key: '/', action: 'focusSearch' },
  { key: 'Escape', action: 'escape' },
  { key: 'n', ctrlKey: true, action: 'addClient' },
  { key: 'n', metaKey: true, action: 'addClient' }, // For Mac
  { key: '?', action: 'showHelp' },
  { key: '?', shiftKey: true, action: 'showHelp' }, // For keyboards that need shift for ?
];

interface UseGlobalHotkeysOptions {
  onFocusSearch?: () => void;
  onEscape?: () => void;
  onAddClient?: () => void;
  onShowHelp?: () => void;
  enabled?: boolean;
  customHotkeys?: HotkeyConfig[];
}

export function useGlobalHotkeys({
  onFocusSearch,
  onEscape,
  onAddClient,
  onShowHelp,
  enabled = true,
  customHotkeys = [],
}: UseGlobalHotkeysOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    const hotkeys = [...DEFAULT_HOTKEYS, ...customHotkeys];

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger hotkeys when user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('[contenteditable="true"]')
      ) {
        // Allow escape key even in inputs
        if (event.key === 'Escape') {
          onEscape?.();
        }
        return;
      }

      // Check each hotkey configuration
      for (const hotkey of hotkeys) {
        const keyMatches = event.key.toLowerCase() === hotkey.key.toLowerCase();
        const ctrlMatches = !!hotkey.ctrlKey === event.ctrlKey;
        const altMatches = !!hotkey.altKey === event.altKey;
        const shiftMatches = !!hotkey.shiftKey === event.shiftKey;
        const metaMatches = !!hotkey.metaKey === event.metaKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          event.preventDefault();
          event.stopPropagation();

          switch (hotkey.action) {
            case 'focusSearch':
              onFocusSearch?.();
              break;
            case 'escape':
              onEscape?.();
              break;
            case 'addClient':
              onAddClient?.();
              break;
            case 'showHelp':
              onShowHelp?.();
              break;
          }
          break; // Stop checking after first match
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onFocusSearch, onEscape, onAddClient, onShowHelp, enabled, customHotkeys]);

  return {
    // Return the default hotkeys for display purposes
    hotkeys: DEFAULT_HOTKEYS,
  };
} 