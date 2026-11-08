import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Tldraw, getSvgAsImage, createShapeId, getPointsFromDrawSegments } from 'tldraw';
import tldrawCss from 'tldraw/tldraw.css';

const h = React.createElement;

const STYLE_ID = 'dsh-ui-board-styles';
const TLDRAW_STYLE_ID = 'tldraw-injected-styles';

/** Sanitize tldraw user data in localStorage to prevent strict schema validation crashes */
function cleanupTldrawLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = localStorage.getItem('TLDRAW_USER_DATA_v3');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        if (data.user && typeof data.user === 'object' && data.user.isDarkMode !== undefined) {
          delete data.user.isDarkMode;
          localStorage.setItem('TLDRAW_USER_DATA_v3', JSON.stringify(data));
        }
      }
    }
  } catch (_) {}
}

function installStyles() {
  cleanupTldrawLocalStorage();
  if (typeof document === 'undefined') return;

  if (!document.getElementById(TLDRAW_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = TLDRAW_STYLE_ID;
    style.textContent = tldrawCss;
    document.head.appendChild(style);
  }

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
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
        padding: 1px 6px;
        font-size: 10px;
        font-weight: 600;
        border-radius: 999px;
        background: var(--dsw-alias-state-business-primary, #2563eb);
        color: #ffffff;
        line-height: 1.2;
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

      /* Layout push when side panel is open */
      body.uib-side-right-open .pI_x6G_centerCol {
        margin-right: var(--uib-side-width, 540px) !important;
        transition: margin-right 0.2s cubic-bezier(0.2, 0, 0, 1);
      }
      body.uib-side-left-open .pI_x6G_centerCol {
        margin-left: var(--uib-side-width, 540px) !important;
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
      .uib-side-resizer:hover, .uib-side-resizer.active {
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
        padding: 6px 12px;
        background: var(--dsw-alias-bg-layer-2, #f9fafb);
        border-bottom: 0.5px solid var(--dsw-alias-border-l2, #e5e7eb);
        user-select: none;
        cursor: grab;
        flex: none;
        z-index: 20;
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
        min-width: 0;
      }
      .uib-header-controls {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: none;
      }
      .uib-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        padding: 0;
        border: 1px solid transparent;
        background: transparent;
        color: var(--dsw-alias-label-secondary, #6b7280);
        border-radius: var(--dsw-radius-sm, 4px);
        cursor: pointer;
        transition: background 0.1s, color 0.1s, border-color 0.1s;
      }
      .uib-icon-btn:hover {
        background: var(--dsw-alias-interactive-bg-hover, #e5e7eb);
        color: var(--dsw-alias-label-primary, #111827);
      }
      .uib-icon-btn.active {
        background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #2563eb) 12%, transparent);
        color: var(--dsw-alias-state-business-primary, #2563eb);
        border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #2563eb) 30%, transparent);
      }

      /* Board Title in Header */
      .uib-board-title-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 7px;
        border-radius: var(--dsw-radius-sm, 5px);
        background: color-mix(in srgb, var(--dsw-alias-interactive-bg-hover, #f3f4f6) 80%, transparent);
        border: 1px dashed var(--dsw-alias-border-l3, #cbd5e1);
        cursor: pointer;
        transition: background 0.12s, border-color 0.12s;
      }
      .uib-board-title-wrapper:hover {
        background: var(--dsw-alias-interactive-bg-hover, #e5e7eb);
        border-color: var(--dsw-alias-state-business-primary, #2563eb);
      }
      .uib-board-title-text {
        font-size: 12px;
        font-weight: 600;
        color: var(--dsw-alias-label-primary, #111827);
        max-width: 170px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .uib-board-title-input {
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1.5px solid var(--dsw-alias-state-business-primary, #2563eb);
        background: var(--dsw-alias-bg-layer-1, #ffffff);
        color: var(--dsw-alias-label-primary, #111827);
        outline: none;
        width: 150px;
      }

      /* Tool separator */
      .uib-tool-sep {
        width: 1px;
        height: 18px;
        background: var(--dsw-alias-border-l2, #e5e7eb);
        margin: 0 3px;
        flex: none;
      }

      /* Buttons */
      .uib-btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 26px;
        padding: 0 9px;
        font-size: 11px;
        font-weight: 600;
        border-radius: 5px;
        border: none;
        background: var(--dsw-alias-state-business-primary, #2563eb);
        color: #ffffff;
        cursor: pointer;
        transition: opacity 0.12s;
      }
      .uib-btn-primary:hover {
        opacity: 0.9;
      }
      .uib-btn-secondary {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 26px;
        padding: 0 8px;
        font-size: 11px;
        font-weight: 500;
        border-radius: 5px;
        border: 1px solid var(--dsw-alias-border-l2, #d1d5db);
        background: var(--dsw-alias-bg-layer-1, #ffffff);
        color: var(--dsw-alias-label-primary, #111827);
        cursor: pointer;
        transition: background 0.12s;
      }
      .uib-btn-secondary:hover {
        background: var(--dsw-alias-interactive-bg-hover, #f3f4f6);
      }

      .uib-ai-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 26px;
        padding: 0 9px;
        font-size: 11px;
        font-weight: 600;
        border-radius: 5px;
        border: none;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: #ffffff;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
        transition: opacity 0.15s, transform 0.1s;
      }
      .uib-ai-btn:hover {
        opacity: 0.92;
        transform: translateY(-1px);
      }

      /* Tldraw Canvas Container */
      .uib-tldraw-wrapper {
        position: relative;
        flex: 1;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
      .uib-tldraw-wrapper .tl-container {
        width: 100% !important;
        height: 100% !important;
      }

      /* Toast notification */
      .uib-toast {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: #ffffff;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        pointer-events: none;
        z-index: 10000;
        animation: uib-fade-in 0.2s ease-out;
      }
      @keyframes uib-fade-in {
        from { opacity: 0; transform: translate(-50%, 8px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      /* Resize Handle for Floating Window */
      .uib-resize-handle {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 14px;
        height: 14px;
        cursor: nwse-resize;
        z-index: 100;
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

      /* Saved Boards Modal */
      .uib-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(2px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: uib-fade-in 0.15s ease-out;
      }
      .uib-modal-card {
        width: 620px;
        max-width: calc(100vw - 32px);
        max-height: 85vh;
        background: var(--dsw-alias-bg-layer-1, #ffffff);
        color: var(--dsw-alias-label-primary, #111827);
        border: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        border-radius: 12px;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: inherit;
      }
      .uib-modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 18px;
        background: var(--dsw-alias-bg-layer-2, #f9fafb);
        border-bottom: 0.5px solid var(--dsw-alias-border-l2, #e5e7eb);
      }
      .uib-modal-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 600;
      }
      .uib-search-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 18px 0;
      }
      .uib-search-input {
        flex: 1;
        height: 32px;
        padding: 0 10px;
        border-radius: var(--dsw-radius-sm, 6px);
        border: 1px solid var(--dsw-alias-border-l2, #d1d5db);
        background: var(--dsw-alias-bg-layer-1, #ffffff);
        color: var(--dsw-alias-label-primary, #111827);
        font-size: 12px;
        font-family: inherit;
        outline: none;
      }
      .uib-search-input:focus {
        border-color: var(--dsw-alias-state-business-primary, #2563eb);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary, #2563eb) 20%, transparent);
      }
      .uib-modal-body {
        padding: 12px 18px 18px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 9px;
        flex: 1;
      }
      .uib-board-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid var(--dsw-alias-border-l2, #e5e7eb);
        background: var(--dsw-alias-bg-layer-1, #ffffff);
        transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        cursor: pointer;
      }
      .uib-board-card:hover {
        border-color: var(--dsw-alias-state-business-primary, #2563eb);
        background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #2563eb) 3%, #ffffff);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .uib-board-card.active {
        border-color: var(--dsw-alias-state-business-primary, #2563eb);
        background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #2563eb) 6%, #ffffff);
      }
      .uib-board-card-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        flex: 1;
      }
      .uib-board-card-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .uib-board-card-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--dsw-alias-label-primary, #111827);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .uib-board-card-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary, #6b7280);
      }
      .uib-active-pill {
        padding: 1px 6px;
        font-size: 10px;
        font-weight: 600;
        border-radius: 999px;
        background: var(--dsw-alias-state-business-primary, #2563eb);
        color: #ffffff;
      }
      .uib-board-card-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .uib-card-action-btn {
        height: 26px;
        padding: 0 8px;
        font-size: 11px;
        font-weight: 500;
        border-radius: 4px;
        border: 1px solid var(--dsw-alias-border-l2, #d1d5db);
        background: var(--dsw-alias-bg-layer-1, #ffffff);
        color: var(--dsw-alias-label-secondary, #4b5563);
        cursor: pointer;
        transition: background 0.12s, color 0.12s, border-color 0.12s;
      }
      .uib-card-action-btn:hover {
        background: var(--dsw-alias-interactive-bg-hover, #f3f4f6);
        color: var(--dsw-alias-label-primary, #111827);
      }
      .uib-card-action-btn.danger:hover {
        background: #fee2e2;
        color: #dc2626;
        border-color: #fca5a5;
      }
      .uib-empty-boards {
        padding: 30px;
        text-align: center;
        font-size: 13px;
        color: var(--dsw-alias-label-tertiary, #9ca3af);
      }
    `;
    document.head.appendChild(style);
  }
}

function SvgDockRight() {
  return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, [
    h('rect', { x: 1, y: 2, width: 14, height: 12, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
    h('rect', { x: 9.5, y: 3.5, width: 4.5, height: 9, rx: 1, fill: 'currentColor' })
  ]);
}
function SvgDockLeft() {
  return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, [
    h('rect', { x: 1, y: 2, width: 14, height: 12, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
    h('rect', { x: 2, y: 3.5, width: 4.5, height: 9, rx: 1, fill: 'currentColor' })
  ]);
}
function SvgFloat() {
  return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor' }, [
    h('rect', { x: 2, y: 5, width: 8.5, height: 8.5, rx: 1.5, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
    h('path', { d: 'M5.5 5V3A1.5 1.5 0 0 1 7 1.5h6A1.5 1.5 0 0 1 14.5 3v6A1.5 1.5 0 0 1 13 10.5h-2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 })
  ]);
}
function SvgMaximize() {
  return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }, [
    h('rect', { x: 2, y: 2, width: 12, height: 12, rx: 2 })
  ]);
}
function SvgClose() {
  return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }, [
    h('line', { x1: 3.5, y1: 3.5, x2: 12.5, y2: 12.5 }),
    h('line', { x1: 12.5, y1: 3.5, x2: 3.5, y2: 12.5 })
  ]);
}
function SvgFolder() {
  return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round' }, [
    h('path', { d: 'M1.5 3.5A1.5 1.5 0 0 1 3 2h3.5l1.5 2H13a1.5 1.5 0 0 1 1.5 1.5V13a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 13V3.5z' })
  ]);
}
function SvgSave() {
  return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round' }, [
    h('path', { d: 'M13.5 14H2.5A1.5 1.5 0 0 1 1 12.5V2.5A1.5 1.5 0 0 1 2.5 1h8.5l4 4v7.5a1.5 1.5 0 0 1-1.5 1.5z' }),
    h('path', { d: 'M4 1v4h6V1' }),
    h('rect', { x: 4, y: 8, width: 8, height: 6, rx: 1 })
  ]);
}
function SvgPlus() {
  return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }, [
    h('line', { x1: 8, y1: 2.5, x2: 8, y2: 13.5 }),
    h('line', { x1: 2.5, y1: 8, x2: 13.5, y2: 8 })
  ]);
}

/** Helper to extract structured element summary from Tldraw editor for AI tools */
function extractShapesSummary(editor) {
  if (!editor) return [];
  try {
    const shapes = editor.getCurrentPageShapes();
    return shapes.map(s => {
      let label = '';
      if (s.props) {
        if (typeof s.props.text === 'string') {
          label = s.props.text;
        } else if (typeof s.props.name === 'string') {
          label = s.props.name;
        } else if (typeof s.props.label === 'string') {
          label = s.props.label;
        } else if (s.props.richText) {
          const extractText = (node) => {
            if (!node) return '';
            if (node.text) return node.text;
            if (Array.isArray(node.content)) return node.content.map(extractText).join(' ');
            return '';
          };
          label = extractText(s.props.richText);
        }
      }

      const bounds = editor.getShapePageBounds(s);
      const res = {
        id: s.id,
        type: s.type, // 'geo', 'arrow', 'text', 'note', 'frame', 'image', 'draw'
        x: Math.round(bounds?.x ?? s.x),
        y: Math.round(bounds?.y ?? s.y),
        width: Math.round(bounds?.w || s.props?.w || s.props?.width || 0),
        height: Math.round(bounds?.h || s.props?.h || s.props?.height || 0),
        label: String(label || '').trim(),
        color: s.props?.color || '#2563eb',
        geo: s.props?.geo || null
      };

      if ((s.type === 'draw' || s.type === 'pen') && s.props?.segments) {
        try {
          const rawPts = getPointsFromDrawSegments(s.props.segments, s.props.scaleX || 1, s.props.scaleY || 1);
          res.points = rawPts.map(p => [Math.round(s.x + p.x), Math.round(s.y + p.y)]);
        } catch (_) {
          res.points = [];
        }
      } else if (s.type === 'arrow' && s.props) {
        res.startX = Math.round(s.x + (s.props.start?.x || 0));
        res.startY = Math.round(s.y + (s.props.start?.y || 0));
        res.endX = Math.round(s.x + (s.props.end?.x || 0));
        res.endY = Math.round(s.y + (s.props.end?.y || 0));
      }

      return res;
    });
  } catch (_) {
    return [];
  }
}

/** Convert legacy elements array into a valid Tldraw store snapshot */
function convertLegacyElementsToSnapshot(editor, elements) {
  if (!editor || !Array.isArray(elements) || elements.length === 0) return null;
  try {
    const baseSnapshot = editor.store.getStoreSnapshot();
    const schema = baseSnapshot.schema;
    const records = {};

    elements.forEach((item, idx) => {
      const sid = createShapeId(item.id || `legacy_${idx}`);
      const index = `a${idx + 1}`;

      if (item.type === 'screen' || item.type === 'frame') {
        records[sid] = {
          id: sid,
          typeName: 'shape',
          type: 'frame',
          x: item.x || 100,
          y: item.y || 100,
          rotation: 0,
          index,
          parentId: 'page:page',
          isLocked: false,
          opacity: 1,
          meta: {},
          props: {
            w: item.width || 320,
            h: item.height || 420,
            name: item.label || 'Screen',
            color: 'black'
          }
        };
      } else if (item.type === 'text') {
        records[sid] = {
          id: sid,
          typeName: 'shape',
          type: 'text',
          x: item.x || 100,
          y: item.y || 100,
          rotation: 0,
          index,
          parentId: 'page:page',
          isLocked: false,
          opacity: 1,
          meta: {},
          props: {
            color: 'black',
            size: 'm',
            w: item.width || 120,
            font: 'draw',
            textAlign: 'start',
            autoSize: true,
            scale: 1,
            richText: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: item.label || 'Text' }] }] }
          }
        };
      } else if (item.type === 'arrow') {
        const sx = item.startX || item.x || 100;
        const sy = item.startY || item.y || 100;
        const ex = item.endX || (sx + (item.width || 160));
        const ey = item.endY || sy;
        records[sid] = {
          id: sid,
          typeName: 'shape',
          type: 'arrow',
          x: sx,
          y: sy,
          rotation: 0,
          index,
          parentId: 'page:page',
          isLocked: false,
          opacity: 1,
          meta: {},
          props: {
            kind: 'arc',
            elbowMidPoint: 0.5,
            dash: 'draw',
            size: 'm',
            fill: 'none',
            color: 'blue',
            labelColor: 'black',
            bend: 0,
            start: { x: 0, y: 0 },
            end: { x: ex - sx, y: ey - sy },
            arrowheadStart: 'none',
            arrowheadEnd: 'arrow',
            richText: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: item.label || '' }] }] },
            labelPosition: 0.5,
            font: 'draw',
            scale: 1
          }
        };
      } else if (item.type === 'pen' || item.type === 'draw') {
        const pts = item.points || [[0, 0], [10, 10]];
        const minX = Math.min(...pts.map(p => p[0]));
        const minY = Math.min(...pts.map(p => p[1]));
        const pathStr = pts.map((p, i) => (i === 0 ? 'M' : 'L') + (p[0] - minX) + ',' + (p[1] - minY)).join(' ');
        records[sid] = {
          id: sid,
          typeName: 'shape',
          type: 'draw',
          x: minX,
          y: minY,
          rotation: 0,
          index,
          parentId: 'page:page',
          isLocked: false,
          opacity: 1,
          meta: {},
          props: {
            segments: [{ type: 'free', path: pathStr }],
            color: 'blue',
            fill: 'none',
            dash: 'draw',
            size: 'm',
            isComplete: true,
            isClosed: false,
            isPen: false,
            scale: 1,
            scaleX: 1,
            scaleY: 1
          }
        };
      } else {
        records[sid] = {
          id: sid,
          typeName: 'shape',
          type: 'geo',
          x: item.x || 100,
          y: item.y || 100,
          rotation: 0,
          index,
          parentId: 'page:page',
          isLocked: false,
          opacity: 1,
          meta: {},
          props: {
            w: item.width || 140,
            h: item.height || 40,
            geo: 'rectangle',
            dash: 'draw',
            growY: 0,
            url: '',
            scale: 1,
            flipX: false,
            flipY: false,
            color: item.type === 'button' ? 'blue' : 'black',
            labelColor: 'black',
            fill: item.type === 'button' ? 'semi' : 'none',
            size: 'm',
            font: 'draw',
            align: 'middle',
            verticalAlign: 'middle',
            richText: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: item.label || '' }] }] }
          }
        };
      }
    });

    return {
      store: {
        ...baseSnapshot.store,
        ...records
      },
      schema
    };
  } catch (err) {
    console.error('Failed to convert legacy elements:', err);
    return null;
  }
}

/**
 * Main UI Board Modal Component with Tldraw
 */
function UIBoardModal({ sessionId, onClose }) {
  cleanupTldrawLocalStorage();
  const activeSessionId = sessionId ||
    (window.location.hash.match(/#\/s\/([^/?#]+)/)?.[1]) ||
    (window.location.pathname.match(/\/s\/([^/?#]+)/)?.[1]) ||
    'default';

  const [layoutMode, setLayoutMode] = useState('side-right'); // 'floating' | 'side-right' | 'side-left' | 'maximized'
  const [sideWidth, setSideWidth] = useState(540);
  const [pos, setPos] = useState({ x: Math.max(20, window.innerWidth - 860), y: 70 });
  const [size, setSize] = useState({ w: 820, h: 580 });
  const [toastMsg, setToastMsg] = useState('');
  const [elementCount, setElementCount] = useState(0);

  // Active board identity
  const [currentBoardId, setCurrentBoardId] = useState(() => {
    try {
      return localStorage.getItem(`dsh_ui_board_current_${activeSessionId}`) || activeSessionId;
    } catch (_) {
      return activeSessionId;
    }
  });

  const [currentBoardName, setCurrentBoardName] = useState(() => {
    try {
      return localStorage.getItem(`dsh_ui_board_name_${currentBoardId}`) ||
        (currentBoardId === 'default' ? 'Default Board' :
        (currentBoardId.startsWith('session-') ? 'Session Board' : 'Untitled Board'));
    } catch (_) {
      return 'Untitled Board';
    }
  });

  const [isEditingBoardName, setIsEditingBoardName] = useState(false);
  const [boardNameEdit, setBoardNameEdit] = useState('');

  // Saved boards modal
  const [showBoardsModal, setShowBoardsModal] = useState(false);
  const [savedBoards, setSavedBoards] = useState([]);
  const [boardsSearch, setBoardsSearch] = useState('');
  const boardImportInputRef = useRef(null);

  // Refs
  const editorRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ w: 0, h: 0, x: 0, y: 0 });
  const windowRef = useRef(null);
  const toastTimerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 3500);
  }, []);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Synchronize side docking layout to adjust main chat space
  useEffect(() => {
    if (layoutMode === 'side-right') {
      document.body.classList.add('uib-side-right-open');
      document.body.classList.remove('uib-side-left-open');
      document.documentElement.style.setProperty('--uib-side-width', `${sideWidth}px`);
    } else if (layoutMode === 'side-left') {
      document.body.classList.add('uib-side-left-open');
      document.body.classList.remove('uib-side-right-open');
      document.documentElement.style.setProperty('--uib-side-width', `${sideWidth}px`);
    } else {
      document.body.classList.remove('uib-side-right-open', 'uib-side-left-open');
    }
    return () => {
      document.body.classList.remove('uib-side-right-open', 'uib-side-left-open');
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
      let nextW = side === 'right' ? startW - deltaX : startW + deltaX;
      nextW = Math.max(360, Math.min(window.innerWidth - 320, nextW));
      setSideWidth(nextW);
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resizing floating window
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
        w: Math.max(480, resizeStartRef.current.w + deltaX),
        h: Math.max(380, resizeStartRef.current.h + deltaY)
      });
    };
    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Dragging floating window header
  const handleHeaderMouseDown = (e) => {
    if (layoutMode !== 'floating') return;
    if (e.target.closest('button, input, .uib-board-title-wrapper')) return;
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Refresh saved boards list
  const refreshBoardsList = useCallback(async () => {
    let localList = [];
    try {
      const raw = localStorage.getItem('dsh_ui_boards_index');
      if (raw) localList = JSON.parse(raw) || [];
    } catch (_) {}

    let serverList = [];
    try {
      const res = await fetch('/api/ui-board?action=list');
      const data = await res.json();
      if (data?.ok && Array.isArray(data.boards)) {
        serverList = data.boards;
      }
    } catch (_) {}

    const map = new Map();
    for (const item of localList) {
      if (item?.id) map.set(item.id, item);
    }
    for (const item of serverList) {
      if (item?.id) {
        const existing = map.get(item.id);
        if (!existing || (item.updatedAt || 0) >= (existing.updatedAt || 0)) {
          map.set(item.id, { ...existing, ...item });
        }
      }
    }

    const merged = Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    setSavedBoards(merged);
    try {
      localStorage.setItem('dsh_ui_boards_index', JSON.stringify(merged));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (showBoardsModal) {
      refreshBoardsList();
    }
  }, [showBoardsModal, refreshBoardsList]);

  // Persist current board state
  const saveCurrentBoard = useCallback(async (isManual = false) => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const snapshot = editor.store.getStoreSnapshot();
      const elements = extractShapesSummary(editor);
      setElementCount(elements.length);

      const bid = currentBoardId;
      const bname = currentBoardName;

      // Extract live SVG
      let svg = null;
      try {
        const shapeIds = [...editor.getCurrentPageShapeIds()];
        if (shapeIds.length > 0) {
          const svgRes = await editor.getSvgString(shapeIds);
          svg = svgRes?.svg || null;
        }
      } catch (_) {}

      // Save to localStorage
      try {
        localStorage.setItem(`dsh_ui_board_${bid}`, JSON.stringify(snapshot));
        localStorage.setItem(`dsh_ui_board_name_${bid}`, bname);
        let idxList = [];
        try {
          idxList = JSON.parse(localStorage.getItem('dsh_ui_boards_index') || '[]');
        } catch (_) {}
        const existIdx = idxList.findIndex(b => b.id === bid);
        const boardMeta = {
          id: bid,
          name: bname,
          sessionId: activeSessionId,
          count: elements.length,
          updatedAt: Date.now()
        };
        if (existIdx >= 0) {
          idxList[existIdx] = { ...idxList[existIdx], ...boardMeta };
        } else {
          idxList.unshift(boardMeta);
        }
        localStorage.setItem('dsh_ui_boards_index', JSON.stringify(idxList));
      } catch (_) {}

      // Save to backend
      fetch('/api/ui-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bid,
          name: bname,
          session: activeSessionId,
          snapshot,
          elements,
          svg
        })
      }).then(() => {
        if (isManual) {
          refreshBoardsList();
          showToast(`💾 Saved board "${bname}" successfully!`);
        }
      }).catch((err) => {
        if (isManual) showToast(`⚠️ Save error: ${err.message}`);
      });
    } catch (err) {
      console.error('Error saving board:', err);
    }
  }, [currentBoardId, currentBoardName, activeSessionId, refreshBoardsList, showToast]);

  // Handle board mount in Tldraw
  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;

    // 1. Chặn phím tắt zoom của trình duyệt khi đang thao tác trên Board
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === '+' || e.key === '=') editor.zoomIn();
        if (e.key === '-') editor.zoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    // Synchronize initial dark theme
    const isDark = document.body.hasAttribute('data-ds-dark-theme');
    try {
      editor.user.updateUserPreferences({ colorScheme: isDark ? 'dark' : 'light' });
    } catch (_) {}

    // Load initial board data
    const bid = currentBoardId;
    let loaded = false;

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(`dsh_ui_board_${bid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.store && parsed?.schema) {
          editor.store.loadStoreSnapshot(parsed);
          setElementCount(editor.getCurrentPageShapes().length);
          loaded = true;
        }
      }
    } catch (_) {}

    // Fetch from backend
    fetch(`/api/ui-board?id=${encodeURIComponent(bid)}`)
      .then(res => res.json())
      .then(data => {
        if (data?.ok) {
          if (data.snapshot?.store && data.snapshot?.schema) {
            editor.store.loadStoreSnapshot(data.snapshot);
            setElementCount(editor.getCurrentPageShapes().length);
          } else if (!loaded && Array.isArray(data.elements) && data.elements.length > 0) {
            // Restore legacy elements into a valid snapshot safely
            const converted = convertLegacyElementsToSnapshot(editor, data.elements);
            if (converted) {
              editor.store.loadStoreSnapshot(converted);
              setElementCount(editor.getCurrentPageShapes().length);
            }
          }
          if (data.name) setCurrentBoardName(data.name);
        }
      })
      .catch((err) => {
        console.error('Failed to load board from server:', err);
      });

    // Listen to changes with debounced auto-save (300ms for live-view sync)
    const unlisten = editor.store.listen(() => {
      setElementCount(editor.getCurrentPageShapes().length);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveCurrentBoard(false);
      }, 300);
    });

    return () => {
      unlisten();
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [currentBoardId, saveCurrentBoard]);

  // Dark theme observer
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.body.hasAttribute('data-ds-dark-theme');
      try {
        editorRef.current?.user.updateUserPreferences({ colorScheme: isDark ? 'dark' : 'light' });
      } catch (_) {}
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
    return () => observer.disconnect();
  }, []);

  // Rename current board
  const handleSaveBoardName = () => {
    setIsEditingBoardName(false);
    const trimmed = (boardNameEdit || '').trim();
    if (!trimmed || trimmed === currentBoardName) return;
    setCurrentBoardName(trimmed);
    try {
      localStorage.setItem(`dsh_ui_board_name_${currentBoardId}`, trimmed);
    } catch (_) {}
    saveCurrentBoard(false);
    showToast(`🏷️ Renamed board to "${trimmed}"`);
  };

  // Load a board
  const handleLoadBoard = useCallback((boardId, boardName) => {
    if (boardId === currentBoardId) {
      setShowBoardsModal(false);
      return;
    }

    // Save active board first
    saveCurrentBoard(false);

    setCurrentBoardId(boardId);
    const finalName = boardName || 'Untitled Board';
    setCurrentBoardName(finalName);
    try {
      localStorage.setItem(`dsh_ui_board_current_${activeSessionId}`, boardId);
      localStorage.setItem(`dsh_ui_board_name_${boardId}`, finalName);
    } catch (_) {}

    // Load into Tldraw editor
    const editor = editorRef.current;
    if (editor) {
      fetch(`/api/ui-board?id=${encodeURIComponent(boardId)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.ok && data.snapshot?.store && data.snapshot?.schema) {
            editor.store.loadStoreSnapshot(data.snapshot);
            setElementCount(editor.getCurrentPageShapes().length);
            if (data.name) setCurrentBoardName(data.name);
          } else if (data?.ok && Array.isArray(data.elements) && data.elements.length > 0) {
            const converted = convertLegacyElementsToSnapshot(editor, data.elements);
            if (converted) {
              editor.store.loadStoreSnapshot(converted);
              setElementCount(editor.getCurrentPageShapes().length);
            }
            if (data.name) setCurrentBoardName(data.name);
          } else {
            // Check local cache
            try {
              const cached = localStorage.getItem(`dsh_ui_board_${boardId}`);
              if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed?.store && parsed?.schema) {
                  editor.store.loadStoreSnapshot(parsed);
                  setElementCount(editor.getCurrentPageShapes().length);
                }
              }
            } catch (_) {}
          }
        })
        .catch(() => {});
    }

    setShowBoardsModal(false);
    showToast(`📂 Opened board "${finalName}"!`);
  }, [currentBoardId, activeSessionId, saveCurrentBoard, showToast]);

  // Create new board
  const handleCreateNewBoard = useCallback(() => {
    const name = window.prompt('Enter new board name:', 'Untitled Board');
    if (name === null) return;
    const trimmed = (name || '').trim() || 'Untitled Board';

    // Save active board first
    saveCurrentBoard(false);

    const newId = `board_${Date.now()}`;
    setCurrentBoardId(newId);
    setCurrentBoardName(trimmed);

    try {
      localStorage.setItem(`dsh_ui_board_name_${newId}`, trimmed);
      localStorage.setItem(`dsh_ui_board_current_${activeSessionId}`, newId);
    } catch (_) {}

    const editor = editorRef.current;
    if (editor) {
      editor.selectAll();
      editor.deleteShapes(editor.getSelectedShapeIds());
      setElementCount(0);
      const emptySnapshot = editor.store.getStoreSnapshot();
      try {
        localStorage.setItem(`dsh_ui_board_${newId}`, JSON.stringify(emptySnapshot));
      } catch (_) {}
      fetch('/api/ui-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          name: trimmed,
          session: activeSessionId,
          snapshot: emptySnapshot,
          elements: []
        })
      }).then(() => refreshBoardsList());
    }

    setShowBoardsModal(false);
    showToast(`✨ Created new board "${trimmed}"!`);
  }, [activeSessionId, saveCurrentBoard, refreshBoardsList, showToast]);

  // Delete a board
  const handleDeleteBoard = useCallback((boardId, boardName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete board "${boardName || boardId}"?`)) {
      return;
    }

    fetch(`/api/ui-board?id=${encodeURIComponent(boardId)}`, {
      method: 'DELETE'
    }).catch(() => {
      fetch('/api/ui-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: boardId })
      }).catch(() => {});
    });

    try {
      localStorage.removeItem(`dsh_ui_board_${boardId}`);
      localStorage.removeItem(`dsh_ui_board_name_${boardId}`);
      const raw = localStorage.getItem('dsh_ui_boards_index');
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter(b => b.id !== boardId);
        localStorage.setItem('dsh_ui_boards_index', JSON.stringify(filtered));
      }
    } catch (_) {}

    if (boardId === currentBoardId) {
      const fallbackId = activeSessionId;
      const fallbackName = 'Untitled Board';
      setCurrentBoardId(fallbackId);
      setCurrentBoardName(fallbackName);
      editorRef.current?.selectAll();
      editorRef.current?.deleteShapes(editorRef.current?.getSelectedShapeIds());
      setElementCount(0);
    }

    refreshBoardsList();
    showToast(`🗑️ Deleted board "${boardName || boardId}"`);
  }, [currentBoardId, activeSessionId, refreshBoardsList, showToast]);

  // Export board to file
  const handleExportBoardById = useCallback((boardId, boardName, e) => {
    if (e) e.stopPropagation();
    let boardSnapshot = null;
    let boardElements = [];

    if (boardId === currentBoardId && editorRef.current) {
      boardSnapshot = editorRef.current.store.getStoreSnapshot();
      boardElements = extractShapesSummary(editorRef.current);
    } else {
      try {
        const cached = localStorage.getItem(`dsh_ui_board_${boardId}`);
        if (cached) boardSnapshot = JSON.parse(cached);
      } catch (_) {}
    }

    const data = {
      id: boardId,
      name: boardName || 'ui-board',
      snapshot: boardSnapshot,
      elements: boardElements,
      exportedAt: Date.now()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobUrl = URLObj.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${(boardName || 'ui-board').replace(/[^a-zA-Z0-9_-]/g, '_')}.uiboard.json`;
    a.click();
    URLObj.revokeObjectURL(blobUrl);
    showToast(`💾 Exported "${boardName || 'board'}" to file!`);
  }, [currentBoardId, showToast]);

  // Import board from file
  const handleImportBoardFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const newId = `board_${Date.now()}`;
        const newName = data.name || file.name.replace(/\.[^/.]+$/, '') || 'Imported Board';

        saveCurrentBoard(false);

        setCurrentBoardId(newId);
        setCurrentBoardName(newName);

        const editor = editorRef.current;
        if (editor) {
          if (data.snapshot?.store) {
            editor.store.loadStoreSnapshot(data.snapshot);
            setElementCount(editor.getCurrentPageShapes().length);
          } else if (Array.isArray(data.elements)) {
            editor.selectAll();
            editor.deleteShapes(editor.getSelectedShapeIds());
            const newShapes = data.elements.map(item => {
              const sid = createShapeId(item.id);
              if (item.type === 'screen' || item.type === 'frame') {
                return { id: sid, type: 'frame', x: item.x || 100, y: item.y || 100, props: { w: item.width || 320, h: item.height || 460, name: item.label || 'Screen' } };
              }
              return { id: sid, type: 'geo', x: item.x || 120, y: item.y || 120, props: { w: item.width || 140, h: item.height || 40, geo: 'rectangle', text: item.label || 'Component', color: 'blue' } };
            });
            editor.createShapes(newShapes);
            setElementCount(newShapes.length);
          }

          saveCurrentBoard(false);
        }

        refreshBoardsList();
        setShowBoardsModal(false);
        showToast(`📥 Imported "${newName}" successfully!`);
      } catch (err) {
        showToast(`⚠️ Import error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }, [saveCurrentBoard, refreshBoardsList, showToast]);

  // Copy snapshot to clipboard and sync with AI
  const handleSendSnapshotToAi = async () => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const shapeIds = [...editor.getCurrentPageShapeIds()];
      if (shapeIds.length === 0) {
        showToast('⚠️ The board is currently empty. Draw something first!');
        return;
      }

      const svgResult = await editor.getSvgString(shapeIds);
      if (!svgResult || !svgResult.svg) {
        showToast('⚠️ Could not generate board SVG image.');
        return;
      }

      const blob = await getSvgAsImage(svgResult.svg, {
        type: 'png',
        quality: 1,
        scale: 2
      });

      if (blob && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToast('✅ Board snapshot copied to clipboard! Press Ctrl+V in chat to discuss with AI.');
      } else {
        showToast('✅ Snapshot prepared!');
      }

      // Sync latest snapshot & element hierarchy to backend for AI tools
      saveCurrentBoard(false);
    } catch (err) {
      showToast(`Snapshot error: ${err.message}`);
    }
  };

  // Window layout positioning
  let windowStyle = {
    position: 'fixed',
    zIndex: 99999
  };
  if (layoutMode === 'floating') {
    windowStyle = {
      ...windowStyle,
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      width: `${size.w}px`,
      height: `${size.h}px`
    };
  } else if (layoutMode === 'side-right') {
    windowStyle = {
      ...windowStyle,
      top: 0,
      right: 0,
      bottom: 0,
      width: `${sideWidth}px`,
      height: '100vh',
      borderLeft: '1px solid var(--dsw-alias-border-l2, #e5e7eb)'
    };
  } else if (layoutMode === 'side-left') {
    windowStyle = {
      ...windowStyle,
      top: 0,
      left: 0,
      bottom: 0,
      width: `${sideWidth}px`,
      height: '100vh',
      borderRight: '1px solid var(--dsw-alias-border-l2, #e5e7eb)'
    };
  } else if (layoutMode === 'maximized') {
    windowStyle = {
      ...windowStyle,
      inset: '16px',
      width: 'calc(100vw - 32px)',
      height: 'calc(100vh - 32px)'
    };
  }

  const isSideMode = layoutMode === 'side-right' || layoutMode === 'side-left';

  return h('div', {
    ref: windowRef,
    className: `uib-window ${isSideMode ? 'side-mode' : ''}`,
    style: windowStyle
  }, [
    // Side resizer bar
    layoutMode === 'side-right' ? h('div', {
      className: 'uib-side-resizer left',
      title: 'Drag to resize panel width',
      onMouseDown: (e) => handleSideResizeMouseDown(e, 'right')
    }) : null,
    layoutMode === 'side-left' ? h('div', {
      className: 'uib-side-resizer right',
      title: 'Drag to resize panel width',
      onMouseDown: (e) => handleSideResizeMouseDown(e, 'left')
    }) : null,

    // Header Bar
    h('div', {
      className: 'uib-header',
      onMouseDown: handleHeaderMouseDown
    }, [
      h('div', { className: 'uib-title-cluster' }, [
        h('span', { style: { fontSize: '16px' } }, '🎨'),
        isEditingBoardName ?
          h('input', {
            className: 'uib-board-title-input',
            value: boardNameEdit,
            autoFocus: true,
            onChange: (e) => setBoardNameEdit(e.target.value),
            onBlur: handleSaveBoardName,
            onKeyDown: (e) => {
              if (e.key === 'Enter') handleSaveBoardName();
              if (e.key === 'Escape') setIsEditingBoardName(false);
            }
          }) :
          h('div', {
            className: 'uib-board-title-wrapper',
            title: 'Click to rename this board',
            onClick: () => {
              setBoardNameEdit(currentBoardName);
              setIsEditingBoardName(true);
            }
          }, [
            h('span', { className: 'uib-board-title-text' }, currentBoardName),
            h('span', { style: { fontSize: '11px', opacity: 0.6 } }, '✏️')
          ]),
        h('span', { className: 'uib-action-badge' }, `${elementCount} ${elementCount === 1 ? 'shape' : 'shapes'}`)
      ]),

      h('div', { className: 'uib-header-controls' }, [
        // Boards button
        h('button', {
          className: 'uib-btn-secondary',
          title: 'Manage and open saved boards',
          onClick: () => setShowBoardsModal(true)
        }, [
          h(SvgFolder),
          h('span', null, 'Boards')
        ]),
        // Manual Save button
        h('button', {
          className: 'uib-icon-btn',
          title: 'Save current board snapshot',
          onClick: () => saveCurrentBoard(true)
        }, h(SvgSave)),
        // New Board button
        h('button', {
          className: 'uib-icon-btn',
          title: 'Create a new board',
          onClick: handleCreateNewBoard
        }, h(SvgPlus)),

        h('div', { className: 'uib-tool-sep' }),

        // Send to AI button
        h('button', {
          className: 'uib-ai-btn',
          onClick: handleSendSnapshotToAi,
          title: 'Copy high-res snapshot to clipboard and sync data with AI'
        }, '📸 Send to AI'),

        h('div', { className: 'uib-tool-sep' }),

        // Window mode controls
        h('button', {
          className: `uib-icon-btn ${layoutMode === 'side-right' ? 'active' : ''}`,
          title: 'Dock to Right',
          onClick: () => setLayoutMode('side-right')
        }, h(SvgDockRight)),
        h('button', {
          className: `uib-icon-btn ${layoutMode === 'side-left' ? 'active' : ''}`,
          title: 'Dock to Left',
          onClick: () => setLayoutMode('side-left')
        }, h(SvgDockLeft)),
        h('button', {
          className: `uib-icon-btn ${layoutMode === 'floating' ? 'active' : ''}`,
          title: 'Float Window',
          onClick: () => setLayoutMode('floating')
        }, h(SvgFloat)),
        h('button', {
          className: `uib-icon-btn ${layoutMode === 'maximized' ? 'active' : ''}`,
          title: layoutMode === 'maximized' ? 'Restore Window' : 'Maximize Window',
          onClick: () => setLayoutMode(curr => curr === 'maximized' ? 'side-right' : 'maximized')
        }, h(SvgMaximize)),
        h('button', {
          className: 'uib-icon-btn',
          title: 'Close Board',
          onClick: onClose
        }, h(SvgClose))
      ])
    ]),

    // Tldraw Canvas Container
    h('div', { className: 'uib-tldraw-wrapper' }, [
      h(Tldraw, {
        autoFocus: true,
        inferDarkMode: true,
        onMount: handleEditorMount
      })
    ]),

    // Toast Message
    toastMsg ? h('div', { className: 'uib-toast' }, toastMsg) : null,

    // Resize Handle for Floating Window
    layoutMode === 'floating' ? h('div', {
      className: 'uib-resize-handle',
      onMouseDown: handleResizeMouseDown
    }) : null,

    // Saved Boards Modal
    showBoardsModal ? h('div', {
      className: 'uib-modal-overlay',
      onClick: (e) => { if (e.target === e.currentTarget) setShowBoardsModal(false); }
    }, [
      h('div', { className: 'uib-modal-card' }, [
        h('div', { className: 'uib-modal-head' }, [
          h('div', { className: 'uib-modal-title' }, [
            h('span', { style: { fontSize: '18px' } }, '📁'),
            h('span', null, 'Saved Boards')
          ]),
          h('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [
            h('button', {
              className: 'uib-btn-primary',
              onClick: handleCreateNewBoard
            }, '➕ New Board'),
            h('button', {
              className: 'uib-btn-secondary',
              onClick: () => boardImportInputRef.current?.click()
            }, '📥 Import JSON'),
            h('button', {
              className: 'uib-icon-btn',
              onClick: () => setShowBoardsModal(false)
            }, h(SvgClose))
          ])
        ]),

        h('div', { className: 'uib-search-bar' }, [
          h('input', {
            className: 'uib-search-input',
            placeholder: '🔍 Search boards by name...',
            value: boardsSearch,
            onChange: (e) => setBoardsSearch(e.target.value)
          })
        ]),

        h('div', { className: 'uib-modal-body' }, [
          (() => {
            const filtered = savedBoards.filter(b => {
              if (!boardsSearch.trim()) return true;
              const query = boardsSearch.toLowerCase();
              return (b.name && b.name.toLowerCase().includes(query)) || (b.id && b.id.toLowerCase().includes(query));
            });

            if (filtered.length === 0) {
              return h('div', { className: 'uib-empty-boards' }, [
                h('div', { style: { fontSize: '32px', marginBottom: '8px' } }, '📂'),
                h('div', null, boardsSearch ? 'No matching boards found.' : 'No saved boards yet. Create a new one!')
              ]);
            }

            return filtered.map(b => {
              const isActive = b.id === currentBoardId;
              return h('div', {
                key: b.id,
                className: `uib-board-card ${isActive ? 'active' : ''}`,
                onClick: () => handleLoadBoard(b.id, b.name)
              }, [
                h('div', { className: 'uib-board-card-info' }, [
                  h('div', { className: 'uib-board-card-title-row' }, [
                    h('span', { style: { fontSize: '16px' } }, '🎨'),
                    h('span', { className: 'uib-board-card-name' }, b.name || 'Untitled Board'),
                    isActive ? h('span', { className: 'uib-active-pill' }, 'Active') : null
                  ]),
                  h('div', { className: 'uib-board-card-meta' }, [
                    h('span', null, `${b.count || 0} ${b.count === 1 ? 'shape' : 'shapes'}`),
                    h('span', null, '•'),
                    h('span', null, formatTimeAgo(b.updatedAt))
                  ])
                ]),
                h('div', {
                  className: 'uib-board-card-actions',
                  onClick: (e) => e.stopPropagation()
                }, [
                  h('button', {
                    className: 'uib-card-action-btn',
                    title: 'Open this board',
                    onClick: () => handleLoadBoard(b.id, b.name)
                  }, '📂 Open'),
                  h('button', {
                    className: 'uib-card-action-btn',
                    title: 'Export to JSON file',
                    onClick: (e) => handleExportBoardById(b.id, b.name, e)
                  }, '💾 Export'),
                  h('button', {
                    className: 'uib-card-action-btn danger',
                    title: 'Delete this board',
                    onClick: (e) => handleDeleteBoard(b.id, b.name, e)
                  }, '🗑️')
                ])
              ]);
            });
          })()
        ])
      ])
    ]) : null,

    // Hidden input for board JSON import
    h('input', {
      ref: boardImportInputRef,
      type: 'file',
      accept: '.json,.uiboard.json',
      style: { display: 'none' },
      onChange: (e) => {
        const file = e.target.files?.[0];
        if (file) handleImportBoardFile(file);
        e.target.value = '';
      }
    })
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
    h('button', {
      type: 'button',
      className: `uib-action-btn ${isOpen ? 'active' : ''}`,
      onClick: (e) => {
        e.currentTarget.blur();
        setIsOpen(curr => !curr);
      },
      title: 'Open UI Wireframe Board to sketch and collaborate with AI'
    }, [
      h('span', { key: 'icon', style: { fontSize: '14px' } }, '🎨'),
      h('span', { key: 'text' }, 'UI Board')
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

export const inject = ['slots'];
export function apply(ctx) {
  installStyles();
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'ui-board-header-action',
    order: 10,
    label: () => 'UI Board'
  }, UIBoardHeaderAction));
}
