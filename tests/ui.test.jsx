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
});
