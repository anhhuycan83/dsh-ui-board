# dsh-ui-board

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Powered by Excalidraw](https://img.shields.io/badge/Canvas_Engine-Excalidraw-6965DB)](https://github.com/excalidraw/excalidraw)
[![DeepSeek Harness](https://img.shields.io/badge/Plugin_for-DeepSeek_Harness-2563EB)](https://github.com/deepseek-ai/deepseek-harness)

> Whiteboard & UI wireframe design canvas plugin for **DeepSeek Harness Web** powered by **Excalidraw** with bi-directional AI collaboration.

![UI Board Icon](./icon.svg)

---

## ✨ Features

- **🎨 Powered by [Excalidraw](https://github.com/excalidraw/excalidraw)**:
  - Beloved hand-drawn, sketchy wireframing aesthetic.
  - Infinite virtual canvas with hardware-accelerated smooth zoom and pan.
  - Full shape toolkit: Rectangles, diamonds, ellipses, arrows, lines, freehand draw, text, frames, and eraser.
  - Rich styling controls: Stroke colors, background colors, fill styles (solid, hachure, cross-hatch), stroke widths, and sloppiness.
  - Automatic dark theme synchronization with DeepSeek Harness theme.

- **🖼️ 3 Image Insertion & Paste Methods**:
  - **Clipboard Paste (`Ctrl + V`)**: Copy any screenshot or image (PrtScn, Snipping Tool, web, Figma) and paste directly onto the board.
  - **Toolbar Menu (`🖼️ Image`)**: File picker to insert local images directly onto the canvas.
  - **Drag & Drop**: Drag image files from your computer and drop directly onto the board.
  - **Isolated Dropzone**: Never gets blocked or trapped by host overlays.

- **⚡ Lightning-Fast In-Memory Live Sync**:
  - In-memory backend caching (`RAM-first` architecture): AI reads board state in < 1ms!
  - 300ms debounced real-time persistence to backend and `localStorage`.
  - Visual sketch analysis and structured hierarchy summary for AI discussions.

- **⌨️ Isolated Shortcuts & Zoom**:
  - `Ctrl + Wheel`: Zooms canvas when hovering over board without zooming the browser tab.
  - `Ctrl + +`, `Ctrl + -`, `Ctrl + 0`: Board-scoped zoom in, zoom out, reset zoom.
  - Normal typing in chat box or outside board remains completely unaffected (spacebar, undo, paste work normally).

- **🎨 Multi-Mode Window Layout**:
  - **Dock Right (`◨`)**: Pin board to the right side with smooth responsive chat pushing.
  - **Dock Left (`◧`)**: Pin board to the left side when chat needs room on the right.
  - **Floating Window (`🗗`)**: Freely draggable and resizable modal window across the screen.
  - **Maximize (`🗖`)**: Expand to full-screen workspace.
  - **Drag-to-Resize Divider**: Adjust board width from 360px to 800px on the fly.

- **📁 Board Management & Persistence**:
  - **Inline Renaming**: Click the board title in the header to rename anytime.
  - **Saved Boards Manager (`📁 Boards`)**: Browse all previous boards with search, element count, and last-modified time.
  - **Create New Board (`➕ New Board`)**: Start fresh boards without losing your past work.
  - **Open & Resume (`📂 Open`)**: Switch between past boards seamlessly; resumes right where you left off.
  - **Manual & Auto-Save (`💾 Save`)**: Automatic real-time persistence with explicit save feedback.
  - **Export to File (`💾 Export`)**: Download any board as `.excalidraw.json` file for backup or sharing.
  - **Import from File (`📥 Import JSON`)**: Upload any `.excalidraw.json` file to restore onto your board.

- **🤖 Two-Way AI Collaboration**:
  1. **Visual Vision (`📸 Send to AI`)**: Captures high-res canvas snapshot directly to clipboard for image analysis in chat.
  2. **AI Read (`ui_board_read`)**: AI agent inspects screens, buttons, inputs, labels, and user flows via structured JSON in < 1ms.
  3. **AI Write / Mutate (`ui_board_mutate`)**: AI can programmatically generate new screens, add missing fields/buttons, or wire up flow arrows onto your board in real time!

- **🤖 Two-Way AI Collaboration**:
  1. **Visual Vision (`📸 Send to AI`)**: Captures high-res canvas snapshot directly to clipboard for image analysis in chat.
  2. **AI Read (`ui_board_read`)**: AI agent inspects screens, buttons, inputs, labels, and user flows via structured JSON.
  3. **AI Write / Mutate (`ui_board_mutate`)**: AI can programmatically generate new screens, add missing fields/buttons, or wire up flow arrows onto your board in real time!

---

## 🚀 Installation

In your DeepSeek Harness environment:

```bash
# Add dsh-ui-board to your profile (e.g. web profile)
dsh plugin --profile web add /path/to/dsh-ui-board

# Or link directly from local directory
dsh plugin --profile web add "D:/huy/working/ai/harness/dsh/plugin"
```

Reload your DeepSeek Harness Web GUI (`http://127.0.0.1:3080`). You will see the **🎨 UI Board** button in the conversation toolbar.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Space` + Drag | Pan across canvas |
| `Ctrl` + `Z` | Undo |
| `Ctrl` + `Y` / `Ctrl` + `Shift` + `Z` | Redo |
| `Ctrl` + `V` | Paste image from clipboard |
| `Delete` / `Backspace` | Delete selected element |
| `Ctrl` + Mouse Wheel | Zoom in / Zoom out |
| Double-click element | Edit label / text inline |

---

## 🛠️ Architecture

- **Client (`client.js`)**: React module injected into DSH Web client runtime via `conversation.session.header.actions` slot.
- **Host (`index.js`)**: Cordis plugin registering `/api/ui-board` REST endpoint and two Agent Tools:
  - `ui_board_read`: Scans and summarizes canvas structure into screen hierarchies and flows.
  - `ui_board_mutate`: Adds, updates, deletes, or clears canvas elements on behalf of the AI agent.
- **Persistence**: Sessions save automatically to `~/.dsh/ui-board/board-<sessionId>.json` and browser `localStorage`.

---

## 📄 License

MIT License © 2026 anhhuycan83
