/**
 * OLIVÍCOLA LUJÁN · Reglas de Dominio y Lógica de Negocio
 * Contiene todas las funciones puras de negocio del sistema de trazabilidad de tambores.
 */

/**
 * Normaliza un texto removiendo acentos y convirtiendo a minúsculas.
 */
export function removeAccents(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Extrae el número secuencial de un identificador visible (ej: "T000001" -> 1, "T1000000" -> 1000000).
 */
export function parseTamborNumber(idStr) {
  if (!idStr || typeof idStr !== 'string') return 0;
  const match = idStr.trim().match(/^T0*(\d+)$/i);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Calcula el siguiente identificador de tambor (ej: T000001, T000012, T1000000).
 * Revisa tanto los tambores activos como el historial de eventos para evitar reutilizar
 * números de registros eliminados.
 *
 * @param {Array} tambores - Lista de tambores actuales
 * @param {Array} historial - Lista de eventos del historial
 * @returns {string} Siguiente ID formateado (mínimo 6 dígitos)
 */
export function nextTamborId(tambores = [], historial = []) {
  let maxNum = 0;

  if (Array.isArray(tambores)) {
    for (const t of tambores) {
      if (!t) continue;
      const idToCheck = t.tambor_id || t.id;
      const num = parseTamborNumber(idToCheck);
      if (num > maxNum) maxNum = num;
    }
  }

  if (Array.isArray(historial)) {
    for (const h of historial) {
      if (!h) continue;
      const num = parseTamborNumber(h.tambor_id);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;

  if (nextNum < 1000000) {
    return `T${String(nextNum).padStart(6, '0')}`;
  }
  return `T${nextNum}`;
}

/**
 * Obtiene el código de una opción de catálogo por ID o código.
 */
function resolveCatalogCode(catalogs, value, tipo) {
  if (!value) return '';
  const item = (catalogs || []).find(
    (c) =>
      c &&
      c.tipo === tipo &&
      (c.id === value || c.codigo?.toUpperCase() === String(value).toUpperCase() || c.nombre === value)
  );
  return item?.codigo ? item.codigo.trim().toUpperCase() : String(value).trim().toUpperCase();
}

/**
 * Obtiene el nombre legible de una opción de catálogo.
 */
export function resolveCatalogName(catalogs, value, tipo) {
  if (!value) return '—';
  const item = (catalogs || []).find(
    (c) =>
      c &&
      (!tipo || c.tipo === tipo) &&
      (c.id === value || c.codigo?.toUpperCase() === String(value).toUpperCase())
  );
  return item?.nombre || value;
}

/**
 * Construye el código descriptivo del producto a partir de los 5 atributos de catálogo:
 * producto_codigo-presentacion_codigo-variedad_codigo-calibre_codigo-calidad_codigo
 * Ejemplo: ENT-VDE-ALOR-161/200-PRI
 */
export function buildDescriptiveCode(drumData = {}, catalogs = []) {
  const prod = resolveCatalogCode(catalogs, drumData.producto, 'producto');
  const pres = resolveCatalogCode(catalogs, drumData.presentacion, 'presentacion');
  const var_ = resolveCatalogCode(catalogs, drumData.variedad, 'variedad');
  const cal = resolveCatalogCode(catalogs, drumData.calibre, 'calibre');
  const qual = resolveCatalogCode(catalogs, drumData.calidad, 'calidad');

  return [prod, pres, var_, cal, qual].filter(Boolean).join('-');
}

/**
 * Construye el código completo del tambor:
 * codigo_descriptivo-tambor_id
 * Ejemplo: ENT-VDE-ALOR-161/200-PRI-T000001
 */
export function buildFullCode(descriptiveCode, tamborId) {
  if (!descriptiveCode && !tamborId) return '';
  if (!descriptiveCode) return tamborId || '';
  if (!tamborId) return descriptiveCode;
  return `${descriptiveCode}-${tamborId}`;
}

/**
 * Normaliza las entradas de un tambor eliminando espacios en blanco y casteando tipos.
 */
export function normalizeDrumInput(data = {}) {
  const normalized = { ...data };

  if (normalized.lote !== undefined) {
    normalized.lote = String(normalized.lote ?? '').trim();
  }

  if (normalized.peso !== undefined) {
    const p = typeof normalized.peso === 'string' ? parseFloat(normalized.peso.replace(',', '.')) : Number(normalized.peso);
    normalized.peso = Number.isFinite(p) ? p : NaN;
  }

  if (normalized.fecha_ingreso !== undefined) {
    normalized.fecha_ingreso = String(normalized.fecha_ingreso ?? '').trim();
  }

  if (normalized.fecha_elaboracion !== undefined) {
    normalized.fecha_elaboracion = normalized.fecha_elaboracion ? String(normalized.fecha_elaboracion).trim() : '';
  }

  if (normalized.observaciones !== undefined) {
    normalized.observaciones = normalized.observaciones ? String(normalized.observaciones).trim() : '';
  }

  return normalized;
}

/**
 * Valida un formato de fecha estricto YYYY-MM-DD y su existencia en calendario.
 */
export function isValidDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

/**
 * Valida todos los datos de un tambor según las reglas de negocio.
 *
 * @param {Object} rawData - Datos del tambor a validar
 * @param {Array} catalogs - Lista completa de opciones de catálogo
 * @param {Object} options - { isEdit: boolean, currentDrum: Object }
 * @returns {Object} { valid: boolean, errors: Record<string, string> }
 */
export function validateDrum(rawData = {}, catalogs = [], { isEdit = false, currentDrum = null } = {}) {
  const data = normalizeDrumInput(rawData);
  const errors = {};

  const requiredCatalogFields = [
    { field: 'producto', tipo: 'producto', label: 'Producto' },
    { field: 'presentacion', tipo: 'presentacion', label: 'Presentación' },
    { field: 'variedad', tipo: 'variedad', label: 'Variedad' },
    { field: 'calibre', tipo: 'calibre', label: 'Calibre' },
    { field: 'calidad', tipo: 'calidad', label: 'Calidad' },
    { field: 'ubicacion', tipo: 'ubicacion', label: 'Ubicación' },
    { field: 'estado', tipo: 'estado', label: 'Estado' },
  ];

  for (const { field, tipo, label } of requiredCatalogFields) {
    const val = data[field];
    if (!val) {
      errors[field] = `El campo ${label} es obligatorio`;
      continue;
    }

    const item = (catalogs || []).find(
      (c) => c && c.tipo === tipo && (c.id === val || c.codigo === val)
    );

    if (!item) {
      errors[field] = `La opción seleccionada para ${label} no es válida`;
      continue;
    }

    // Regla de activación:
    // En alta: la opción DEBE estar activa.
    // En edición: si ya estaba asignada previamente a este tambor, se puede mantener aunque esté inactiva.
    if (!item.activo) {
      const wasPreviouslyAssigned =
        isEdit && currentDrum && (currentDrum[field] === item.id || currentDrum[field] === item.codigo);
      if (!wasPreviouslyAssigned) {
        errors[field] = `La opción "${item.nombre}" está inactiva y no se puede seleccionar`;
      }
    }
  }

  // Lote
  if (!data.lote || data.lote.length === 0) {
    errors.lote = 'El lote es obligatorio';
  }

  // Peso
  if (data.peso === undefined || Number.isNaN(data.peso) || data.peso <= 0) {
    errors.peso = 'El peso neto debe ser un número mayor a 0 kg';
  }

  // Fecha de ingreso
  if (!data.fecha_ingreso) {
    errors.fecha_ingreso = 'La fecha de ingreso es obligatoria';
  } else if (!isValidDateString(data.fecha_ingreso)) {
    errors.fecha_ingreso = 'La fecha de ingreso debe tener formato YYYY-MM-DD válido';
  }

  // Fecha de elaboración (opcional)
  if (data.fecha_elaboracion) {
    if (!isValidDateString(data.fecha_elaboracion)) {
      errors.fecha_elaboracion = 'La fecha de elaboración debe tener formato YYYY-MM-DD válido';
    } else if (data.fecha_ingreso && isValidDateString(data.fecha_ingreso)) {
      if (data.fecha_elaboracion > data.fecha_ingreso) {
        errors.fecha_elaboracion = 'La fecha de elaboración no puede ser posterior a la fecha de ingreso';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Compara dos estados de un tambor y genera los eventos de diferencia para el historial.
 * Por cada campo modificado produce { campo, valor_anterior, valor_nuevo, descripcion }.
 */
export function diffDrumFields(oldDrum = {}, newDrum = {}, catalogs = []) {
  const fields = [
    { key: 'producto', label: 'Producto', isCatalog: true },
    { key: 'presentacion', label: 'Presentación', isCatalog: true },
    { key: 'variedad', label: 'Variedad', isCatalog: true },
    { key: 'calibre', label: 'Calibre', isCatalog: true },
    { key: 'calidad', label: 'Calidad', isCatalog: true },
    { key: 'lote', label: 'Lote' },
    { key: 'fecha_ingreso', label: 'Fecha de ingreso' },
    { key: 'fecha_elaboracion', label: 'Fecha de elaboración' },
    { key: 'peso', label: 'Peso neto' },
    { key: 'ubicacion', label: 'Ubicación', isCatalog: true },
    { key: 'estado', label: 'Estado', isCatalog: true },
    { key: 'observaciones', label: 'Observaciones' },
  ];

  const diffs = [];

  for (const field of fields) {
    const { key, label, isCatalog } = field;
    let oldVal = oldDrum[key] ?? '';
    let newVal = newDrum[key] ?? '';

    if (key === 'peso') {
      const oldP = Number(oldVal);
      const newP = Number(newVal);
      if (oldP === newP) continue;
      oldVal = String(oldVal);
      newVal = String(newVal);
    } else {
      oldVal = String(oldVal).trim();
      newVal = String(newVal).trim();
      if (oldVal === newVal) continue;
    }

    let displayOld = oldVal;
    let displayNew = newVal;

    if (isCatalog) {
      displayOld = resolveCatalogName(catalogs, oldVal, key);
      displayNew = resolveCatalogName(catalogs, newVal, key);
    }

    diffs.push({
      campo: key,
      valor_anterior: displayOld,
      valor_nuevo: displayNew,
      descripcion: `Campo "${label}" modificado: "${displayOld || '(vacío)'}" → "${displayNew || '(vacío)'}"`,
    });
  }

  return diffs;
}

/**
 * Busca y filtra tambores en memoria.
 * - Búsqueda insensible a mayúsculas y acentos sobre tambor_id, código, lote, producto, variedad, calibre, ubicación.
 * - Filtros por catálogos exactos.
 */
export function searchDrums(drums = [], query = '', filters = {}, catalogs = []) {
  if (!Array.isArray(drums)) return [];

  const normQuery = removeAccents(query);

  // Mapa de nombres legibles para optimizar búsqueda de texto
  const catNamesMap = new Map();
  for (const c of catalogs || []) {
    if (c?.id) {
      catNamesMap.set(c.id, removeAccents(c.nombre));
    }
  }

  return drums.filter((d) => {
    if (!d) return false;

    // Filtros exactos por catálogo
    if (filters.producto && d.producto !== filters.producto) return false;
    if (filters.presentacion && d.presentacion !== filters.presentacion) return false;
    if (filters.variedad && d.variedad !== filters.variedad) return false;
    if (filters.calibre && d.calibre !== filters.calibre) return false;
    if (filters.calidad && d.calidad !== filters.calidad) return false;
    if (filters.ubicacion && d.ubicacion !== filters.ubicacion) return false;
    if (filters.estado && d.estado !== filters.estado) return false;
    if (filters.lote && removeAccents(d.lote) !== removeAccents(filters.lote)) return false;

    // Búsqueda por texto
    if (normQuery) {
      const idMatch = removeAccents(d.tambor_id).includes(normQuery);
      const codeMatch = removeAccents(d.codigo).includes(normQuery);
      const descMatch = removeAccents(d.codigo_descriptivo).includes(normQuery);
      const loteMatch = removeAccents(d.lote).includes(normQuery);
      const prodMatch = (catNamesMap.get(d.producto) || '').includes(normQuery);
      const varMatch = (catNamesMap.get(d.variedad) || '').includes(normQuery);
      const calMatch = (catNamesMap.get(d.calibre) || '').includes(normQuery);
      const presMatch = (catNamesMap.get(d.presentacion) || '').includes(normQuery);
      const ubiMatch = (catNamesMap.get(d.ubicacion) || '').includes(normQuery);

      if (!idMatch && !codeMatch && !descMatch && !loteMatch && !prodMatch && !varMatch && !calMatch && !presMatch && !ubiMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calcula los totales del inventario:
 * - Cantidad total de tambores
 * - Suma de kilogramos netos
 * - Ubicaciones ocupadas distintas
 */
export function calculateInventoryTotals(drums = []) {
  if (!Array.isArray(drums)) {
    return { totalDrums: 0, totalKg: 0, totalLocations: 0 };
  }

  let totalKg = 0;
  const locations = new Set();

  for (const d of drums) {
    if (!d) continue;
    const p = Number(d.peso);
    if (Number.isFinite(p) && p > 0) {
      totalKg += p;
    }
    if (d.ubicacion) {
      locations.add(d.ubicacion);
    }
  }

  return {
    totalDrums: drums.length,
    totalKg: Math.round(totalKg * 100) / 100,
    totalLocations: locations.size,
  };
}
