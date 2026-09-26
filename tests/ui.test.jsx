import { describe, it, expect } from 'vitest';
import React from 'react';
import { CardDescription } from '../src/components/ui/card.jsx';
import { PhysicalLabel, SectorLabel } from '../src/components/Barcode.jsx';

describe('Pruebas de Componentes UI y Etiquetado', () => {
  it('1. CardDescription se exporta correctamente y es un componente funcional', () => {
    expect(typeof CardDescription).toBe('function');
  });

  it('2. PhysicalLabel genera el formato con prefijo "Tambor" e información requerida', () => {
    const mockDrum = {
      id: 'tb-001',
      tambor_id: 'T000001',
      codigo_descriptivo: 'ENT-VDE-ALOR-161/200-PRI',
      codigo: 'ENT-VDE-ALOR-161/200-PRI-T000001',
      lote: 'LOTE-TEST',
      peso: 220.5,
      fecha_ingreso: '2026-09-25',
      ubicacion_nombre: 'Nave A - Fila 1',
    };

    const element = PhysicalLabel({ drum: mockDrum, widthMm: 50, heightMm: 100 });
    expect(element).toBeDefined();

    // Convertir el árbol de React a string JSON para inspeccionar sus textos
    const jsonStr = JSON.stringify(element);
    expect(jsonStr).toContain('OLIVÍCOLA LUJÁN');
    expect(jsonStr).toContain('ENT-VDE-ALOR-161/200-PRI');
    expect(jsonStr).toContain('ENT-VDE-ALOR-161/200-PRI-T000001');
    expect(jsonStr).toContain('Tambor T000001');
  });

  it('3. PhysicalLabel soporta formato de impresión directa sin bordes decorativos en papel térmico', () => {
    const mockDrum = {
      id: 'tb-002',
      tambor_id: 'T000002',
      codigo_descriptivo: 'DES-NEG-ARAU-201/240-SEC',
      codigo: 'DES-NEG-ARAU-201/240-SEC-T000002',
      lote: 'LOTE-TEST-2',
      peso: 180.0,
      fecha_ingreso: '2026-09-25',
      ubicacion_nombre: 'Patio B',
    };

    const element = PhysicalLabel({ drum: mockDrum, widthMm: 50, heightMm: 100, showBorder: false });
    expect(element).toBeDefined();

    const jsonStr = JSON.stringify(element);
    expect(jsonStr).toContain('printable-label-page');
    expect(jsonStr).not.toContain('border-dashed');
  });

  it('4. PhysicalLabel prioriza codigo_compacto como base para CODE 128 según el gerente', () => {
    const mockDrum = {
      id: 'tb-001',
      tambor_id: 'T000001',
      codigo_descriptivo: 'ENT-VDE-ALOR-121/140-PRI',
      codigo_compacto: 'ENTVDEALOR121140PRI',
      codigo: 'ENT-VDE-ALOR-121/140-PRI-T000001',
      lote: 'LOTE-2026-LUJ01',
      peso: 180.0,
      fecha_ingreso: '2026-09-01',
      ubicacion_nombre: 'Nave A - Fila 1',
    };

    const element = PhysicalLabel({ drum: mockDrum, widthMm: 50, heightMm: 100 });
    const jsonStr = JSON.stringify(element);

    expect(jsonStr).toContain('ENTVDEALOR121140PRI');
    expect(jsonStr).toContain('ENT-VDE-ALOR-121/140-PRI');
    expect(jsonStr).toContain('ENT-VDE-ALOR-121/140-PRI-T000001');
    expect(jsonStr).toContain('Tambor T000001');
    expect(jsonStr).toContain('180');
    expect(jsonStr).toContain('kg');
  });

  it('5. Todas las paginas del sistema exportan componentes funcionales sin variables no definidas', async () => {
    const pages = [
      () => import('../src/pages/InventoryPage.jsx'),
      () => import('../src/pages/Dashboard.jsx'),
      () => import('../src/pages/NewDrumPage.jsx'),
      () => import('../src/pages/EditDrumPage.jsx'),
      () => import('../src/pages/ScanPage.jsx'),
      () => import('../src/pages/DrumDetailPage.jsx'),
      () => import('../src/pages/BatchLabelsPage.jsx'),
      () => import('../src/pages/HistoryPage.jsx'),
      () => import('../src/pages/ConfigurationPage.jsx'),
      () => import('../src/pages/HelpPage.jsx'),
      () => import('../src/pages/InventoryAuditPage.jsx'),
    ];

    for (const loadPage of pages) {
      const module = await loadPage();
      const component = Object.values(module).find((v) => typeof v === 'function');
      expect(typeof component).toBe('function');
    }
  });

  it('6. SectorLabel genera etiqueta física de sector con nombre, código y CODE 128', () => {
    const mockSector = {
      id: 'cat-ubi-1',
      codigo: 'NAV-A1',
      nombre: 'Nave A - Fila 1',
    };

    const element = SectorLabel({ sector: mockSector, widthMm: 100, heightMm: 50 });
    expect(element).toBeDefined();

    const jsonStr = JSON.stringify(element);
    expect(jsonStr).toContain('OLIVÍCOLA LUJÁN');
    expect(jsonStr).toContain('Nave A - Fila 1');
    expect(jsonStr).toContain('NAV-A1');
    expect(jsonStr).toContain('printable-label-page');
  });

  it('7. PhysicalLabel horizontal térmica incorpora el identificador único Tambor T000001 junto al código descriptivo y OLIVÍCOLA LUJÁN', () => {
    const mockDrum = {
      id: 'tb-001',
      tambor_id: 'T000001',
      codigo_descriptivo: 'ENT-VDE-ALOR-161/200-PRI',
      codigo_compacto: 'ENTVDEALOR161200PRI',
      codigo: 'ENT-VDE-ALOR-161/200-PRI-T000001',
      lote: 'LOTE-TEST',
      peso: 220.5,
      fecha_ingreso: '2026-09-25',
      ubicacion_nombre: 'Nave A - Fila 1',
    };

    // Formato horizontal como en la foto (100mm × 50mm por defecto)
    const element = PhysicalLabel({ drum: mockDrum });
    const jsonStr = JSON.stringify(element);

    expect(jsonStr).toContain('OLIVÍCOLA LUJÁN');
    expect(jsonStr).toContain('ENT-VDE-ALOR-161/200-PRI');
    expect(jsonStr).toContain('Tambor T000001');
    expect(jsonStr).toContain('ENT-VDE-ALOR-161/200-PRI-T000001');
    expect(jsonStr).toContain('ENTVDEALOR161200PRI');
  });

  it('8. PhysicalLabel utiliza el código único con ID como valor de BarcodeSvg para permitir escaneo individual y deduplicación', () => {
    const mockDrum = {
      id: 'tb-011',
      tambor_id: 'T000011',
      codigo_descriptivo: 'ENT-VDE-ALOR-121/140-PRI',
      codigo_compacto: 'ENTVDEALOR121140PRI',
      codigo: 'ENT-VDE-ALOR-121/140-PRI-T000011',
      peso: 180,
    };

    const element = PhysicalLabel({ drum: mockDrum });
    // Encontrar BarcodeSvg dentro de los hijos del elemento
    const jsonStr = JSON.stringify(element);
    // El barcode value debe ser el código único ENT-VDE-ALOR-121/140-PRI-T000011
    expect(jsonStr).toContain('"value":"ENT-VDE-ALOR-121/140-PRI-T000011"');
  });
});


