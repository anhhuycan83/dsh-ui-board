import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const name = 'dsh-ui-board';
export const inject = [];

/** Directory where UI board files are stored. */
const STORAGE_DIR = path.join(os.homedir(), '.dsh', 'ui-board');

function ensureStorageDir() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[dsh-ui-board] failed to create storage directory:', err);
  }
}

/** In-memory cache of boards by session ID */
const boardCache = new Map();

function getBoardPath(sessionId) {
  const safeId = String(sessionId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STORAGE_DIR, `board-${safeId}.json`);
}

function loadBoard(sessionId) {
  const sid = sessionId || 'default';
  if (boardCache.has(sid)) {
    return boardCache.get(sid);
  }

  ensureStorageDir();
  const filePath = getBoardPath(sid);
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data && Array.isArray(data.elements)) {
        boardCache.set(sid, data);
        return data;
      }
    }
  } catch (err) {
    console.error(`[dsh-ui-board] error reading board file for session ${sid}:`, err);
  }

  const defaultBoard = {
    sessionId: sid,
    elements: [],
    updatedAt: Date.now()
  };
  boardCache.set(sid, defaultBoard);
  return defaultBoard;
}

function saveBoard(sessionId, elements) {
  const sid = sessionId || 'default';
  const board = {
    sessionId: sid,
    elements: Array.isArray(elements) ? elements : [],
    updatedAt: Date.now()
  };
  boardCache.set(sid, board);

  ensureStorageDir();
  const filePath = getBoardPath(sid);
  try {
    fs.writeFileSync(filePath, JSON.stringify(board, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[dsh-ui-board] error writing board file for session ${sid}:`, err);
  }
  return board;
}

function generateHierarchySummary(elements) {
  if (!elements || elements.length === 0) {
    return 'The UI Board is currently empty. No screens or components have been created yet.';
  }

  const screens = elements.filter(e => e.type === 'screen');
  const buttons = elements.filter(e => e.type === 'button');
  const inputs = elements.filter(e => e.type === 'input');
  const boxes = elements.filter(e => e.type === 'box');
  const texts = elements.filter(e => e.type === 'text');
  const arrows = elements.filter(e => e.type === 'arrow');
  const penStrokes = elements.filter(e => e.type === 'pen');

  let summary = `### UI Board Overview (${elements.length} elements total)\n\n`;

  if (screens.length > 0) {
    summary += `#### Screens / Windows (${screens.length}):\n`;
    for (const screen of screens) {
      summary += `* **[Screen] ${screen.label || 'Untitled Screen'}** (ID: \`${screen.id}\`, Pos: [${screen.x}, ${screen.y}], Size: ${screen.width}x${screen.height})\n`;

      // Find children within screen bounds (exclude other screens and arrows)
      const children = elements.filter(e => {
        if (e.id === screen.id || e.type === 'screen' || e.type === 'arrow') return false;
        return (
          e.x >= screen.x &&
          e.y >= screen.y &&
          e.x + (e.width || 0) <= screen.x + screen.width &&
          e.y + (e.height || 0) <= screen.y + screen.height
        );
      });

      if (children.length > 0) {
        for (const child of children) {
          const typeLabel = child.type.toUpperCase();
          summary += `  - \`${typeLabel}\`: "${child.label || child.props?.placeholder || 'No label'}" (ID: \`${child.id}\`)\n`;
        }
      } else {
        summary += `  - (No child components inside)\n`;
      }
    }
    summary += '\n';
  }

  if (arrows.length > 0) {
    summary += `#### User Flow / Connections (${arrows.length}):\n`;
    for (const arrow of arrows) {
      const fromLabel = arrow.fromLabel || arrow.fromId || 'Source';
      const toLabel = arrow.toLabel || arrow.toId || 'Target';
      const desc = arrow.label ? ` via "${arrow.label}"` : '';
      summary += `* [Flow] \`${fromLabel}\` ➔ \`${toLabel}\`${desc} (ID: \`${arrow.id}\`)\n`;
    }
    summary += '\n';
  }

  const looseItems = elements.filter(e => {
    if (e.type === 'screen' || e.type === 'arrow') return false;
    // Check if inside any screen
    const insideScreen = screens.some(s => (
      e.x >= s.x && e.y >= s.y &&
      e.x + (e.width || 0) <= s.x + s.width &&
      e.y + (e.height || 0) <= s.y + s.height
    ));
    return !insideScreen;
  });

  if (looseItems.length > 0) {
    summary += `#### Standalone / Outside Elements (${looseItems.length}):\n`;
    for (const item of looseItems) {
      if (item.type === 'pen') {
        summary += `* \`PEN STROKE\`: Freehand sketch line (ID: \`${item.id}\`)\n`;
      } else if (item.type === 'image') {
        summary += `* \`IMAGE\`: "${item.label || 'Image'}" (ID: \`${item.id}\`, Size: ${item.width}x${item.height})\n`;
      } else {
        summary += `* \`${item.type.toUpperCase()}\`: "${item.label || item.props?.placeholder || ''}" (ID: \`${item.id}\`)\n`;
      }
    }
  }

  return summary;
}

export function apply(ctx) {
  // 1. Register WebServer API
  ctx.inject(['webServer'], (webCtx) => {
    const webServer = webCtx.get('webServer');
    if (!webServer) return;

    webCtx.effect(() => {
      return webServer.register({
        kind: 'prefix',
        path: '/api/ui-board',
        handler: async (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          let urlObj;
          try {
            urlObj = new URL(req.url, 'http://127.0.0.1');
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: 'Invalid URL' }));
            return;
          }

          const sessionId = urlObj.searchParams.get('session') || 'default';

          if (req.method === 'GET') {
            const board = loadBoard(sessionId);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              ok: true,
              session: sessionId,
              elements: board.elements,
              updatedAt: board.updatedAt
            }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                const targetSession = data.session || sessionId;
                const elements = data.elements || [];
                const updatedBoard = saveBoard(targetSession, elements);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({
                  ok: true,
                  session: targetSession,
                  count: updatedBoard.elements.length,
                  updatedAt: updatedBoard.updatedAt
                }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ ok: false, error: err.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    });
  });

  // 2. Register Agent Tools
  ctx.inject(['tools'], (toolsCtx) => {
    const tools = toolsCtx.get('tools');
    if (!tools) return;

    toolsCtx.effect(() => {
      // Tool 1: ui_board_read
      const unregisterRead = tools.register({
        name: 'ui_board_read',
        description: 'Read the current UI design board elements (screens/windows, buttons, inputs, boxes, text labels, and user flow connection arrows) drawn in the whiteboard canvas.',
        parameters: {
          type: 'object',
          properties: {
            session: {
              type: 'string',
              description: 'Optional session id. If omitted, the tool reads the current session board or the default active board.'
            }
          }
        },
        output: {
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string', description: 'Structured overview of all screens, UI controls, and user flows.' },
              elementCount: { type: 'integer' },
              elementsJson: { type: 'string', description: 'Raw JSON representation of all elements for precise inspection.' }
            },
            required: ['summary', 'elementCount', 'elementsJson']
          },
          render(args, value) {
            return [{ type: 'text', text: value.summary }];
          }
        },
        async execute(args, exec) {
          const sid = args.session || exec.agent?.session?.id || 'default';
          const board = loadBoard(sid);
          const summary = generateHierarchySummary(board.elements);
          return {
            summary,
            elementCount: board.elements.length,
            elementsJson: JSON.stringify(board.elements)
          };
        }
      });

      // Tool 2: ui_board_mutate
      const unregisterMutate = tools.register({
        name: 'ui_board_mutate',
        description: 'Add, update, or remove UI wireframe elements on the whiteboard canvas (e.g. create a new screen/window, add buttons, input fields, labels, or flow connection arrows).',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['add', 'update', 'delete', 'clear'],
              description: 'The mutation action: "add" appends new elements, "update" edits existing elements by ID, "delete" removes elements by ID, "clear" removes all elements.'
            },
            elements: {
              type: 'array',
              description: 'Elements to add or update. Each element object should have: id (string), type ("screen"|"button"|"input"|"box"|"text"|"arrow"), x (num), y (num), width (num), height (num), label (string), color (optional string), fill (optional string), props (optional object).',
              items: {
                type: 'object'
              }
            },
            element_ids: {
              type: 'array',
              description: 'List of element IDs to delete when action is "delete".',
              items: { type: 'string' }
            },
            session: {
              type: 'string',
              description: 'Optional session ID.'
            }
          },
          required: ['action']
        },
        output: {
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              elementCount: { type: 'integer' }
            },
            required: ['summary', 'elementCount']
          },
          render(args, value) {
            return [{ type: 'text', text: value.summary }];
          }
        },
        async execute(args, exec) {
          const sid = args.session || exec.agent?.session?.id || 'default';
          const board = loadBoard(sid);
          let currentElements = [...board.elements];
          let changeMsg = '';

          if (args.action === 'clear') {
            currentElements = [];
            changeMsg = 'Cleared all elements on the UI board.';
          } else if (args.action === 'delete') {
            const idsToDelete = new Set(args.element_ids || []);
            const beforeLen = currentElements.length;
            currentElements = currentElements.filter(e => !idsToDelete.has(e.id));
            changeMsg = `Deleted ${beforeLen - currentElements.length} elements from the UI board.`;
          } else if (args.action === 'add') {
            const newItems = (args.elements || []).map((item, idx) => ({
              id: item.id || `elem_${Date.now()}_${idx}`,
              type: item.type || 'box',
              x: Number(item.x) || 100,
              y: Number(item.y) || 100,
              width: Number(item.width) || 160,
              height: Number(item.height) || 80,
              label: item.label || '',
              color: item.color || '#2563eb',
              fill: item.fill || (item.type === 'screen' ? '#ffffff' : 'transparent'),
              props: item.props || {},
              ...item
            }));
            currentElements = [...currentElements, ...newItems];
            changeMsg = `Added ${newItems.length} elements to the UI board.`;
          } else if (args.action === 'update') {
            const updates = new Map((args.elements || []).map(e => [e.id, e]));
            currentElements = currentElements.map(e => {
              if (updates.has(e.id)) {
                return { ...e, ...updates.get(e.id) };
              }
              return e;
            });
            changeMsg = `Updated ${updates.size} elements on the UI board.`;
          }

          saveBoard(sid, currentElements);
          return {
            summary: `${changeMsg} Total elements now: ${currentElements.length}.`,
            elementCount: currentElements.length
          };
        }
      });

      return () => {
        unregisterRead?.();
        unregisterMutate?.();
      };
    });
  });
}
