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

/** In-memory cache of boards by ID / session ID */
const boardCache = new Map();

function getBoardPath(id) {
  const safeId = String(id || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STORAGE_DIR, `board-${safeId}.json`);
}

function listBoards() {
  ensureStorageDir();
  const boards = [];
  try {
    const files = fs.readdirSync(STORAGE_DIR);
    for (const file of files) {
      if (file.startsWith('board-') && file.endsWith('.json')) {
        const fileId = file.slice('board-'.length, -'.json'.length);
        const filePath = path.join(STORAGE_DIR, file);
        try {
          const stats = fs.statSync(filePath);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(raw);
          const count = Array.isArray(data.elements) ? data.elements.length : 0;
          let displayName = data.name;
          if (!displayName || !displayName.trim()) {
            if (fileId === 'default') {
              displayName = 'Default Board';
            } else if (fileId.startsWith('session-')) {
              displayName = `Session ${fileId.slice('session-'.length, 'session-'.length + 8)}`;
            } else {
              displayName = `Board ${fileId.slice(0, 12)}`;
            }
          }
          boards.push({
            id: data.id || fileId,
            name: displayName,
            sessionId: data.sessionId || null,
            count,
            createdAt: data.createdAt || stats.birthtimeMs || stats.mtimeMs,
            updatedAt: data.updatedAt || stats.mtimeMs
          });
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('[dsh-ui-board] failed to list boards:', err);
  }
  boards.sort((a, b) => b.updatedAt - a.updatedAt);
  return boards;
}

function loadBoard(idOrSession) {
  const targetId = idOrSession || 'default';
  if (boardCache.has(targetId)) {
    return boardCache.get(targetId);
  }

  ensureStorageDir();
  const filePath = getBoardPath(targetId);
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data && Array.isArray(data.elements)) {
        if (!data.id) data.id = targetId;
        if (!data.name) {
          data.name = targetId === 'default' ? 'Default Board' : (
            targetId.startsWith('session-') ? `Session ${targetId.slice('session-'.length, 'session-'.length + 8)}` : `Board ${targetId.slice(0, 12)}`
          );
        }
        boardCache.set(targetId, data);
        return data;
      }
    }
  } catch (err) {
    console.error(`[dsh-ui-board] error reading board file for ${targetId}:`, err);
  }

  const defaultBoard = {
    id: targetId,
    name: targetId === 'default' ? 'Default Board' : 'Untitled Board',
    sessionId: targetId.startsWith('session-') ? targetId : null,
    elements: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  boardCache.set(targetId, defaultBoard);
  return defaultBoard;
}

function saveBoard(arg1, arg2) {
  let id = 'default';
  let elements = [];
  let name = '';
  let sessionId = null;
  let createdAt = null;

  if (typeof arg1 === 'object' && arg1 !== null) {
    id = arg1.id || arg1.session || 'default';
    elements = Array.isArray(arg1.elements) ? arg1.elements : [];
    name = arg1.name;
    sessionId = arg1.session || arg1.sessionId || null;
    createdAt = arg1.createdAt;
  } else {
    id = arg1 || 'default';
    elements = Array.isArray(arg2) ? arg2 : [];
    sessionId = id.startsWith('session-') ? id : null;
  }

  const existing = boardCache.get(id) || {};
  let finalName = (name && name.trim()) || existing.name;
  if (!finalName) {
    if (id === 'default') {
      finalName = 'Default Board';
    } else if (id.startsWith('session-')) {
      finalName = `Session ${id.slice('session-'.length, 'session-'.length + 8)}`;
    } else {
      finalName = 'Untitled Board';
    }
  }

  const board = {
    id,
    name: finalName,
    sessionId: sessionId || existing.sessionId || (id.startsWith('session-') ? id : null),
    elements,
    createdAt: existing.createdAt || createdAt || Date.now(),
    updatedAt: Date.now()
  };
  boardCache.set(id, board);

  // If this board is associated with a session and id !== sessionId, update session cache & file
  if (board.sessionId && board.id !== board.sessionId) {
    boardCache.set(board.sessionId, board);
    const sessionFilePath = getBoardPath(board.sessionId);
    try {
      fs.writeFileSync(sessionFilePath, JSON.stringify(board, null, 2), 'utf-8');
    } catch (_) {}
  }

  ensureStorageDir();
  const filePath = getBoardPath(id);
  try {
    fs.writeFileSync(filePath, JSON.stringify(board, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[dsh-ui-board] error writing board file for ${id}:`, err);
  }
  return board;
}

function deleteBoard(id) {
  if (!id) return false;
  boardCache.delete(id);
  ensureStorageDir();
  const filePath = getBoardPath(id);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.error(`[dsh-ui-board] error deleting board file ${id}:`, err);
  }
  return false;
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
          const action = urlObj.searchParams.get('action');

          if (req.method === 'GET') {
            if (action === 'list') {
              const boards = listBoards();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                ok: true,
                boards
              }));
              return;
            }

            const targetId = urlObj.searchParams.get('id') || sessionId;
            const board = loadBoard(targetId);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              ok: true,
              id: board.id || targetId,
              name: board.name,
              session: board.sessionId || sessionId,
              elements: board.elements,
              createdAt: board.createdAt,
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

                if (data.action === 'delete') {
                  const targetId = data.id || sessionId;
                  deleteBoard(targetId);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ ok: true, deleted: targetId }));
                  return;
                }

                const updatedBoard = saveBoard(data);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({
                  ok: true,
                  id: updatedBoard.id,
                  name: updatedBoard.name,
                  session: updatedBoard.sessionId,
                  count: updatedBoard.elements.length,
                  createdAt: updatedBoard.createdAt,
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

          if (req.method === 'DELETE') {
            const targetId = urlObj.searchParams.get('id') || sessionId;
            deleteBoard(targetId);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: true, deleted: targetId }));
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
            board_id: {
              type: 'string',
              description: 'Optional board ID. If omitted, the tool reads the current session board or the default active board.'
            },
            session: {
              type: 'string',
              description: 'Optional session id. Used if board_id is not provided.'
            }
          }
        },
        output: {
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string', description: 'Structured overview of all screens, UI controls, and user flows.' },
              boardName: { type: 'string', description: 'Name of the board.' },
              elementCount: { type: 'integer' },
              elementsJson: { type: 'string', description: 'Raw JSON representation of all elements for precise inspection.' }
            },
            required: ['summary', 'boardName', 'elementCount', 'elementsJson']
          },
          render(args, value) {
            return [{ type: 'text', text: value.summary }];
          }
        },
        async execute(args, exec) {
          const sid = args.board_id || args.session || exec.agent?.session?.id || 'default';
          const board = loadBoard(sid);
          const header = `**Board: "${board.name || 'Untitled'}"** (ID: \`${board.id || sid}\`)\n\n`;
          const summary = header + generateHierarchySummary(board.elements);
          return {
            summary,
            boardName: board.name || 'Untitled',
            elementCount: board.elements.length,
            elementsJson: JSON.stringify(board.elements)
          };
        }
      });

      // Tool 2: ui_board_mutate
      const unregisterMutate = tools.register({
        name: 'ui_board_mutate',
        description: 'Add, update, rename, or remove UI wireframe elements on the whiteboard canvas (e.g. create a new screen/window, add buttons, input fields, labels, or flow connection arrows).',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['add', 'update', 'delete', 'clear', 'rename'],
              description: 'The mutation action: "add" appends new elements, "update" edits existing elements by ID, "delete" removes elements by ID, "clear" removes all elements, "rename" renames the board.'
            },
            name: {
              type: 'string',
              description: 'New board name when action is "rename".'
            },
            elements: {
              type: 'array',
              description: 'Elements to add or update. Each element object should have: id (string), type ("screen"|"button"|"input"|"box"|"text"|"arrow"|"image"), x (num), y (num), width (num), height (num), label (string), color (optional string), fill (optional string), props (optional object).',
              items: {
                type: 'object'
              }
            },
            element_ids: {
              type: 'array',
              description: 'List of element IDs to delete when action is "delete".',
              items: { type: 'string' }
            },
            board_id: {
              type: 'string',
              description: 'Optional board ID.'
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
              boardName: { type: 'string' },
              elementCount: { type: 'integer' }
            },
            required: ['summary', 'boardName', 'elementCount']
          },
          render(args, value) {
            return [{ type: 'text', text: value.summary }];
          }
        },
        async execute(args, exec) {
          const sid = args.board_id || args.session || exec.agent?.session?.id || 'default';
          const board = loadBoard(sid);
          let currentElements = [...board.elements];
          let currentName = board.name;
          let changeMsg = '';

          if (args.action === 'rename') {
            if (args.name && args.name.trim()) {
              currentName = args.name.trim();
              changeMsg = `Renamed board to "${currentName}".`;
            }
          } else if (args.action === 'clear') {
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

          const saved = saveBoard({
            id: sid,
            name: currentName,
            session: args.session,
            elements: currentElements
          });

          return {
            summary: `${changeMsg} Total elements now: ${currentElements.length}.`,
            boardName: saved.name,
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
