import { describe, it, expect } from 'vitest';
import {
  nextTamborId,
  buildDescriptiveCode,
  buildFullCode,
  normalizeDrumInput,
  validateDrum,
  diffDrumFields,
  searchDrums,
  calculateInventoryTotals,
  isValidDateString,
} from '../src/lib/domain.js';

const mockCatalogs = [
  { id: 'prod-1', tipo: 'producto', nombre: 'Aceituna', codigo: 'ENT', activo: true, orden: 1 },
  { id: 'pres-1', tipo: 'presentacion', nombre: 'Verde en Salmuera', codigo: 'VDE', activo: true, orden: 1 },
  { id: 'var-1', tipo: 'variedad', nombre: 'Arauco', codigo: 'ALOR', activo: true, orden: 1 },
  { id: 'cal-1', tipo: 'calibre', nombre: '161/200', codigo: '161/200', activo: true, orden: 1 },
  { id: 'qual-1', tipo: 'calidad', nombre: 'Primera', codigo: 'PRI', activo: true, orden: 1 },
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
      // T000003 fue eliminado, pero existe en el historial
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
    // Primer ID
    expect(nextTamborId([], [])).toBe('T000001');

    // Crecimiento a siete dígitos
    const tambores = [{ tambor_id: 'T999999' }];
    expect(nextTamborId(tambores, [])).toBe('T1000000');

    // Superando siete dígitos
    const tambores7 = [{ tambor_id: 'T1000005' }];
    expect(nextTamborId(tambores7, [])).toBe('T1000006');
  });

  // Test 3: Código construido desde catálogos
  it('3. Construye el código descriptivo y completo a partir de los catálogos', () => {
    const drumData = {
      producto: 'prod-1',
      presentacion: 'pres-1',
      variedad: 'var-1',
      calibre: 'cal-1',
      calidad: 'qual-1',
    };

    const descCode = buildDescriptiveCode(drumData, mockCatalogs);
    expect(descCode).toBe('ENT-VDE-ALOR-161/200-PRI');

    const fullCode = buildFullCode(descCode, 'T000001');
    expect(fullCode).toBe('ENT-VDE-ALOR-161/200-PRI-T000001');
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
      peso: 150,
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
      peso: 200,
      ubicacion: 'ubi-1',
      estado: 'est-1',
    };

    const newDrum = {
      ...oldDrum,
      lote: 'LOTE-B',
      peso: 205.5,
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
    expect(pesoDiff.valor_anterior).toBe('200');
    expect(pesoDiff.valor_nuevo).toBe('205.5');

    const obsDiff = diffs.find((d) => d.campo === 'observaciones');
    expect(obsDiff).toBeDefined();
    expect(obsDiff.valor_nuevo).toBe('Nueva nota de cata');
  });

  // Test 8: Búsqueda sin acentos y combinación con filtros
  it('8. Búsqueda insensible a acentos y mayúsculas combinada con filtros de catálogo', () => {
    const drums = [
      {
        id: '1',
        tambor_id: 'T000001',
        codigo: 'ENT-VDE-ALOR-161/200-PRI-T000001',
        codigo_descriptivo: 'ENT-VDE-ALOR-161/200-PRI',
        producto: 'prod-1',
        variedad: 'var-1',
        calibre: 'cal-1',
        lote: 'LOTE-CÓRDOBA',
        peso: 200,
        ubicacion: 'ubi-1',
      },
      {
        id: '2',
        tambor_id: 'T000002',
        codigo: 'ENT-VDE-MANZ-161/200-PRI-T000002',
        codigo_descriptivo: 'ENT-VDE-MANZ-161/200-PRI',
        producto: 'prod-1',
        variedad: 'var-2',
        calibre: 'cal-1',
        lote: 'LOTE-MENDOZA',
        peso: 210,
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

    // Combinación de búsqueda + filtro
    const foundFiltered = searchDrums(drums, 't000001', { variedad: 'var-1' }, mockCatalogs);
    expect(foundFiltered).toHaveLength(1);

    const foundExcluded = searchDrums(drums, 't000001', { variedad: 'var-2' }, mockCatalogs);
    expect(foundExcluded).toHaveLength(0);
  });

  // Test adicional: Validación estricta de fechas de calendario
  it('9. Rechaza fechas de calendario imposibles como 2026-02-30', () => {
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-09-25')).toBe(true);
  });

  // Test adicional: Cálculo de totales de inventario
  it('10. Calcula los totales de inventario con precisión (kilos netos y ubicaciones)', () => {
    const drums = [
      { peso: 200.25, ubicacion: 'ubi-1' },
      { peso: 199.75, ubicacion: 'ubi-1' },
      { peso: 300, ubicacion: 'ubi-2' },
    ];
    const totals = calculateInventoryTotals(drums);
    expect(totals.totalDrums).toBe(3);
    expect(totals.totalKg).toBe(700);
    expect(totals.totalLocations).toBe(2);
  });

  // Test 11: Búsqueda por calidad, estado y compatibilidad de filtros con códigos de catálogo
  it('11. Busca por términos de calidad/estado y filtra por ID o código de catálogo', () => {
    const drums = [
      {
        id: '1',
        tambor_id: 'T000001',
        codigo: 'ENT-VDE-ALOR-161/200-PRI-T000001',
        producto: 'prod-1',
        variedad: 'var-1',
        calibre: 'cal-1',
        calidad: 'qual-1', // Primera
        estado: 'est-1', // En fermentación
        lote: 'L-01',
        peso: 200,
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
});
