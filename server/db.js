/**
 * OLIVÍCOLA LUJÁN · Capa de Persistencia SQLite Embebida
 * Motor de base de datos relacional para el modo Servidor Host y almacenamiento local permanente.
 * Utiliza node:sqlite (integrado nativamente en Node.js 22+) sin dependencias binarias externas.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let DatabaseSync;
try {
  const sqliteMod = require('node:sqlite');
  DatabaseSync = sqliteMod?.DatabaseSync;
} catch (err) {
  // node:sqlite no está disponible en Node <22 ni en Electron 33 (basado en Node 20)
}
import {
  INITIAL_CATALOGOS,
  INITIAL_TAMBORES,
  INITIAL_HISTORIAL,
  INITIAL_MOVIMIENTOS,
} from '../src/api/demoData.js';
import {
  nextTamborId,
  buildDescriptiveCode,
  buildCompactCode,
  buildFullCode,
  normalizeDrumInput,
  validateDrum,
  diffDrumFields,
  resolveCatalogName,
} from '../src/lib/domain.js';

/**
 * Motor de persistencia JSON de alta compatibilidad para Electron / Node.js
 * Se activa automáticamente cuando node:sqlite nativo no está disponible.
 */
export class JSONFileDatabase {
  constructor(dbPath = null) {
    let p = dbPath || process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'trazabilidad.json');
    if (p.endsWith('.sqlite')) {
      p = p.replace(/\.sqlite$/, '.json');
    }
    this.dbPath = p;
    this.state = {
      catalogos: [],
      tambores: [],
      historial: [],
      movimientos: [],
    };
    this.init();
  }

  init() {
    if (this.dbPath !== ':memory:') {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.dbPath)) {
        try {
          const raw = fs.readFileSync(this.dbPath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.catalogos)) {
            this.state = {
              catalogos: parsed.catalogos || [],
              tambores: parsed.tambores || [],
              historial: parsed.historial || [],
              movimientos: parsed.movimientos || [],
            };
            return;
          }
        } catch (err) {
          console.warn('[JSONStore] Error al cargar archivo:', err.message);
        }
      }
    }
    this.seedIfEmpty();
  }

  save() {
    if (this.dbPath === ':memory:') return;
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      console.error('[JSONStore] Error al guardar en disco:', err.message);
    }
  }

  seedIfEmpty(includeDemoDrums = (this.dbPath === ':memory:')) {
    if (this.state.catalogos.length === 0) {
      this.resetToInitialState(includeDemoDrums);
    }
  }

  resetToInitialState(includeDemoDrums = true) {
    this.state = {
      catalogos: (INITIAL_CATALOGOS || []).map(c => ({ ...c, activo: Boolean(c.activo), orden: c.orden || 1 })),
      tambores: includeDemoDrums ? (INITIAL_TAMBORES || []).map(t => ({ ...t, peso: Number(t.peso) })) : [],
      historial: includeDemoDrums ? [...(INITIAL_HISTORIAL || [])] : [],
      movimientos: includeDemoDrums ? [...(INITIAL_MOVIMIENTOS || [])] : [],
    };
    this.save();
  }

  getFullState() {
    return {
      catalogos: [...this.state.catalogos].sort((a, b) => (a.orden || 1) - (b.orden || 1) || a.nombre.localeCompare(b.nombre)),
      tambores: [...this.state.tambores].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
      historial: [...this.state.historial].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
      movimientos: [...this.state.movimientos].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    };
  }

  saveFullState(newState) {
    this.state = {
      catalogos: Array.isArray(newState.catalogos) ? newState.catalogos : this.state.catalogos,
      tambores: Array.isArray(newState.tambores) ? newState.tambores : this.state.tambores,
      historial: Array.isArray(newState.historial) ? newState.historial : this.state.historial,
      movimientos: Array.isArray(newState.movimientos) ? newState.movimientos : this.state.movimientos,
    };
    this.save();
    return true;
  }

  getTambores() {
    return [...this.state.tambores].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }

  getTamborById(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toUpperCase();
    const drum = this.state.tambores.find(
      t => (t.id && t.id.toUpperCase() === cleanId) || (t.tambor_id && t.tambor_id.toUpperCase() === cleanId)
    );
    if (!drum) return null;

    const historial = this.state.historial
      .filter(h => (h.tambor_id && h.tambor_id.toUpperCase() === drum.tambor_id.toUpperCase()) || h.tambor_ref === drum.id)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const movimientos = this.state.movimientos
      .filter(m => (m.tambor_id && m.tambor_id.toUpperCase() === drum.tambor_id.toUpperCase()) || m.tambor_ref === drum.id)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    return { ...drum, historial, movimientos };
  }

  createTambor(rawInput, currentUser = null) {
    const state = this.getFullState();
    const normalized = normalizeDrumInput(rawInput);
    const validation = validateDrum(normalized, state.catalogos, { isEdit: false });
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Datos del tambor inválidos');
    }

    const nextId = nextTamborId(state.tambores, state.historial);
    const descCode = buildDescriptiveCode(normalized, state.catalogos);
    const compactCode = buildCompactCode(descCode);
    const fullCode = buildFullCode(descCode, nextId);
    const now = new Date().toISOString();

    const drum = {
      ...normalized,
      id: `tb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: nextId,
      codigo_descriptivo: descCode,
      codigo_compacto: compactCode,
      codigo: fullCode,
      created_date: now,
    };

    const historyEvent = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo: 'Creación',
      descripcion: `Tambor creado en el sistema con peso neto ${drum.peso} kg`,
      actor: currentUser?.nombre || 'Operario Planta',
      created_date: now,
    };

    this.state.tambores.unshift(drum);
    this.state.historial.unshift(historyEvent);
    this.save();
    return drum;
  }

  updateTambor(id, rawInput, currentUser = null) {
    const existing = this.getTamborById(id);
    if (!existing) throw new Error(`No se encontró el tambor solicitado (${id})`);

    const state = this.getFullState();
    const mergedInput = { ...existing, ...rawInput };
    const normalized = normalizeDrumInput(mergedInput);

    const validation = validateDrum(normalized, state.catalogos, { isEdit: true, currentDrum: existing });
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Datos del tambor inválidos');
    }

    const descCode = buildDescriptiveCode(normalized, state.catalogos);
    const compactCode = buildCompactCode(descCode);
    const fullCode = buildFullCode(descCode, existing.tambor_id);
    const now = new Date().toISOString();

    const updatedDrum = {
      ...existing,
      ...normalized,
      id: existing.id,
      tambor_id: existing.tambor_id,
      codigo_descriptivo: descCode,
      codigo_compacto: compactCode,
      codigo: fullCode,
      updated_date: now,
    };

    const diffs = diffDrumFields(existing, updatedDrum, state.catalogos);
    const idx = this.state.tambores.findIndex(t => t.id === existing.id);
    if (idx !== -1) {
      this.state.tambores[idx] = updatedDrum;
    }

    for (const diff of diffs) {
      this.state.historial.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tambor_id: existing.tambor_id,
        tambor_ref: existing.id,
        tipo: 'Edición',
        campo: diff.campo,
        valor_anterior: diff.valor_anterior,
        valor_nuevo: diff.valor_nuevo,
        descripcion: diff.descripcion,
        actor: currentUser?.nombre || 'Operario Planta',
        created_date: now,
      });
    }

    this.save();
    return updatedDrum;
  }

  recordMovimiento(drumId, movementInput, currentUser = null) {
    const drum = this.getTamborById(drumId);
    if (!drum) throw new Error(`No se encontró el tambor solicitado (${drumId})`);

    const state = this.getFullState();
    const { tipo, ubicacion_nueva, estado_nuevo, observaciones } = movementInput;
    if (!tipo) throw new Error('Debe seleccionar el tipo de movimiento');
    if (!ubicacion_nueva) throw new Error('Debe indicar la nueva ubicación');

    const tipoItem = state.catalogos.find((c) => (c.id === tipo || c.codigo === tipo) && c.tipo === 'tipo_movimiento');
    if (!tipoItem) throw new Error('El tipo de movimiento seleccionado no es válido');

    const ubiItem = state.catalogos.find((c) => (c.id === ubicacion_nueva || c.codigo === ubicacion_nueva) && c.tipo === 'ubicacion');
    if (!ubiItem) throw new Error('La ubicación de destino seleccionada no es válida');

    const ubiAntId = drum.ubicacion;
    const ubiNuevaId = ubiItem.id;
    const estAntId = drum.estado;
    const estNuevoId = estado_nuevo || drum.estado;
    const now = new Date().toISOString();

    const movement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo,
      ubicacion_anterior: ubiAntId,
      ubicacion_nueva: ubiNuevaId,
      estado_anterior: estAntId,
      estado_nuevo: estNuevoId,
      observaciones: observaciones?.trim() || '',
      created_date: now,
    };

    this.state.movimientos.unshift(movement);

    this.state.historial.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo: 'Movimiento',
      descripcion: `Movimiento: ${tipoItem.nombre || 'Registrado'}`,
      observaciones: observaciones?.trim() || '',
      actor: currentUser?.nombre || 'Operario Planta',
      created_date: now,
    });

    if (ubiAntId !== ubiNuevaId) {
      const nomAnt = resolveCatalogName(state.catalogos, ubiAntId, 'ubicacion');
      const nomNue = resolveCatalogName(state.catalogos, ubiNuevaId, 'ubicacion');
      this.state.historial.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tambor_id: drum.tambor_id,
        tambor_ref: drum.id,
        tipo: 'Edición',
        campo: 'ubicacion',
        valor_anterior: nomAnt,
        valor_nuevo: nomNue,
        descripcion: `Ubicación modificada: "${nomAnt}" → "${nomNue}"`,
        actor: currentUser?.nombre || 'Operario Planta',
        created_date: now,
      });
    }

    const drumIdx = this.state.tambores.findIndex(t => t.id === drum.id);
    if (drumIdx !== -1) {
      this.state.tambores[drumIdx] = {
        ...this.state.tambores[drumIdx],
        ubicacion: ubiNuevaId,
        estado: estNuevoId,
        updated_date: now,
      };
    }

    this.save();
    return { drum: { ...drum, ubicacion: ubiNuevaId, estado: estNuevoId, updated_date: now }, movement };
  }

  deleteTambor(drumId, confirmationText, currentUser = null) {
    const drum = this.getTamborById(drumId);
    if (!drum) throw new Error(`No se encontró el tambor solicitado (${drumId})`);

    if (confirmationText?.trim().toUpperCase() !== drum.tambor_id.toUpperCase()) {
      throw new Error(`Para confirmar la eliminación debe escribir exactamente el número "${drum.tambor_id}"`);
    }

    const now = new Date().toISOString();
    this.state.historial.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo: 'Eliminación',
      descripcion: `Tambor ${drum.tambor_id} eliminado del inventario activo`,
      actor: currentUser?.nombre || 'Administrador',
      created_date: now,
    });

    this.state.tambores = this.state.tambores.filter(t => t.id !== drum.id);
    this.save();
    return { success: true, deletedTamborId: drum.tambor_id };
  }

  applyInventarioAuditoria(auditResult = {}, currentUser = null) {
    const state = this.getFullState();
    const now = new Date().toISOString();
    const relocations = auditResult.relocations || [];
    let updatedCount = 0;
    const createdMovements = [];

    const defaultMoveType =
      state.catalogos.find((c) => c.tipo === 'tipo_movimiento' && (c.id === 'cat-mov-1' || c.codigo === 'TRAS'))?.id ||
      state.catalogos.find((c) => c.tipo === 'tipo_movimiento')?.id ||
      'cat-mov-1';

    for (const item of relocations) {
      const drum = state.tambores.find(
        (d) => d.id === item.drumId || (item.tambor_id && d.tambor_id?.toUpperCase() === item.tambor_id.toUpperCase())
      );
      if (!drum) continue;

      const oldUbiId = drum.ubicacion;
      const newUbiId = item.newSectorId;
      if (oldUbiId === newUbiId) continue;

      const oldName = resolveCatalogName(state.catalogos, oldUbiId, 'ubicacion');
      const newName = resolveCatalogName(state.catalogos, newUbiId, 'ubicacion');
      const movId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      this.state.movimientos.unshift({
        id: movId,
        tambor_id: drum.tambor_id,
        tambor_ref: drum.id,
        tipo: defaultMoveType,
        ubicacion_anterior: oldUbiId,
        ubicacion_nueva: newUbiId,
        estado_anterior: drum.estado,
        estado_nuevo: drum.estado,
        observaciones: `Ajuste por toma de inventario físico en sector "${newName}"`,
        created_date: now,
      });

      this.state.historial.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tambor_id: drum.tambor_id,
        tambor_ref: drum.id,
        tipo: 'Movimiento',
        descripcion: `Movimiento por toma de inventario: "${oldName}" → "${newName}"`,
        observaciones: 'Escaneo de sector durante inventario físico',
        actor: currentUser?.nombre || 'Operario Planta',
        created_date: now,
      });

      const dIdx = this.state.tambores.findIndex(t => t.id === drum.id);
      if (dIdx !== -1) {
        this.state.tambores[dIdx].ubicacion = newUbiId;
        this.state.tambores[dIdx].updated_date = now;
      }
      updatedCount++;
      createdMovements.push(movId);
    }

    const allAuditedDrumIds = new Set();
    (auditResult.sectors || []).forEach((sec) => {
      (sec.drums || []).forEach((d) => {
        if (d.tambor_id) allAuditedDrumIds.add(d.tambor_id.toUpperCase());
      });
    });

    for (const tId of allAuditedDrumIds) {
      const idx = this.state.tambores.findIndex(t => t.tambor_id?.toUpperCase() === tId);
      if (idx !== -1) {
        this.state.tambores[idx].ultima_auditoria = now;
        this.state.tambores[idx].updated_date = now;
      }
    }

    this.state.historial.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipo: 'Inventario',
      descripcion: `Toma de inventario físico completada: ${auditResult.validDrumsCount || allAuditedDrumIds.size || 0} tambores auditados en ${auditResult.sectorsCount || 0} sectores (${updatedCount} reubicaciones).`,
      observaciones: 'Auditoría física por sectores de planta',
      actor: currentUser?.nombre || 'Operario Planta',
      created_date: now,
    });

    this.save();
    return {
      success: true,
      relocationsApplied: updatedCount,
      movementsCreated: createdMovements.length,
      auditedCount: allAuditedDrumIds.size,
      timestamp: now,
    };
  }

  authorizeQualityLot({ drumIds = [], lot = '', estadoNuevo = 'cat-est-5', observaciones = '', muestreoData = null }, currentUser = null) {
    if (!drumIds || drumIds.length === 0) {
      throw new Error('Debe especificar al menos un tambor para autorizar');
    }
    const state = this.getFullState();
    const now = new Date().toISOString();
    const targetStatusItem = state.catalogos.find((c) => (c.id === estadoNuevo || c.codigo === estadoNuevo) && c.tipo === 'estado');
    const statusName = targetStatusItem?.nombre || 'Aprobado calidad';
    const qualityMoveType =
      state.catalogos.find((c) => c.tipo === 'tipo_movimiento' && (c.id === 'cat-mov-3' || c.codigo === 'CTRL'))?.id ||
      'cat-mov-3';

    let updatedCount = 0;
    for (const id of drumIds) {
      const drum = state.tambores.find((d) => d.id === id || d.tambor_id?.toUpperCase() === id?.toUpperCase());
      if (!drum) continue;

      const prevStatusName = resolveCatalogName(state.catalogos, drum.estado, 'estado');
      const samplingNotes = muestreoData
        ? ` [pH: ${muestreoData.ph || '-'} | Salinidad: ${muestreoData.salinidad || '-'}% | Acidez: ${muestreoData.acidez || '-'}%]`
        : '';
      const fullObs = `${observaciones || 'Inspección de control de calidad'}${samplingNotes}`.trim();

      this.state.movimientos.unshift({
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tambor_id: drum.tambor_id,
        tambor_ref: drum.id,
        tipo: qualityMoveType,
        ubicacion_anterior: drum.ubicacion,
        ubicacion_nueva: drum.ubicacion,
        estado_anterior: drum.estado,
        estado_nuevo: targetStatusItem?.id || estadoNuevo,
        observaciones: fullObs,
        created_date: now,
      });

      this.state.historial.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tambor_id: drum.tambor_id,
        tambor_ref: drum.id,
        tipo: 'Calidad',
        descripcion: `Autorización de calidad: "${statusName}" (Lote: ${drum.lote || lot || 'N/A'})`,
        observaciones: fullObs,
        actor: currentUser?.nombre || 'Control de Calidad',
        created_date: now,
      });

      const dIdx = this.state.tambores.findIndex(t => t.id === drum.id);
      if (dIdx !== -1) {
        this.state.tambores[dIdx].estado = targetStatusItem?.id || estadoNuevo;
        this.state.tambores[dIdx].updated_date = now;
      }
      updatedCount++;
    }

    this.save();
    return { success: true, authorizedCount: updatedCount, estado: statusName, timestamp: now };
  }

  saveCatalogItem(catalogItem) {
    const { id, tipo, nombre, codigo, activo = true, orden = 1 } = catalogItem;
    if (!tipo || !nombre || !codigo) throw new Error('Tipo, nombre y código son obligatorios');

    const cleanCode = String(codigo).trim().toUpperCase();
    if (!/^[A-Z0-9]+([ /\\-][A-Z0-9]+)*$/.test(cleanCode)) {
      throw new Error('El código solo puede contener letras mayúsculas, números, / y guiones');
    }

    const existing = this.state.catalogos.find(c => c.tipo === tipo && c.codigo?.toUpperCase() === cleanCode && c.id !== id);
    if (existing) {
      throw new Error(`Ya existe una opción con el código "${cleanCode}" para este catálogo`);
    }

    if (id) {
      const idx = this.state.catalogos.findIndex(c => c.id === id);
      if (idx !== -1) {
        this.state.catalogos[idx] = {
          ...this.state.catalogos[idx],
          nombre: String(nombre).trim(),
          codigo: cleanCode,
          activo: Boolean(activo),
          orden: Number(orden) || 1,
        };
      }
    } else {
      const newId = `cat-${tipo.substring(0, 3)}-${Date.now()}`;
      this.state.catalogos.push({
        id: newId,
        tipo,
        nombre: String(nombre).trim(),
        codigo: cleanCode,
        activo: Boolean(activo),
        orden: Number(orden) || 1,
        created_date: new Date().toISOString(),
      });
    }

    this.save();
    return this.getCatalogos();
  }

  getCatalogos() {
    return [...this.state.catalogos].sort((a, b) => (a.orden || 1) - (b.orden || 1) || a.nombre.localeCompare(b.nombre));
  }

  toggleCatalogActive(id) {
    const item = this.state.catalogos.find(c => c.id === id);
    if (!item) throw new Error('Opción de catálogo no encontrada');
    item.activo = !item.activo;
    this.save();
    return { ...item };
  }

  close() {}
}

export class SQLiteDatabase {
  constructor(dbPath = null) {
    if (!DatabaseSync) {
      return new JSONFileDatabase(dbPath);
    }
    this.dbPath = dbPath || process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'trazabilidad.sqlite');
    this.db = null;
    this.init();
  }

  init() {
    if (this.dbPath !== ':memory:') {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.db = new DatabaseSync(this.dbPath);
    this.createTables();
    this.seedIfEmpty();
  }

  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS catalogos (
        id TEXT PRIMARY KEY,
        tipo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        codigo TEXT NOT NULL,
        activo INTEGER DEFAULT 1,
        orden INTEGER DEFAULT 1,
        created_date TEXT
      );

      CREATE TABLE IF NOT EXISTS tambores (
        id TEXT PRIMARY KEY,
        tambor_id TEXT UNIQUE NOT NULL,
        codigo TEXT NOT NULL,
        codigo_descriptivo TEXT NOT NULL,
        codigo_compacto TEXT NOT NULL,
        producto TEXT NOT NULL,
        presentacion TEXT NOT NULL,
        variedad TEXT NOT NULL,
        calibre TEXT NOT NULL,
        calidad TEXT NOT NULL,
        lote TEXT NOT NULL,
        peso REAL NOT NULL,
        fecha_ingreso TEXT NOT NULL,
        fecha_elaboracion TEXT,
        ubicacion TEXT NOT NULL,
        estado TEXT NOT NULL,
        observaciones TEXT,
        created_date TEXT NOT NULL,
        updated_date TEXT,
        ultima_auditoria TEXT
      );

      CREATE TABLE IF NOT EXISTS historial (
        id TEXT PRIMARY KEY,
        tambor_id TEXT,
        tambor_ref TEXT,
        tipo TEXT NOT NULL,
        campo TEXT,
        valor_anterior TEXT,
        valor_nuevo TEXT,
        descripcion TEXT NOT NULL,
        observaciones TEXT,
        actor TEXT,
        created_date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS movimientos (
        id TEXT PRIMARY KEY,
        tambor_id TEXT NOT NULL,
        tambor_ref TEXT,
        tipo TEXT NOT NULL,
        ubicacion_anterior TEXT,
        ubicacion_nueva TEXT,
        estado_anterior TEXT,
        estado_nuevo TEXT,
        observaciones TEXT,
        created_date TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tambores_codigo ON tambores(codigo);
      CREATE INDEX IF NOT EXISTS idx_tambores_lote ON tambores(lote);
      CREATE INDEX IF NOT EXISTS idx_historial_tambor ON historial(tambor_id);
      CREATE INDEX IF NOT EXISTS idx_movimientos_tambor ON movimientos(tambor_id);
    `);
  }

  seedIfEmpty(includeDemoDrums = (this.dbPath === ':memory:')) {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM catalogos').get();
    if (row && row.count === 0) {
      this.resetToInitialState(includeDemoDrums);
    }
  }

  resetToInitialState(includeDemoDrums = true) {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      this.db.exec('DELETE FROM catalogos;');
      this.db.exec('DELETE FROM tambores;');
      this.db.exec('DELETE FROM historial;');
      this.db.exec('DELETE FROM movimientos;');

      const insertCat = this.db.prepare(`
        INSERT INTO catalogos (id, tipo, nombre, codigo, activo, orden, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of INITIAL_CATALOGOS) {
        insertCat.run(c.id, c.tipo, c.nombre, c.codigo, c.activo ? 1 : 0, c.orden || 1, new Date().toISOString());
      }

      if (includeDemoDrums) {
        const insertDrum = this.db.prepare(`
          INSERT INTO tambores (
            id, tambor_id, codigo, codigo_descriptivo, codigo_compacto,
            producto, presentacion, variedad, calibre, calidad,
            lote, peso, fecha_ingreso, fecha_elaboracion, ubicacion,
            estado, observaciones, created_date, updated_date, ultima_auditoria
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const t of INITIAL_TAMBORES) {
          insertDrum.run(
            t.id, t.tambor_id, t.codigo, t.codigo_descriptivo, t.codigo_compacto,
            t.producto, t.presentacion, t.variedad, t.calibre, t.calidad,
            t.lote, Number(t.peso), t.fecha_ingreso, t.fecha_elaboracion || null, t.ubicacion,
            t.estado, t.observaciones || null, t.created_date, t.updated_date || null, t.ultima_auditoria || null
          );
        }

        const insertHist = this.db.prepare(`
          INSERT INTO historial (id, tambor_id, tambor_ref, tipo, campo, valor_anterior, valor_nuevo, descripcion, observaciones, actor, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const h of INITIAL_HISTORIAL) {
          insertHist.run(
            h.id, h.tambor_id || null, h.tambor_ref || null, h.tipo, h.campo || null,
            h.valor_anterior || null, h.valor_nuevo || null, h.descripcion,
            h.observaciones || null, h.actor || 'Sistema', h.created_date
          );
        }

        const insertMov = this.db.prepare(`
          INSERT INTO movimientos (id, tambor_id, tambor_ref, tipo, ubicacion_anterior, ubicacion_nueva, estado_anterior, estado_nuevo, observaciones, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const m of INITIAL_MOVIMIENTOS) {
          insertMov.run(
            m.id, m.tambor_id, m.tambor_ref || null, m.tipo, m.ubicacion_anterior || null,
            m.ubicacion_nueva || null, m.estado_anterior || null, m.estado_nuevo || null,
            m.observaciones || null, m.created_date
          );
        }
      }

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  getFullState() {
    const catalogos = this.db.prepare('SELECT * FROM catalogos ORDER BY orden ASC, nombre ASC').all().map(c => ({
      ...c,
      activo: Boolean(c.activo),
    }));

    const tambores = this.db.prepare('SELECT * FROM tambores ORDER BY created_date DESC').all().map(t => ({
      ...t,
      peso: Number(t.peso),
    }));

    const historial = this.db.prepare('SELECT * FROM historial ORDER BY created_date DESC').all();
    const movimientos = this.db.prepare('SELECT * FROM movimientos ORDER BY created_date DESC').all();

    return { catalogos, tambores, historial, movimientos };
  }

  saveFullState(state) {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      this.db.exec('DELETE FROM catalogos;');
      this.db.exec('DELETE FROM tambores;');
      this.db.exec('DELETE FROM historial;');
      this.db.exec('DELETE FROM movimientos;');

      if (Array.isArray(state.catalogos)) {
        const insertCat = this.db.prepare(`
          INSERT INTO catalogos (id, tipo, nombre, codigo, activo, orden, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const c of state.catalogos) {
          insertCat.run(c.id, c.tipo, c.nombre, c.codigo, c.activo ? 1 : 0, c.orden || 1, c.created_date || new Date().toISOString());
        }
      }

      if (Array.isArray(state.tambores)) {
        const insertDrum = this.db.prepare(`
          INSERT INTO tambores (
            id, tambor_id, codigo, codigo_descriptivo, codigo_compacto,
            producto, presentacion, variedad, calibre, calidad,
            lote, peso, fecha_ingreso, fecha_elaboracion, ubicacion,
            estado, observaciones, created_date, updated_date, ultima_auditoria
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const t of state.tambores) {
          insertDrum.run(
            t.id, t.tambor_id, t.codigo, t.codigo_descriptivo, t.codigo_compacto,
            t.producto, t.presentacion, t.variedad, t.calibre, t.calidad,
            t.lote, Number(t.peso), t.fecha_ingreso, t.fecha_elaboracion || null, t.ubicacion,
            t.estado, t.observaciones || null, t.created_date, t.updated_date || null, t.ultima_auditoria || null
          );
        }
      }

      if (Array.isArray(state.historial)) {
        const insertHist = this.db.prepare(`
          INSERT INTO historial (id, tambor_id, tambor_ref, tipo, campo, valor_anterior, valor_nuevo, descripcion, observaciones, actor, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const h of state.historial) {
          insertHist.run(
            h.id, h.tambor_id || null, h.tambor_ref || null, h.tipo, h.campo || null,
            h.valor_anterior || null, h.valor_nuevo || null, h.descripcion,
            h.observaciones || null, h.actor || 'Sistema', h.created_date
          );
        }
      }

      if (Array.isArray(state.movimientos)) {
        const insertMov = this.db.prepare(`
          INSERT INTO movimientos (id, tambor_id, tambor_ref, tipo, ubicacion_anterior, ubicacion_nueva, estado_anterior, estado_nuevo, observaciones, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const m of state.movimientos) {
          insertMov.run(
            m.id, m.tambor_id, m.tambor_ref || null, m.tipo, m.ubicacion_anterior || null,
            m.ubicacion_nueva || null, m.estado_anterior || null, m.estado_nuevo || null,
            m.observaciones || null, m.created_date
          );
        }
      }

      this.db.exec('COMMIT;');
      return true;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  getTambores() {
    return this.db.prepare('SELECT * FROM tambores ORDER BY created_date DESC').all().map(t => ({
      ...t,
      peso: Number(t.peso),
    }));
  }

  getTamborById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const drum = this.db.prepare(
      'SELECT * FROM tambores WHERE id = ? OR UPPER(tambor_id) = UPPER(?)'
    ).get(cleanId, cleanId);

    if (!drum) return null;

    const historial = this.db.prepare(
      'SELECT * FROM historial WHERE UPPER(tambor_id) = UPPER(?) OR tambor_ref = ? ORDER BY created_date DESC'
    ).all(drum.tambor_id, drum.id);

    const movimientos = this.db.prepare(
      'SELECT * FROM movimientos WHERE UPPER(tambor_id) = UPPER(?) OR tambor_ref = ? ORDER BY created_date DESC'
    ).all(drum.tambor_id, drum.id);

    return {
      ...drum,
      peso: Number(drum.peso),
      historial,
      movimientos,
    };
  }

  createTambor(rawInput, currentUser = null) {
    const state = this.getFullState();
    const normalized = normalizeDrumInput(rawInput);

    const validation = validateDrum(normalized, state.catalogos, { isEdit: false });
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Datos del tambor inválidos');
    }

    const nextId = nextTamborId(state.tambores, state.historial);
    const descCode = buildDescriptiveCode(normalized, state.catalogos);
    const compactCode = buildCompactCode(descCode);
    const fullCode = buildFullCode(descCode, nextId);
    const now = new Date().toISOString();

    const drum = {
      ...normalized,
      id: `tb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: nextId,
      codigo_descriptivo: descCode,
      codigo_compacto: compactCode,
      codigo: fullCode,
      created_date: now,
    };

    const historyEvent = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo: 'Creación',
      descripcion: `Tambor creado en el sistema con peso neto ${drum.peso} kg`,
      actor: currentUser?.nombre || 'Operario Planta',
      created_date: now,
    };

    this.db.exec('BEGIN TRANSACTION;');
    try {
      this.db.prepare(`
        INSERT INTO tambores (
          id, tambor_id, codigo, codigo_descriptivo, codigo_compacto,
          producto, presentacion, variedad, calibre, calidad,
          lote, peso, fecha_ingreso, fecha_elaboracion, ubicacion,
          estado, observaciones, created_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        drum.id, drum.tambor_id, drum.codigo, drum.codigo_descriptivo, drum.codigo_compacto,
        drum.producto, drum.presentacion, drum.variedad, drum.calibre, drum.calidad,
        drum.lote, drum.peso, drum.fecha_ingreso, drum.fecha_elaboracion || null, drum.ubicacion,
        drum.estado, drum.observaciones || null, drum.created_date
      );

      this.db.prepare(`
        INSERT INTO historial (id, tambor_id, tambor_ref, tipo, descripcion, actor, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        historyEvent.id, historyEvent.tambor_id, historyEvent.tambor_ref,
        historyEvent.tipo, historyEvent.descripcion, historyEvent.actor, historyEvent.created_date
      );

      this.db.exec('COMMIT;');
      return drum;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  updateTambor(id, rawInput, currentUser = null) {
    const existing = this.getTamborById(id);
    if (!existing) {
      throw new Error(`No se encontró el tambor solicitado (${id})`);
    }

    const state = this.getFullState();
    const mergedInput = { ...existing, ...rawInput };
    const normalized = normalizeDrumInput(mergedInput);

    const validation = validateDrum(normalized, state.catalogos, {
      isEdit: true,
      currentDrum: existing,
    });

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Datos del tambor inválidos');
    }

    const descCode = buildDescriptiveCode(normalized, state.catalogos);
    const compactCode = buildCompactCode(descCode);
    const fullCode = buildFullCode(descCode, existing.tambor_id);
    const now = new Date().toISOString();

    const updatedDrum = {
      ...existing,
      ...normalized,
      id: existing.id,
      tambor_id: existing.tambor_id,
      codigo_descriptivo: descCode,
      codigo_compacto: compactCode,
      codigo: fullCode,
      updated_date: now,
    };

    const diffs = diffDrumFields(existing, updatedDrum, state.catalogos);

    this.db.exec('BEGIN TRANSACTION;');
    try {
      this.db.prepare(`
        UPDATE tambores SET
          codigo = ?, codigo_descriptivo = ?, codigo_compacto = ?,
          producto = ?, presentacion = ?, variedad = ?, calibre = ?, calidad = ?,
          lote = ?, peso = ?, fecha_ingreso = ?, fecha_elaboracion = ?, ubicacion = ?,
          estado = ?, observaciones = ?, updated_date = ?
        WHERE id = ?
      `).run(
        updatedDrum.codigo, updatedDrum.codigo_descriptivo, updatedDrum.codigo_compacto,
        updatedDrum.producto, updatedDrum.presentacion, updatedDrum.variedad, updatedDrum.calibre, updatedDrum.calidad,
        updatedDrum.lote, updatedDrum.peso, updatedDrum.fecha_ingreso, updatedDrum.fecha_elaboracion || null,
        updatedDrum.ubicacion, updatedDrum.estado, updatedDrum.observaciones || null, updatedDrum.updated_date,
        updatedDrum.id
      );

      const insertHist = this.db.prepare(`
        INSERT INTO historial (id, tambor_id, tambor_ref, tipo, campo, valor_anterior, valor_nuevo, descripcion, actor, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const diff of diffs) {
        insertHist.run(
          `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          existing.tambor_id, existing.id, 'Edición', diff.campo,
          diff.valor_anterior, diff.valor_nuevo, diff.descripcion,
          currentUser?.nombre || 'Operario Planta', now
        );
      }

      this.db.exec('COMMIT;');
      return updatedDrum;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  recordMovimiento(drumId, movementInput, currentUser = null) {
    const drum = this.getTamborById(drumId);
    if (!drum) {
      throw new Error(`No se encontró el tambor solicitado (${drumId})`);
    }

    const state = this.getFullState();
    const { tipo, ubicacion_nueva, estado_nuevo, observaciones } = movementInput;

    if (!tipo) throw new Error('Debe seleccionar el tipo de movimiento');
    if (!ubicacion_nueva) throw new Error('Debe indicar la nueva ubicación');

    const tipoItem = state.catalogos.find((c) => (c.id === tipo || c.codigo === tipo) && c.tipo === 'tipo_movimiento');
    if (!tipoItem) throw new Error('El tipo de movimiento seleccionado no es válido');

    const ubiItem = state.catalogos.find((c) => (c.id === ubicacion_nueva || c.codigo === ubicacion_nueva) && c.tipo === 'ubicacion');
    if (!ubiItem) throw new Error('La ubicación de destino seleccionada no es válida');

    if (estado_nuevo) {
      const estItem = state.catalogos.find((c) => (c.id === estado_nuevo || c.codigo === estado_nuevo) && c.tipo === 'estado');
      if (!estItem) throw new Error('El estado seleccionado no es válido');
    }

    const ubiAntId = drum.ubicacion;
    const ubiNuevaId = ubiItem.id;
    const estAntId = drum.estado;
    const estNuevoId = estado_nuevo || drum.estado;
    const now = new Date().toISOString();

    const movement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo,
      ubicacion_anterior: ubiAntId,
      ubicacion_nueva: ubiNuevaId,
      estado_anterior: estAntId,
      estado_nuevo: estNuevoId,
      observaciones: observaciones?.trim() || '',
      created_date: now,
    };

    this.db.exec('BEGIN TRANSACTION;');
    try {
      this.db.prepare(`
        INSERT INTO movimientos (id, tambor_id, tambor_ref, tipo, ubicacion_anterior, ubicacion_nueva, estado_anterior, estado_nuevo, observaciones, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movement.id, movement.tambor_id, movement.tambor_ref, movement.tipo,
        movement.ubicacion_anterior, movement.ubicacion_nueva, movement.estado_anterior,
        movement.estado_nuevo, movement.observaciones, movement.created_date
      );

      this.db.prepare(`
        INSERT INTO historial (id, tambor_id, tambor_ref, tipo, descripcion, observaciones, actor, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        drum.tambor_id, drum.id, 'Movimiento', `Movimiento: ${tipoItem.nombre || 'Registrado'}`,
        observaciones?.trim() || '', currentUser?.nombre || 'Operario Planta', now
      );

      if (ubiAntId !== ubiNuevaId) {
        const nomAnt = resolveCatalogName(state.catalogos, ubiAntId, 'ubicacion');
        const nomNue = resolveCatalogName(state.catalogos, ubiNuevaId, 'ubicacion');
        this.db.prepare(`
          INSERT INTO historial (id, tambor_id, tambor_ref, tipo, campo, valor_anterior, valor_nuevo, descripcion, actor, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          drum.tambor_id, drum.id, 'Edición', 'ubicacion', nomAnt, nomNue,
          `Ubicación modificada: "${nomAnt}" → "${nomNue}"`, currentUser?.nombre || 'Operario Planta', now
        );
      }

      if (estado_nuevo && estAntId !== estado_nuevo) {
        const estNomAnt = resolveCatalogName(state.catalogos, estAntId, 'estado');
        const estNomNue = resolveCatalogName(state.catalogos, estado_nuevo, 'estado');
        this.db.prepare(`
          INSERT INTO historial (id, tambor_id, tambor_ref, tipo, campo, valor_anterior, valor_nuevo, descripcion, actor, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          drum.tambor_id, drum.id, 'Edición', 'estado', estNomAnt, estNomNue,
          `Estado modificado: "${estNomAnt}" → "${estNomNue}"`, currentUser?.nombre || 'Operario Planta', now
        );
      }

      this.db.prepare(`
        UPDATE tambores SET ubicacion = ?, estado = ?, updated_date = ? WHERE id = ?
      `).run(ubiNuevaId, estNuevoId, now, drum.id);

      this.db.exec('COMMIT;');
      return { drum: { ...drum, ubicacion: ubiNuevaId, estado: estNuevoId, updated_date: now }, movement };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  deleteTambor(drumId, confirmationText, currentUser = null) {
    const drum = this.getTamborById(drumId);
    if (!drum) {
      throw new Error(`No se encontró el tambor solicitado (${drumId})`);
    }

    if (confirmationText?.trim().toUpperCase() !== drum.tambor_id.toUpperCase()) {
      throw new Error(`Para confirmar la eliminación debe escribir exactamente el número "${drum.tambor_id}"`);
    }

    const now = new Date().toISOString();
    this.db.exec('BEGIN TRANSACTION;');
    try {
      this.db.prepare(`
        INSERT INTO historial (id, tambor_id, tambor_ref, tipo, descripcion, actor, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        drum.tambor_id, drum.id, 'Eliminación',
        `Tambor ${drum.tambor_id} eliminado del inventario activo`,
        currentUser?.nombre || 'Administrador', now
      );

      this.db.prepare('DELETE FROM tambores WHERE id = ?').run(drum.id);
      this.db.exec('COMMIT;');
      return { success: true, deletedTamborId: drum.tambor_id };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  applyInventarioAuditoria(auditResult = {}, currentUser = null) {
    const state = this.getFullState();
    const now = new Date().toISOString();
    const relocations = auditResult.relocations || [];
    let updatedCount = 0;
    const createdMovements = [];

    const defaultMoveType =
      state.catalogos.find((c) => c.tipo === 'tipo_movimiento' && (c.id === 'cat-mov-1' || c.codigo === 'TRAS'))?.id ||
      state.catalogos.find((c) => c.tipo === 'tipo_movimiento')?.id ||
      'cat-mov-1';

    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const item of relocations) {
        const drum = state.tambores.find(
          (d) => d.id === item.drumId || (item.tambor_id && d.tambor_id?.toUpperCase() === item.tambor_id.toUpperCase())
        );
        if (!drum) continue;

        const oldUbiId = drum.ubicacion;
        const newUbiId = item.newSectorId;
        if (oldUbiId === newUbiId) continue;

        const oldName = resolveCatalogName(state.catalogos, oldUbiId, 'ubicacion');
        const newName = resolveCatalogName(state.catalogos, newUbiId, 'ubicacion');

        const movId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.db.prepare(`
          INSERT INTO movimientos (id, tambor_id, tambor_ref, tipo, ubicacion_anterior, ubicacion_nueva, estado_anterior, estado_nuevo, observaciones, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          movId, drum.tambor_id, drum.id, defaultMoveType, oldUbiId, newUbiId,
          drum.estado, drum.estado, `Ajuste por toma de inventario físico en sector "${newName}"`, now
        );

        this.db.prepare(`
          INSERT INTO historial (id, tambor_id, tambor_ref, tipo, descripcion, observaciones, actor, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          drum.tambor_id, drum.id, 'Movimiento',
          `Movimiento por toma de inventario: "${oldName}" → "${newName}"`,
          'Escaneo de sector durante inventario físico', currentUser?.nombre || 'Operario Planta', now
        );

        this.db.prepare(`
          INSERT INTO historial (id, tambor_id, tambor_ref, tipo, campo, valor_anterior, valor_nuevo, descripcion, actor, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          drum.tambor_id, drum.id, 'Edición', 'ubicacion', oldName, newName,
          `Ubicación actualizada por inventario: "${oldName}" → "${newName}"`,
          currentUser?.nombre || 'Operario Planta', now
        );

        this.db.prepare(`
          UPDATE tambores SET ubicacion = ?, updated_date = ? WHERE id = ?
        `).run(newUbiId, now, drum.id);

        updatedCount++;
        createdMovements.push(movId);
      }

      // Actualizar timestamp de última auditoría
      const allAuditedDrumIds = new Set();
      (auditResult.sectors || []).forEach((sec) => {
        (sec.drums || []).forEach((d) => {
          if (d.tambor_id) allAuditedDrumIds.add(d.tambor_id.toUpperCase());
        });
      });

      for (const tId of allAuditedDrumIds) {
        this.db.prepare(`
          UPDATE tambores SET ultima_auditoria = ?, updated_date = ? WHERE UPPER(tambor_id) = ?
        `).run(now, now, tId);
      }

      this.db.prepare(`
        INSERT INTO historial (id, tipo, descripcion, observaciones, actor, created_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, 'Inventario',
        `Toma de inventario físico completada: ${auditResult.validDrumsCount || allAuditedDrumIds.size || 0} tambores auditados en ${auditResult.sectorsCount || 0} sectores (${updatedCount} reubicaciones).`,
        'Auditoría física por sectores de planta', currentUser?.nombre || 'Operario Planta', now
      );

      this.db.exec('COMMIT;');
      return {
        success: true,
        relocationsApplied: updatedCount,
        movementsCreated: createdMovements.length,
        auditedCount: allAuditedDrumIds.size,
        timestamp: now,
      };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  authorizeQualityLot({ drumIds = [], lot = '', estadoNuevo = 'cat-est-5', observaciones = '', muestreoData = null }, currentUser = null) {
    if (!drumIds || drumIds.length === 0) {
      throw new Error('Debe especificar al menos un tambor para autorizar');
    }

    const state = this.getFullState();
    const now = new Date().toISOString();
    const targetStatusItem = state.catalogos.find((c) => (c.id === estadoNuevo || c.codigo === estadoNuevo) && c.tipo === 'estado');
    const statusName = targetStatusItem?.nombre || 'Aprobado calidad';
    const qualityMoveType =
      state.catalogos.find((c) => c.tipo === 'tipo_movimiento' && (c.id === 'cat-mov-3' || c.codigo === 'CTRL'))?.id ||
      'cat-mov-3';

    let updatedCount = 0;
    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const id of drumIds) {
        const drum = state.tambores.find((d) => d.id === id || d.tambor_id?.toUpperCase() === id?.toUpperCase());
        if (!drum) continue;

        const prevStatusName = resolveCatalogName(state.catalogos, drum.estado, 'estado');
        const samplingNotes = muestreoData
          ? ` [pH: ${muestreoData.ph || '-'} | Salinidad: ${muestreoData.salinidad || '-'}% | Acidez: ${muestreoData.acidez || '-'}%]`
          : '';
        const fullObs = `${observaciones || 'Inspección de control de calidad'}${samplingNotes}`.trim();

        // 1. Movimiento de calidad
        this.db.prepare(`
          INSERT INTO movimientos (id, tambor_id, tambor_ref, tipo, ubicacion_anterior, ubicacion_nueva, estado_anterior, estado_nuevo, observaciones, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          drum.tambor_id, drum.id, qualityMoveType, drum.ubicacion, drum.ubicacion,
          drum.estado, targetStatusItem?.id || estadoNuevo, fullObs, now
        );

        // 2. Historial de Calidad
        this.db.prepare(`
          INSERT INTO historial (id, tambor_id, tambor_ref, tipo, descripcion, observaciones, actor, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          drum.tambor_id, drum.id, 'Calidad',
          `Autorización de calidad: "${statusName}" (Lote: ${drum.lote || lot || 'N/A'})`,
          fullObs, currentUser?.nombre || 'Control de Calidad', now
        );

        // 3. Historial de Edición de estado
        this.db.prepare(`
          INSERT INTO historial (id, tambor_id, tambor_ref, tipo, campo, valor_anterior, valor_nuevo, descripcion, actor, created_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          drum.tambor_id, drum.id, 'Edición', 'estado', prevStatusName, statusName,
          `Estado modificado por Calidad: "${prevStatusName}" → "${statusName}"`,
          currentUser?.nombre || 'Control de Calidad', now
        );

        // 4. Actualizar tambor
        this.db.prepare(`
          UPDATE tambores SET estado = ?, updated_date = ? WHERE id = ?
        `).run(targetStatusItem?.id || estadoNuevo, now, drum.id);

        updatedCount++;
      }

      this.db.exec('COMMIT;');
      return { success: true, authorizedCount: updatedCount, estado: statusName, timestamp: now };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  saveCatalogItem(catalogItem) {
    const { id, tipo, nombre, codigo, activo = true, orden = 1 } = catalogItem;
    if (!tipo || !nombre || !codigo) {
      throw new Error('Tipo, nombre y código son obligatorios');
    }

    const cleanCode = String(codigo).trim().toUpperCase();
    if (!/^[A-Z0-9]+([ /\\-][A-Z0-9]+)*$/.test(cleanCode)) {
      throw new Error('El código solo puede contener letras mayúsculas, números, / y guiones');
    }

    const existing = this.db.prepare(
      'SELECT id FROM catalogos WHERE tipo = ? AND UPPER(codigo) = ? AND id != ?'
    ).get(tipo, cleanCode, id || '');

    if (existing) {
      throw new Error(`Ya existe una opción con el código "${cleanCode}" para este catálogo`);
    }

    if (id) {
      this.db.prepare(`
        UPDATE catalogos SET nombre = ?, codigo = ?, activo = ?, orden = ? WHERE id = ?
      `).run(String(nombre).trim(), cleanCode, activo ? 1 : 0, Number(orden) || 1, id);
    } else {
      const newId = `cat-${tipo.substring(0, 3)}-${Date.now()}`;
      this.db.prepare(`
        INSERT INTO catalogos (id, tipo, nombre, codigo, activo, orden, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(newId, tipo, String(nombre).trim(), cleanCode, activo ? 1 : 0, Number(orden) || 1, new Date().toISOString());
    }

    return this.getCatalogos();
  }

  getCatalogos() {
    return this.db.prepare('SELECT * FROM catalogos ORDER BY orden ASC, nombre ASC').all().map(c => ({
      ...c,
      activo: Boolean(c.activo),
    }));
  }

  toggleCatalogActive(id) {
    const item = this.db.prepare('SELECT * FROM catalogos WHERE id = ?').get(id);
    if (!item) throw new Error('Opción de catálogo no encontrada');

    const newActive = item.activo ? 0 : 1;
    this.db.prepare('UPDATE catalogos SET activo = ? WHERE id = ?').run(newActive, id);
    return { ...item, activo: Boolean(newActive) };
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
