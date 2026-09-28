import { describe, it, expect, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { SQLiteDatabase } from '../server/db.js';
import { createServer, getLanIps } from '../server/index.js';
import {
  ROLES,
  PERMISOS,
  ROLE_PERMISSIONS,
  DEFAULT_USERS,
  checkPermission,
} from '../src/components/Auth.jsx';
import {
  getNetworkConfig,
  setNetworkConfig,
  NETWORK_MODES,
  authorizeQualityLot,
  getOperatorAuditEvents,
  loadDatabase,
  resetDemoDatabase,
  setCurrentWorkspaceMode,
} from '../src/api/repository.js';

// Mock localStorage para vitest
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('1. Persistencia Relacional SQLite Embebida (server/db.js)', () => {
  let db;

  beforeEach(() => {
    db = new SQLiteDatabase(':memory:');
  });

  it('1.1 Inicializa base de datos en memoria con esquema completo y seed oficial', () => {
    const state = db.getFullState();
    expect(state.catalogos.length).toBeGreaterThanOrEqual(50);
    expect(state.tambores).toHaveLength(12);
    expect(state.historial.length).toBeGreaterThan(0);
    expect(state.movimientos.length).toBeGreaterThan(0);

    const firstDrum = state.tambores[0];
    expect(firstDrum.tambor_id).toBeDefined();
    expect(firstDrum.codigo_compacto).toBeDefined();
    expect(firstDrum.peso).toBeGreaterThan(0);
  });

  it('1.2 Crea nuevo tambor calculando ID secuencial y códigos descriptivo/compacto', () => {
    const raw = {
      producto: 'cat-prod-1',
      presentacion: 'cat-pres-1',
      variedad: 'cat-var-1',
      calibre: 'cat-cal-1',
      calidad: 'cat-qual-1',
      lote: 'LOTE-SQLITE-01',
      fecha_ingreso: '2026-09-25',
      peso: '180,0',
      ubicacion: 'cat-ubi-1',
      estado: 'cat-est-1',
    };

    const created = db.createTambor(raw, { nombre: 'Operario SQLite' });
    expect(created.tambor_id).toBe('T000013');
    expect(created.peso).toBe(180.0);
    expect(created.codigo_compacto).toBe('ENTVDEALOR121140PRI');

    const retrieved = db.getTamborById('T000013');
    expect(retrieved).toBeDefined();
    expect(retrieved.lote).toBe('LOTE-SQLITE-01');
    expect(retrieved.historial.length).toBeGreaterThanOrEqual(1);
    expect(retrieved.historial[0].actor).toBe('Operario SQLite');
  });

  it('1.3 Actualiza tambor y registra diferencias campo por campo en el historial', () => {
    const drum = db.getFullState().tambores[0];
    const updated = db.updateTambor(
      drum.id,
      { lote: 'LOTE-MODIFICADO-SQLITE', peso: 195.5 },
      { nombre: 'Operador Balanza' }
    );

    expect(updated.lote).toBe('LOTE-MODIFICADO-SQLITE');
    expect(updated.peso).toBe(195.5);

    const detail = db.getTamborById(drum.id);
    const editEvent = detail.historial.find((h) => h.tipo === 'Edición' && h.campo === 'lote');
    expect(editEvent).toBeDefined();
    expect(editEvent.valor_nuevo).toBe('LOTE-MODIFICADO-SQLITE');
  });

  it('1.4 Registra movimiento físico modificando ubicación y estado', () => {
    const drum = db.getFullState().tambores[0];
    const res = db.recordMovimiento(
      drum.id,
      {
        tipo: 'cat-mov-1',
        ubicacion_nueva: 'cat-ubi-4', // Nave B - Fila 1
        estado_nuevo: 'cat-est-3',   // En salmuera definitiva
        observaciones: 'Traslado a nave B por maduración',
      },
      { nombre: 'Operador Autoelevador' }
    );

    expect(res.drum.ubicacion).toBe('cat-ubi-4');
    expect(res.drum.estado).toBe('cat-est-3');
    expect(res.movement.tipo).toBe('cat-mov-1');

    const detail = db.getTamborById(drum.id);
    expect(detail.movimientos.length).toBeGreaterThanOrEqual(1);
    expect(detail.movimientos[0].observaciones).toBe('Traslado a nave B por maduración');
  });

  it('1.5 Aplica toma física de inventario por sectores reubicando tambores', () => {
    const drums = db.getFullState().tambores;
    const targetDrum = drums[0];

    const auditResult = {
      sectorsCount: 1,
      validDrumsCount: 1,
      relocations: [
        {
          drumId: targetDrum.id,
          tambor_id: targetDrum.tambor_id,
          newSectorId: 'cat-ubi-5', // Nave B - Fila 2
        },
      ],
      sectors: [
        {
          sectorId: 'cat-ubi-5',
          drums: [{ tambor_id: targetDrum.tambor_id }],
        },
      ],
    };

    const res = db.applyInventarioAuditoria(auditResult, { nombre: 'Operario Escáner' });
    expect(res.success).toBe(true);
    expect(res.relocationsApplied).toBe(1);

    const updated = db.getTamborById(targetDrum.id);
    expect(updated.ubicacion).toBe('cat-ubi-5');
    expect(updated.ultima_auditoria).toBeDefined();
  });

  it('1.6 Dictamina y autoriza lote de calidad con parámetros de muestreo físico-químico', () => {
    const drums = db.getFullState().tambores;
    const target = drums[0];

    const res = db.authorizeQualityLot(
      {
        drumIds: [target.id],
        lot: target.lote,
        estadoNuevo: 'cat-est-5', // Aprobado calidad
        observaciones: 'Lote apto según análisis organoléptico',
        muestreoData: { ph: '3.82', salinidad: '8.4', acidez: '0.42' },
      },
      { nombre: 'Ing. Marcela Benítez' }
    );

    expect(res.success).toBe(true);
    expect(res.authorizedCount).toBe(1);

    const detail = db.getTamborById(target.id);
    expect(detail.estado).toBe('cat-est-5');
    const qualityHist = detail.historial.find((h) => h.tipo === 'Calidad');
    expect(qualityHist).toBeDefined();
    expect(qualityHist.observaciones).toContain('pH: 3.82');
  });

  it('1.7 Elimina tambor requiriendo confirmación estricta de su número visible', () => {
    const drums = db.getFullState().tambores;
    const target = drums[drums.length - 1];

    expect(() => db.deleteTambor(target.id, 'NUMERO-INCORRECTO')).toThrow();

    const delRes = db.deleteTambor(target.id, target.tambor_id, { nombre: 'Valeria Rivas' });
    expect(delRes.success).toBe(true);

    const check = db.getTamborById(target.id);
    expect(check).toBeNull();
  });
});

describe('2. Servidor Backend HTTP para LAN (server/index.js)', () => {
  let db;
  let app;

  beforeEach(() => {
    db = new SQLiteDatabase(':memory:');
    app = createServer({ db });
  });

  // Helper para despachar peticiones en proceso simulando el ciclo HTTP de Node
  const dispatch = (method, url, body = null) => {
    return new Promise((resolve) => {
      const req = new EventEmitter();
      req.method = method;
      req.url = url;
      req.headers = { host: 'localhost:4000', 'content-type': 'application/json' };

      let statusCode = 200;
      let headers = {};
      let responseBody = '';

      const res = {
        writeHead: (code, hdrs) => {
          statusCode = code;
          headers = hdrs;
        },
        end: (data) => {
          if (data) responseBody += data;
          let parsed = null;
          try {
            parsed = JSON.parse(responseBody);
          } catch {
            parsed = responseBody;
          }
          resolve({ status: statusCode, headers, body: parsed });
        },
      };

      app.server.emit('request', req, res);

      if (body) {
        req.emit('data', JSON.stringify(body));
      }
      req.emit('end');
    });
  };

  it('2.1 Responde a /api/status con estadísticas, versión y modo host', async () => {
    const res = await dispatch('GET', '/api/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.mode).toBe('host');
    expect(res.body.version).toBe('1.0.1');
    expect(res.body.stats.tambores).toBe(12);
  });

  it('2.2 Responde a /api/network-info con interfaces locales detectadas', async () => {
    const res = await dispatch('GET', '/api/network-info');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.hostIps)).toBe(true);
  });

  it('2.3 Lista tambores vía GET /api/tambores y crea vía POST /api/tambores', async () => {
    const getRes = await dispatch('GET', '/api/tambores');
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveLength(12);

    const newDrum = {
      producto: 'cat-prod-1',
      presentacion: 'cat-pres-1',
      variedad: 'cat-var-1',
      calibre: 'cat-cal-1',
      calidad: 'cat-qual-1',
      lote: 'LOTE-API-01',
      fecha_ingreso: '2026-09-25',
      peso: '180',
      ubicacion: 'cat-ubi-1',
      estado: 'cat-est-1',
    };

    const postRes = await dispatch('POST', '/api/tambores', { drumData: newDrum });
    expect(postRes.status).toBe(201);
    expect(postRes.body.tambor_id).toBe('T000013');
  });

  it('2.4 Registra dictamen de calidad vía POST /api/calidad/autorizar', async () => {
    const drums = db.getTambores();
    const target = drums[0];

    const res = await dispatch('POST', '/api/calidad/autorizar', {
      drumIds: [target.id],
      estadoNuevo: 'cat-est-5',
      observaciones: 'Liberado por muestreo API',
      muestreoData: { ph: '3.9', salinidad: '8.0', acidez: '0.45' },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.authorizedCount).toBe(1);
  });

  it('2.5 Maneja preflight OPTIONS devolviendo cabeceras CORS permisivas', async () => {
    const res = await dispatch('OPTIONS', '/api/tambores');
    expect(res.status).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

describe('3. Jerarquía de Perfiles y Control de Permisos (src/components/Auth.jsx)', () => {
  it('3.1 Perfil Operario posee permisos de pesaje, escaneo, inventario e impresión; no de administración', () => {
    expect(checkPermission(ROLES.OPERARIO, PERMISOS.PESAJE_REGISTRO)).toBe(true);
    expect(checkPermission(ROLES.OPERARIO, PERMISOS.ESCANEO_BURST)).toBe(true);
    expect(checkPermission(ROLES.OPERARIO, PERMISOS.TOMA_INVENTARIO)).toBe(true);
    expect(checkPermission(ROLES.OPERARIO, PERMISOS.IMPRESION_ETIQUETAS)).toBe(true);

    // No permitidos para operario
    expect(checkPermission(ROLES.OPERARIO, PERMISOS.GESTION_CATALOGOS)).toBe(false);
    expect(checkPermission(ROLES.OPERARIO, PERMISOS.GESTION_BACKUPS)).toBe(false);
    expect(checkPermission(ROLES.OPERARIO, PERMISOS.ELIMINAR_TAMBORES)).toBe(false);
    expect(checkPermission(ROLES.OPERARIO, PERMISOS.CONFIG_RED)).toBe(false);
  });

  it('3.2 Perfil Calidad posee autorización de calidad y muestreos; no catálogos ni backups', () => {
    expect(checkPermission(ROLES.CALIDAD, PERMISOS.AUTORIZAR_CALIDAD)).toBe(true);
    expect(checkPermission(ROLES.CALIDAD, PERMISOS.MUESTREO_LOTES)).toBe(true);
    expect(checkPermission(ROLES.CALIDAD, PERMISOS.ESCANEO_BURST)).toBe(true);
    expect(checkPermission(ROLES.CALIDAD, PERMISOS.AUDITORIA_REALTIME)).toBe(true);

    // No permitidos para calidad
    expect(checkPermission(ROLES.CALIDAD, PERMISOS.GESTION_CATALOGOS)).toBe(false);
    expect(checkPermission(ROLES.CALIDAD, PERMISOS.GESTION_BACKUPS)).toBe(false);
    expect(checkPermission(ROLES.CALIDAD, PERMISOS.ELIMINAR_TAMBORES)).toBe(false);
  });

  it('3.3 Perfil Administrador posee todos los permisos del sistema', () => {
    for (const perm of Object.values(PERMISOS)) {
      expect(checkPermission(ROLES.ADMINISTRADOR, perm)).toBe(true);
    }
  });

  it('3.4 Usuarios predefinidos corresponden a Operario de Planta, Calidad y Gerente General', () => {
    expect(DEFAULT_USERS.operario.rol).toBe(ROLES.OPERARIO);
    expect(DEFAULT_USERS.calidad.rol).toBe(ROLES.CALIDAD);
    expect(DEFAULT_USERS.admin.rol).toBe(ROLES.ADMINISTRADOR);
  });
});

describe('4. Arquitectura de Red y Configuración en Repositorio (src/api/repository.js)', () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentWorkspaceMode('demo');
    resetDemoDatabase();
  });

  it('4.1 Permite alternar y persistir entre Modo Autónomo, Host y Terminal Cliente', () => {
    const initial = getNetworkConfig();
    expect(initial.mode).toBe(NETWORK_MODES.OFFLINE);

    setNetworkConfig({ mode: NETWORK_MODES.HOST, hostUrl: 'http://localhost:4000' });
    expect(getNetworkConfig().mode).toBe(NETWORK_MODES.HOST);

    setNetworkConfig({ mode: NETWORK_MODES.CLIENT, hostUrl: 'http://192.168.1.50:4000' });
    expect(getNetworkConfig().mode).toBe(NETWORK_MODES.CLIENT);
    expect(getNetworkConfig().hostUrl).toBe('http://192.168.1.50:4000');
  });

  it('4.2 Ejecuta authorizeQualityLot actualizando estado, creando movimiento e historial', async () => {
    const db = loadDatabase();
    const target = db.tambores[0];

    const res = await authorizeQualityLot(
      {
        drumIds: [target.id],
        lot: target.lote,
        estadoNuevo: 'cat-est-5',
        observaciones: 'Liberación de lote de prueba',
        muestreoData: { ph: '3.8', salinidad: '8.5', acidez: '0.4' },
      },
      { nombre: 'Ing. Marcela Benítez' }
    );

    expect(res.success).toBe(true);
    expect(res.authorizedCount).toBe(1);

    const dbAfter = loadDatabase();
    const drumAfter = dbAfter.tambores.find((d) => d.id === target.id);
    expect(drumAfter.estado).toBe('cat-est-5');

    const histEvent = dbAfter.historial.find((h) => h.tipo === 'Calidad');
    expect(histEvent).toBeDefined();
    expect(histEvent.observaciones).toContain('pH: 3.8');
  });

  it('4.3 Consulta eventos de auditoría para gerencia con filtros por actor y tipo', () => {
    const all = getOperatorAuditEvents({});
    expect(all.length).toBeGreaterThan(0);

    const creationEvents = getOperatorAuditEvents({ tipo: 'Creación' });
    expect(creationEvents.every((e) => e.tipo === 'Creación')).toBe(true);
  });
});

describe('5. Soporte para Escritorio y Empaquetado Electron', () => {
  it('5.1 package.json define punto de entrada electron/main.cjs y scripts de empaquetado', () => {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    expect(pkg.main).toBe('electron/main.cjs');
    expect(pkg.scripts['electron:start']).toBeDefined();
    expect(pkg.scripts['electron:build']).toBeDefined();
    expect(pkg.scripts['electron:build:win']).toBeDefined();
    expect(pkg.scripts['electron:build:mac']).toBeDefined();
    expect(pkg.build).toBeDefined();
    expect(pkg.build.appId).toBe('com.olivicolalujan.trazabilidad');
    expect(pkg.build.win.target).toContain('nsis');
    expect(pkg.build.mac.target).toContain('dmg');
  });

  it('5.2 electron/main.cjs y electron/preload.cjs existen y contienen lógica de escritorio', () => {
    const mainPath = path.resolve(process.cwd(), 'electron', 'main.cjs');
    const preloadPath = path.resolve(process.cwd(), 'electron', 'preload.cjs');

    expect(fs.existsSync(mainPath)).toBe(true);
    expect(fs.existsSync(preloadPath)).toBe(true);

    const mainContent = fs.readFileSync(mainPath, 'utf8');
    expect(mainContent).toContain('BrowserWindow');
    expect(mainContent).toContain('startEmbeddedServer');
    expect(mainContent).toContain('getLocalIps');

    const preloadContent = fs.readFileSync(preloadPath, 'utf8');
    expect(preloadContent).toContain('contextBridge');
    expect(preloadContent).toContain('electronAPI');
  });
});
