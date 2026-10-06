import { describe, it, expect } from 'vitest';
import {
  nextTamborId,
  buildDescriptiveCode,
  buildCompactCode,
  getCode128Base,
  buildFullCode,
  normalizeDrumInput,
  validateDrum,
  diffDrumFields,
  searchDrums,
  calculateInventoryTotals,
  isValidDateString,
  getSuggestedWeightForProduct,
  DEFAULT_PRODUCT_WEIGHTS,
  isSectorCode,
  extractDrumIdAndCode,
  parseInventoryScanStream,
  cleanBarcodeSeparators,
  normalizeScanInput,
  matchDrumByScan,
} from '../src/lib/domain.js';

const mockCatalogs = [
  // Productos oficiales
  { id: 'prod-1', tipo: 'producto', nombre: 'Entera', codigo: 'ENT', activo: true, orden: 1 },
  { id: 'prod-2', tipo: 'producto', nombre: 'Descarozada', codigo: 'DES', activo: true, orden: 2 },
  { id: 'prod-3', tipo: 'producto', nombre: 'Rodajas', codigo: 'FET', activo: true, orden: 3 },
  { id: 'prod-4', tipo: 'producto', nombre: 'Griegas', codigo: 'GRI', activo: true, orden: 4 },
  { id: 'prod-5', tipo: 'producto', nombre: 'Rellenas', codigo: 'RELL', activo: true, orden: 5 },
  { id: 'prod-6', tipo: 'producto', nombre: 'Rotas', codigo: 'ROTA', activo: true, orden: 6 },

  // Presentaciones oficiales
  { id: 'pres-1', tipo: 'presentacion', nombre: 'Verde', codigo: 'VDE', activo: true, orden: 1 },
  { id: 'pres-2', tipo: 'presentacion', nombre: 'Negra', codigo: 'NN', activo: true, orden: 2 },
  { id: 'pres-6', tipo: 'presentacion', nombre: 'Para Griega', codigo: 'P/GR', activo: true, orden: 6 },
  { id: 'pres-7', tipo: 'presentacion', nombre: 'Sin Carozo', codigo: 'S/C', activo: true, orden: 7 },
  { id: 'pres-8', tipo: 'presentacion', nombre: 'Con Pasta', codigo: 'C/P', activo: true, orden: 8 },

  // Variedades oficiales
  { id: 'var-1', tipo: 'variedad', nombre: 'Aloreña', codigo: 'ALOR', activo: true, orden: 1 },
  { id: 'var-2', tipo: 'variedad', nombre: 'Arauco', codigo: 'ARA', activo: true, orden: 2 },
  { id: 'var-3', tipo: 'variedad', nombre: 'Manzanilla Fina', codigo: 'MF', activo: true, orden: 3 },
  { id: 'var-4', tipo: 'variedad', nombre: 'Picual', codigo: 'PIC', activo: true, orden: 4 },
  { id: 'var-5', tipo: 'variedad', nombre: 'Empeltre', codigo: 'EMP', activo: true, orden: 5 },

  // Calibres oficiales
  { id: 'cal-1', tipo: 'calibre', nombre: '121/140', codigo: '121/140', activo: true, orden: 1 },
  { id: 'cal-5', tipo: 'calibre', nombre: '161/200', codigo: '161/200', activo: true, orden: 5 },
  { id: 'cal-11', tipo: 'calibre', nombre: 'Sin Calibre', codigo: 'SIN CAL', activo: true, orden: 11 },

  // Calidades oficiales
  { id: 'qual-1', tipo: 'calidad', nombre: 'Primera', codigo: 'PRI', activo: true, orden: 1 },
  { id: 'qual-2', tipo: 'calidad', nombre: 'Segunda', codigo: 'SDA', activo: true, orden: 2 },
  { id: 'qual-3', tipo: 'calidad', nombre: 'Tercera', codigo: 'TRA', activo: true, orden: 3 },

  // Ubicaciones y Estados
  { id: 'ubi-1', tipo: 'ubicacion', nombre: 'Nave A - Fila 3', codigo: 'NAV-A3', activo: true, orden: 1 },
  { id: 'ubi-inactiva', tipo: 'ubicacion', nombre: 'Depósito Viejo', codigo: 'DEP-V', activo: false, orden: 99 },
  { id: 'est-1', tipo: 'estado', nombre: 'En fermentación', codigo: 'FERM', activo: true, orden: 1 },
  { id: 'mov-1', tipo: 'tipo_movimiento', nombre: 'Traslado interno', codigo: 'TRAS', activo: true, orden: 1 },
];

describe('Reglas de Dominio - OLIVÍCOLA LUJÁN', () => {
  // Test 1: No reutilizar ID de un tambor eliminado si permanece en historial
  it('1. No debe reutilizar el ID de un tambor eliminado si permanece en el historial', () => {
    const tambores = [
      { tambor_id: 'T000001' },
      { tambor_id: 'T000002' },
    ];
    const historial = [
      { tambor_id: 'T000001', tipo: 'Creación' },
      { tambor_id: 'T000002', tipo: 'Creación' },
      { tambor_id: 'T000003', tipo: 'Eliminación', descripcion: 'Tambor eliminado' },
    ];

    const nextId = nextTamborId(tambores, historial);
    expect(nextId).toBe('T000004');
  });

  // Test 2: Primer ID y crecimiento a siete dígitos
  it('2. Asigna T000001 como primer ID y maneja el crecimiento a siete dígitos', () => {
    expect(nextTamborId([], [])).toBe('T000001');

    const tambores = [{ tambor_id: 'T999999' }];
    expect(nextTamborId(tambores, [])).toBe('T1000000');

    const tambores7 = [{ tambor_id: 'T1000005' }];
    expect(nextTamborId(tambores7, [])).toBe('T1000006');
  });

  // Test 3: Código construido desde catálogos, código compacto y CODE 128
  it('3. Construye el código descriptivo, compacto y completo según la planilla oficial del gerente', () => {
    // Ejemplo exacto del Excel: ENTERA (ENT), VERDE (VDE), ALOREÑA (ALOR), 121/140, PRIMERA (PRI)
    const drumData = {
      producto: 'prod-1',
      presentacion: 'pres-1',
      variedad: 'var-1',
      calibre: 'cal-1',
      calidad: 'qual-1',
    };

    const descCode = buildDescriptiveCode(drumData, mockCatalogs);
    expect(descCode).toBe('ENT-VDE-ALOR-121/140-PRI');

    // Código compacto (sin guiones ni barra del calibre): ENTVDEALOR121140PRI
    const compactCode = buildCompactCode(descCode);
    expect(compactCode).toBe('ENTVDEALOR121140PRI');

    // Código base CODE 128
    const code128 = getCode128Base(drumData, mockCatalogs);
    expect(code128).toBe('ENTVDEALOR121140PRI');

    // Código completo con tambor_id
    const fullCode = buildFullCode(descCode, 'T000001');
    expect(fullCode).toBe('ENT-VDE-ALOR-121/140-PRI-T000001');
  });

  // Test 3b: Código compacto maneja calibres con espacio (SIN CAL) y presentaciones con barra (P/GR, S/C, C/P)
  it('3b. Genera código compacto sin espacios, barras ni guiones para casos especiales', () => {
    // Griega para griega sin calibre
    const descGriega = 'GRI-P/GR-ARA-SIN CAL-PRI';
    expect(buildCompactCode(descGriega)).toBe('GRIPGRARASINCALPRI');

    // Descarozada sin carozo
    const descDescarozada = 'DES-S/C-EMP-161/180-TRA';
    expect(buildCompactCode(descDescarozada)).toBe('DESSCEMP161180TRA');

    // Rellenas con pasta
    const descRellenas = 'RELL-C/P-MF-141/160-PRI';
    expect(buildCompactCode(descRellenas)).toBe('RELLCPMF141160PRI');
  });

  // Test 3c: Pesos sugeridos/predeterminados oficiales por tipo de producto
  it('3c. Obtiene los pesos sugeridos/predeterminados oficiales por tipo de producto', () => {
    // Descarozada: 140 kg
    expect(getSuggestedWeightForProduct('DES')).toBe(140);
    expect(getSuggestedWeightForProduct('prod-2', mockCatalogs)).toBe(140);
    expect(getSuggestedWeightForProduct('Descarozada')).toBe(140);

    // Entera: 180 kg
    expect(getSuggestedWeightForProduct('ENT')).toBe(180);
    expect(getSuggestedWeightForProduct('prod-1', mockCatalogs)).toBe(180);
    expect(getSuggestedWeightForProduct('Entera')).toBe(180);

    // Griega / Griegas: 180 kg
    expect(getSuggestedWeightForProduct('GRI')).toBe(180);
    expect(getSuggestedWeightForProduct('prod-4', mockCatalogs)).toBe(180);
    expect(getSuggestedWeightForProduct('Griegas')).toBe(180);

    // Rellenas: 160 kg
    expect(getSuggestedWeightForProduct('RELL')).toBe(160);
    expect(getSuggestedWeightForProduct('prod-5', mockCatalogs)).toBe(160);
    expect(getSuggestedWeightForProduct('Rellenas')).toBe(160);

    // Rodajas: 160 kg
    expect(getSuggestedWeightForProduct('FET')).toBe(160);
    expect(getSuggestedWeightForProduct('prod-3', mockCatalogs)).toBe(160);
    expect(getSuggestedWeightForProduct('Rodajas')).toBe(160);

    // Rotas: 160 kg
    expect(getSuggestedWeightForProduct('ROTA')).toBe(160);
    expect(getSuggestedWeightForProduct('prod-6', mockCatalogs)).toBe(160);
    expect(getSuggestedWeightForProduct('Rotas')).toBe(160);

    // Constante exportada
    expect(DEFAULT_PRODUCT_WEIGHTS.ENT).toBe(180);
    expect(DEFAULT_PRODUCT_WEIGHTS.DES).toBe(140);
    expect(DEFAULT_PRODUCT_WEIGHTS.FET).toBe(160);
    expect(DEFAULT_PRODUCT_WEIGHTS.GRI).toBe(180);
    expect(DEFAULT_PRODUCT_WEIGHTS.RELL).toBe(160);
    expect(DEFAULT_PRODUCT_WEIGHTS.ROTA).toBe(160);
  });

  // Test 4: Normalización de lote y peso
  it('4. Normaliza lote (recortando espacios) y peso (casteo a número)', () => {
    const raw = {
      lote: '  LOT-2026-X  ',
      peso: ' 210,5 ',
      fecha_ingreso: ' 2026-09-24 ',
    };

    const normalized = normalizeDrumInput(raw);
    expect(normalized.lote).toBe('LOT-2026-X');
    expect(normalized.peso).toBe(210.5);
    expect(normalized.fecha_ingreso).toBe('2026-09-24');
  });

  // Test 5: Rechazo de pesos inválidos y elaboración posterior al ingreso
  it('5. Rechaza pesos inválidos (<= 0 o no numéricos) y fecha de elaboración posterior al ingreso', () => {
    const baseDrum = {
      producto: 'prod-1',
      presentacion: 'pres-1',
      variedad: 'var-1',
      calibre: 'cal-1',
      calidad: 'qual-1',
      ubicacion: 'ubi-1',
      estado: 'est-1',
      lote: 'LOT-01',
      fecha_ingreso: '2026-09-20',
      peso: 180,
    };

    // Peso negativo
    const resNegative = validateDrum({ ...baseDrum, peso: -10 }, mockCatalogs);
    expect(resNegative.valid).toBe(false);
    expect(resNegative.errors.peso).toBeDefined();

    // Peso cero
    const resZero = validateDrum({ ...baseDrum, peso: 0 }, mockCatalogs);
    expect(resZero.valid).toBe(false);
    expect(resZero.errors.peso).toBeDefined();

    // Elaboración posterior a ingreso
    const resDates = validateDrum(
      {
        ...baseDrum,
        fecha_ingreso: '2026-09-20',
        fecha_elaboracion: '2026-09-25', // Posterior
      },
      mockCatalogs
    );
    expect(resDates.valid).toBe(false);
    expect(resDates.errors.fecha_elaboracion).toContain('no puede ser posterior');

    // Elaboración igual o anterior a ingreso (válido)
    const resDatesOk = validateDrum(
      {
        ...baseDrum,
        fecha_ingreso: '2026-09-20',
        fecha_elaboracion: '2026-09-18',
      },
      mockCatalogs
    );
    expect(resDatesOk.valid).toBe(true);
  });

  // Test 6: Conservación de opciones inactivas en edición y rechazo en alta
  it('6. Rechaza opciones inactivas en alta, pero permite conservarlas al editar si ya estaban asignadas', () => {
    const drumWithInactive = {
      producto: 'prod-1',
      presentacion: 'pres-1',
      variedad: 'var-1',
      calibre: 'cal-1',
      calidad: 'qual-1',
      ubicacion: 'ubi-inactiva', // Inactiva
      estado: 'est-1',
      lote: 'LOT-99',
      fecha_ingreso: '2026-09-20',
      peso: 180,
    };

    // En ALTA (isEdit: false): DEBE RECHAZAR
    const resAlta = validateDrum(drumWithInactive, mockCatalogs, { isEdit: false });
    expect(resAlta.valid).toBe(false);
    expect(resAlta.errors.ubicacion).toContain('inactiva');

    // En EDICIÓN donde ya tenía esa ubicación asignada: DEBE ACEPTAR
    const currentDrum = { id: 'd-1', ubicacion: 'ubi-inactiva' };
    const resEdicion = validateDrum(drumWithInactive, mockCatalogs, { isEdit: true, currentDrum });
    expect(resEdicion.valid).toBe(true);

    // En EDICIÓN donde NO tenía esa opción asignada previamente: DEBE RECHAZAR
    const currentDrumDiff = { id: 'd-1', ubicacion: 'ubi-1' };
    const resEdicionRechaza = validateDrum(drumWithInactive, mockCatalogs, { isEdit: true, currentDrum: currentDrumDiff });
    expect(resEdicionRechaza.valid).toBe(false);
    expect(resEdicionRechaza.errors.ubicacion).toContain('inactiva');
  });

  // Test 7: Valores anteriores/nuevos por campo modificado
  it('7. Genera eventos de diferencia con valor_anterior y valor_nuevo por cada campo modificado', () => {
    const oldDrum = {
      producto: 'prod-1',
      presentacion: 'pres-1',
      variedad: 'var-1',
      calibre: 'cal-1',
      calidad: 'qual-1',
      lote: 'LOTE-A',
      peso: 180,
      ubicacion: 'ubi-1',
      estado: 'est-1',
    };

    const newDrum = {
      ...oldDrum,
      lote: 'LOTE-B',
      peso: 185.5,
      observaciones: 'Nueva nota de cata',
    };

    const diffs = diffDrumFields(oldDrum, newDrum, mockCatalogs);
    expect(diffs).toHaveLength(3);

    const loteDiff = diffs.find((d) => d.campo === 'lote');
    expect(loteDiff).toBeDefined();
    expect(loteDiff.valor_anterior).toBe('LOTE-A');
    expect(loteDiff.valor_nuevo).toBe('LOTE-B');

    const pesoDiff = diffs.find((d) => d.campo === 'peso');
    expect(pesoDiff).toBeDefined();
    expect(pesoDiff.valor_anterior).toBe('180');
    expect(pesoDiff.valor_nuevo).toBe('185.5');

    const obsDiff = diffs.find((d) => d.campo === 'observaciones');
    expect(obsDiff).toBeDefined();
    expect(obsDiff.valor_nuevo).toBe('Nueva nota de cata');
  });

  // Test 8: Búsqueda sin acentos, mayúsculas y soporte de código compacto
  it('8. Búsqueda insensible a acentos y mayúsculas, combinada con filtros y código compacto', () => {
    const drums = [
      {
        id: '1',
        tambor_id: 'T000001',
        codigo: 'ENT-VDE-ALOR-121/140-PRI-T000001',
        codigo_descriptivo: 'ENT-VDE-ALOR-121/140-PRI',
        codigo_compacto: 'ENTVDEALOR121140PRI',
        producto: 'prod-1',
        variedad: 'var-1',
        calibre: 'cal-1',
        lote: 'LOTE-CÓRDOBA',
        peso: 180,
        ubicacion: 'ubi-1',
      },
      {
        id: '2',
        tambor_id: 'T000002',
        codigo: 'ENT-VDE-ARA-121/140-PRI-T000002',
        codigo_descriptivo: 'ENT-VDE-ARA-121/140-PRI',
        codigo_compacto: 'ENTVDEARA121140PRI',
        producto: 'prod-1',
        variedad: 'var-2',
        calibre: 'cal-1',
        lote: 'LOTE-MENDOZA',
        peso: 180,
        ubicacion: 'ubi-1',
      },
    ];

    // Búsqueda sin acento: 'cordoba' debe encontrar 'LOTE-CÓRDOBA'
    const foundCordoba = searchDrums(drums, 'cordoba', {}, mockCatalogs);
    expect(foundCordoba).toHaveLength(1);
    expect(foundCordoba[0].tambor_id).toBe('T000001');

    // Búsqueda por número: 'T000002'
    const foundId = searchDrums(drums, 't000002', {}, mockCatalogs);
    expect(foundId).toHaveLength(1);
    expect(foundId[0].tambor_id).toBe('T000002');

    // Búsqueda por código compacto (CODE 128)
    const foundCompact = searchDrums(drums, 'entvdealor121140pri', {}, mockCatalogs);
    expect(foundCompact).toHaveLength(1);
    expect(foundCompact[0].tambor_id).toBe('T000001');

    // Combinación de búsqueda + filtro
    const foundFiltered = searchDrums(drums, 't000001', { variedad: 'var-1' }, mockCatalogs);
    expect(foundFiltered).toHaveLength(1);

    const foundExcluded = searchDrums(drums, 't000001', { variedad: 'var-2' }, mockCatalogs);
    expect(foundExcluded).toHaveLength(0);
  });

  // Test 9: Validación estricta de fechas de calendario
  it('9. Rechaza fechas de calendario imposibles como 2026-02-30', () => {
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-09-25')).toBe(true);
  });

  // Test 10: Cálculo de totales de inventario
  it('10. Calcula los totales de inventario con precisión (kilos netos y ubicaciones)', () => {
    const drums = [
      { peso: 180.25, ubicacion: 'ubi-1' },
      { peso: 179.75, ubicacion: 'ubi-1' },
      { peso: 140, ubicacion: 'ubi-2' },
    ];
    const totals = calculateInventoryTotals(drums);
    expect(totals.totalDrums).toBe(3);
    expect(totals.totalKg).toBe(500);
    expect(totals.totalLocations).toBe(2);
  });

  // Test 11: Búsqueda por calidad, estado y compatibilidad de filtros con códigos de catálogo
  it('11. Busca por términos de calidad/estado y filtra por ID o código de catálogo', () => {
    const drums = [
      {
        id: '1',
        tambor_id: 'T000001',
        codigo: 'ENT-VDE-ALOR-121/140-PRI-T000001',
        producto: 'prod-1',
        variedad: 'var-1',
        calibre: 'cal-1',
        calidad: 'qual-1', // Primera
        estado: 'est-1', // En fermentación
        lote: 'L-01',
        peso: 180,
        ubicacion: 'ubi-1',
      },
    ];

    // Búsqueda por calidad "primera"
    const foundQual = searchDrums(drums, 'primera', {}, mockCatalogs);
    expect(foundQual).toHaveLength(1);

    // Búsqueda por estado "fermentacion" (sin acento)
    const foundEst = searchDrums(drums, 'fermentacion', {}, mockCatalogs);
    expect(foundEst).toHaveLength(1);

    // Filtro por código en vez de id
    const foundByCode = searchDrums(drums, '', { variedad: 'ALOR' }, mockCatalogs);
    expect(foundByCode).toHaveLength(1);
  });

  // Test 12: Robustez de buildCompactCode ante diferentes estructuras de entrada
  it('12. buildCompactCode resuelve correctamente desde strings, objetos con codigo_descriptivo o codigo_compacto', () => {
    // Desde string
    expect(buildCompactCode('ENT-VDE-ALOR-121/140-PRI')).toBe('ENTVDEALOR121140PRI');

    // Desde objeto con codigo_compacto existente (sin pasar catálogos)
    expect(buildCompactCode({ codigo_compacto: 'ENTVDEALOR121140PRI' })).toBe('ENTVDEALOR121140PRI');

    // Desde objeto con codigo_descriptivo (sin pasar catálogos)
    expect(buildCompactCode({ codigo_descriptivo: 'DES-S/C-EMP-161/180-TRA' })).toBe('DESSCEMP161180TRA');

    // Desde objeto con atributos y catálogos
    const drumObj = {
      producto: 'prod-3',
      presentacion: 'pres-1',
      variedad: 'var-3',
      calibre: 'cal-1',
      calidad: 'qual-1',
    };
    expect(buildCompactCode(drumObj, mockCatalogs)).toBe('FETVDEMF121140PRI');

    // Entradas nulas o vacías
    expect(buildCompactCode(null)).toBe('');
    expect(buildCompactCode(undefined)).toBe('');
    expect(buildCompactCode({})).toBe('');
  });

  // Test 13: getSuggestedWeightForProduct con IDs por defecto y búsquedas compactas flexibles
  it('13. getSuggestedWeightForProduct resuelve IDs de catálogo por defecto sin requerir array de catálogos', () => {
    expect(getSuggestedWeightForProduct('cat-prod-1')).toBe(180); // Entera
    expect(getSuggestedWeightForProduct('cat-prod-2')).toBe(140); // Descarozada
    expect(getSuggestedWeightForProduct('cat-prod-3')).toBe(160); // Rodajas
    expect(getSuggestedWeightForProduct('cat-prod-4')).toBe(180); // Griegas
    expect(getSuggestedWeightForProduct('cat-prod-5')).toBe(160); // Rellenas
    expect(getSuggestedWeightForProduct('cat-prod-6')).toBe(160); // Rotas
    expect(getSuggestedWeightForProduct('invalido')).toBeNull();

    // searchDrums con espacios y barras en búsqueda contra código compacto
    const drums = [
      {
        id: '1',
        tambor_id: 'T000001',
        codigo: 'ENT-VDE-ALOR-121/140-PRI-T000001',
        codigo_descriptivo: 'ENT-VDE-ALOR-121/140-PRI',
        codigo_compacto: 'ENTVDEALOR121140PRI',
        lote: 'L-01',
        peso: 180,
      },
    ];

    // Busca 'ENT VDE ALOR'
    const foundWithSpaces = searchDrums(drums, 'ENT VDE ALOR', {}, mockCatalogs);
    expect(foundWithSpaces).toHaveLength(1);

    // Busca '121 140'
    const foundCaliberSpaces = searchDrums(drums, '121 140', {}, mockCatalogs);
    expect(foundCaliberSpaces).toHaveLength(1);
  });

  // Test 14: Detección inteligente de códigos de sector
  it('14. isSectorCode identifica códigos de sectores de planta con o sin prefijo SEC-', () => {
    // Código directo existente en mockCatalogs (NAV-A3)
    const res1 = isSectorCode('NAV-A3', mockCatalogs);
    expect(res1.isSector).toBe(true);
    expect(res1.sectorCode).toBe('NAV-A3');

    // Con prefijo SEC-
    const res2 = isSectorCode('SEC-NAV-A3', mockCatalogs);
    expect(res2.isSector).toBe(true);
    expect(res2.sectorCode).toBe('NAV-A3');

    // Minúsculas y espacios tolerantes
    const res3 = isSectorCode('  nav-a3  ', mockCatalogs);
    expect(res3.isSector).toBe(true);

    // Código de tambor NO debe ser sector
    const resDrum = isSectorCode('ENT-VDE-ALOR-121/140-PRI-T000001', mockCatalogs);
    expect(resDrum.isSector).toBe(false);

    // Entrada vacía
    expect(isSectorCode('', mockCatalogs).isSector).toBe(false);
    expect(isSectorCode(null, mockCatalogs).isSector).toBe(false);
  });

  // Test 15: Extracción de tambor_id y código descriptivo/compacto
  it('15. extractDrumIdAndCode descompone lecturas completas o individuales', () => {
    // Código completo
    const parsedFull = extractDrumIdAndCode('ENT-VDE-ALOR-121/140-PRI-T000001');
    expect(parsedFull.tamborId).toBe('T000001');
    expect(parsedFull.descriptiveCode).toBe('ENT-VDE-ALOR-121/140-PRI');
    expect(parsedFull.compactCode).toBe('ENTVDEALOR121140PRI');

    // Solo ID con tambores existentes en BD
    const mockDrums = [
      {
        tambor_id: 'T000005',
        codigo_descriptivo: 'DES-NEG-ARA-161/200-SDA',
        codigo_compacto: 'DESNEGARA161200SDA',
      },
    ];
    const parsedIdOnly = extractDrumIdAndCode('T000005', mockDrums);
    expect(parsedIdOnly.tamborId).toBe('T000005');
    expect(parsedIdOnly.descriptiveCode).toBe('DES-NEG-ARA-161/200-SDA');
  });

  // Test 16: Flujo integral de Toma de Inventario por Sectores con deduplicación y agrupación
  it('16. parseInventoryScanStream agrupa tambores con mismo contenido y distinto ID, previene duplicados y detecta discrepancias', () => {
    // Tambores en BD:
    // T000001 a T000011 en sector NAV-A3
    // T000012 en sector DEP-V (inactivo)
    // T000015 en sector NAV-A3 (esperado en NAV-A3 pero no será escaneado -> faltante)
    const existingDrums = [];
    for (let i = 1; i <= 11; i++) {
      const idStr = `T${String(i).padStart(6, '0')}`;
      existingDrums.push({
        id: `tb-${i}`,
        tambor_id: idStr,
        codigo_descriptivo: 'ENT-VDE-ALOR-121/140-PRI',
        codigo_compacto: 'ENTVDEALOR121140PRI',
        codigo: `ENT-VDE-ALOR-121/140-PRI-${idStr}`,
        peso: 180,
        ubicacion: 'ubi-1', // NAV-A3
      });
    }

    // T000012 registrado previamente en otra ubicación (DEP-V)
    existingDrums.push({
      id: 'tb-12',
      tambor_id: 'T000012',
      codigo_descriptivo: 'ENT-VDE-ARA-161/200-PRI',
      codigo_compacto: 'ENTVDEARA161200PRI',
      codigo: 'ENT-VDE-ARA-161/200-PRI-T000012',
      peso: 180,
      ubicacion: 'ubi-inactiva',
    });

    // T000015 registrado en NAV-A3 que NO será escaneado
    existingDrums.push({
      id: 'tb-15',
      tambor_id: 'T000015',
      codigo_descriptivo: 'ENT-VDE-ALOR-121/140-PRI',
      codigo: 'ENT-VDE-ALOR-121/140-PRI-T000015',
      peso: 180,
      ubicacion: 'ubi-1',
    });

    // Flujo volcado desde la memoria del escáner:
    // 1. Sector NAV-A3
    // 2. 11 tambores con el mismo contenido ENT-VDE-ALOR-121/140-PRI pero distinto ID
    // 3. Un re-escaneo duplicado intencional de T000001
    // 4. Tambor T000012 hallado aquí (reubicación)
    const scannerDump = [
      'NAV-A3',
      ...existingDrums.slice(0, 11).map((d) => d.codigo),
      'ENT-VDE-ALOR-121/140-PRI-T000001', // ¡Duplicado del escáner!
      'ENT-VDE-ARA-161/200-PRI-T000012', // Reubicado aquí
    ];

    const result = parseInventoryScanStream(scannerDump, {
      catalogos: mockCatalogs,
      tambores: existingDrums,
    });

    // Verificaciones globales
    expect(result.validDrumsCount).toBe(12); // 11 iguales + 1 distinto (el duplicado fue ignorado)
    expect(result.duplicatesCount).toBe(1);
    expect(result.duplicateScans[0].tamborId).toBe('T000001');

    // 1 Sector procesado
    expect(result.sectorsCount).toBe(1);
    const sectorA3 = result.sectors[0];
    expect(sectorA3.sector.codigo).toBe('NAV-A3');
    expect(sectorA3.totalDrums).toBe(12);

    // Agrupación alfanumérica: deben haber 11 tambores en el grupo ENT-VDE-ALOR-121/140-PRI
    const group11 = sectorA3.groups.find((g) => g.codigo_descriptivo === 'ENT-VDE-ALOR-121/140-PRI');
    expect(group11).toBeDefined();
    expect(group11.count).toBe(11);
    expect(group11.drumIds).toHaveLength(11);
    expect(group11.drumIds).toContain('T000001');
    expect(group11.drumIds).toContain('T000011');
    expect(group11.totalKg).toBe(11 * 180);

    // Reubicación detectada: T000012 estaba en ubi-inactiva y ahora está en NAV-A3
    expect(result.relocationsCount).toBe(1);
    expect(result.relocations[0].tambor_id).toBe('T000012');
    expect(result.relocations[0].newSectorId).toBe('ubi-1');

    // Discrepancia de faltantes: T000015 estaba registrado en NAV-A3 pero no fue escaneado
    expect(sectorA3.missingCount).toBe(1);
    expect(sectorA3.missingDrums[0].tambor_id).toBe('T000015');
  });

  // Test 17: Volcado de tabla desde memoria del escáner con múltiples columnas (índice, código, timestamp)
  it('17. parseInventoryScanStream procesa volcados de tablas con columnas de timestamp e índice sin crear tambores fantasma', () => {
    const tableDump = [
      'N°\tCódigo\tFecha\tHora',
      '1\tNAV-A1\t2026-09-25\t09:15:00',
      '2\tENT-VDE-ALOR-121/140-PRI-T000001\t2026-09-25\t09:15:10',
      '3\tENT-VDE-ALOR-121/140-PRI-T000002\t2026-09-25\t09:15:18',
      '4\tENT-VDE-ALOR-121/140-PRI-T000003\t2026-09-25\t09:15:25',
    ].join('\n');

    const result = parseInventoryScanStream(tableDump, {
      catalogos: [{ id: 'cat-ubi-1', codigo: 'NAV-A1', nombre: 'Nave A - Fila 1', tipo: 'ubicacion' }],
      tambores: [],
    });

    expect(result.sectorsCount).toBe(1);
    expect(result.validDrumsCount).toBe(3);
    expect(result.duplicatesCount).toBe(0);
    expect(result.sectors[0].sector.codigo).toBe('NAV-A1');
    expect(result.sectors[0].totalDrums).toBe(3);
  });

  // Test 18: Seguridad contra falsos duplicados en tambores sin ID embebido
  it('18. extractDrumIdAndCode no inventa tambor_id arbitrario y parseInventoryScanStream contabiliza tambores múltiples sin ID', () => {
    const mockDrums = [
      { id: 'tb-1', tambor_id: 'T000001', codigo_descriptivo: 'ENT-VDE-ALOR-121/140-PRI', ubicacion: 'sec-1' },
      { id: 'tb-2', tambor_id: 'T000002', codigo_descriptivo: 'ENT-VDE-ALOR-121/140-PRI', ubicacion: 'sec-1' },
    ];

    // Lectura de código descriptivo solo
    const parsed = extractDrumIdAndCode('ENT-VDE-ALOR-121/140-PRI', mockDrums);
    expect(parsed.tamborId).toBeNull();
    expect(parsed.descriptiveCode).toBe('ENT-VDE-ALOR-121/140-PRI');

    // Flujo con 3 tambores escaneados por código descriptivo
    const stream = ['SEC-1', 'ENT-VDE-ALOR-121/140-PRI', 'ENT-VDE-ALOR-121/140-PRI', 'ENT-VDE-ALOR-121/140-PRI'];
    const result = parseInventoryScanStream(stream, {
      catalogos: [{ id: 'sec-1', codigo: 'SEC-1', nombre: 'Sector 1', tipo: 'ubicacion' }],
      tambores: mockDrums,
    });

    // Deben contabilizarse los 3 sin descartar falsamente como duplicados
    expect(result.validDrumsCount).toBe(3);
    expect(result.duplicatesCount).toBe(0);
    expect(result.sectors[0].groups[0].count).toBe(3);
  });

  // Test 19: Reconocimiento tolerante de códigos de sector envueltos en asteriscos
  it('19. isSectorCode reconoce códigos con asteriscos (*NAV-A1* y * NAV-A1 *) generados por etiquetas físicas', () => {
    const catalogs = [{ id: 'cat-ubi-1', codigo: 'NAV-A1', nombre: 'Nave A - Fila 1', tipo: 'ubicacion' }];

    const res1 = isSectorCode('*NAV-A1*', catalogs);
    expect(res1.isSector).toBe(true);
    expect(res1.sectorCode).toBe('NAV-A1');

    const res2 = isSectorCode('* NAV-A1 *', catalogs);
    expect(res2.isSector).toBe(true);
    expect(res2.sectorCode).toBe('NAV-A1');
  });

  // Test 20: Descomposición y normalización de etiquetas con apóstrofes de teclado español
  it("20. extractDrumIdAndCode, normalizeScanInput y cleanBarcodeSeparators procesan correctamente FET'VDE'MF'201-240'SDA'T000005", () => {
    const rawBarcode = "FET'VDE'MF'201-240'SDA'T000005";

    // 1. Limpieza de separadores
    expect(cleanBarcodeSeparators(rawBarcode)).toBe('FETVDEMF201240SDAT000005');

    // 2. Normalización de apóstrofes y calibres con guión
    expect(normalizeScanInput(rawBarcode)).toBe('FET-VDE-MF-201/240-SDA-T000005');

    // 3. Extracción de ID y códigos
    const mockDrums = [
      {
        id: 'tb-5',
        tambor_id: 'T000005',
        codigo_descriptivo: 'FET-VDE-MF-201/240-SDA',
        codigo_compacto: 'FETVDEMF201240SDA',
        codigo: 'FET-VDE-MF-201/240-SDA-T000005',
      },
    ];

    const parsed = extractDrumIdAndCode(rawBarcode, mockDrums);
    expect(parsed.tamborId).toBe('T000005');
    expect(parsed.descriptiveCode).toBe('FET-VDE-MF-201/240-SDA');
    expect(parsed.compactCode).toBe('FETVDEMF201240SDA');
    expect(parsed.raw).toBe(rawBarcode);
  });

  // Test 21: Resolución inteligente de lecturas de escaneo con matchDrumByScan
  it("21. matchDrumByScan resuelve tambor exacto con apóstrofes FET'VDE'MF'201-240'SDA'T000005, 'T000005', sectores y eliminados", () => {
    const mockDrums = [
      {
        id: 'tb-5',
        tambor_id: 'T000005',
        codigo_descriptivo: 'FET-VDE-MF-201/240-SDA',
        codigo_compacto: 'FETVDEMF201240SDA',
        codigo: 'FET-VDE-MF-201/240-SDA-T000005',
        ubicacion: 'cat-ubi-1',
      },
      {
        id: 'tb-6',
        tambor_id: 'T000006',
        codigo_descriptivo: 'FET-VDE-MF-201/240-SDA',
        codigo_compacto: 'FETVDEMF201240SDA',
        codigo: 'FET-VDE-MF-201/240-SDA-T000006',
        ubicacion: 'cat-ubi-2',
      },
    ];

    const catalogs = [
      { id: 'cat-ubi-1', codigo: 'NAV-A1', nombre: 'Nave A - Fila 1', tipo: 'ubicacion' },
    ];

    const history = [
      { tambor_id: 'T000099', tipo: 'Eliminación', descripcion: 'Tambor descartado' },
    ];

    // 1. Coincidencia exacta con código de etiqueta de planta con apóstrofes
    const res1 = matchDrumByScan("FET'VDE'MF'201-240'SDA'T000005", { tambores: mockDrums, catalogos: catalogs, historial: history });
    expect(res1.type).toBe('drum');
    expect(res1.drum?.tambor_id).toBe('T000005');

    // 2. Coincidencia con ID envuelto en comillas simples
    const res2 = matchDrumByScan("'T000005'", { tambores: mockDrums });
    expect(res2.type).toBe('drum');
    expect(res2.drum?.tambor_id).toBe('T000005');

    // 3. Coincidencia con solo código de producto (múltiples tambores)
    const res3 = matchDrumByScan("FET'VDE'MF'201-240'SDA", { tambores: mockDrums });
    expect(res3.type).toBe('multiple');
    expect(res3.drums.length).toBe(2);

    // 4. Reconocimiento de sector con apóstrofe (NAV'A1)
    const res4 = matchDrumByScan("NAV'A1", { tambores: mockDrums, catalogos: catalogs });
    expect(res4.type).toBe('sector');
    expect(res4.sectorCode).toBe('NAV-A1');

    // 5. Reconocimiento de tambor dado de baja
    const res5 = matchDrumByScan("T000099", { tambores: mockDrums, catalogos: catalogs, historial: history });
    expect(res5.type).toBe('deleted');
    expect(res5.deletedTamborId).toBe('T000099');
  });

  // Test 22: Búsqueda en Inventario y detección de sectores tolerantes a apóstrofes
  it("22. searchDrums e isSectorCode toleran apóstrofes y devuelven coincidencias exactas", () => {
    const mockDrums = [
      {
        id: 'tb-5',
        tambor_id: 'T000005',
        codigo_descriptivo: 'FET-VDE-MF-201/240-SDA',
        codigo_compacto: 'FETVDEMF201240SDA',
        codigo: 'FET-VDE-MF-201/240-SDA-T000005',
      },
    ];

    // Búsqueda en lista de tambores con la etiqueta escaneada
    const searchResult = searchDrums(mockDrums, "FET'VDE'MF'201-240'SDA'T000005");
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].tambor_id).toBe('T000005');

    // Detección de sector con apóstrofe
    const secRes = isSectorCode("NAV'A1", [{ id: 'u1', codigo: 'NAV-A1', tipo: 'ubicacion' }]);
    expect(secRes.isSector).toBe(true);
    expect(secRes.sectorCode).toBe('NAV-A1');
  });
});


