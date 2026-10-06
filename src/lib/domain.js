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
 * Ejemplo: ENT-VDE-ALOR-121/140-PRI-T000001
 */
export function buildFullCode(descriptiveCode, tamborId) {
  if (!descriptiveCode && !tamborId) return '';
  if (!descriptiveCode) return tamborId || '';
  if (!tamborId) return descriptiveCode;
  return `${descriptiveCode}-${tamborId}`;
}

/**
 * Limpia y normaliza una cadena de código de barras eliminando todos los separadores
 * y caracteres espurios generados por mapeos de teclado o formatos físicos
 * (guiones, barras, apóstrofes, comillas, espacios, etc.).
 * Retorna la cadena limpia en mayúsculas.
 *
 * @param {string} str - Cadena a limpiar
 * @returns {string} Cadena alfanumérica en mayúsculas
 */
export function cleanBarcodeSeparators(str) {
  if (!str) return '';
  return String(str)
    .toUpperCase()
    .replace(/[-_/\s'’`"´\\|:~#*]/g, '')
    .trim();
}

/**
 * Normaliza una entrada de escaneo tolerando las particularidades de teclados
 * en español (donde el lector USB envía apóstrofes en lugar de guiones y guiones en lugar de barras).
 * Ejemplo: "FET'VDE'MF'201-240'SDA'T000005" -> "FET-VDE-MF-201/240-SDA-T000005"
 *
 * @param {string} str - Cadena cruda del escáner
 * @returns {string} Cadena normalizada con guiones y barras estándar
 */
export function normalizeScanInput(str) {
  if (!str) return '';
  let clean = String(str).trim().replace(/^['"`*]+|['"`*]+$/g, '').trim();
  // Sustituir apóstrofes y comillas simples/inclinadas por guiones
  clean = clean.replace(/['’`]/g, '-');
  // Normalizar rangos de calibres numéricos con guión al formato con barra oficial (ej: 201-240 -> 201/240)
  clean = clean.replace(/(\d{2,3})-(\d{2,3})/g, (m, p1, p2) => `${p1}/${p2}`);
  return clean;
}

/**
 * Construye el código compacto (sin guiones ni barra del calibre)
 * especificado por la gerencia de Olivícola Luján como base para la generación de CODE 128.
 * Ejemplo: "ENT-VDE-ALOR-121/140-PRI" -> "ENTVDEALOR121140PRI"
 *
 * @param {Object|string} input - Objeto de tambor o string con código descriptivo
 * @param {Array} [catalogs] - Catálogos si se pasa un objeto con IDs
 * @returns {string} Código compacto sin guiones, barras ni espacios en mayúsculas
 */
export function buildCompactCode(input, catalogs = []) {
  let descriptiveCode = '';
  if (typeof input === 'string') {
    descriptiveCode = input;
  } else if (input && typeof input === 'object') {
    if (catalogs && catalogs.length > 0) {
      descriptiveCode = buildDescriptiveCode(input, catalogs);
    } else if (input.codigo_compacto) {
      return cleanBarcodeSeparators(input.codigo_compacto);
    } else if (input.codigo_descriptivo) {
      descriptiveCode = input.codigo_descriptivo;
    } else {
      descriptiveCode = buildDescriptiveCode(input, catalogs);
    }
  }
  if (!descriptiveCode) return '';
  return cleanBarcodeSeparators(descriptiveCode);
}

/**
 * Obtiene el código base para generar el código de barras CODE 128.
 * Coincide con el código compacto según la planilla oficial del gerente.
 */
export function getCode128Base(drumData, catalogs = []) {
  if (drumData && typeof drumData === 'object' && drumData.codigo_compacto) {
    return drumData.codigo_compacto;
  }
  return buildCompactCode(drumData, catalogs);
}

/**
 * Pesos sugeridos / predeterminados oficiales por tipo de producto (kg por tambor)
 * según la especificación del gerente de Olivícola Luján:
 * - Entera: 180 kg
 * - Griega / Griegas: 180 kg
 * - Descarozada: 140 kg
 * - Rellenas: 160 kg
 * - Rodajas: 160 kg
 * - Rotas: 160 kg
 */
export const DEFAULT_PRODUCT_WEIGHTS = {
  ENT: 180,
  GRI: 180,
  DES: 140,
  RELL: 160,
  FET: 160,
  ROTA: 160,
};

const DEFAULT_PRODUCT_ID_WEIGHTS = {
  'cat-prod-1': 180, // Entera
  'cat-prod-2': 140, // Descarozada
  'cat-prod-3': 160, // Rodajas
  'cat-prod-4': 180, // Griegas
  'cat-prod-5': 160, // Rellenas
  'cat-prod-6': 160, // Rotas
};

/**
 * Obtiene el peso sugerido / predeterminado por tambor según el producto seleccionado.
 *
 * @param {string} productValue - ID de catálogo, código de producto o nombre
 * @param {Array} [catalogs] - Catálogos del sistema
 * @returns {number|null} Peso neto en kg sugerido o null
 */
export function getSuggestedWeightForProduct(productValue, catalogs = []) {
  if (!productValue) return null;

  let code = '';
  if (catalogs && catalogs.length > 0) {
    code = resolveCatalogCode(catalogs, productValue, 'producto');
  }
  if (!code) {
    code = String(productValue).trim().toUpperCase();
  }

  if (DEFAULT_PRODUCT_WEIGHTS[code] !== undefined) {
    return DEFAULT_PRODUCT_WEIGHTS[code];
  }

  if (DEFAULT_PRODUCT_ID_WEIGHTS[productValue] !== undefined) {
    return DEFAULT_PRODUCT_ID_WEIGHTS[productValue];
  }

  // Fallback por texto normalizado
  const norm = removeAccents(productValue);
  if (norm.includes('descaroz')) return 140;
  if (norm.includes('enter')) return 180;
  if (norm.includes('grieg')) return 180;
  if (norm.includes('rellen')) return 160;
  if (norm.includes('rodaj')) return 160;
  if (norm.includes('rota')) return 160;

  return null;
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

  // Helper para comparar catálogo por id o por código
  const matchesFilter = (itemValue, filterValue, tipo) => {
    if (!filterValue) return true;
    if (itemValue === filterValue) return true;
    const itemOption = (catalogs || []).find(
      (c) => c && (!tipo || c.tipo === tipo) && (c.id === itemValue || c.codigo === itemValue)
    );
    const filterOption = (catalogs || []).find(
      (c) => c && (!tipo || c.tipo === tipo) && (c.id === filterValue || c.codigo === filterValue)
    );
    if (itemOption && filterOption && itemOption.id === filterOption.id) return true;
    return false;
  };

  // Mapa de nombres legibles para optimizar búsqueda de texto
  const catNamesMap = new Map();
  for (const c of catalogs || []) {
    if (c?.id) {
      catNamesMap.set(c.id, removeAccents(c.nombre));
    }
    if (c?.codigo) {
      catNamesMap.set(c.codigo, removeAccents(c.nombre));
    }
  }

  return drums.filter((d) => {
    if (!d) return false;

    // Filtros exactos por catálogo
    if (filters.producto && !matchesFilter(d.producto, filters.producto, 'producto')) return false;
    if (filters.presentacion && !matchesFilter(d.presentacion, filters.presentacion, 'presentacion')) return false;
    if (filters.variedad && !matchesFilter(d.variedad, filters.variedad, 'variedad')) return false;
    if (filters.calibre && !matchesFilter(d.calibre, filters.calibre, 'calibre')) return false;
    if (filters.calidad && !matchesFilter(d.calidad, filters.calidad, 'calidad')) return false;
    if (filters.ubicacion && !matchesFilter(d.ubicacion, filters.ubicacion, 'ubicacion')) return false;
    if (filters.estado && !matchesFilter(d.estado, filters.estado, 'estado')) return false;
    if (filters.lote && removeAccents(d.lote) !== removeAccents(filters.lote)) return false;

    // Búsqueda por texto
    if (normQuery) {
      const cleanCompactQuery = cleanBarcodeSeparators(normQuery);
      const parsedQuery = extractDrumIdAndCode(normQuery, drums);
      const targetQueryId = parsedQuery.tamborId ? removeAccents(parsedQuery.tamborId) : '';

      const idMatch =
        removeAccents(d.tambor_id).includes(normQuery) ||
        (targetQueryId && removeAccents(d.tambor_id) === targetQueryId);
      const codeMatch =
        removeAccents(d.codigo).includes(normQuery) ||
        (cleanCompactQuery.length >= 3 && cleanBarcodeSeparators(d.codigo).includes(cleanCompactQuery));
      const descMatch =
        removeAccents(d.codigo_descriptivo).includes(normQuery) ||
        (cleanCompactQuery.length >= 3 && cleanBarcodeSeparators(d.codigo_descriptivo).includes(cleanCompactQuery));
      const compactMatch =
        removeAccents(d.codigo_compacto || '').includes(normQuery) ||
        (cleanCompactQuery.length >= 3 && cleanBarcodeSeparators(d.codigo_compacto || '').includes(cleanCompactQuery));
      const loteMatch = removeAccents(d.lote).includes(normQuery);
      const prodMatch = (catNamesMap.get(d.producto) || '').includes(normQuery);
      const varMatch = (catNamesMap.get(d.variedad) || '').includes(normQuery);
      const calMatch = (catNamesMap.get(d.calibre) || '').includes(normQuery);
      const presMatch = (catNamesMap.get(d.presentacion) || '').includes(normQuery);
      const qualMatch = (catNamesMap.get(d.calidad) || '').includes(normQuery);
      const ubiMatch = (catNamesMap.get(d.ubicacion) || '').includes(normQuery);
      const estMatch = (catNamesMap.get(d.estado) || '').includes(normQuery);

      if (
        !idMatch &&
        !codeMatch &&
        !descMatch &&
        !compactMatch &&
        !loteMatch &&
        !prodMatch &&
        !varMatch &&
        !calMatch &&
        !presMatch &&
        !qualMatch &&
        !ubiMatch &&
        !estMatch
      ) {
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

/**
 * Normaliza un código de sector o ubicación para comparación tolerante.
 * Elimina prefijos comunes como 'SEC-', 'SECTOR-', 'UBI-', 'UBICACION-',
 * guiones, barras, espacios y acentos.
 */
/**
 * Normaliza un código de sector o ubicación para comparación tolerante.
 * Elimina prefijos comunes como 'SEC-', 'SECTOR-', 'UBI-', 'UBICACION-',
 * guiones, barras, apóstrofes, espacios y acentos.
 */
export function normalizeSectorCode(str) {
  if (!str) return '';
  let clean = removeAccents(str).toUpperCase().trim();
  // Eliminar asteriscos, comillas y apóstrofes de simbologías o etiquetas físicas
  clean = clean.replace(/^['"`*]+|['"`*]+$/g, '').trim();
  clean = clean.replace(/^(SEC|SECTOR|UBI|UBICACION)[-_:\s'’`]*/i, '');
  return cleanBarcodeSeparators(clean);
}

/**
 * Determina si una cadena de texto o código escaneado corresponde a un sector de la planta.
 * Compara contra el catálogo oficial de ubicaciones (por código, id o nombre).
 *
 * @param {string} code - Código escaneado (ej: "NAV-A1", "NAV'A1", "SEC-NAV-A1", "cat-ubi-1")
 * @param {Array} catalogs - Catálogos del sistema
 * @returns {{ isSector: boolean, sector: Object | null, sectorCode: string }}
 */
export function isSectorCode(code, catalogs = []) {
  if (!code || typeof code !== 'string') {
    return { isSector: false, sector: null, sectorCode: '' };
  }

  const rawTrimmed = code.trim().replace(/^['"`*]+|['"`*]+$/g, '').trim();
  const upperTrimmed = rawTrimmed.toUpperCase();
  const normalizedInput = normalizeSectorCode(rawTrimmed);

  if (!normalizedInput) {
    return { isSector: false, sector: null, sectorCode: '' };
  }

  // Filtrar ubicaciones del catálogo
  const locations = (catalogs || []).filter((c) => c && c.tipo === 'ubicacion');

  for (const loc of locations) {
    if (!loc) continue;

    // 1. Coincidencia por ID técnico (ej: "cat-ubi-1")
    if (loc.id && loc.id.toUpperCase() === upperTrimmed) {
      return { isSector: true, sector: loc, sectorCode: loc.codigo || loc.id };
    }

    // 2. Coincidencia por código de sector (ej: "NAV-A1" o con apóstrofe "NAV'A1")
    if (loc.codigo) {
      const locCodeNorm = normalizeSectorCode(loc.codigo);
      if (
        loc.codigo.toUpperCase() === upperTrimmed ||
        locCodeNorm === normalizedInput ||
        upperTrimmed === `SEC-${loc.codigo.toUpperCase()}` ||
        upperTrimmed === `SECTOR-${loc.codigo.toUpperCase()}`
      ) {
        return { isSector: true, sector: loc, sectorCode: loc.codigo };
      }
    }

    // 3. Coincidencia por nombre exacto normalizado
    if (loc.nombre) {
      const locNameNorm = normalizeSectorCode(loc.nombre);
      if (locNameNorm === normalizedInput && normalizedInput.length >= 4) {
        return { isSector: true, sector: loc, sectorCode: loc.codigo || loc.id };
      }
    }
  }

  // 4. Si tiene prefijo explícito SEC- o SECTOR- pero no está en catálogo, reconocerlo como sector genérico
  if (/^(SEC|SECTOR)[-_:\s'’`]+/i.test(rawTrimmed)) {
    const extractedCode = rawTrimmed.replace(/^(SEC|SECTOR)[-_:\s'’`]*/i, '').trim().toUpperCase();
    return {
      isSector: true,
      sector: {
        id: `custom-sec-${extractedCode}`,
        codigo: extractedCode,
        nombre: `Sector ${extractedCode}`,
        tipo: 'ubicacion',
        activo: true,
      },
      sectorCode: extractedCode,
    };
  }

  return { isSector: false, sector: null, sectorCode: '' };
}

/**
 * Extrae el tambor_id y el código descriptivo/compacto de una lectura de escáner.
 * Soporta múltiples formatos de escaneo:
 * - Código con apóstrofes de teclado español: "FET'VDE'MF'201-240'SDA'T000005"
 * - Código completo estándar: "ENT-VDE-ALOR-121/140-PRI-T000001"
 * - ID único: "T000001" o "'T000001'"
 * - Compacto con ID: "ENTVDEALOR121140PRI-T000001" o "ENTVDEALOR121140PRIT000001"
 * - Código descriptivo solo: "ENT-VDE-ALOR-121/140-PRI" (no fabrica tambor_id arbitrario)
 *
 * @param {string} rawString - Lectura cruda del escáner
 * @param {Array} drums - Lista de tambores existentes para desambiguación/enriquecimiento
 * @returns {Object} { tamborId, descriptiveCode, compactCode, raw }
 */
export function extractDrumIdAndCode(rawString, drums = []) {
  if (!rawString || typeof rawString !== 'string') {
    return { tamborId: null, descriptiveCode: '', compactCode: '', raw: '' };
  }

  const raw = rawString.trim().replace(/^['"`*]+|['"`*]+$/g, '').trim();
  const upper = raw.toUpperCase();

  let tamborId = null;
  let descriptiveCode = '';

  // 1. Buscar patrón de tambor_id (T seguido de 4 a 8 dígitos, ej: T000001 o T000005)
  // Tolera delimitadores guion, barra, apóstrofe, comillas, guion bajo o espacio
  const idMatch =
    upper.match(/(?:^|[-_/'’`\s])(T\d{4,})(?:$|[-_/'’`\s])/i) ||
    upper.match(/(T\d{4,})/i);
  if (idMatch) {
    tamborId = idMatch[1].toUpperCase();
  }

  // 2. Extraer código descriptivo si el string tiene prefijo antes de tambor_id
  if (tamborId && upper.includes(tamborId)) {
    const idx = upper.indexOf(tamborId);
    let prefix = raw.slice(0, idx).replace(/[-_/\s'’`]+$/, '').trim();
    if (prefix) {
      descriptiveCode = normalizeScanInput(prefix);
    }
  }

  // 3. Si se reconoció tambor_id, buscar tambor exacto en BD para enriquecer su código oficial
  if (tamborId) {
    const drumById = (drums || []).find((d) => d && d.tambor_id?.toUpperCase() === tamborId);
    if (drumById?.codigo_descriptivo) {
      descriptiveCode = drumById.codigo_descriptivo;
    }
  } else {
    // 4. Si NO hay tambor_id explícito, verificar si coincide con ID único técnico (ej: "tb-001")
    const drumByExactId = (drums || []).find((d) => d && d.id && d.id.toUpperCase() === upper);
    if (drumByExactId) {
      tamborId = drumByExactId.tambor_id;
      descriptiveCode = drumByExactId.codigo_descriptivo || descriptiveCode;
    } else {
      // O si coincide con el código completo único (ej: ENT-VDE-ALOR-121/140-PRI-T000001)
      const cleanUpper = cleanBarcodeSeparators(upper);
      const drumByFullCode = (drums || []).find((d) => {
        if (!d) return false;
        if (d.codigo && d.codigo.toUpperCase() === upper) return true;
        if (d.codigo && cleanBarcodeSeparators(d.codigo) === cleanUpper) return true;
        return false;
      });
      if (drumByFullCode) {
        tamborId = drumByFullCode.tambor_id;
        descriptiveCode = drumByFullCode.codigo_descriptivo || descriptiveCode;
      }
    }
  }

  // 5. Si aún no hay código descriptivo pero el string contiene especificación
  if (!descriptiveCode) {
    const normRaw = normalizeScanInput(raw);
    if (normRaw.includes('-')) {
      descriptiveCode = normRaw;
    } else {
      const cleanUpper = cleanBarcodeSeparators(upper);
      const drumByCompact = (drums || []).find((d) => {
        if (!d) return false;
        if (d.codigo_compacto && d.codigo_compacto.toUpperCase() === upper) return true;
        if (d.codigo_compacto && cleanBarcodeSeparators(d.codigo_compacto) === cleanUpper) return true;
        return false;
      });
      if (drumByCompact?.codigo_descriptivo) {
        descriptiveCode = drumByCompact.codigo_descriptivo;
      } else {
        descriptiveCode = normRaw;
      }
    }
  }

  const compactCode = descriptiveCode ? buildCompactCode(descriptiveCode) : '';

  return {
    tamborId,
    descriptiveCode,
    compactCode,
    raw,
  };
}

/**
 * Resuelve una lectura o consulta de escaneo contra el inventario y catálogos.
 * Maneja formatos estándar, lecturas con apóstrofes del teclado español (ej: FET'VDE'MF'201-240'SDA'T000005),
 * códigos compactos, IDs directos, sectores y registros dados de baja.
 *
 * @param {string} query - Cadena leída del escáner o tipeada por el usuario
 * @param {Object} context - { tambores, catalogos, historial }
 * @returns {Object} { type: 'drum'|'multiple'|'sector'|'deleted'|'unknown', drum, drums, sector, sectorCode, deletedTamborId, parsed }
 */
export function matchDrumByScan(query, { tambores = [], catalogos = [], historial = [] } = {}) {
  if (!query || typeof query !== 'string') {
    return {
      type: 'unknown',
      drum: null,
      drums: [],
      sector: null,
      sectorCode: '',
      deletedTamborId: null,
      parsed: { tamborId: null, descriptiveCode: '', compactCode: '', raw: '' },
    };
  }

  const rawTrimmed = query.trim().replace(/^['"`*]+|['"`*]+$/g, '').trim();
  if (!rawTrimmed) {
    return {
      type: 'unknown',
      drum: null,
      drums: [],
      sector: null,
      sectorCode: '',
      deletedTamborId: null,
      parsed: { tamborId: null, descriptiveCode: '', compactCode: '', raw: '' },
    };
  }

  const upper = rawTrimmed.toUpperCase();
  const cleanQuery = cleanBarcodeSeparators(rawTrimmed);
  const parsed = extractDrumIdAndCode(rawTrimmed, tambores);
  const targetTamborId = parsed.tamborId;

  // 1. Coincidencia exacta única por identificador de tambor o código completo
  const exactUnique = (tambores || []).find((t) => {
    if (!t) return false;

    // Coincidencia directa por tambor_id extraído (ej: T000005)
    if (targetTamborId && t.tambor_id?.toUpperCase() === targetTamborId) {
      return true;
    }

    const tIdUpper = t.tambor_id?.toUpperCase();
    const tCodeUpper = t.codigo?.toUpperCase();
    const tTechnicalId = t.id?.toUpperCase();

    if (tIdUpper === upper || tCodeUpper === upper || tTechnicalId === upper) {
      return true;
    }

    // Comparación por código compacto con ID
    if (t.codigo_compacto) {
      const compWithId = `${t.codigo_compacto}${t.tambor_id || ''}`.toUpperCase();
      const compWithDashId = `${t.codigo_compacto}-${t.tambor_id || ''}`.toUpperCase();
      if (compWithId === upper || compWithDashId === upper) return true;
    }

    // Comparación limpia sin delimitadores
    if (cleanQuery && cleanQuery.length >= 4) {
      const cleanCode = cleanBarcodeSeparators(t.codigo);
      if (cleanCode && cleanCode === cleanQuery) return true;

      const cleanFull = cleanBarcodeSeparators(`${t.codigo_compacto || ''}${t.tambor_id || ''}`);
      if (cleanFull && cleanFull === cleanQuery) return true;
    }

    return false;
  });

  if (exactUnique) {
    return {
      type: 'drum',
      drum: exactUnique,
      drums: [exactUnique],
      sector: null,
      sectorCode: '',
      deletedTamborId: null,
      parsed,
    };
  }

  // 2. Coincidencia por código de producto (descriptivo o compacto, sin tambor_id)
  const matches = (tambores || []).filter((t) => {
    if (!t) return false;

    if (t.codigo_compacto?.toUpperCase() === upper || t.codigo_descriptivo?.toUpperCase() === upper) {
      return true;
    }

    if (cleanQuery && cleanQuery.length >= 3) {
      const cleanCompact = cleanBarcodeSeparators(t.codigo_compacto);
      const cleanDesc = cleanBarcodeSeparators(t.codigo_descriptivo);
      if (cleanCompact === cleanQuery || cleanDesc === cleanQuery) return true;
    }

    return false;
  });

  if (matches.length === 1) {
    return {
      type: 'drum',
      drum: matches[0],
      drums: matches,
      sector: null,
      sectorCode: '',
      deletedTamborId: null,
      parsed,
    };
  }

  if (matches.length > 1) {
    return {
      type: 'multiple',
      drum: null,
      drums: matches,
      sector: null,
      sectorCode: '',
      deletedTamborId: null,
      parsed,
    };
  }

  // 3. Verificar si corresponde a un Sector de planta
  const sectorCheck = isSectorCode(rawTrimmed, catalogos);
  if (sectorCheck.isSector) {
    return {
      type: 'sector',
      drum: null,
      drums: [],
      sector: sectorCheck.sector,
      sectorCode: sectorCheck.sectorCode,
      deletedTamborId: null,
      parsed,
    };
  }

  // 4. Verificar si es un tambor dado de baja (en historial de auditoría)
  const deletedEvent = (historial || []).find((h) => {
    if (!h) return false;
    if (targetTamborId && h.tambor_id?.toUpperCase() === targetTamborId) return true;
    if (h.tambor_id?.toUpperCase() === upper) return true;
    return false;
  });

  if (deletedEvent) {
    const id = targetTamborId || deletedEvent.tambor_id;
    return {
      type: 'deleted',
      drum: null,
      drums: [],
      sector: null,
      sectorCode: '',
      deletedTamborId: id,
      parsed,
    };
  }

  return {
    type: 'unknown',
    drum: null,
    drums: [],
    sector: null,
    sectorCode: '',
    deletedTamborId: null,
    parsed,
  };
}

/**
 * Parsea el flujo de lectura de inventario generado por un escáner con memoria interna,
 * volcado tabular (TSV/CSV) o pistola USB en vivo.
 * Reconoce el sector activo y asocia los tambores subsiguientes a ese sector.
 * Realiza:
 * 1. Detección y cambio de sector en base a códigos de sector (ej: NAV-A1).
 * 2. Control estricto de duplicados mediante ID único (T000001) omitiendo re-escaneos.
 * 3. Agrupación y conteo por código alfanumérico descriptivo (ej: "11 tambores de ENT-VDE-ALOR-121/140-PRI").
 * 4. Detección de discrepancias:
 *    - Tambores reubicados (su ubicación en BD es distinta al sector donde fueron escaneados).
 *    - Tambores faltantes (estaban registrados en el sector en BD pero no fueron escaneados).
 *    - Tambores no registrados (escaneados pero inexistentes en BD).
 *
 * @param {string|Array<string>} rawInput - Texto con saltos de línea/delimitadores o array de strings
 * @param {Object} options - { catalogos: Array, tambores: Array }
 * @returns {Object} Resultado estructurado de la toma de inventario
 */
export function parseInventoryScanStream(rawInput, { catalogos = [], tambores = [] } = {}) {
  // Convertir entrada a array de líneas limpias
  let rawLines = [];
  if (Array.isArray(rawInput)) {
    rawLines = rawInput.map((l) => (l != null ? String(l).trim() : '')).filter(Boolean);
  } else if (typeof rawInput === 'string') {
    rawLines = rawInput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  }

  // Detector de columnas secundarias que son metadatos y no códigos de barras
  const isMetadataToken = (token) => {
    if (!token) return true;
    const t = token.trim();
    const clean = removeAccents(t);
    if (/^(n[°o]|num|numero|item|id|index|codigo|cod|barcode|sector|ubicacion|fecha|date|hora|time|timestamp|scan)$/i.test(clean)) return true;
    if (/^\d{1,4}$/.test(t)) return true; // Números de fila (1, 2, 3...)
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(t) || /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(t)) return true; // Fechas
    if (/^\d{1,2}:\d{2}(:\d{2})?(\s*(am|pm))?$/i.test(t)) return true; // Horas
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}[ T]\d{1,2}:\d{2}/.test(t)) return true; // Timestamp completo
    if (/^[|\-=_*#]+$/.test(t)) return true; // Decoradores
    return false;
  };

  const lines = [];
  for (const line of rawLines) {
    if (line.startsWith('//') || line.startsWith('#')) continue;

    if (line.includes('\t') || line.includes('|')) {
      const parts = line.split(/[\t|]+/).map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (!isMetadataToken(part)) {
          lines.push(part);
        }
      }
    } else if (line.includes(',') || line.includes(';')) {
      const parts = line.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (!isMetadataToken(part)) {
          lines.push(part);
        }
      }
    } else {
      if (!isMetadataToken(line)) {
        lines.push(line);
      }
    }
  }

  const seenDrumIds = new Set();
  const duplicateScans = [];
  const relocations = [];
  const unregistered = [];
  const scannedValidDrums = [];

  // Mapa ordenado de sectores
  const sectorsMap = new Map();

  const getOrCreateSectorEntry = (sectorObj) => {
    const secId = sectorObj?.id || 'unassigned';
    if (!sectorsMap.has(secId)) {
      sectorsMap.set(secId, {
        sector: sectorObj || {
          id: 'unassigned',
          codigo: 'SIN_SECTOR',
          nombre: 'Sin Sector Asignado',
          tipo: 'ubicacion',
        },
        drums: [],
        duplicates: [],
        groups: new Map(), // descriptiveCode -> { count, drums, totalKg }
        missingDrums: [],
        relocations: [],
      });
    }
    return sectorsMap.get(secId);
  };

  let currentSector = null;

  for (const line of lines) {
    // 1. ¿Es código de sector?
    const sectorDetection = isSectorCode(line, catalogos);
    if (sectorDetection.isSector) {
      currentSector = sectorDetection.sector;
      getOrCreateSectorEntry(currentSector);
      continue;
    }

    // 2. Es lectura de tambor
    const targetSector = currentSector || {
      id: 'unassigned',
      codigo: 'SIN_SECTOR',
      nombre: 'Sin Sector Asignado',
      tipo: 'ubicacion',
    };
    const sectorEntry = getOrCreateSectorEntry(targetSector);

    const parsed = extractDrumIdAndCode(line, tambores);

    // Si tiene tambor_id, verificar unicidad
    if (parsed.tamborId) {
      if (seenDrumIds.has(parsed.tamborId)) {
        const dupItem = {
          tamborId: parsed.tamborId,
          raw: line,
          sector: targetSector,
          descriptiveCode: parsed.descriptiveCode,
        };
        duplicateScans.push(dupItem);
        sectorEntry.duplicates.push(dupItem);
        continue; // Omitir duplicado para no contabilizar dos veces
      }
      seenDrumIds.add(parsed.tamborId);
    }

    // Buscar en BD
    const cleanLine = cleanBarcodeSeparators(line);
    const dbDrum = tambores.find(
      (d) =>
        (parsed.tamborId && d.tambor_id?.toUpperCase() === parsed.tamborId.toUpperCase()) ||
        d.codigo?.toUpperCase() === line.toUpperCase() ||
        d.id === line ||
        (cleanLine && cleanBarcodeSeparators(d.codigo) === cleanLine)
    );

    let weight = 0;
    let descCode = parsed.descriptiveCode;

    if (dbDrum) {
      weight = Number(dbDrum.peso) || 0;
      if (!descCode) descCode = dbDrum.codigo_descriptivo;

      // Verificar si cambió de sector
      if (targetSector.id !== 'unassigned' && dbDrum.ubicacion !== targetSector.id) {
        const relocationItem = {
          drumId: dbDrum.id,
          tambor_id: dbDrum.tambor_id,
          codigo: dbDrum.codigo,
          codigo_descriptivo: dbDrum.codigo_descriptivo,
          peso: dbDrum.peso,
          lote: dbDrum.lote,
          oldSectorId: dbDrum.ubicacion,
          oldSectorName: resolveCatalogName(catalogos, dbDrum.ubicacion, 'ubicacion'),
          newSectorId: targetSector.id,
          newSectorName: targetSector.nombre || targetSector.codigo,
        };
        relocations.push(relocationItem);
        sectorEntry.relocations.push(relocationItem);
      }
    } else {
      // Sugerir peso predeterminado del producto si no está en BD
      const prodCode = (descCode || line).split('-')[0];
      weight = getSuggestedWeightForProduct(prodCode, catalogos) || 0;

      if (parsed.tamborId) {
        unregistered.push({
          tamborId: parsed.tamborId,
          raw: line,
          sector: targetSector,
        });
      }
    }

    if (!descCode) {
      descCode = line;
    }

    const drumEntry = {
      raw: line,
      tambor_id: parsed.tamborId || (dbDrum ? dbDrum.tambor_id : null),
      codigo_descriptivo: descCode,
      peso: weight,
      dbDrum: dbDrum || null,
      isRelocated: Boolean(dbDrum && targetSector.id !== 'unassigned' && dbDrum.ubicacion !== targetSector.id),
      isUnregistered: Boolean(!dbDrum && parsed.tamborId),
      sectorId: targetSector.id,
      sectorCode: targetSector.codigo,
      sectorName: targetSector.nombre,
    };

    sectorEntry.drums.push(drumEntry);
    scannedValidDrums.push(drumEntry);

    // Agrupación por código alfanumérico dentro del sector
    const groupKey = descCode || 'SIN_CODIGO';
    if (!sectorEntry.groups.has(groupKey)) {
      sectorEntry.groups.set(groupKey, {
        codigo_descriptivo: groupKey,
        count: 0,
        totalKg: 0,
        drumIds: [],
        drums: [],
      });
    }
    const group = sectorEntry.groups.get(groupKey);
    group.count += 1;
    group.totalKg += weight;
    if (drumEntry.tambor_id) {
      group.drumIds.push(drumEntry.tambor_id);
    }
    group.drums.push(drumEntry);
  }

  // Detectar tambores faltantes en cada sector auditado
  let totalMissing = 0;
  for (const [secId, entry] of sectorsMap.entries()) {
    if (secId === 'unassigned') continue;

    // Tambores que según la BD deberían estar en este sector
    const expectedInSector = tambores.filter((d) => d.ubicacion === secId);
    entry.missingDrums = expectedInSector.filter((d) => !seenDrumIds.has(d.tambor_id));
    totalMissing += entry.missingDrums.length;
  }

  // Convertir mapas de grupos a arrays limpios
  const processedSectors = Array.from(sectorsMap.values()).map((s) => ({
    sector: s.sector,
    totalDrums: s.drums.length,
    totalKg: Math.round(s.drums.reduce((acc, d) => acc + (d.peso || 0), 0) * 100) / 100,
    groups: Array.from(s.groups.values()).map((g) => ({
      ...g,
      totalKg: Math.round(g.totalKg * 100) / 100,
    })),
    duplicatesCount: s.duplicates.length,
    duplicates: s.duplicates,
    relocationsCount: s.relocations.length,
    relocations: s.relocations,
    missingCount: s.missingDrums.length,
    missingDrums: s.missingDrums,
    drums: s.drums,
  }));

  const totalKgAll = scannedValidDrums.reduce((acc, d) => acc + (d.peso || 0), 0);

  return {
    totalScannedCount: lines.length,
    validDrumsCount: scannedValidDrums.length,
    duplicatesCount: duplicateScans.length,
    duplicateScans,
    relocationsCount: relocations.length,
    relocations,
    missingCount: totalMissing,
    unregisteredCount: unregistered.length,
    unregistered,
    totalKg: Math.round(totalKgAll * 100) / 100,
    sectorsCount: processedSectors.filter((s) => s.sector.id !== 'unassigned').length,
    sectors: processedSectors,
  };
}
