import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadDatabase,
  saveDatabase,
  createDrum,
  updateDrum,
  recordDrumMovement,
  deleteDrum,
  saveCatalogItem,
  exportDatabaseJSON,
  importDatabaseJSON,
  resetDemoDatabase,
  setCurrentWorkspaceMode,
} from '../src/api/repository.js';

// Mock localStorage para Vitest en entorno Node
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

describe('Pruebas de Repositorio y Ciclo Integral de Trazabilidad', () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentWorkspaceMode('demo');
    resetDemoDatabase();
  });

  it('1. Carga inicial de demostración con 12 tambores y catálogos', () => {
    const db = loadDatabase();
    expect(db.tambores).toHaveLength(12);
    expect(db.catalogos.length).toBeGreaterThan(10);
    expect(db.historial.length).toBeGreaterThan(0);
    expect(db.movimientos.length).toBeGreaterThan(0);
  });

  it('2. Ciclo de Alta: calcula T000013, crea evento de historial y persiste en BD', async () => {
    const dbBefore = loadDatabase();
    expect(dbBefore.tambores).toHaveLength(12);

    const newDrumInput = {
      producto: 'cat-prod-1',
      presentacion: 'cat-pres-1',
      variedad: 'cat-var-1',
      calibre: 'cat-cal-1',
      calidad: 'cat-qual-1',
      lote: 'LOTE-TEST-01',
      fecha_ingreso: '2026-09-25',
      peso: '225,5',
      ubicacion: 'cat-ubi-1',
      estado: 'cat-est-1',
    };

    const created = await createDrum(newDrumInput, { nombre: 'Operario Test' });

    expect(created.tambor_id).toBe('T000013');
    expect(created.peso).toBe(225.5);
    expect(created.codigo_descriptivo).toBe('ENT-VDE-ALOR-161/200-PRI');
    expect(created.codigo).toBe('ENT-VDE-ALOR-161/200-PRI-T000013');

    const dbAfter = loadDatabase();
    expect(dbAfter.tambores).toHaveLength(13);

    // Comprobar que se creó el evento en Historial
    const createEvent = dbAfter.historial.find(
      (h) => h.tambor_id === 'T000013' && h.tipo === 'Creación'
    );
    expect(createEvent).toBeDefined();
    expect(createEvent.actor).toBe('Operario Test');
  });

  it('3. Ciclo de Edición: preserva tambor_id, recalcula código y guarda diferencias', async () => {
    const db = loadDatabase();
    const target = db.tambores[0]; // T000001

    const updated = await updateDrum(
      target.id,
      {
        ...target,
        variedad: 'cat-var-2', // Cambia de Arauco (ALOR) a Manzanilla (MANZ)
        peso: 230,
      },
      { nombre: 'Supervisor' }
    );

    expect(updated.tambor_id).toBe('T000001');
    expect(updated.codigo_descriptivo).toContain('MANZ');
    expect(updated.codigo).toBe(`ENT-VDE-MANZ-161/200-PRI-T000001`);

    const dbAfter = loadDatabase();
    const varDiff = dbAfter.historial.find(
      (h) => h.tambor_id === 'T000001' && h.campo === 'variedad'
    );
    expect(varDiff).toBeDefined();
    expect(varDiff.valor_anterior).toBe('Arauco');
    expect(varDiff.valor_nuevo).toBe('Manzanilla');
  });

  it('4. Ciclo de Movimiento: actualiza ubicación/estado y genera registros', async () => {
    const db = loadDatabase();
    const target = db.tambores[0]; // T000001, ubicada en Nave A - Fila 1

    const result = await recordDrumMovement(
      target.id,
      {
        tipo: 'cat-mov-1', // Traslado interno
        ubicacion_nueva: 'cat-ubi-7', // Sector Despacho
        estado_nuevo: 'cat-est-7', // Listo para despacho
        observaciones: 'Traslado para consolidación de carga',
      },
      { nombre: 'Operario Autoelevador' }
    );

    expect(result.drum.ubicacion).toBe('cat-ubi-7');
    expect(result.drum.estado).toBe('cat-est-7');

    const dbAfter = loadDatabase();
    const updatedInDb = dbAfter.tambores.find((d) => d.id === target.id);
    expect(updatedInDb.ubicacion).toBe('cat-ubi-7');

    // Verificar movimiento en entidad Movimiento
    expect(dbAfter.movimientos[0].ubicacion_nueva).toBe('cat-ubi-7');

    // Verificar evento en Historial
    const moveHistory = dbAfter.historial.find(
      (h) => h.tambor_id === target.tambor_id && h.tipo === 'Movimiento'
    );
    expect(moveHistory).toBeDefined();
  });

  it('5. Ciclo de Eliminación: rechaza confirmación incorrecta, elimina tambor y preserva historial', async () => {
    const db = loadDatabase();
    const target = db.tambores[0]; // T000001

    // Intento con confirmación equivocada
    await expect(deleteDrum(target.id, 'INCORRECTO')).rejects.toThrow();

    // Confirmación exacta
    const res = await deleteDrum(target.id, target.tambor_id, { nombre: 'Gerente' });
    expect(res.success).toBe(true);

    const dbAfter = loadDatabase();
    expect(dbAfter.tambores).toHaveLength(11);
    expect(dbAfter.tambores.find((d) => d.id === target.id)).toBeUndefined();

    // El historial permanece y tiene el evento de eliminación
    const deleteEvent = dbAfter.historial.find(
      (h) => h.tambor_id === target.tambor_id && h.tipo === 'Eliminación'
    );
    expect(deleteEvent).toBeDefined();
    expect(deleteEvent.descripcion).toContain('eliminado');
  });

  it('6. Catálogos: rechaza códigos duplicados dentro del mismo tipo', async () => {
    // Intentar agregar otra variedad con código "ALOR" que ya existe
    await expect(
      saveCatalogItem({
        tipo: 'variedad',
        nombre: 'Arauco Clon 2',
        codigo: 'ALOR',
        activo: true,
      })
    ).rejects.toThrow(/Ya existe una opción/);
  });

  it('7. Copia de Seguridad: exporta e importa base de datos completa', () => {
    const exportedJson = exportDatabaseJSON();
    expect(typeof exportedJson).toBe('string');

    // Limpiar base de datos
    saveDatabase({ tambores: [], catalogos: [], historial: [], movimientos: [] });
    expect(loadDatabase().tambores).toHaveLength(0);

    // Restaurar desde JSON exportado
    const restored = importDatabaseJSON(exportedJson);
    expect(restored.tambores).toHaveLength(12);

    const dbAfter = loadDatabase();
    expect(dbAfter.tambores).toHaveLength(12);
  });

  it('8. Operaciones con identificador insensible a mayúsculas (t000001 vs T000001)', async () => {
    // updateDrum con id en minúsculas
    const updated = await updateDrum('t000001', {
      lote: 'LOTE-MINUSCULA',
      peso: 220,
    });
    expect(updated.tambor_id).toBe('T000001');
    expect(updated.lote).toBe('LOTE-MINUSCULA');

    // recordDrumMovement con id en minúsculas
    const moveRes = await recordDrumMovement('t000001', {
      tipo: 'cat-mov-1',
      ubicacion_nueva: 'cat-ubi-2',
    });
    expect(moveRes.drum.ubicacion).toBe('cat-ubi-2');

    // deleteDrum con id en minúsculas y confirmación en minúsculas
    const delRes = await deleteDrum('t000001', 't000001');
    expect(delRes.success).toBe(true);
  });

  it('9. Movimientos: rechaza tipos de movimiento o ubicaciones inexistentes', async () => {
    await expect(
      recordDrumMovement('T000002', {
        tipo: 'tipo-falso',
        ubicacion_nueva: 'cat-ubi-1',
      })
    ).rejects.toThrow(/tipo de movimiento/);

    await expect(
      recordDrumMovement('T000002', {
        tipo: 'cat-mov-1',
        ubicacion_nueva: 'ubicacion-falsa',
      })
    ).rejects.toThrow(/ubicación de destino/);
  });

  it('10. Catálogos: rechaza caracteres inválidos en códigos de catálogo', async () => {
    await expect(
      saveCatalogItem({
        tipo: 'variedad',
        nombre: 'Variedad Rara',
        codigo: 'VAR#01',
      })
    ).rejects.toThrow(/El código solo puede contener letras mayúsculas/);
  });
});
