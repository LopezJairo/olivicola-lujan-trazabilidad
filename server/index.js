/**
 * OLIVÍCOLA LUJÁN · Servidor Backend Embebido y API para Red Local (LAN)
 * Permite operar en Modo Servidor Host sirviendo la base de datos SQLite y la API
 * a los terminales cliente de planta, balanzas y dispositivos móviles.
 * 
 * Basado en node:http estándar para funcionar sin dependencias binarias externas.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { SQLiteDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.resolve(__dirname, '..', 'dist');

/**
 * Detecta las direcciones IP locales (IPv4) disponibles en la máquina.
 */
export function getLanIps() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push({ iface: name, ip: net.address });
      }
    }
  }
  return results;
}

/**
 * Determina el Content-Type para archivos estáticos
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js':
    case '.mjs': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.woff2': return 'font/woff2';
    default: return 'application/octet-stream';
  }
}

/**
 * Lee y parsea el cuerpo de una petición POST/PUT como JSON
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Protección contra payloads excesivos (>10MB)
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Payload demasiado grande'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error(`JSON inválido: ${err.message}`));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Responde con JSON agregando cabeceras CORS
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  });
  res.end(JSON.stringify(data));
}

/**
 * Servidor HTTP para LAN y modo Host
 */
export function createServer(options = {}) {
  const db = options.db || new SQLiteDatabase(options.dbPath);

  const server = http.createServer(async (req, res) => {
    // 1. Manejo de Preflight CORS
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    try {
      // -------------------------------------------------------------
      // RUTAS API
      // -------------------------------------------------------------

      // 1. Estado y Salud del Servidor
      if (pathname === '/api/status' && req.method === 'GET') {
        const lanIps = getLanIps();
        const state = db.getFullState();
        sendJson(res, 200, {
          status: 'ok',
          mode: 'host',
          app: 'Olivícola Luján · Trazabilidad',
          version: '1.0.1',
          serverTime: new Date().toISOString(),
          lanIps,
          stats: {
            tambores: state.tambores.length,
            catalogos: state.catalogos.length,
            historial: state.historial.length,
            movimientos: state.movimientos.length,
          },
        });
        return;
      }

      // 2. Información de Red para Clientes
      if (pathname === '/api/network-info' && req.method === 'GET') {
        const lanIps = getLanIps();
        sendJson(res, 200, {
          hostIps: lanIps.map(i => i.ip),
          interfaces: lanIps,
          port: server.address()?.port || 4000,
        });
        return;
      }

      // 3. Base de Datos Completa (Carga o Sincronización)
      if (pathname === '/api/database') {
        if (req.method === 'GET') {
          sendJson(res, 200, db.getFullState());
          return;
        }
        if (req.method === 'POST') {
          const body = await parseJsonBody(req);
          db.saveFullState(body);
          sendJson(res, 200, { success: true, message: 'Base de datos sincronizada' });
          return;
        }
      }

      // 4. Tambores (Listar o Crear)
      if (pathname === '/api/tambores') {
        if (req.method === 'GET') {
          sendJson(res, 200, db.getTambores());
          return;
        }
        if (req.method === 'POST') {
          const body = await parseJsonBody(req);
          const user = body.currentUser || { nombre: 'Operario LAN' };
          const drum = db.createTambor(body.drumData || body, user);
          sendJson(res, 201, drum);
          return;
        }
      }

      // 5. Tambor Individual (Detalle, Editar, Eliminar)
      const tamborMatch = pathname.match(/^\/api\/tambores\/([^/]+)$/);
      if (tamborMatch) {
        const id = decodeURIComponent(tamborMatch[1]);
        if (req.method === 'GET') {
          const drum = db.getTamborById(id);
          if (!drum) {
            sendJson(res, 404, { error: `Tambor no encontrado (${id})` });
            return;
          }
          sendJson(res, 200, drum);
          return;
        }
        if (req.method === 'PUT') {
          const body = await parseJsonBody(req);
          const user = body.currentUser || { nombre: 'Operario LAN' };
          const drum = db.updateTambor(id, body.drumData || body, user);
          sendJson(res, 200, drum);
          return;
        }
        if (req.method === 'DELETE') {
          const body = await parseJsonBody(req);
          const confirmText = body.confirmationText || parsedUrl.searchParams.get('confirmationText');
          const user = body.currentUser || { nombre: 'Administrador LAN' };
          const result = db.deleteTambor(id, confirmText, user);
          sendJson(res, 200, result);
          return;
        }
      }

      // 6. Registrar Movimiento Físico
      const movMatch = pathname.match(/^\/api\/tambores\/([^/]+)\/movimiento$/);
      if (movMatch && req.method === 'POST') {
        const id = decodeURIComponent(movMatch[1]);
        const body = await parseJsonBody(req);
        const user = body.currentUser || { nombre: 'Operario LAN' };
        const result = db.recordMovimiento(id, body.movementInput || body, user);
        sendJson(res, 200, result);
        return;
      }

      // 7. Auditoría de Inventario por Ráfaga de Escaneo
      if (pathname === '/api/inventario/auditoria' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const user = body.currentUser || { nombre: 'Operario LAN' };
        const result = db.applyInventarioAuditoria(body.auditResult || body, user);
        sendJson(res, 200, result);
        return;
      }

      // 8. Control de Calidad: Autorización de Lotes y Muestreos
      if (pathname === '/api/calidad/autorizar' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const user = body.currentUser || { nombre: 'Responsable Calidad LAN' };
        const result = db.authorizeQualityLot(body, user);
        sendJson(res, 200, result);
        return;
      }

      // 9. Catálogos
      if (pathname === '/api/catalogos') {
        if (req.method === 'GET') {
          sendJson(res, 200, db.getCatalogos());
          return;
        }
        if (req.method === 'POST') {
          const body = await parseJsonBody(req);
          const catalogos = db.saveCatalogItem(body);
          sendJson(res, 200, catalogos);
          return;
        }
      }

      const catToggleMatch = pathname.match(/^\/api\/catalogos\/([^/]+)\/toggle$/);
      if (catToggleMatch && req.method === 'POST') {
        const id = decodeURIComponent(catToggleMatch[1]);
        const item = db.toggleCatalogActive(id);
        sendJson(res, 200, item);
        return;
      }

      // 10. Copia de Seguridad JSON
      if (pathname === '/api/backup' && req.method === 'GET') {
        const state = db.getFullState();
        sendJson(res, 200, {
          app: 'OLIVÍCOLA LUJÁN · Trazabilidad de Tambores',
          version: '1.0.1',
          exportedAt: new Date().toISOString(),
          mode: 'host',
          data: state,
        });
        return;
      }

      if (pathname === '/api/restore' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const data = body.data || body;
        db.saveFullState(data);
        sendJson(res, 200, { success: true, message: 'Base de datos restaurada correctamente' });
        return;
      }

      // 11. Restablecer Demo
      if (pathname === '/api/reset-demo' && req.method === 'POST') {
        db.resetToInitialState(true);
        sendJson(res, 200, { success: true, message: 'Datos demo restablecidos' });
        return;
      }

      // -------------------------------------------------------------
      // SERVICIO DE ARCHIVOS ESTÁTICOS DE DIST (Para clientes web LAN)
      // -------------------------------------------------------------
      if (fs.existsSync(DIST_PATH)) {
        let filePath = path.join(DIST_PATH, pathname === '/' ? 'index.html' : pathname);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(DIST_PATH, 'index.html');
        }

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath);
          res.writeHead(200, {
            'Content-Type': getMimeType(filePath),
            'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'max-age=31536000',
          });
          res.end(content);
          return;
        }
      }

      // Si no coincide con ninguna ruta ni archivo
      sendJson(res, 404, { error: 'Ruta no encontrada' });
    } catch (err) {
      console.error('Error procesando solicitud en servidor backend:', err);
      sendJson(res, 400, { error: err.message || 'Error interno del servidor' });
    }
  });

  return {
    server,
    db,
    listen: (port = 4000, host = '0.0.0.0') => {
      return new Promise((resolve, reject) => {
        server.listen(port, host, () => {
          const actualPort = server.address().port;
          const lanIps = getLanIps();
          console.log(`[Olivícola Luján] Servidor Host iniciado en http://localhost:${actualPort}`);
          lanIps.forEach(i => {
            console.log(`[Olivícola Luján] Accesible en LAN (${i.iface}): http://${i.ip}:${actualPort}`);
          });
          resolve({ port: actualPort, lanIps });
        });
        server.on('error', reject);
      });
    },
    close: () => {
      return new Promise((resolve) => {
        db.close();
        server.close(resolve);
      });
    },
  };
}

// Arranque directo por línea de comandos: `node server/index.js`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';
  const instance = createServer();
  instance.listen(port, host).catch(err => {
    console.error('Error al iniciar servidor:', err);
    process.exit(1);
  });
}
