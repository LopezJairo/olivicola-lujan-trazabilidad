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
});
