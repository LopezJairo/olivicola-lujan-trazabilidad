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
import { TEST_DATASET_15 } from '../data/testDataset.js';
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
import { checkPermission, PERMISOS } from '../components/Auth.jsx';
import { logger } from '../lib/logger.js';

const STORAGE_KEY_PREFIX = 'olivicola-lujan-';
const CURRENT_MODE_KEY = `${STORAGE_KEY_PREFIX}workspace-mode`; // 'demo' | 'empresa'

export function getCurrentWorkspaceMode() {
  try {
    return localStorage.getItem(CURRENT_MODE_KEY) || 'empresa';
  } catch {
    return 'empresa';
  }
}

export function setCurrentWorkspaceMode(mode) {
  try {
    localStorage.setItem(CURRENT_MODE_KEY, mode);
  } catch (err) {
    console.error('Error al guardar modo de espacio de trabajo:', err);
  }
}

export function clearAllCompanyData(user = null) {
  const emptyState = {
    catalogos: JSON.parse(JSON.stringify(INITIAL_CATALOGOS)),
    tambores: [],
    historial: [],
    movimientos: [],
  };
  saveDatabase(emptyState, 'empresa');
  return emptyState;
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
  try {
    const config = getNetworkConfig();
    if (config.mode !== NETWORK_MODES.OFFLINE) {
      callServerApi('/api/reset-demo', { method: 'POST' }).catch(() => {});
    }
  } catch {}
  return initial;
}

/**
 * Carga el conjunto oficial de 15 tambores de prueba en el espacio activo
 * (ideal para evaluación, pruebas de escáner y verificación en vivo).
 */
export function loadTestDataset() {
  const dataset = JSON.parse(JSON.stringify(TEST_DATASET_15));
  saveDatabase(dataset);
  try {
    const config = getNetworkConfig();
    if (config.mode !== NETWORK_MODES.OFFLINE) {
      callServerApi('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataset }),
      }).catch(() => {});
    }
  } catch {}
  return dataset;
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
// ARQUITECTURA DE RED: MODOS OFFLINE, SERVIDOR HOST Y TERMINAL CLIENTE
// -------------------------------------------------------------

export const NETWORK_MODES = {
  OFFLINE: 'offline', // Modo Autónomo: opera 100% local en localStorage
  HOST: 'host',       // Modo Servidor Host: aloja base de datos y sirve a la red local
  CLIENT: 'client',   // Modo Terminal Cliente: conecta a la IP local del Servidor Host
};

const NETWORK_CONFIG_KEY = `${STORAGE_KEY_PREFIX}network-config`;

export function getNetworkConfig() {
  try {
    const raw = localStorage.getItem(NETWORK_CONFIG_KEY);
    if (!raw) {
      return {
        mode: NETWORK_MODES.OFFLINE,
        hostUrl: 'http://localhost:4000',
        autoSync: true,
        status: 'ready',
        lastSync: null,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      mode: NETWORK_MODES.OFFLINE,
      hostUrl: 'http://localhost:4000',
      autoSync: true,
      status: 'ready',
      lastSync: null,
    };
  }
}

export function setNetworkConfig(config) {
  try {
    const current = getNetworkConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(NETWORK_CONFIG_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error al guardar configuración de red:', err);
    return getNetworkConfig();
  }
}

/**
 * Normaliza y limpia una URL de Servidor Host (agrega http:// y puerto 4000 si faltan)
 */
export function normalizeHostUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return 'http://localhost:4000';
  let clean = rawUrl.trim().replace(/\/+$/, '');
  if (!clean) return 'http://localhost:4000';

  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `http://${clean}`;
  }

  try {
    const parsed = new URL(clean);
    if (!parsed.port && parsed.protocol === 'http:') {
      parsed.port = '4000';
      clean = parsed.toString().replace(/\/+$/, '');
    }
  } catch {}

  return clean;
}

/**
 * Prueba la conectividad HTTP con el servidor host en la LAN
 */
export async function testHostConnection(targetUrl = null) {
  const url = normalizeHostUrl(targetUrl || getNetworkConfig().hostUrl);
  logger.info('Red', `Enviando solicitud de sondeo a ${url}/api/status`);
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${url}/api/status`, { signal: controller.signal });
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    if (res.ok) {
      const data = await res.json();
      logger.success('Red', `Enlace confirmado con Servidor Host en ${elapsed}ms`, {
        url,
        version: data?.version,
        tambores: data?.stats?.tambores,
        catalogos: data?.stats?.catalogos,
      });
      return { success: true, data, normalizedUrl: url, elapsed };
    }
    const errText = `Servidor respondió con código HTTP ${res.status} (${res.statusText})`;
    logger.error('Red', errText, { url, status: res.status });
    return { success: false, error: errText };
  } catch (err) {
    const elapsed = Date.now() - startTime;
    let errorMsg = '';
    if (err.name === 'AbortError') {
      errorMsg = `Tiempo de espera agotado tras ${elapsed}ms. La máquina ${url} no respondió. Verifica que el Servidor Host esté encendido y que el Firewall de Windows permita el puerto 4000.`;
    } else {
      errorMsg = `Error de conexión en ${elapsed}ms (${err.message}). Verifica que la IP sea correcta y ambos equipos estén en la misma red.`;
    }
    logger.error('Red', errorMsg, { url, error: err.message, elapsed });
    return { success: false, error: errorMsg };
  }
}

/**
 * Sincroniza los datos locales con el Servidor Host
 */
export async function syncWithHostServer() {
  const config = getNetworkConfig();
  if (config.mode === NETWORK_MODES.OFFLINE) return false;

  const url = normalizeHostUrl(config.hostUrl);
  logger.info('Red', `Iniciando sincronización completa desde ${url}/api/database`);
  try {
    const res = await fetch(`${url}/api/database`);
    if (res.ok) {
      const hostData = await res.json();
      saveDatabase(hostData);
      setNetworkConfig({ hostUrl: url, status: 'connected', lastSync: new Date().toISOString() });
      logger.success('Red', `Sincronización exitosa: ${hostData.tambores?.length || 0} tambores descargados`, {
        tambores: hostData.tambores?.length,
        catalogos: hostData.catalogos?.length,
      });
      return hostData;
    }
    logger.error('Red', `Error HTTP ${res.status} al sincronizar base de datos`, { url });
    setNetworkConfig({ status: 'error' });
    return false;
  } catch (err) {
    logger.error('Red', `Fallo al sincronizar con Servidor Host: ${err.message}`, { url, error: err.message });
    setNetworkConfig({ status: 'disconnected' });
    return false;
  }
}

/**
 * Realiza llamadas HTTP al servidor local si estamos en Modo Host o Cliente LAN.
 * Si la red falla o está en modo offline, retorna null para operar de modo local.
 */
export async function callServerApi(endpoint, options = {}) {
  const config = getNetworkConfig();
  if (config.mode === NETWORK_MODES.OFFLINE) return null;

  const baseUrl = normalizeHostUrl(config.hostUrl);
  const url = `${baseUrl}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      setNetworkConfig({ status: 'connected' });
      return await res.json();
    } else {
      const errData = await res.json().catch(() => ({}));
      logger.warn('API', `Respuesta HTTP ${res.status} en ${endpoint}: ${errData.error || res.statusText}`);
      return null;
    }
  } catch (err) {
    logger.warn('API', `Servidor Host no disponible en ${url} (${err.message}). Operando localmente.`);
    setNetworkConfig({ status: 'disconnected' });
    return null;
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

  // 1. Sincronización con Servidor Host si estamos en modo Host o Cliente LAN
  const config = getNetworkConfig();
  if (config.mode !== NETWORK_MODES.OFFLINE) {
    const serverResult = await callServerApi('/api/tambores', {
      method: 'POST',
      body: JSON.stringify({ drumData: rawInput, currentUser }),
    });

    if (serverResult && serverResult.tambor_id) {
      const freshState = loadDatabase();
      if (!freshState.tambores.some((d) => d.tambor_id === serverResult.tambor_id)) {
        freshState.tambores.unshift(serverResult);
        saveDatabase(freshState);
      }
      return serverResult;
    }
  }

  // 2. Persistencia local autónoma u offline
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

  // Sincronización con Servidor Host si estamos en modo Host o Cliente LAN
  const config = getNetworkConfig();
  if (config.mode !== NETWORK_MODES.OFFLINE) {
    callServerApi(`/api/tambores/${encodeURIComponent(existingDrum.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ drumData: rawInput, currentUser }),
    }).catch(() => {});
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

  // Sincronización con Servidor Host si estamos en modo Host o Cliente LAN
  const config = getNetworkConfig();
  if (config.mode !== NETWORK_MODES.OFFLINE) {
    callServerApi(`/api/tambores/${encodeURIComponent(drum.id)}/movimiento`, {
      method: 'POST',
      body: JSON.stringify({ movementInput, currentUser }),
    }).catch(() => {});
  }

  saveDatabase(state);
  return { drum, movement: newMovement };
}

/**
 * Elimina un tambor previa confirmación exacta de su número visible.
 * El historial y movimientos se conservan permanentemente.
 */
export async function deleteDrum(drumId, confirmationText, currentUser = null) {
  if (currentUser?.rol && !checkPermission(currentUser.rol, PERMISOS.ELIMINAR_TAMBORES)) {
    throw new Error('Permiso denegado: Se requiere perfil de Administrador para dar de baja tambores');
  }

  const state = loadDatabase();
  const drumIndex = state.tambores.findIndex((d) => d.id === drumId || d.tambor_id?.toUpperCase() === drumId?.toUpperCase());

  if (drumIndex === -1) {
    throw new Error(`No se encontró el tambor solicitado (${drumId})`);
  }

  const drum = state.tambores[drumIndex];

  if (confirmationText?.trim().toUpperCase() !== drum.tambor_id.toUpperCase()) {
    throw new Error(`Para confirmar la eliminación debe escribir exactamente el número "${drum.tambor_id}"`);
  }

  // Sincronización con Servidor Host si estamos en modo Host o Cliente LAN
  const netConfig = getNetworkConfig();
  if (netConfig.mode !== NETWORK_MODES.OFFLINE) {
    callServerApi(`/api/tambores/${encodeURIComponent(drum.id)}`, {
      method: 'DELETE',
      body: JSON.stringify({ confirmationText, currentUser }),
    }).catch(() => {});
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

export async function saveCatalogItem(catalogItem, currentUser = null) {
  if (currentUser?.rol && !checkPermission(currentUser.rol, PERMISOS.GESTION_CATALOGOS)) {
    throw new Error('Permiso denegado: Se requiere perfil de Administrador para gestionar catálogos');
  }

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

  // Sincronización con Servidor Host si estamos en modo Host o Cliente LAN
  const config = getNetworkConfig();
  if (config.mode !== NETWORK_MODES.OFFLINE) {
    callServerApi('/api/catalogos', {
      method: 'POST',
      body: JSON.stringify(catalogItem),
    }).catch(() => {});
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

export async function toggleCatalogActive(id, currentUser = null) {
  if (currentUser?.rol && !checkPermission(currentUser.rol, PERMISOS.GESTION_CATALOGOS)) {
    throw new Error('Permiso denegado: Se requiere perfil de Administrador para gestionar catálogos');
  }

  const state = loadDatabase();
  const item = state.catalogos.find((c) => c.id === id);
  if (!item) throw new Error('Opción de catálogo no encontrada');

  // Sincronización con Servidor Host si estamos en modo Host o Cliente LAN
  const config = getNetworkConfig();
  if (config.mode !== NETWORK_MODES.OFFLINE) {
    callServerApi(`/api/catalogos/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
    }).catch(() => {});
  }

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

  // Sincronización con Servidor Host si estamos en modo Host o Cliente LAN
  const config = getNetworkConfig();
  if (config.mode !== NETWORK_MODES.OFFLINE) {
    callServerApi('/api/inventario/auditoria', {
      method: 'POST',
      body: JSON.stringify({ auditResult, currentUser }),
    }).catch(() => {});
  }

  saveDatabase(state);

  return {
    success: true,
    relocationsApplied: updatedCount,
    movementsCreated: createdMovements.length,
    auditedCount: allAuditedDrumIds.size,
    timestamp: now,
  };
}

// -------------------------------------------------------------
// CONTROL DE CALIDAD Y MUESTREO
// -------------------------------------------------------------

/**
 * Autoriza o retiene un lote o conjunto de tambores tras la inspección de calidad.
 * Registra parámetros de muestreo físico-químico, crea movimiento de control y actualiza historial.
 */
export async function authorizeQualityLot(params = {}, currentUser = null) {
  if (currentUser?.rol && !checkPermission(currentUser.rol, PERMISOS.AUTORIZAR_CALIDAD)) {
    throw new Error('Permiso denegado: Se requiere perfil de Control de Calidad o Administrador para autorizar o retener lotes');
  }

  const { drumIds = [], lot = '', estadoNuevo = 'cat-est-5', observaciones = '', muestreoData = null } = params;

  if (!drumIds || drumIds.length === 0) {
    throw new Error('Debe seleccionar al menos un tambor para registrar la inspección');
  }

  const networkConfig = getNetworkConfig();
  if (networkConfig.mode !== NETWORK_MODES.OFFLINE) {
    try {
      const res = await fetch(`${networkConfig.hostUrl}/api/calidad/autorizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, currentUser }),
      });
      if (res.ok) {
        const result = await res.json();
        // Sincronizar copia local
        await syncWithHostServer();
        return result;
      }
    } catch (e) {
      console.warn('Error comunicando con servidor host, aplicando localmente:', e);
    }
  }

  const state = loadDatabase();
  const now = new Date().toISOString();
  const targetStatusItem = state.catalogos.find((c) => (c.id === estadoNuevo || c.codigo === estadoNuevo) && c.tipo === 'estado');
  const statusName = targetStatusItem?.nombre || 'Aprobado calidad';
  const qualityMoveType =
    state.catalogos.find((c) => c.tipo === 'tipo_movimiento' && (c.id === 'cat-mov-3' || c.codigo === 'CTRL'))?.id ||
    'cat-mov-3';

  let updatedCount = 0;
  const targetIdSet = new Set(drumIds.map(id => String(id).toUpperCase()));

  for (const drum of state.tambores) {
    if (targetIdSet.has(drum.id.toUpperCase()) || targetIdSet.has(drum.tambor_id?.toUpperCase())) {
      const prevStatusName = resolveCatalogName(state.catalogos, drum.estado, 'estado');
      const samplingNotes = muestreoData
        ? ` [pH: ${muestreoData.ph || '-'} | Salinidad: ${muestreoData.salinidad || '-'}% | Acidez: ${muestreoData.acidez || '-'}%]`
        : '';
      const fullObs = `${observaciones || 'Inspección de control de calidad'}${samplingNotes}`.trim();

      // 1. Movimiento de calidad
      state.movimientos.unshift({
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

      // 2. Historial de Calidad
      state.historial.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tambor_id: drum.tambor_id,
        tambor_ref: drum.id,
        tipo: 'Calidad',
        descripcion: `Autorización de calidad: "${statusName}" (Lote: ${drum.lote || lot || 'N/A'})`,
        observaciones: fullObs,
        actor: currentUser?.nombre || 'Control de Calidad',
        created_date: now,
      });

      // 3. Historial de Edición de estado
      state.historial.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tambor_id: drum.tambor_id,
        tambor_ref: drum.id,
        tipo: 'Edición',
        campo: 'estado',
        valor_anterior: prevStatusName,
        valor_nuevo: statusName,
        descripcion: `Estado modificado por Calidad: "${prevStatusName}" → "${statusName}"`,
        actor: currentUser?.nombre || 'Control de Calidad',
        created_date: now,
      });

      drum.estado = targetStatusItem?.id || estadoNuevo;
      drum.updated_date = now;
      updatedCount++;
    }
  }

  saveDatabase(state);
  return { success: true, authorizedCount: updatedCount, estado: statusName, timestamp: now };
}

// -------------------------------------------------------------
// AUDITORÍA Y CONSULTAS GERENCIALES
// -------------------------------------------------------------

/**
 * Consulta de eventos de auditoría para el Gerente / Administrador
 */
export function getOperatorAuditEvents(filters = {}) {
  const state = loadDatabase();
  const { actor, tipo, search, dateFrom, dateTo } = filters;

  return (state.historial || []).filter(item => {
    if (actor && actor !== 'ALL' && item.actor !== actor) return false;
    if (tipo && tipo !== 'ALL' && item.tipo !== tipo) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTambor = item.tambor_id?.toLowerCase().includes(q);
      const matchDesc = item.descripcion?.toLowerCase().includes(q);
      const matchActor = item.actor?.toLowerCase().includes(q);
      if (!matchTambor && !matchDesc && !matchActor) return false;
    }
    if (dateFrom && item.created_date < dateFrom) return false;
    if (dateTo && item.created_date > dateTo) return false;
    return true;
  });
}

