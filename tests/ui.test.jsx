import { describe, it, expect } from 'vitest';
import React from 'react';
import { CardDescription } from '../src/components/ui/card.jsx';
import { PhysicalLabel } from '../src/components/Barcode.jsx';

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
});
