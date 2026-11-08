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
const sseClients = new Set();

function broadcastBoardUpdate(board) {
  if (!board || sseClients.size === 0) return;
  const payload = `data: ${JSON.stringify({
    type: 'update',
    id: board.id,
    sessionId: board.sessionId,
    name: board.name,
    rawElements: board.rawElements,
    elements: board.elements,
    appState: board.appState,
    files: board.files,
    updatedAt: board.updatedAt
  })}\n\n`;

  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

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
        const cached = boardCache.get(fileId);
        if (cached) {
          boards.push({
            id: cached.id,
            name: cached.name,
            sessionId: cached.sessionId || null,
            count: Array.isArray(cached.elements) ? cached.elements.length : 0,
            createdAt: cached.createdAt,
            updatedAt: cached.updatedAt
          });
        } else {
          const filePath = path.join(STORAGE_DIR, file);
          try {
            const stats = fs.statSync(filePath);
            const raw = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw);
            const count = Array.isArray(data.elements) ? data.elements.length : 0;
            let displayName = data.name;
            if (!displayName || !displayName.trim()) {
              displayName = fileId === 'default' ? 'Default Board' : (fileId.startsWith('session-') ? `Session ${fileId.slice('session-'.length, 'session-'.length + 8)}` : `Board ${fileId.slice(0, 12)}`);
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
    }
  } catch (err) {
    console.error('[dsh-ui-board] failed to list boards:', err);
  }
  boards.sort((a, b) => b.updatedAt - a.updatedAt);
  return boards;
}

function loadBoard(idOrSession) {
  const targetId = idOrSession || 'default';
  ensureStorageDir();
  const filePath = getBoardPath(targetId);
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const cached = boardCache.get(targetId);
      if (cached && cached._mtime === stats.mtimeMs) {
        return cached;
      }
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data && Array.isArray(data.elements)) {
        if (!data.id) data.id = targetId;
        if (!data.name) {
          data.name = targetId === 'default' ? 'Default Board' : (
            targetId.startsWith('session-') ? `Session ${targetId.slice('session-'.length, 'session-'.length + 8)}` : `Board ${targetId.slice(0, 12)}`
          );
        }
        data._mtime = stats.mtimeMs;
        boardCache.set(targetId, data);
        return data;
      }
    }
  } catch (err) {
    console.error(`[dsh-ui-board] error reading board file for ${targetId}:`, err);
  }

  if (boardCache.has(targetId)) {
    return boardCache.get(targetId);
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
  let snapshot = null;
  let svg = null;

  if (typeof arg1 === 'object' && arg1 !== null) {
    id = arg1.id || arg1.session || 'default';
    elements = Array.isArray(arg1.elements) ? arg1.elements : [];
    name = arg1.name;
    sessionId = arg1.session || arg1.sessionId || null;
    createdAt = arg1.createdAt;
    snapshot = arg1.snapshot || null;
    svg = arg1.svg || null;
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
    rawElements: (arg1 && arg1.rawElements) || existing.rawElements || null,
    appState: (arg1 && arg1.appState) || existing.appState || null,
    files: (arg1 && arg1.files) || existing.files || null,
    snapshot: snapshot || existing.snapshot || null,
    svg: svg || existing.svg || null,
    createdAt: existing.createdAt || createdAt || Date.now(),
    updatedAt: Date.now()
  };
  boardCache.set(id, board);
  broadcastBoardUpdate(board);

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
    if (board.svg) {
      const svgPath = path.join(STORAGE_DIR, `board-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`);
      fs.writeFileSync(svgPath, board.svg, 'utf-8');
    }
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

function renderAsciiStrokes(penStrokes) {
  const allPoints = [];
  penStrokes.forEach(s => {
    if (Array.isArray(s.points)) {
      s.points.forEach(p => allPoints.push(p));
    }
  });
  if (allPoints.length < 2) return '';

  const minX = Math.min(...allPoints.map(p => p[0]));
  const maxX = Math.max(...allPoints.map(p => p[0]));
  const minY = Math.min(...allPoints.map(p => p[1]));
  const maxY = Math.max(...allPoints.map(p => p[1]));
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const targetW = 60;
  const targetH = Math.min(25, Math.max(8, Math.round((spanY / spanX) * targetW * 0.55)));
  const grid = Array.from({ length: targetH }, () => Array(targetW).fill(' '));

  penStrokes.forEach((stroke, sIdx) => {
    const pts = stroke.points || [];
    const char = String((sIdx % 9) + 1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const steps = Math.max(1, Math.max(Math.abs(p2[0] - p1[0]), Math.abs(p2[1] - p1[1])) * 2);
      for (let step = 0; step <= steps; step++) {
        const x = p1[0] + (p2[0] - p1[0]) * (step / steps);
        const y = p1[1] + (p2[1] - p1[1]) * (step / steps);
        const gx = Math.min(targetW - 1, Math.max(0, Math.floor(((x - minX) / spanX) * (targetW - 1))));
        const gy = Math.min(targetH - 1, Math.max(0, Math.floor(((y - minY) / spanY) * (targetH - 1))));
        grid[gy][gx] = char;
      }
    }
  });

  return '```text\n' + grid.map(row => row.join('')).join('\n') + '\n```\n';
}

function generateHierarchySummary(elements) {
  if (!elements || elements.length === 0) {
    return 'The UI Board is currently empty. No screens or components have been created yet.';
  }

  const screens = elements.filter(e => e.type === 'screen' || e.type === 'frame');
  const arrows = elements.filter(e => e.type === 'arrow');
  const penStrokes = elements.filter(e => (e.type === 'freedraw' || e.type === 'pen' || e.type === 'draw') && Array.isArray(e.points) && e.points.length > 0);

  let summary = `### UI Board Overview (${elements.length} elements total)\n\n`;

  if (penStrokes.length > 0) {
    summary += `#### Freehand Drawings / Handwritten Sketches (${penStrokes.length} strokes):\n`;
    const ascii = renderAsciiStrokes(penStrokes);
    if (ascii) {
      summary += `Visual sketch rendering:\n${ascii}\n`;
    }
  }

  if (screens.length > 0) {
    summary += `#### Screens / Window Frames (${screens.length}):\n`;
    for (const screen of screens) {
      summary += `* **[Screen] ${screen.label || 'Untitled Screen'}** (ID: \`${screen.id}\`, Pos: [${screen.x}, ${screen.y}], Size: ${screen.width}x${screen.height})\n`;

      // Find children within screen bounds or by frameId
      const children = elements.filter(e => {
        if (e.id === screen.id || e.type === 'screen' || e.type === 'frame' || e.type === 'arrow') return false;
        if (e.frameId && e.frameId === screen.id) return true;
        return (
          e.x >= screen.x &&
          e.y >= screen.y &&
          e.x + (e.width || 0) <= screen.x + screen.width &&
          e.y + (e.height || 0) <= screen.y + screen.height
        );
      });

      if (children.length > 0) {
        for (const child of children) {
          const typeLabel = (child.geo ? `${child.type}:${child.geo}` : child.type).toUpperCase();
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
    if (e.type === 'screen' || e.type === 'frame' || e.type === 'arrow') return false;
    if (e.frameId) return false;
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
      if (item.type === 'freedraw' || item.type === 'pen' || item.type === 'draw') {
        const strokeLen = item.points?.length ? ` (${item.points.length} points)` : '';
        summary += `* \`PEN STROKE\`: Freehand sketch line${strokeLen} at [${item.x}, ${item.y}] (ID: \`${item.id}\`)\n`;
      } else if (item.type === 'image') {
        summary += `* \`IMAGE\`: "${item.label || 'Image'}" (ID: \`${item.id}\`, Size: ${item.width}x${item.height})\n`;
      } else {
        const typeLabel = (item.geo ? `${item.type}:${item.geo}` : item.type).toUpperCase();
        summary += `* \`${typeLabel}\`: "${item.label || item.props?.placeholder || ''}" at [${item.x}, ${item.y}] Size: ${item.width}x${item.height} (ID: \`${item.id}\`)\n`;
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
            if (urlObj.pathname.endsWith('/stream')) {
              res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
              });
              const client = { res, id: urlObj.searchParams.get('id') };
              sseClients.add(client);
              req.on('close', () => {
                sseClients.delete(client);
              });
              res.write(': connected\n\n');
              return;
            }

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
              rawElements: board.rawElements || board.elements,
              appState: board.appState || {},
              files: board.files || {},
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
          let board = loadBoard(sid);

          // If the board is empty, but another board exists (e.g. user created or switched to a named board), check the most recently modified board!
          if ((!board.elements || board.elements.length === 0) && !args.board_id && !args.session) {
            const list = listBoards();
            if (list.length > 0 && list[0].count > 0) {
              board = loadBoard(list[0].id);
            }
          }

          const header = `**Board: "${board.name || 'Untitled'}"** (ID: \`${board.id || sid}\`, Last Updated: ${new Date(board.updatedAt || Date.now()).toLocaleTimeString()})\n\n`;
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
          let board = loadBoard(sid);
          if ((!board.elements || board.elements.length === 0) && !args.board_id && !args.session) {
            const list = listBoards();
            if (list.length > 0 && list[0].count > 0) {
              board = loadBoard(list[0].id);
            }
          }
          const actualId = board.id || sid;
          let currentElements = [...board.elements];
          let currentRawElements = Array.isArray(board.rawElements) ? [...board.rawElements] : [...currentElements];
          let currentName = board.name;
          let changeMsg = '';

          if (args.action === 'rename') {
            if (args.name && args.name.trim()) {
              currentName = args.name.trim();
              changeMsg = `Renamed board to "${currentName}".`;
            }
          } else if (args.action === 'clear') {
            currentElements = [];
            currentRawElements = [];
            changeMsg = 'Cleared all elements on the UI board.';
          } else if (args.action === 'delete') {
            const idsToDelete = new Set(args.element_ids || []);
            const beforeLen = currentElements.length;
            currentElements = currentElements.filter(e => !idsToDelete.has(e.id));
            currentRawElements = currentRawElements.filter(e => !idsToDelete.has(e.id));
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

            const newRawItems = newItems.map(item => {
              if (item.type === 'text') {
                const textStr = String(item.label || item.text || 'world');
                return {
                  id: item.id,
                  type: 'text',
                  x: Number(item.x) || 150,
                  y: Number(item.y) || 450,
                  width: Number(item.width) || (textStr.length * 20),
                  height: Number(item.height) || 45,
                  angle: 0,
                  strokeColor: item.color || '#1e1e1e',
                  backgroundColor: 'transparent',
                  fillStyle: 'solid',
                  strokeWidth: 1,
                  strokeStyle: 'solid',
                  roundness: null,
                  roughness: 1,
                  opacity: 100,
                  groupIds: [],
                  frameId: null,
                  seed: Math.floor(Math.random() * 100000),
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 100000),
                  isDeleted: false,
                  boundElements: null,
                  updated: Date.now(),
                  link: null,
                  locked: false,
                  text: textStr,
                  fontSize: Number(item.fontSize) || 36,
                  fontFamily: 1,
                  textAlign: 'left',
                  verticalAlign: 'top',
                  containerId: null,
                  originalText: textStr,
                  lineHeight: 1.25
                };
              }
              return item;
            });
            currentRawElements = [...currentRawElements, ...newRawItems];

            changeMsg = `Added ${newItems.length} elements to the UI board.`;
          } else if (args.action === 'update') {
            const updates = new Map((args.elements || []).map(e => [e.id, e]));
            currentElements = currentElements.map(e => {
              if (updates.has(e.id)) {
                return { ...e, ...updates.get(e.id) };
              }
              return e;
            });
            currentRawElements = currentRawElements.map(e => {
              if (updates.has(e.id)) {
                return { ...e, ...updates.get(e.id) };
              }
              return e;
            });
            changeMsg = `Updated ${updates.size} elements on the UI board.`;
          }

          const saved = saveBoard({
            id: actualId,
            name: currentName,
            session: args.session,
            elements: currentElements,
            rawElements: currentRawElements,
            appState: board.appState,
            files: board.files
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
