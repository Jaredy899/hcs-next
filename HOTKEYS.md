# Keyboard Shortcuts

This application supports several keyboard shortcuts to help you navigate more efficiently:

## Search Navigation
- **`/`** - Focus the search input
- **`Enter`** - When search has exactly one result, select that client
- **`Escape`** - Clear search or close current modal/client

## Client Management
- **`Ctrl+N`** / **`⌘+N`** (Mac) - Add new consumer (when on main list)

## Help & Navigation
- **`?`** - Show keyboard shortcuts help modal
- **`Escape`** - Close any open modal, go back to previous view

## Implementation Details

The hotkey system is implemented using:
- `useGlobalHotkeys` custom hook for managing keyboard event listeners
- Global event listeners that respect input focus states
- Cross-platform support (Ctrl on Windows/Linux, Cmd on Mac)

### Features:
- **Smart Context Awareness**: Hotkeys are disabled when typing in inputs/textareas
- **Modal Hierarchy**: Escape key respects modal stack (help → add client → client details → main list)
- **Simple Search**: Press `/` to quickly focus and select the search input
- **Visual Feedback**: Help modal shows all available shortcuts
- **Accessibility**: Keyboard-only navigation support

### Adding New Hotkeys:
To add new hotkeys, update the `DEFAULT_HOTKEYS` array in `src/hooks/useGlobalHotkeys.ts` and add the corresponding action handler. 