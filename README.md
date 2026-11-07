# dsh-ui-board

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Powered by tldraw](https://img.shields.io/badge/Canvas_Engine-tldraw_v5-FF0080)](https://github.com/tldraw/tldraw)
[![DeepSeek Harness](https://img.shields.io/badge/Plugin_for-DeepSeek_Harness-2563EB)](https://github.com/deepseek-ai/deepseek-harness)

> Whiteboard & UI wireframe design canvas plugin for **DeepSeek Harness Web** powered by **Tldraw** with bi-directional AI collaboration.

![UI Board Icon](./icon.svg)

---

## ✨ Features

- **⚡ World-Class Canvas Powered by [Tldraw](https://github.com/tldraw/tldraw)**:
  - Infinite canvas with hardware-accelerated smooth zoom, pan, pinch, and navigation.
  - Complete shape toolkit: Freehand draw, eraser, arrows, sticky notes, text, frames/screens, rectangles, ellipses, clouds, stars, and shapes.
  - Rich styling controls: Colors, fill patterns, stroke widths, dash styles, fonts, and alignments.
  - Native image drag & drop and clipboard paste (`Ctrl + V`).
  - Automatic dark theme synchronization with DeepSeek Harness theme.

- **🎨 Multi-Mode Window Layout**:
  - **Dock Right (`◨`)**: Pin the board to the right side with smooth responsive chat pushing.
  - **Dock Left (`◧`)**: Pin the board to the left side when chat needs room on the right.
  - **Floating Window (`🗗`)**: Freely draggable and resizable modal window across the screen.
  - **Maximize (`🗖`)**: Expand to full-screen workspace.
  - **Drag-to-Resize Divider**: Adjust board width from 340px to 800px on the fly.

- **📐 Complete UI Wireframe & Design Toolkit**:
  - `👆` **Select & Move (`V`)**: Pick, drag, and position any component.
  - `📱` **Screen Frame (`S`)**: Window / application frame with title bar and traffic lights.
  - `🔘` **Button (`B`)**: Clickable button component with custom label and fill color.
  - `📝` **Text Input Field (`I`)**: Styled input field for forms and search bars.
  - `🔲` **Container / Card (`C`)**: Grouping boxes for content panels and card layouts.
  - `🔤` **Text / Heading (`T`)**: Typography elements for titles, subtitles, and labels.
  - `➡️` **Connector Flow Arrow (`A`)**: Directed arrows with labels for user journeys and page transitions.
  - `✏️` **Freehand Pen (`P`)**: Smooth freehand sketching and annotations.
  - `🖼️` **Insert Image**: Select and embed local images directly onto the canvas.
  - `🧹` **Eraser (`E`)**: Quick click-to-delete tool.

- **🖼️ 3 Image Insertion Methods**:
  - **Toolbar Menu (`🖼️`)**: Native file picker to select one or multiple images.
  - **Drag & Drop**: Drag image files from your computer and drop directly onto the board.
  - **Clipboard Paste (`Ctrl + V`)**: Copy screenshots (from Snipping Tool, PrtScn, Figma, web) and paste instantly.

- **♾️ Infinite Auto-Expanding Canvas (like diagrams.net / draw.io)**:
  - **Right / Bottom expansion**: Drawing or moving objects near boundaries automatically extends the canvas (+600px).
  - **Left / Top expansion**: Placing objects near the top or left boundary shifts elements and view seamlessly (+350px).
  - **Spacebar Pan**: Hold `Space` and drag with mouse to pan smoothly across the canvas.
  - **Zoom Controls**: Zoom In (`+`), Zoom Out (`-`), Reset (`100%`), or `Ctrl + MouseWheel`.

- **📁 Complete Board Management & Persistence**:
  - **Inline Renaming**: Click the board title directly in the header to rename anytime.
  - **Saved Boards Manager (`📁 Boards`)**: Browse all previous boards with search, element count, and last-modified time.
  - **Create New Board (`➕ New Board`)**: Start fresh boards without losing your past work.
  - **Open & Resume (`📂 Open`)**: Switch between past boards seamlessly; resumes right where you left off.
  - **Manual & Auto-Save (`💾 Save`)**: Automatic real-time persistence with explicit save feedback.
  - **Export to File (`💾 Export JSON`)**: Download any board as a `.uiboard.json` file for offline backup or sharing.
  - **Import from File (`📥 Import JSON`)**: Upload any `.json` or `.uiboard.json` file to restore onto your board.

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
