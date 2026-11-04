window.__ModuleLoader__.load({
  id: "dsh-ui-board",
  factory: (require) => {
    const React = require("react");
    const ReactDOM = require("react-dom");
    const h = React.createElement;
    const { useState, useEffect, useRef, useCallback } = React;

    const STYLE_ID = "dsh-ui-board-styles";
    function installStyles() {
      if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        /* UI Board Toolbar Button */
        .uib-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 10px;
          border-radius: var(--dsw-radius-sm, 6px);
          border: 0.5px solid var(--dsw-alias-border-l2, #d1d5db);
          background: var(--dsw-alias-bg-layer-1, #ffffff);
          color: var(--dsw-alias-label-primary, #111827);
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          user-select: none;
        }
        .uib-action-btn:hover {
          background: var(--dsw-alias-interactive-bg-hover, #f3f4f6);
          border-color: var(--dsw-alias-border-l3, #9ca3af);
          color: var(--dsw-alias-state-business-primary, #2563eb);
        }
        .uib-action-btn.active {
          background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #2563eb) 12%, transparent);
          border-color: var(--dsw-alias-state-business-primary, #2563eb);
          color: var(--dsw-alias-state-business-primary, #2563eb);
        }
        .uib-action-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1px 5px;
          font-size: 10px;
          font-weight: 600;
          border-radius: 999px;
          background: var(--dsw-alias-state-business-primary, #2563eb);
          color: #ffffff;
          line-height: 1;
        }

        /* Board Window Container */
        .uib-window {
          display: flex;
          flex-direction: column;
          background: var(--dsw-alias-bg-layer-1, #ffffff);
          color: var(--dsw-alias-label-primary, #111827);
          border: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          overflow: hidden;
          font-family: inherit;
          box-sizing: border-box;
          z-index: 99999;
        }
        .uib-window.side-mode {
          border-radius: 0;
          border-top: none;
          border-bottom: none;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
        }

        /* Layout push when side panel is open - ONLY push centerCol once */
        body.uib-side-right-open .pI_x6G_centerCol {
          margin-right: var(--uib-side-width, 500px) !important;
          transition: margin-right 0.2s cubic-bezier(0.2, 0, 0, 1);
        }

        body.uib-side-left-open .pI_x6G_centerCol {
          margin-left: var(--uib-side-width, 500px) !important;
          transition: margin-left 0.2s cubic-bezier(0.2, 0, 0, 1);
        }

        /* Side panel drag resizer bar */
        .uib-side-resizer {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 8px;
          cursor: ew-resize;
          z-index: 100;
          background: transparent;
          transition: background 0.15s;
        }
        .uib-side-resizer:hover, .uib-side-resizer:active {
          background: var(--dsw-alias-state-business-primary, #2563eb);
        }
        .uib-side-resizer.left {
          left: -4px;
        }
        .uib-side-resizer.right {
          right: -4px;
        }

        /* Header / Title bar */
        .uib-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: var(--dsw-alias-bg-layer-2, #f9fafb);
          border-bottom: 0.5px solid var(--dsw-alias-border-l2, #e5e7eb);
          user-select: none;
          cursor: grab;
        }
        .uib-header:active {
          cursor: grabbing;
        }
        .uib-window.side-mode .uib-header {
          cursor: default;
        }
        .uib-title-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
        }
        .uib-header-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .uib-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          padding: 0;
          border: none;
          background: transparent;
          color: var(--dsw-alias-label-secondary, #6b7280);
          border-radius: var(--dsw-radius-sm, 4px);
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }
        .uib-icon-btn:hover {
          background: var(--dsw-alias-interactive-bg-hover, #e5e7eb);
          color: var(--dsw-alias-label-primary, #111827);
        }

        /* Toolbar 2-row layout */
        .uib-toolbar {
          display: flex;
          flex-direction: column;
          padding: 6px 10px;
          gap: 6px;
          background: var(--dsw-alias-bg-layer-1, #ffffff);
          border-bottom: 0.5px solid var(--dsw-alias-border-l2, #e5e7eb);
          user-select: none;
        }
        .uib-toolbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          width: 100%;
        }
        .uib-tool-group {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .uib-tool-sep {
          width: 1px;
          height: 20px;
          background: var(--dsw-alias-border-l2, #e5e7eb);
          margin: 0 4px;
        }
        .uib-tool-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          font-size: 18px;
          border-radius: var(--dsw-radius-sm, 6px);
          border: 1px solid transparent;
          background: transparent;
          color: var(--dsw-alias-label-secondary, #4b5563);
          cursor: pointer;
          transition: background 0.1s, color 0.1s, border-color 0.1s, transform 0.08s;
        }
        .uib-tool-btn:hover {
          background: var(--dsw-alias-interactive-bg-hover, #f3f4f6);
          color: var(--dsw-alias-label-primary, #111827);
          transform: translateY(-1px);
        }
        .uib-tool-btn.active {
          background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #2563eb) 14%, transparent);
          border-color: var(--dsw-alias-state-business-primary, #2563eb);
          color: var(--dsw-alias-state-business-primary, #2563eb);
          font-weight: 600;
        }
        .uib-tool-btn.btn-text {
          width: auto;
          padding: 0 8px;
          font-size: 11px;
          font-weight: 500;
        }
        .uib-color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 0.1s;
        }
        .uib-color-dot.active {
          border-color: var(--dsw-alias-label-primary, #111827);
          transform: scale(1.15);
        }

        .uib-ai-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 28px;
          padding: 0 10px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 6px;
          border: none;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: #ffffff;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
          transition: opacity 0.15s, transform 0.1s;
        }
        .uib-ai-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        .uib-ai-btn:active {
          transform: translateY(0);
        }

        /* Canvas Area - Infinite scrollable surface like diagrams.net */
        .uib-canvas-container {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: auto;
          background-color: var(--dsw-alias-bg-base, #ffffff);
          background-image: radial-gradient(var(--dsw-alias-border-l3, #cbd5e1) 1.2px, transparent 1.2px);
          background-size: 24px 24px;
          touch-action: none;
        }
        .uib-canvas-container.panning {
          cursor: grab;
        }
        .uib-canvas-container.panning:active {
          cursor: grabbing;
        }
        .uib-canvas-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .uib-canvas-container::-webkit-scrollbar-thumb {
          background: var(--dsw-alias-border-l3, #cbd5e1);
          border-radius: 4px;
        }
        .uib-canvas-container::-webkit-scrollbar-thumb:hover {
          background: var(--dsw-alias-label-tertiary, #9ca3af);
        }
        .uib-canvas-svg {
          display: block;
          transform-origin: 0 0;
        }

        /* Toast notification */
        .uib-toast {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: #1f2937;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          pointer-events: none;
          z-index: 100;
          animation: uib-fade-in 0.2s ease-out;
        }
        @keyframes uib-fade-in {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* Resize Handle */
        .uib-resize-handle {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 14px;
          height: 14px;
          cursor: nwse-resize;
          z-index: 10;
        }
        .uib-resize-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 6px;
          height: 6px;
          border-right: 2px solid var(--dsw-alias-label-tertiary, #9ca3af);
          border-bottom: 2px solid var(--dsw-alias-label-tertiary, #9ca3af);
        }
      `;
      document.head.appendChild(style);
    }

    const COLORS = [
      { name: "Dark", value: "#1f2937" },
      { name: "Blue", value: "#2563eb" },
      { name: "Green", value: "#16a34a" },
      { name: "Red", value: "#dc2626" },
      { name: "Purple", value: "#7c3aed" },
      { name: "Amber", value: "#d97706" }
    ];

    function SvgDockRight() {
      return h("svg", { width: 14, height: 14, viewBox: "0 0 16 16", fill: "currentColor" }, [
        h("rect", { x: 1, y: 2, width: 14, height: 12, rx: 2, fill: "none", stroke: "currentColor", strokeWidth: 1.5 }),
        h("rect", { x: 9.5, y: 3.5, width: 4.5, height: 9, rx: 1, fill: "currentColor" })
      ]);
    }
    function SvgDockLeft() {
      return h("svg", { width: 14, height: 14, viewBox: "0 0 16 16", fill: "currentColor" }, [
        h("rect", { x: 1, y: 2, width: 14, height: 12, rx: 2, fill: "none", stroke: "currentColor", strokeWidth: 1.5 }),
        h("rect", { x: 2, y: 3.5, width: 4.5, height: 9, rx: 1, fill: "currentColor" })
      ]);
    }
    function SvgFloat() {
      return h("svg", { width: 14, height: 14, viewBox: "0 0 16 16", fill: "currentColor" }, [
        h("rect", { x: 2, y: 5, width: 8.5, height: 8.5, rx: 1.5, fill: "none", stroke: "currentColor", strokeWidth: 1.5 }),
        h("path", { d: "M5.5 5V3A1.5 1.5 0 0 1 7 1.5h6A1.5 1.5 0 0 1 14.5 3v6A1.5 1.5 0 0 1 13 10.5h-2", fill: "none", stroke: "currentColor", strokeWidth: 1.5 })
      ]);
    }
    function SvgMaximize() {
      return h("svg", { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5 }, [
        h("rect", { x: 2, y: 2, width: 12, height: 12, rx: 2 })
      ]);
    }
    function SvgClose() {
      return h("svg", { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" }, [
        h("line", { x1: 3.5, y1: 3.5, x2: 12.5, y2: 12.5 }),
        h("line", { x1: 12.5, y1: 3.5, x2: 3.5, y2: 12.5 })
      ]);
    }

    /**
     * Whiteboard Modal Component
     */
    function UIBoardModal({ sessionId, onClose }) {
      const activeSessionId = sessionId ||
        (window.location.hash.match(/#\/s\/([^/?#]+)/)?.[1]) ||
        (window.location.pathname.match(/\/s\/([^/?#]+)/)?.[1]) ||
        "default";
      const [layoutMode, setLayoutMode] = useState("side-right"); // 'floating' | 'side-right' | 'side-left' | 'maximized'
      const [sideWidth, setSideWidth] = useState(500);
      const [pos, setPos] = useState({ x: Math.max(20, window.innerWidth - 820), y: 70 });
      const [size, setSize] = useState({ w: 780, h: 540 });
      const [currentTool, setCurrentTool] = useState("select");
      const [currentColor, setCurrentColor] = useState("#2563eb");
      const [strokeWidth, setStrokeWidth] = useState(2);
      const [elements, setElements] = useState([]);
      const [history, setHistory] = useState([]);
      const [historyIndex, setHistoryIndex] = useState(-1);
      const [selectedId, setSelectedId] = useState(null);
      const [toastMsg, setToastMsg] = useState("");
      const [editingElementId, setEditingElementId] = useState(null);
      const [editText, setEditText] = useState("");
      const [isDragOverFile, setIsDragOverFile] = useState(false);
      const [canvasSize, setCanvasSize] = useState({ width: 3400, height: 2400 });
      const [zoom, setZoom] = useState(1);
      const [isSpacePressed, setIsSpacePressed] = useState(false);

      const isDraggingRef = useRef(false);
      const dragStartPosRef = useRef({ x: 0, y: 0 });
      const isResizingRef = useRef(false);
      const resizeStartRef = useRef({ w: 0, h: 0, x: 0, y: 0 });
      const drawingRef = useRef(null);
      const svgRef = useRef(null);
      const containerRef = useRef(null);
      const isPanningRef = useRef(false);
      const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
      const windowRef = useRef(null);
      const isMouseOverBoardRef = useRef(false);
      const toastTimerRef = useRef(null);
      const fileInputRef = useRef(null);

      const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          const centerCoords = {
            x: Math.round((svgRef.current?.clientWidth || 600) / 2),
            y: Math.round((svgRef.current?.clientHeight || 400) / 2)
          };
          for (let i = 0; i < files.length; i++) {
            insertImageFile(files[i], centerCoords);
          }
        }
        e.target.value = "";
      };

      const showToast = useCallback((msg) => {
        setToastMsg(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToastMsg(""), 3500);
      }, []);

      // Blur any active element so Space doesn't trigger button clicks
      useEffect(() => {
        if (document.activeElement && typeof document.activeElement.blur === "function") {
          document.activeElement.blur();
        }
      }, []);

      // Synchronize side docking layout to adjust main chat space
      useEffect(() => {
        if (layoutMode === "side-right") {
          document.body.classList.add("uib-side-right-open");
          document.body.classList.remove("uib-side-left-open");
          document.documentElement.style.setProperty("--uib-side-width", `${sideWidth}px`);
        } else if (layoutMode === "side-left") {
          document.body.classList.add("uib-side-left-open");
          document.body.classList.remove("uib-side-right-open");
          document.documentElement.style.setProperty("--uib-side-width", `${sideWidth}px`);
        } else {
          document.body.classList.remove("uib-side-right-open", "uib-side-left-open");
        }
        return () => {
          document.body.classList.remove("uib-side-right-open", "uib-side-left-open");
        };
      }, [layoutMode, sideWidth]);

      // Resizing the docked side panel
      const handleSideResizeMouseDown = (e, side) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startW = sideWidth;
        const handleMouseMove = (ev) => {
          const deltaX = ev.clientX - startX;
          let nextW = side === "right" ? startW - deltaX : startW + deltaX;
          nextW = Math.max(340, Math.min(window.innerWidth - 320, nextW));
          setSideWidth(nextW);
        };
        const handleMouseUp = () => {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      };

      // Push state into undo history
      const commitElements = useCallback((nextElements) => {
        setElements(nextElements);
        setHistory(prev => {
          const trimmed = prev.slice(0, historyIndex + 1);
          return [...trimmed, nextElements];
        });
        setHistoryIndex(prev => prev + 1);

        // Auto save to server and localStorage
        const sid = activeSessionId;
        try {
          localStorage.setItem(`dsh_ui_board_${sid}`, JSON.stringify(nextElements));
        } catch (_) {}

        fetch(`/api/ui-board?session=${encodeURIComponent(sid)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: sid, elements: nextElements })
        }).catch(() => {});
      }, [historyIndex, activeSessionId]);

      // Insert image file from drag-drop or paste
      const insertImageFile = useCallback((file, coords) => {
        if (!file || !file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const img = new Image();
          img.onload = () => {
            const maxW = 420;
            const maxH = 320;
            let w = img.naturalWidth || 300;
            let h = img.naturalHeight || 200;
            if (w > maxW || h > maxH) {
              const ratio = Math.min(maxW / w, maxH / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
            const posX = coords ? Math.max(10, coords.x - Math.round(w / 2)) : 60;
            const posY = coords ? Math.max(10, coords.y - Math.round(h / 2)) : 60;
            const newImage = {
              id: `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: "image",
              x: posX,
              y: posY,
              width: w,
              height: h,
              src: dataUrl,
              label: file.name || "Hình ảnh"
            };
            setElements(prev => {
              const next = [...prev, newImage];
              commitElements(next);
              return next;
            });
            setSelectedId(newImage.id);
            showToast(`✅ Added image "${file.name || 'Image'}" to board!`);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      }, [commitElements, showToast]);

      // Paste image from clipboard (Ctrl+V)
      useEffect(() => {
        const handlePaste = (e) => {
          if (editingElementId) return;
          const items = e.clipboardData?.items;
          if (!items) return;
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type && item.type.indexOf("image") !== -1) {
              e.preventDefault();
              const file = item.getAsFile();
              if (file) {
                const centerCoords = {
                  x: Math.round((svgRef.current?.clientWidth || 600) / 2),
                  y: Math.round((svgRef.current?.clientHeight || 400) / 2)
                };
                insertImageFile(file, centerCoords);
                return;
              }
            }
          }
        };
        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
      }, [editingElementId, insertImageFile]);

      // Load initial elements
      useEffect(() => {
        const sid = activeSessionId;
        // Check localStorage first for instant display
        try {
          const cached = localStorage.getItem(`dsh_ui_board_${sid}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setElements(parsed);
              setHistory([parsed]);
              setHistoryIndex(0);
            }
          }
        } catch (_) {}

        // Fetch from server
        fetch(`/api/ui-board?session=${encodeURIComponent(sid)}`)
          .then(res => res.json())
          .then(data => {
            if (data?.ok && Array.isArray(data.elements)) {
              setElements(data.elements);
              setHistory([data.elements]);
              setHistoryIndex(0);
            }
          })
          .catch(() => {});
      }, [activeSessionId]);

      // Periodic poll from server to receive AI modifications (ui_board_mutate)
      useEffect(() => {
        const sid = activeSessionId;
        const interval = setInterval(() => {
          fetch(`/api/ui-board?session=${encodeURIComponent(sid)}`)
            .then(res => res.json())
            .then(data => {
              if (data?.ok && Array.isArray(data.elements)) {
                // If element count or content changed from external (e.g. AI tool)
                setElements(curr => {
                  if (JSON.stringify(curr) !== JSON.stringify(data.elements)) {
                    return data.elements;
                  }
                  return curr;
                });
              }
            })
            .catch(() => {});
        }, 3000);
        return () => clearInterval(interval);
      }, [activeSessionId]);

      // Undo / Redo
      const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
          const nextIdx = historyIndex - 1;
          setHistoryIndex(nextIdx);
          setElements(history[nextIdx]);
          const sid = activeSessionId;
          fetch(`/api/ui-board?session=${encodeURIComponent(sid)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: sid, elements: history[nextIdx] })
          }).catch(() => {});
        }
      }, [history, historyIndex, activeSessionId]);

      const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
          const nextIdx = historyIndex + 1;
          setHistoryIndex(nextIdx);
          setElements(history[nextIdx]);
          const sid = activeSessionId;
          fetch(`/api/ui-board?session=${encodeURIComponent(sid)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: sid, elements: history[nextIdx] })
          }).catch(() => {});
        }
      }, [history, historyIndex, activeSessionId]);

      // Window drag handler
      const handleHeaderMouseDown = (e) => {
        if (layoutMode !== "floating") return;
        if (e.target.closest("button")) return;
        isDraggingRef.current = true;
        dragStartPosRef.current = {
          x: e.clientX - pos.x,
          y: e.clientY - pos.y
        };
        const handleMouseMove = (ev) => {
          if (!isDraggingRef.current) return;
          setPos({
            x: Math.max(10, Math.min(window.innerWidth - 100, ev.clientX - dragStartPosRef.current.x)),
            y: Math.max(10, Math.min(window.innerHeight - 60, ev.clientY - dragStartPosRef.current.y))
          });
        };
        const handleMouseUp = () => {
          isDraggingRef.current = false;
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      };

      // Window resize handler
      const handleResizeMouseDown = (e) => {
        e.stopPropagation();
        isResizingRef.current = true;
        resizeStartRef.current = {
          w: size.w,
          h: size.h,
          x: e.clientX,
          y: e.clientY
        };
        const handleMouseMove = (ev) => {
          if (!isResizingRef.current) return;
          const deltaX = ev.clientX - resizeStartRef.current.x;
          const deltaY = ev.clientY - resizeStartRef.current.y;
          setSize({
            w: Math.max(450, resizeStartRef.current.w + deltaX),
            h: Math.max(350, resizeStartRef.current.h + deltaY)
          });
        };
        const handleMouseUp = () => {
          isResizingRef.current = false;
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      };

      // Canvas pointer handlers for drawing & auto-expansion
      const getSvgCoordinates = (e) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
          x: Math.round((e.clientX - rect.left) / zoom),
          y: Math.round((e.clientY - rect.top) / zoom)
        };
      };

      const handleCanvasMouseDown = (e) => {
        if (e.target.closest(".uib-edit-input")) return;

        // Middle mouse or Spacebar panning
        if (e.button === 1 || isSpacePressed) {
          e.preventDefault();
          isPanningRef.current = true;
          panStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: containerRef.current?.scrollLeft || 0,
            scrollTop: containerRef.current?.scrollTop || 0
          };
          return;
        }

        const pt = getSvgCoordinates(e);

        if (currentTool === "select") {
          // If clicked on an element, select it
          const clickedElemId = e.target.getAttribute("data-elem-id") ||
                                e.target.closest("[data-elem-id]")?.getAttribute("data-elem-id");
          if (clickedElemId) {
            setSelectedId(clickedElemId);
            const targetElem = elements.find(el => el.id === clickedElemId);
            if (targetElem) {
              drawingRef.current = {
                type: "moving",
                id: clickedElemId,
                startX: pt.x,
                startY: pt.y,
                initialElemX: targetElem.x,
                initialElemY: targetElem.y
              };
            }
          } else {
            setSelectedId(null);
            setEditingElementId(null);
          }
          return;
        }

        if (currentTool === "eraser") {
          const clickedElemId = e.target.getAttribute("data-elem-id") ||
                                e.target.closest("[data-elem-id]")?.getAttribute("data-elem-id");
          if (clickedElemId) {
            commitElements(elements.filter(el => el.id !== clickedElemId));
          }
          return;
        }

        if (currentTool === "pen") {
          const newId = `pen_${Date.now()}`;
          const newStroke = {
            id: newId,
            type: "pen",
            points: [[pt.x, pt.y]],
            color: currentColor,
            lineWidth: strokeWidth
          };
          drawingRef.current = { type: "pen", id: newId, points: [[pt.x, pt.y]] };
          setElements(prev => [...prev, newStroke]);
          return;
        }

        // For box, screen, button, input, arrow, text
        const newId = `${currentTool}_${Date.now()}`;
        drawingRef.current = {
          type: currentTool,
          id: newId,
          startX: pt.x,
          startY: pt.y
        };
      };

      const handleCanvasMouseMove = (e) => {
        // Handle canvas panning
        if (isPanningRef.current && containerRef.current) {
          const dx = e.clientX - panStartRef.current.x;
          const dy = e.clientY - panStartRef.current.y;
          containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
          containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
          return;
        }

        if (!drawingRef.current) return;
        const pt = getSvgCoordinates(e);
        const draw = drawingRef.current;

        // Auto-scroll when pointer reaches container edges
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const margin = 45;
          const speed = 18;
          if (e.clientX > containerRect.right - margin) {
            containerRef.current.scrollLeft += speed;
          } else if (e.clientX < containerRect.left + margin) {
            containerRef.current.scrollLeft -= speed;
          }
          if (e.clientY > containerRect.bottom - margin) {
            containerRef.current.scrollTop += speed;
          } else if (e.clientY < containerRect.top + margin) {
            containerRef.current.scrollTop -= speed;
          }
        }

        // Auto expand canvas right/bottom if reaching edge
        const pad = 200;
        if (pt.x > canvasSize.width - pad || pt.y > canvasSize.height - pad) {
          setCanvasSize(prev => ({
            width: Math.max(prev.width, pt.x + 600),
            height: Math.max(prev.height, pt.y + 600)
          }));
        }

        if (draw.type === "moving") {
          const dx = pt.x - draw.startX;
          const dy = pt.y - draw.startY;
          setElements(prev => prev.map(el => {
            if (el.id === draw.id) {
              return { ...el, x: Math.max(0, draw.initialElemX + dx), y: Math.max(0, draw.initialElemY + dy) };
            }
            return el;
          }));
          return;
        }

        if (draw.type === "pen") {
          draw.points.push([pt.x, pt.y]);
          setElements(prev => prev.map(el => {
            if (el.id === draw.id) {
              return { ...el, points: [...draw.points] };
            }
            return el;
          }));
          return;
        }

        // Preview rectangle or arrow while dragging
        const minX = Math.min(draw.startX, pt.x);
        const minY = Math.min(draw.startY, pt.y);
        const w = Math.max(20, Math.abs(pt.x - draw.startX));
        const h = Math.max(20, Math.abs(pt.y - draw.startY));

        let defaultLabel = "";
        let fill = "transparent";
        if (draw.type === "screen") {
          defaultLabel = "New Screen";
          fill = "rgba(37, 99, 235, 0.04)";
        } else if (draw.type === "button") {
          defaultLabel = "Button";
          fill = currentColor;
        } else if (draw.type === "input") {
          defaultLabel = "Enter text...";
          fill = "#ffffff";
        } else if (draw.type === "box") {
          defaultLabel = "Container";
          fill = "transparent";
        } else if (draw.type === "text") {
          defaultLabel = "Heading";
        }

        const previewElement = {
          id: draw.id,
          type: draw.type,
          x: minX,
          y: minY,
          width: draw.type === "button" ? Math.min(44, h) : (draw.type === "input" ? Math.min(38, h) : h),
          height: draw.type === "button" ? Math.min(44, h) : (draw.type === "input" ? Math.min(38, h) : h),
          label: defaultLabel,
          color: currentColor,
          fill: fill,
          lineWidth: strokeWidth,
          startX: draw.startX,
          startY: draw.startY,
          endX: pt.x,
          endY: pt.y
        };

        setElements(prev => {
          const filtered = prev.filter(el => el.id !== draw.id);
          return [...filtered, previewElement];
        });
      };

      const handleCanvasMouseUp = () => {
        if (isPanningRef.current) {
          isPanningRef.current = false;
        }

        if (!drawingRef.current) return;
        const draw = drawingRef.current;
        drawingRef.current = null;

        let nextList = elements;
        if (draw.type !== "moving" && draw.type !== "pen") {
          setCurrentTool("select");
          setSelectedId(draw.id);
        }

        // Auto-expand left/top if an element was placed near left/top border (< 50px)
        let minX = Infinity;
        let minY = Infinity;
        for (const el of nextList) {
          if (el.type === "pen" && el.points) {
            for (const [px, py] of el.points) {
              if (px < minX) minX = px;
              if (py < minY) minY = py;
            }
          } else {
            if (el.x !== undefined && el.x < minX) minX = el.x;
            if (el.y !== undefined && el.y < minY) minY = el.y;
            if (el.startX !== undefined && el.startX < minX) minX = el.startX;
            if (el.endX !== undefined && el.endX < minX) minX = el.endX;
            if (el.startY !== undefined && el.startY < minY) minY = el.startY;
            if (el.endY !== undefined && el.endY < minY) minY = el.endY;
          }
        }

        if (minX < 50 || minY < 50) {
          const shiftX = minX < 50 ? Math.max(0, 350 - Math.floor(minX)) : 0;
          const shiftY = minY < 50 ? Math.max(0, 250 - Math.floor(minY)) : 0;
          if (shiftX > 0 || shiftY > 0) {
            nextList = nextList.map(el => {
              if (el.type === "pen" && el.points) {
                return { ...el, points: el.points.map(([px, py]) => [px + shiftX, py + shiftY]) };
              }
              return {
                ...el,
                x: (el.x || 0) + shiftX,
                y: (el.y || 0) + shiftY,
                ...el.startX !== undefined ? { startX: el.startX + shiftX, endX: el.endX + shiftX } : {},
                ...el.startY !== undefined ? { startY: el.startY + shiftY, endY: el.endY + shiftY } : {}
              };
            });
            setCanvasSize(prev => ({
              width: prev.width + shiftX,
              height: prev.height + shiftY
            }));
            if (containerRef.current) {
              containerRef.current.scrollLeft += shiftX * zoom;
              containerRef.current.scrollTop += shiftY * zoom;
            }
            showToast("✨ Canvas automatically expanded!");
          }
        }

        commitElements(nextList);
      };

      // Double-click to edit text label
      const handleElementDoubleClick = (el, e) => {
        e.stopPropagation();
        setEditingElementId(el.id);
        setEditText(el.label || "");
      };

      const handleSaveTextEdit = () => {
        if (!editingElementId) return;
        const updated = elements.map(el => {
          if (el.id === editingElementId) {
            return { ...el, label: editText };
          }
          return el;
        });
        commitElements(updated);
        setEditingElementId(null);
      };

      // Delete selected element
      const handleDeleteSelected = useCallback(() => {
        if (!selectedId) return;
        commitElements(elements.filter(el => el.id !== selectedId));
        setSelectedId(null);
        setEditingElementId(null);
      }, [elements, selectedId, commitElements]);

      // Keyboard shortcuts & Spacebar pan
      useEffect(() => {
        const isEditingInDocument = (target) => {
          if (!target) return false;
          return (
            target.isContentEditable ||
            target.getAttribute?.("contenteditable") === "true" ||
            Boolean(target.closest?.("input, textarea, [contenteditable='true'], [data-conversation-region], [data-composer-input]"))
          );
        };

        const handleKeyDown = (e) => {
          if (editingElementId) {
            if (e.key === "Enter") handleSaveTextEdit();
            if (e.key === "Escape") setEditingElementId(null);
            return;
          }

          // If user is typing in chat box or any input outside board, never intercept!
          if (isEditingInDocument(e.target)) {
            return;
          }

          // Only intercept shortcuts when mouse is hovering inside the board or focused on it
          if (!isMouseOverBoardRef.current && !windowRef.current?.contains(document.activeElement)) {
            return;
          }

          if (e.code === "Space") {
            e.preventDefault();
            setIsSpacePressed(true);
          }
          if (e.key === "Delete" || e.key === "Backspace") {
            handleDeleteSelected();
          }
          if (e.ctrlKey && e.key === "z") {
            e.preventDefault();
            handleUndo();
          }
          if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
            e.preventDefault();
            handleRedo();
          }
        };

        const handleKeyUp = (e) => {
          if (isEditingInDocument(e.target)) {
            return;
          }
          if (e.code === "Space") {
            if (isMouseOverBoardRef.current) {
              e.preventDefault();
            }
            setIsSpacePressed(false);
          }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
          window.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("keyup", handleKeyUp);
        };
      }, [editingElementId, editText, handleDeleteSelected, handleUndo, handleRedo]);

      // Copy Snapshot to Clipboard and Sync to AI
      const handleSendSnapshotToAi = async () => {
        if (!svgRef.current) return;
        try {
          const svgElement = svgRef.current;
          const serializer = new XMLSerializer();
          let source = serializer.serializeToString(svgElement);

          // Add XML namespaces if not present
          if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
          }

          const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
          const URLObj = window.URL || window.webkitURL || window;
          const blobURL = URLObj.createObjectURL(svgBlob);

          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = svgElement.clientWidth || 800;
            canvas.height = svgElement.clientHeight || 500;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URLObj.revokeObjectURL(blobURL);

            canvas.toBlob(async (pngBlob) => {
              if (pngBlob && navigator.clipboard && navigator.clipboard.write) {
                try {
                  await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": pngBlob })
                  ]);
                  showToast("✅ Board snapshot copied to clipboard! Press Ctrl+V in chat to discuss with AI.");
                } catch (err) {
                  showToast("⚠️ Could not write to clipboard: " + err.message);
                }
              } else {
                showToast("✅ Snapshot ready!");
              }
            }, "image/png");
          };
          img.src = blobURL;

          // Also trigger server sync so AI tools have the exact data
          const sid = activeSessionId;
          fetch(`/api/ui-board?session=${encodeURIComponent(sid)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: sid, elements })
          }).catch(() => {});

        } catch (err) {
          showToast("Snapshot error: " + err.message);
        }
      };

      // Inline styles for window layout
      let windowStyle = {
        position: "fixed",
        zIndex: 99999
      };
      if (layoutMode === "floating") {
        windowStyle = {
          ...windowStyle,
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${size.w}px`,
          height: `${size.h}px`
        };
      } else if (layoutMode === "side-right") {
        windowStyle = {
          ...windowStyle,
          top: 0,
          right: 0,
          bottom: 0,
          width: `${sideWidth}px`,
          height: "100vh",
          borderLeft: "1px solid var(--dsw-alias-border-l2, #e5e7eb)"
        };
      } else if (layoutMode === "side-left") {
        windowStyle = {
          ...windowStyle,
          top: 0,
          left: 0,
          bottom: 0,
          width: `${sideWidth}px`,
          height: "100vh",
          borderRight: "1px solid var(--dsw-alias-border-l2, #e5e7eb)"
        };
      } else if (layoutMode === "maximized") {
        windowStyle = {
          ...windowStyle,
          inset: "16px",
          width: "calc(100vw - 32px)",
          height: "calc(100vh - 32px)"
        };
      }

      const isSideMode = layoutMode === "side-right" || layoutMode === "side-left";

      return h("div", {
        ref: windowRef,
        className: `uib-window ${isSideMode ? "side-mode" : ""}`,
        style: windowStyle,
        onMouseEnter: () => { isMouseOverBoardRef.current = true; },
        onMouseLeave: () => { isMouseOverBoardRef.current = false; setIsSpacePressed(false); }
      }, [
        // Side resizer bar
        layoutMode === "side-right" ? h("div", {
          className: "uib-side-resizer left",
          title: "Drag to resize panel width",
          onMouseDown: (e) => handleSideResizeMouseDown(e, "right")
        }) : null,
        layoutMode === "side-left" ? h("div", {
          className: "uib-side-resizer right",
          title: "Drag to resize panel width",
          onMouseDown: (e) => handleSideResizeMouseDown(e, "left")
        }) : null,

        // 1. Header Bar
        h("div", {
          className: "uib-header",
          onMouseDown: handleHeaderMouseDown
        }, [
          h("div", { className: "uib-title-cluster" }, [
            h("span", { style: { fontSize: "16px" } }, "🎨"),
            h("span", null, "UI Design & Wireframe Board"),
            h("span", { className: "uib-action-badge" }, `${elements.length} ${elements.length === 1 ? "element" : "elements"}`)
          ]),
          h("div", { className: "uib-header-controls" }, [
            // Dock Right button
            h("button", {
              className: `uib-icon-btn ${layoutMode === "side-right" ? "active" : ""}`,
              title: "Dock to Right",
              onClick: () => setLayoutMode("side-right")
            }, h(SvgDockRight)),
            // Dock Left button
            h("button", {
              className: `uib-icon-btn ${layoutMode === "side-left" ? "active" : ""}`,
              title: "Dock to Left",
              onClick: () => setLayoutMode("side-left")
            }, h(SvgDockLeft)),
            // Float button
            h("button", {
              className: `uib-icon-btn ${layoutMode === "floating" ? "active" : ""}`,
              title: "Float Window",
              onClick: () => setLayoutMode("floating")
            }, h(SvgFloat)),
            // Maximize button
            h("button", {
              className: `uib-icon-btn ${layoutMode === "maximized" ? "active" : ""}`,
              title: layoutMode === "maximized" ? "Restore Window" : "Maximize Window",
              onClick: () => setLayoutMode(curr => curr === "maximized" ? "side-right" : "maximized")
            }, h(SvgMaximize)),
            // Close button
            h("button", {
              className: "uib-icon-btn",
              title: "Close Board",
              onClick: onClose
            }, h(SvgClose))
          ])
        ]),

        // 2. Toolbar (2 compact rows)
        h("div", { className: "uib-toolbar" }, [
          // Row 1: Component & Drawing Tools (Icon-only, large & clean)
          h("div", { className: "uib-toolbar-row" }, [
            h("button", {
              className: `uib-tool-btn ${currentTool === "select" ? "active" : ""}`,
              onClick: () => setCurrentTool("select"),
              title: "Select & Move (V)"
            }, "👆"),
            h("button", {
              className: `uib-tool-btn ${currentTool === "screen" ? "active" : ""}`,
              onClick: () => setCurrentTool("screen"),
              title: "Screen / Window Frame (S)"
            }, "📱"),
            h("button", {
              className: `uib-tool-btn ${currentTool === "button" ? "active" : ""}`,
              onClick: () => setCurrentTool("button"),
              title: "Button Component (B)"
            }, "🔘"),
            h("button", {
              className: `uib-tool-btn ${currentTool === "input" ? "active" : ""}`,
              onClick: () => setCurrentTool("input"),
              title: "Text Input Field (I)"
            }, "📝"),
            h("button", {
              className: `uib-tool-btn ${currentTool === "box" ? "active" : ""}`,
              onClick: () => setCurrentTool("box"),
              title: "Container / Card (C)"
            }, "🔲"),
            h("button", {
              className: `uib-tool-btn ${currentTool === "text" ? "active" : ""}`,
              onClick: () => setCurrentTool("text"),
              title: "Text / Heading (T)"
            }, "🔤"),
            h("button", {
              className: `uib-tool-btn ${currentTool === "arrow" ? "active" : ""}`,
              onClick: () => setCurrentTool("arrow"),
              title: "Connector Flow Arrow (A)"
            }, "➡️"),
            h("button", {
              className: `uib-tool-btn ${currentTool === "pen" ? "active" : ""}`,
              onClick: () => setCurrentTool("pen"),
              title: "Freehand Pen (P)"
            }, "✏️"),
            h("button", {
              className: "uib-tool-btn",
              onClick: () => fileInputRef.current?.click(),
              title: "Insert Image from Computer"
            }, "🖼️"),
            h("button", {
              className: `uib-tool-btn ${currentTool === "eraser" ? "active" : ""}`,
              onClick: () => setCurrentTool("eraser"),
              title: "Eraser (E)"
            }, "🧹")
          ]),

          // Row 2: Colors, Stroke, Actions & AI Button
          h("div", { className: "uib-toolbar-row" }, [
            h("div", { className: "uib-tool-group" }, [
              // Colors
              ...COLORS.map(c => h("div", {
                key: c.value,
                className: `uib-color-dot ${currentColor === c.value ? "active" : ""}`,
                style: { backgroundColor: c.value },
                onClick: () => {
                  setCurrentColor(c.value);
                  if (selectedId) {
                    commitElements(elements.map(el => el.id === selectedId ? { ...el, color: c.value } : el));
                  }
                },
                title: c.name
              })),
              h("div", { className: "uib-tool-sep" }),
              // Stroke width
              h("button", {
                className: `uib-tool-btn btn-text ${strokeWidth === 1.5 ? "active" : ""}`,
                onClick: () => setStrokeWidth(1.5),
                title: "Thin stroke (1.5px)"
              }, "— Thin"),
              h("button", {
                className: `uib-tool-btn btn-text ${strokeWidth === 3 ? "active" : ""}`,
                onClick: () => setStrokeWidth(3),
                title: "Thick stroke (3px)"
              }, "━ Thick"),
              h("div", { className: "uib-tool-sep" }),
              // History actions
              h("button", {
                className: "uib-tool-btn",
                onClick: handleUndo,
                disabled: historyIndex <= 0,
                title: "Undo (Ctrl+Z)"
              }, "↩️"),
              h("button", {
                className: "uib-tool-btn",
                onClick: handleRedo,
                disabled: historyIndex >= history.length - 1,
                title: "Redo (Ctrl+Y)"
              }, "↪️"),
              h("button", {
                className: "uib-tool-btn",
                onClick: () => {
                  if (window.confirm("Are you sure you want to clear the entire board?")) {
                    commitElements([]);
                  }
                },
                title: "Clear all"
              }, "🗑️"),

              h("div", { className: "uib-tool-sep" }),

              // Zoom controls
              h("button", {
                className: "uib-tool-btn",
                onClick: () => setZoom(z => Math.max(0.4, Number((z - 0.15).toFixed(2)))),
                title: "Zoom out"
              }, "🔍 -"),
              h("button", {
                className: "uib-tool-btn btn-text",
                onClick: () => setZoom(1),
                title: "Reset zoom (100%)"
              }, `${Math.round(zoom * 100)}%`),
              h("button", {
                className: "uib-tool-btn",
                onClick: () => setZoom(z => Math.min(2.2, Number((z + 0.15).toFixed(2)))),
                title: "Zoom in"
              }, "🔍 +")
            ]),

            // AI Action Button on the right
            h("button", {
              className: "uib-ai-btn",
              onClick: handleSendSnapshotToAi,
              title: "Copy snapshot to clipboard and sync data with AI"
            }, "📸 Send to AI")
          ])
        ]),

        // Hidden file input for Insert Image button
        h("input", {
          ref: fileInputRef,
          type: "file",
          accept: "image/*",
          multiple: true,
          style: { display: "none" },
          onChange: handleFileInputChange
        }),

        // 3. Canvas Container
        h("div", {
          ref: containerRef,
          className: `uib-canvas-container ${isSpacePressed ? "panning" : ""}`,
          onMouseDown: handleCanvasMouseDown,
          onMouseMove: handleCanvasMouseMove,
          onMouseUp: handleCanvasMouseUp,
          onWheel: (e) => {
            if (e.ctrlKey) {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              setZoom(z => Math.max(0.4, Math.min(2.2, Number((z + delta).toFixed(2)))));
            }
          },
          onDragOver: (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "copy";
          },
          onDragEnter: (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverFile(true);
          },
          onDragLeave: (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.currentTarget === e.target) setIsDragOverFile(false);
          },
          onDrop: (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverFile(false);
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
              const coords = getSvgCoordinates(e);
              for (let i = 0; i < files.length; i++) {
                insertImageFile(files[i], coords);
              }
            }
          }
        }, [
          // Drag file overlay
          isDragOverFile ? h("div", {
            style: {
              position: "absolute",
              inset: "16px",
              zIndex: 90,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              background: "rgba(37, 99, 235, 0.08)",
              border: "2px dashed #2563eb",
              borderRadius: "12px",
              pointerEvents: "none",
              color: "#2563eb",
              fontWeight: 600,
              fontSize: "15px"
            }
          }, [
            h("span", { style: { fontSize: "36px" } }, "📥"),
            h("span", null, "Drop image here to insert onto board")
          ]) : null,

          h("svg", {
            ref: svgRef,
            className: "uib-canvas-svg",
            style: {
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              transform: `scale(${zoom})`
            }
          }, [
            // Definitions: arrowheads
            h("defs", { key: "defs" }, [
              h("marker", {
                id: "uib-arrowhead",
                viewBox: "0 0 10 10",
                refX: 8,
                refY: 5,
                markerWidth: 6,
                markerHeight: 6,
                orient: "auto-start-reverse"
              }, [
                h("path", { d: "M 0 1 L 10 5 L 0 9 z", fill: currentColor })
              ])
            ]),

            // Render all elements
            ...elements.map(el => {
              const isSelected = selectedId === el.id;

              if (el.type === "image") {
                return h("g", {
                  key: el.id,
                  "data-elem-id": el.id,
                  onDoubleClick: (e) => handleElementDoubleClick(el, e)
                }, [
                  h("image", {
                    href: el.src,
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    preserveAspectRatio: "none",
                    style: {
                      cursor: currentTool === "select" ? "move" : "default"
                    }
                  }),
                  isSelected ? h("rect", {
                    x: el.x - 2,
                    y: el.y - 2,
                    width: el.width + 4,
                    height: el.height + 4,
                    fill: "none",
                    stroke: "#2563eb",
                    strokeWidth: 2,
                    strokeDasharray: "4 4"
                  }) : null
                ]);
              }

              if (el.type === "pen") {
                const points = el.points || [];
                if (points.length < 2) return null;
                const pathData = points.reduce((acc, [px, py], idx) => {
                  return idx === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
                }, "");
                return h("path", {
                  key: el.id,
                  "data-elem-id": el.id,
                  d: pathData,
                  stroke: el.color || "#1f2937",
                  strokeWidth: el.lineWidth || 2,
                  fill: "none",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  style: { cursor: currentTool === "select" ? "move" : "default" }
                });
              }

              if (el.type === "arrow") {
                const sx = el.startX ?? el.x;
                const sy = el.startY ?? el.y;
                const ex = el.endX ?? (el.x + el.width);
                const ey = el.endY ?? (el.y + el.height);
                return h("g", {
                  key: el.id,
                  "data-elem-id": el.id,
                  onDoubleClick: (e) => handleElementDoubleClick(el, e)
                }, [
                  h("line", {
                    x1: sx,
                    y1: sy,
                    x2: ex,
                    y2: ey,
                    stroke: el.color || "#2563eb",
                    strokeWidth: el.lineWidth || 2.5,
                    markerEnd: "url(#uib-arrowhead)"
                  }),
                  el.label ? h("text", {
                    x: (sx + ex) / 2,
                    y: (sy + ey) / 2 - 8,
                    fill: el.color || "#2563eb",
                    fontSize: 11,
                    fontWeight: 600,
                    textAnchor: "middle"
                  }, el.label) : null
                ]);
              }

              if (el.type === "screen") {
                return h("g", {
                  key: el.id,
                  "data-elem-id": el.id,
                  onDoubleClick: (e) => handleElementDoubleClick(el, e)
                }, [
                  // Outer window
                  h("rect", {
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    rx: 8,
                    fill: el.fill || "rgba(37, 99, 235, 0.03)",
                    stroke: isSelected ? "#2563eb" : (el.color || "#3b82f6"),
                    strokeWidth: isSelected ? 2.5 : (el.lineWidth || 2),
                    strokeDasharray: isSelected ? "4 4" : "none"
                  }),
                  // Window header bar
                  h("rect", {
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: 28,
                    rx: 8,
                    fill: el.color || "#3b82f6",
                    fillOpacity: 0.15
                  }),
                  h("line", {
                    x1: el.x,
                    y1: el.y + 28,
                    x2: el.x + el.width,
                    y2: el.y + 28,
                    stroke: el.color || "#3b82f6",
                    strokeWidth: 1
                  }),
                  // Window dots
                  h("circle", { cx: el.x + 12, cy: el.y + 14, r: 4, fill: "#ef4444" }),
                  h("circle", { cx: el.x + 24, cy: el.y + 14, r: 4, fill: "#f59e0b" }),
                  h("circle", { cx: el.x + 36, cy: el.y + 14, r: 4, fill: "#10b981" }),
                  // Window title
                  h("text", {
                    x: el.x + 48,
                    y: el.y + 18,
                    fill: "var(--dsw-alias-label-primary, #111827)",
                    fontSize: 12,
                    fontWeight: 600
                  }, el.label || "Screen")
                ]);
              }

              if (el.type === "button") {
                return h("g", {
                  key: el.id,
                  "data-elem-id": el.id,
                  onDoubleClick: (e) => handleElementDoubleClick(el, e)
                }, [
                  h("rect", {
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    rx: 6,
                    fill: el.color || "#2563eb",
                    stroke: isSelected ? "#111827" : "transparent",
                    strokeWidth: isSelected ? 2 : 0
                  }),
                  h("text", {
                    x: el.x + el.width / 2,
                    y: el.y + el.height / 2 + 4,
                    fill: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                    textAnchor: "middle"
                  }, el.label || "Button")
                ]);
              }

              if (el.type === "input") {
                return h("g", {
                  key: el.id,
                  "data-elem-id": el.id,
                  onDoubleClick: (e) => handleElementDoubleClick(el, e)
                }, [
                  h("rect", {
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    rx: 5,
                    fill: "#ffffff",
                    stroke: isSelected ? "#2563eb" : (el.color || "#9ca3af"),
                    strokeWidth: isSelected ? 2 : 1.2
                  }),
                  h("text", {
                    x: el.x + 10,
                    y: el.y + el.height / 2 + 4,
                    fill: "#6b7280",
                    fontSize: 12,
                    fontStyle: "italic"
                  }, el.label || "Enter text...")
                ]);
              }

              if (el.type === "text") {
                return h("g", {
                  key: el.id,
                  "data-elem-id": el.id,
                  onDoubleClick: (e) => handleElementDoubleClick(el, e)
                }, [
                  h("text", {
                    x: el.x,
                    y: el.y + 16,
                    fill: el.color || "#111827",
                    fontSize: 14,
                    fontWeight: 600
                  }, el.label || "Text"),
                  isSelected ? h("rect", {
                    x: el.x - 4,
                    y: el.y,
                    width: Math.max(80, (el.label?.length || 5) * 9 + 8),
                    height: 24,
                    fill: "none",
                    stroke: "#2563eb",
                    strokeWidth: 1.5,
                    strokeDasharray: "2 2"
                  }) : null
                ]);
              }

              // Default: Box / Container
              return h("g", {
                key: el.id,
                "data-elem-id": el.id,
                onDoubleClick: (e) => handleElementDoubleClick(el, e)
              }, [
                h("rect", {
                  x: el.x,
                  y: el.y,
                  width: el.width,
                  height: el.height,
                  rx: 6,
                  fill: el.fill || "transparent",
                  stroke: isSelected ? "#2563eb" : (el.color || "#9ca3af"),
                  strokeWidth: isSelected ? 2 : (el.lineWidth || 1.5),
                  strokeDasharray: el.type === "box" ? "4 4" : "none"
                }),
                el.label ? h("text", {
                  x: el.x + 8,
                  y: el.y + 16,
                  fill: el.color || "#4b5563",
                  fontSize: 11,
                  fontWeight: 500
                }, el.label) : null
              ]);
            })
          ]),

          // Inline text editing overlay
          editingElementId ? (() => {
            const el = elements.find(item => item.id === editingElementId);
            if (!el) return null;
            return h("div", {
              style: {
                position: "absolute",
                left: `${el.x}px`,
                top: `${el.y}px`,
                zIndex: 20
              }
            }, [
              h("input", {
                className: "uib-edit-input",
                autoFocus: true,
                value: editText,
                onChange: (e) => setEditText(e.target.value),
                onBlur: handleSaveTextEdit,
                style: {
                  width: `${Math.max(120, el.width || 120)}px`,
                  padding: "4px 8px",
                  fontSize: "12px",
                  fontWeight: "500",
                  borderRadius: "4px",
                  border: "2px solid #2563eb",
                  outline: "none",
                  background: "#ffffff",
                  color: "#111827",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                }
              })
            ]);
          })() : null,

          // Toast Message
          toastMsg ? h("div", { className: "uib-toast" }, toastMsg) : null,

          // Resize Handle (floating mode only)
          layoutMode === "floating" ? h("div", {
            className: "uib-resize-handle",
            onMouseDown: handleResizeMouseDown
          }) : null
        ])
      ]);
    }

    /**
     * Header Action Button
     */
    function UIBoardHeaderAction({ sessionId }) {
      const [isOpen, setIsOpen] = useState(false);

      useEffect(() => {
        installStyles();
      }, []);

      return h(React.Fragment, null, [
        h("button", {
          type: "button",
          className: `uib-action-btn ${isOpen ? "active" : ""}`,
          onClick: (e) => {
            e.currentTarget.blur();
            setIsOpen(curr => !curr);
          },
          title: "Open UI Wireframe Board to sketch and collaborate with AI"
        }, [
          h("span", { key: "icon", style: { fontSize: "14px" } }, "🎨"),
          h("span", { key: "text" }, "UI Board")
        ]),

        isOpen ? ReactDOM.createPortal(
          h(UIBoardModal, {
            sessionId,
            onClose: () => setIsOpen(false)
          }),
          document.body
        ) : null
      ]);
    }

    return {
      inject: ["slots"],
      apply(ctx) {
        // Register button in session header actions
        ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
          name: "conversation.session.header.actions",
          id: "ui-board-header-action",
          order: 10,
          label: () => "UI Board"
        }, UIBoardHeaderAction));
      }
    };
  }
});
