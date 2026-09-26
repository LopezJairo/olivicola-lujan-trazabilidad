/**
 * OLIVÍCOLA LUJÁN · Repositorio y Capa de Persistencia
 * Gestiona el almacenamiento local (localStorage), transiciones entre
 * espacio de demostración y espacio vacío de empresa, copias de seguridad (JSON)
 * y operaciones de negocio sobre Tambores, Historial, Movimientos y Catálogos.
 */

import {
  INITIAL_CATALOGOS,
  INITIAL_TAMBORES,
  INITIAL_HISTORIAL,
  INITIAL_MOVIMIENTOS,
} from './demoData.js';
import {
  nextTamborId,
  buildDescriptiveCode,
  buildCompactCode,
  buildFullCode,
  normalizeDrumInput,
  validateDrum,
  diffDrumFields,
  resolveCatalogName,
} from '../lib/domain.js';

const STORAGE_KEY_PREFIX = 'olivicola-lujan-';
const CURRENT_MODE_KEY = `${STORAGE_KEY_PREFIX}workspace-mode`; // 'demo' | 'empresa'

export function getCurrentWorkspaceMode() {
  try {
    return localStorage.getItem(CURRENT_MODE_KEY) || 'demo';
  } catch {
    return 'demo';
  }
}

export function setCurrentWorkspaceMode(mode) {
  try {
    localStorage.setItem(CURRENT_MODE_KEY, mode);
  } catch (err) {
    console.error('Error al guardar modo de espacio de trabajo:', err);
  }
}

function getStorageKeyForMode(mode) {
  return `${STORAGE_KEY_PREFIX}store-${mode}-v1`;
}

function getInitialState(mode) {
  if (mode === 'empresa') {
    // Espacio de la empresa: Catálogos base listos para operar, 0 tambores
    return {
      catalogos: JSON.parse(JSON.stringify(INITIAL_CATALOGOS)),
      tambores: [],
      historial: [],
      movimientos: [],
    };
  }
  // Espacio demo: Con 12 tambores de demostración e historial
  return {
    catalogos: JSON.parse(JSON.stringify(INITIAL_CATALOGOS)),
    tambores: JSON.parse(JSON.stringify(INITIAL_TAMBORES)),
    historial: JSON.parse(JSON.stringify(INITIAL_HISTORIAL)),
    movimientos: JSON.parse(JSON.stringify(INITIAL_MOVIMIENTOS)),
  };
}

function isCatalogOutdated(cachedCatalogs = []) {
  if (!Array.isArray(cachedCatalogs) || cachedCatalogs.length === 0) return false;
  const codes = new Set(cachedCatalogs.map((c) => c?.codigo));
  return !codes.has('FET') || !codes.has('GRI') || !codes.has('ROTA') || !codes.has('SIN CAL');
}

export function loadDatabase() {
  const mode = getCurrentWorkspaceMode();
  const key = getStorageKeyForMode(mode);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = getInitialState(mode);
      saveDatabase(initial, mode);
      return initial;
    }
    const parsed = JSON.parse(raw);

    // Migración automática si los catálogos en caché son provisionales o desactualizados
    if (isCatalogOutdated(parsed.catalogos)) {
      if (mode === 'demo') {
        const freshDemo = getInitialState('demo');
        saveDatabase(freshDemo, 'demo');
        return freshDemo;
      }
      const existingCodes = new Set((parsed.catalogos || []).map((c) => `${c.tipo}:${c.codigo}`));
      const mergedCatalogs = [...(parsed.catalogos || [])];
      for (const official of INITIAL_CATALOGOS) {
        if (!existingCodes.has(`${official.tipo}:${official.codigo}`)) {
          mergedCatalogs.push(official);
        }
      }
      const updated = {
        catalogos: mergedCatalogs,
        tambores: Array.isArray(parsed.tambores) ? parsed.tambores : [],
        historial: Array.isArray(parsed.historial) ? parsed.historial : [],
        movimientos: Array.isArray(parsed.movimientos) ? parsed.movimientos : [],
      };
      saveDatabase(updated, mode);
      return updated;
    }

    return {
      catalogos: Array.isArray(parsed.catalogos) ? parsed.catalogos : INITIAL_CATALOGOS,
      tambores: Array.isArray(parsed.tambores) ? parsed.tambores : [],
      historial: Array.isArray(parsed.historial) ? parsed.historial : [],
      movimientos: Array.isArray(parsed.movimientos) ? parsed.movimientos : [],
    };
  } catch (err) {
    console.error('Error al leer base de datos local:', err);
    return getInitialState(mode);
  }
}

export function saveDatabase(data, specificMode = null) {
  const mode = specificMode || getCurrentWorkspaceMode();
  const key = getStorageKeyForMode(mode);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Error al guardar base de datos local:', err);
    throw new Error('No se pudo guardar la información en el almacenamiento local');
  }
}

/**
 * Resetea el espacio demo a los valores iniciales de fábrica.
 */
export function resetDemoDatabase() {
  const initial = getInitialState('demo');
  saveDatabase(initial, 'demo');
  return initial;
}

/**
 * Exporta toda la base de datos actual como archivo JSON para copia de seguridad.
 */
export function exportDatabaseJSON() {
  const state = loadDatabase();
  const mode = getCurrentWorkspaceMode();
  const exportPayload = {
    app: 'OLIVÍCOLA LUJÁN · Trazabilidad de Tambores',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    mode,
    data: state,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Restaura la base de datos a partir de un JSON de respaldo.
 */
export function importDatabaseJSON(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    const data = parsed.data || parsed;
    if (!Array.isArray(data.catalogos) || !Array.isArray(data.tambores)) {
      throw new Error('El archivo no contiene una estructura válida de trazabilidad');
    }
    const cleanData = {
      catalogos: data.catalogos,
      tambores: data.tambores,
      historial: Array.isArray(data.historial) ? data.historial : [],
      movimientos: Array.isArray(data.movimientos) ? data.movimientos : [],
    };
    saveDatabase(cleanData);
    return cleanData;
  } catch (err) {
    throw new Error(`Error al restaurar copia de seguridad: ${err.message}`);
  }
}

// -------------------------------------------------------------
// OPERACIONES DE TAMBORES
// -------------------------------------------------------------

/**
 * Registra un nuevo tambor con cálculo automático de ID y códigos.
 */
export async function createDrum(rawInput, currentUser = null) {
  const state = loadDatabase();
  const normalized = normalizeDrumInput(rawInput);

  const validation = validateDrum(normalized, state.catalogos, { isEdit: false });
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError || 'Datos del tambor inválidos');
  }

  // Asignar ID secuencial único evitando reciclados
  const nextId = nextTamborId(state.tambores, state.historial);
  const descCode = buildDescriptiveCode(normalized, state.catalogos);
  const compactCode = buildCompactCode(descCode);
  const fullCode = buildFullCode(descCode, nextId);

  const newDrum = {
    ...normalized,
    id: `tb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tambor_id: nextId,
    codigo_descriptivo: descCode,
    codigo_compacto: compactCode,
    codigo: fullCode,
    created_date: new Date().toISOString(),
  };

  // Evento de historial
  const historyEvent = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tambor_id: newDrum.tambor_id,
    tambor_ref: newDrum.id,
    tipo: 'Creación',
    descripcion: `Tambor creado en el sistema con peso neto ${newDrum.peso} kg`,
    actor: currentUser?.nombre || 'Operario Planta',
    created_date: new Date().toISOString(),
  };

  state.tambores.unshift(newDrum);
  state.historial.unshift(historyEvent);

  saveDatabase(state);
  return newDrum;
}

/**
 * Actualiza un tambor existente registrando eventos de diferencia en el historial.
 */
export async function updateDrum(id, rawInput, currentUser = null) {
  const state = loadDatabase();
  const drumIndex = state.tambores.findIndex((d) => d.id === id || d.tambor_id?.toUpperCase() === id?.toUpperCase());

  if (drumIndex === -1) {
    throw new Error(`No se encontró el tambor solicitado (${id})`);
  }

  const existingDrum = state.tambores[drumIndex];
  const mergedInput = { ...existingDrum, ...rawInput };
  const normalized = normalizeDrumInput(mergedInput);

  const validation = validateDrum(normalized, state.catalogos, {
    isEdit: true,
    currentDrum: existingDrum,
  });

  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError || 'Datos del tambor inválidos');
  }

  // Recalcular códigos conservando tambor_id
  const descCode = buildDescriptiveCode(normalized, state.catalogos);
  const compactCode = buildCompactCode(descCode);
  const fullCode = buildFullCode(descCode, existingDrum.tambor_id);

  const updatedDrum = {
    ...existingDrum,
    ...normalized,
    id: existingDrum.id,
    tambor_id: existingDrum.tambor_id,
    codigo_descriptivo: descCode,
    codigo_compacto: compactCode,
    codigo: fullCode,
    updated_date: new Date().toISOString(),
  };

  // Calcular diferencias campo por campo
  const diffs = diffDrumFields(existingDrum, updatedDrum, state.catalogos);

  const now = new Date().toISOString();
  for (const diff of diffs) {
    state.historial.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: existingDrum.tambor_id,
      tambor_ref: existingDrum.id,
      tipo: 'Edición',
      campo: diff.campo,
      valor_anterior: diff.valor_anterior,
      valor_nuevo: diff.valor_nuevo,
      descripcion: diff.descripcion,
      actor: currentUser?.nombre || 'Operario Planta',
      created_date: now,
    });
  }

  state.tambores[drumIndex] = updatedDrum;
  saveDatabase(state);
  return updatedDrum;
}

/**
 * Registra un movimiento físico o cambio de estado.
 */
export async function recordDrumMovement(drumId, movementInput, currentUser = null) {
  const state = loadDatabase();
  const drumIndex = state.tambores.findIndex((d) => d.id === drumId || d.tambor_id?.toUpperCase() === drumId?.toUpperCase());

  if (drumIndex === -1) {
    throw new Error(`No se encontró el tambor solicitado (${drumId})`);
  }

  const drum = state.tambores[drumIndex];
  const { tipo, ubicacion_nueva, estado_nuevo, observaciones } = movementInput;

  if (!tipo) {
    throw new Error('Debe seleccionar el tipo de movimiento');
  }
  if (!ubicacion_nueva) {
    throw new Error('Debe indicar la nueva ubicación');
  }

  const tipoItem = state.catalogos.find((c) => (c.id === tipo || c.codigo === tipo) && c.tipo === 'tipo_movimiento');
  if (!tipoItem) {
    throw new Error('El tipo de movimiento seleccionado no es válido');
  }
  const tipoNombre = tipoItem.nombre || 'Movimiento registrado';

  const ubiItem = state.catalogos.find((c) => (c.id === ubicacion_nueva || c.codigo === ubicacion_nueva) && c.tipo === 'ubicacion');
  if (!ubiItem) {
    throw new Error('La ubicación de destino seleccionada no es válida');
  }

  if (estado_nuevo) {
    const estItem = state.catalogos.find((c) => (c.id === estado_nuevo || c.codigo === estado_nuevo) && c.tipo === 'estado');
    if (!estItem) {
      throw new Error('El estado seleccionado no es válido');
    }
  }

  const ubiAntId = drum.ubicacion;
  const ubiNuevaId = ubiItem.id;
  const estAntId = drum.estado;
  const estNuevoId = estado_nuevo || drum.estado;

  const now = new Date().toISOString();

  // 1. Crear entidad Movimiento
  const newMovement = {
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

  // 2. Crear evento principal de Historial
  state.historial.unshift({
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tambor_id: drum.tambor_id,
    tambor_ref: drum.id,
    tipo: 'Movimiento',
    descripcion: `Movimiento: ${tipoNombre}`,
    observaciones: observaciones?.trim() || '',
    actor: currentUser?.nombre || 'Operario Planta',
    created_date: now,
  });

  // 3. Si cambió la ubicación, actualizar tambor y agregar evento específico
  if (ubiAntId !== ubiNuevaId) {
    const nomAnt = resolveCatalogName(state.catalogos, ubiAntId, 'ubicacion');
    const nomNue = resolveCatalogName(state.catalogos, ubiNuevaId, 'ubicacion');
    drum.ubicacion = ubiNuevaId;

    state.historial.unshift({
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

  // 4. Si cambió el estado, actualizar tambor y agregar evento específico
  if (estado_nuevo && estAntId !== estado_nuevo) {
    const estNomAnt = resolveCatalogName(state.catalogos, estAntId, 'estado');
    const estNomNue = resolveCatalogName(state.catalogos, estado_nuevo, 'estado');
    drum.estado = estado_nuevo;

    state.historial.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo: 'Edición',
      campo: 'estado',
      valor_anterior: estNomAnt,
      valor_nuevo: estNomNue,
      descripcion: `Estado modificado: "${estNomAnt}" → "${estNomNue}"`,
      actor: currentUser?.nombre || 'Operario Planta',
      created_date: now,
    });
  }

  drum.updated_date = now;
  state.movimientos.unshift(newMovement);
  state.tambores[drumIndex] = drum;

  saveDatabase(state);
  return { drum, movement: newMovement };
}

/**
 * Elimina un tambor previa confirmación exacta de su número visible.
 * El historial y movimientos se conservan permanentemente.
 */
export async function deleteDrum(drumId, confirmationText, currentUser = null) {
  const state = loadDatabase();
  const drumIndex = state.tambores.findIndex((d) => d.id === drumId || d.tambor_id?.toUpperCase() === drumId?.toUpperCase());

  if (drumIndex === -1) {
    throw new Error(`No se encontró el tambor solicitado (${drumId})`);
  }

  const drum = state.tambores[drumIndex];

  if (confirmationText?.trim().toUpperCase() !== drum.tambor_id.toUpperCase()) {
    throw new Error(`Para confirmar la eliminación debe escribir exactamente el número "${drum.tambor_id}"`);
  }

  // Registrar evento de eliminación en el historial
  state.historial.unshift({
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tambor_id: drum.tambor_id,
    tambor_ref: drum.id,
    tipo: 'Eliminación',
    descripcion: `Tambor ${drum.tambor_id} eliminado del inventario activo`,
    actor: currentUser?.nombre || 'Administrador',
    created_date: new Date().toISOString(),
  });

  // Eliminar el tambor de la lista activa
  state.tambores.splice(drumIndex, 1);

  saveDatabase(state);
  return { success: true, deletedTamborId: drum.tambor_id };
}

// -------------------------------------------------------------
// OPERACIONES DE CATÁLOGOS
// -------------------------------------------------------------

export async function saveCatalogItem(catalogItem) {
  const state = loadDatabase();
  const { id, tipo, nombre, codigo, activo = true, orden = 1 } = catalogItem;

  if (!tipo || !nombre || !codigo) {
    throw new Error('Tipo, nombre y código son obligatorios');
  }

  const cleanCode = String(codigo).trim().toUpperCase();

  // Validar formato del código (letras mayúsculas sin acento, números, espacios, / y guiones)
  if (!/^[A-Z0-9]+([ /\\-][A-Z0-9]+)*$/.test(cleanCode)) {
    throw new Error('El código solo puede contener letras mayúsculas, números, / y guiones');
  }

  // Validar unicidad del código dentro del mismo tipo
  const duplicate = state.catalogos.find(
    (c) => c.tipo === tipo && c.codigo === cleanCode && c.id !== id
  );

  if (duplicate) {
    throw new Error(`Ya existe una opción con el código "${cleanCode}" para este catálogo`);
  }

  if (id) {
    // Editar existente
    const idx = state.catalogos.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Opción de catálogo no encontrada');
    state.catalogos[idx] = {
      ...state.catalogos[idx],
      nombre: String(nombre).trim(),
      codigo: cleanCode,
      activo: Boolean(activo),
      orden: Number(orden) || 1,
    };
  } else {
    // Crear nuevo
    const newItem = {
      id: `cat-${tipo.substring(0, 3)}-${Date.now()}`,
      tipo,
      nombre: String(nombre).trim(),
      codigo: cleanCode,
      activo: Boolean(activo),
      orden: Number(orden) || 1,
      created_date: new Date().toISOString(),
    };
    state.catalogos.push(newItem);
  }

  saveDatabase(state);
  return state.catalogos;
}

export async function toggleCatalogActive(id) {
  const state = loadDatabase();
  const item = state.catalogos.find((c) => c.id === id);
  if (!item) throw new Error('Opción de catálogo no encontrada');

  item.activo = !item.activo;
  saveDatabase(state);
  return item;
}

/**
 * Aplica los resultados de una toma de inventario físico por sectores.
 * Actualiza las ubicaciones de los tambores que cambiaron de sector,
 * crea los movimientos de trazabilidad correspondientes y registra los eventos en el historial.
 *
 * @param {Object} auditResult - Resultado de parseInventoryScanStream (contiene relocations, etc.)
 * @param {Object} currentUser - Usuario que ejecuta la auditoría
 * @returns {Promise<Object>} Resumen del resultado aplicado
 */
export async function applyInventoryAudit(auditResult = {}, currentUser = null) {
  const state = loadDatabase();
  const now = new Date().toISOString();
  const relocations = auditResult.relocations || [];
  let updatedCount = 0;
  const createdMovements = [];

  // 1. Obtener ID de tipo de movimiento para traslado interno (o fallback al primer tipo registrado)
  const defaultMoveType =
    state.catalogos.find((c) => c.tipo === 'tipo_movimiento' && (c.id === 'cat-mov-1' || c.codigo === 'TRAS'))?.id ||
    state.catalogos.find((c) => c.tipo === 'tipo_movimiento')?.id ||
    'cat-mov-1';

  for (const item of relocations) {
    const drumIndex = state.tambores.findIndex(
      (d) => d.id === item.drumId || (item.tambor_id && d.tambor_id?.toUpperCase() === item.tambor_id.toUpperCase())
    );
    if (drumIndex === -1) continue;

    const drum = state.tambores[drumIndex];
    const oldUbiId = drum.ubicacion;
    const newUbiId = item.newSectorId;

    if (oldUbiId === newUbiId) continue;

    const oldName = resolveCatalogName(state.catalogos, oldUbiId, 'ubicacion');
    const newName = resolveCatalogName(state.catalogos, newUbiId, 'ubicacion');

    // 1. Crear entidad Movimiento
    const movement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo: defaultMoveType,
      ubicacion_anterior: oldUbiId,
      ubicacion_nueva: newUbiId,
      estado_anterior: drum.estado,
      estado_nuevo: drum.estado,
      observaciones: `Ajuste por toma de inventario físico en sector "${newName}"`,
      created_date: now,
    };
    state.movimientos.unshift(movement);
    createdMovements.push(movement);

    // 2. Historial: Evento de Movimiento
    state.historial.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo: 'Movimiento',
      descripcion: `Movimiento por toma de inventario: "${oldName}" → "${newName}"`,
      observaciones: `Escaneo de sector durante inventario físico`,
      actor: currentUser?.nombre || 'Operario Planta',
      created_date: now,
    });

    // 3. Historial: Evento de Edición de Ubicación
    state.historial.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tambor_id: drum.tambor_id,
      tambor_ref: drum.id,
      tipo: 'Edición',
      campo: 'ubicacion',
      valor_anterior: oldName,
      valor_nuevo: newName,
      descripcion: `Ubicación actualizada por inventario: "${oldName}" → "${newName}"`,
      actor: currentUser?.nombre || 'Operario Planta',
      created_date: now,
    });

    drum.ubicacion = newUbiId;
    drum.updated_date = now;
    state.tambores[drumIndex] = drum;
    updatedCount++;
  }

  // 4. Actualizar timestamp de última auditoría para todos los tambores verificados
  const allAuditedDrumIds = new Set();
  (auditResult.sectors || []).forEach((sec) => {
    (sec.drums || []).forEach((d) => {
      if (d.tambor_id) allAuditedDrumIds.add(d.tambor_id.toUpperCase());
    });
  });

  for (const drum of state.tambores) {
    if (allAuditedDrumIds.has(drum.tambor_id?.toUpperCase())) {
      drum.ultima_auditoria = now;
      drum.updated_date = now;
    }
  }

  // 5. Registrar evento de toma de inventario global en Historial
  state.historial.unshift({
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tipo: 'Inventario',
    descripcion: `Toma de inventario físico completada: ${auditResult.validDrumsCount || allAuditedDrumIds.size || 0} tambores auditados en ${auditResult.sectorsCount || 0} sectores (${updatedCount} reubicaciones).`,
    observaciones: `Auditoría física por sectores de planta`,
    actor: currentUser?.nombre || 'Operario Planta',
    created_date: now,
  });

  saveDatabase(state);

  return {
    success: true,
    relocationsApplied: updatedCount,
    movementsCreated: createdMovements.length,
    auditedCount: allAuditedDrumIds.size,
    timestamp: now,
  };
}
