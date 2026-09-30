import { describe, it, expect } from 'vitest';
import React from 'react';
import { CardDescription } from '../src/components/ui/card.jsx';
import { PhysicalLabel, SectorLabel } from '../src/components/Barcode.jsx';

describe('Pruebas de Componentes UI y Etiquetado', () => {
  it('1. CardDescription se exporta correctamente y es un componente funcional', () => {
    expect(typeof CardDescription).toBe('function');
  });

  it('2. PhysicalLabel genera el formato limpio con prefijo "Tambor" sin lote, peso ni ubicacion en el pie', () => {
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

    const element = PhysicalLabel({ drum: mockDrum, widthMm: 100, heightMm: 50 });
    expect(element).toBeDefined();

    // Convertir el árbol de React a string JSON para inspeccionar sus textos
    const jsonStr = JSON.stringify(element);
    expect(jsonStr).toContain('OLIVÍCOLA LUJÁN');
    expect(jsonStr).toContain('ENT-VDE-ALOR-161/200-PRI');
    expect(jsonStr).toContain('Tambor T000001');
    // Sin lote, peso ni ubicación en pie
    expect(jsonStr).not.toContain('Lote:');
    expect(jsonStr).not.toContain('Peso:');
    expect(jsonStr).not.toContain('Ubicación:');
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

    const element = PhysicalLabel({ drum: mockDrum, widthMm: 100, heightMm: 50, showBorder: false });
    expect(element).toBeDefined();

    const jsonStr = JSON.stringify(element);
    expect(jsonStr).toContain('printable-label-page');
    expect(jsonStr).not.toContain('border-dashed');
  });

  it('4. PhysicalLabel no incluye códigos secundarios ni pie de metadatos debajo del código de barras', () => {
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

    const element = PhysicalLabel({ drum: mockDrum, widthMm: 100, heightMm: 50 });
    const jsonStr = JSON.stringify(element);

    expect(jsonStr).toContain('ENT-VDE-ALOR-121/140-PRI');
    expect(jsonStr).toContain('Tambor T000001');
    expect(jsonStr).toContain('OLIVÍCOLA LUJÁN');
    // Verificamos que no existan metadatos de lote, peso o ubicación
    expect(jsonStr).not.toContain('Lote:');
    expect(jsonStr).not.toContain('Peso:');
    expect(jsonStr).not.toContain('Ubicación:');
  });

  it('5. Todas las paginas del sistema se renderizan correctamente sin errores ni hooks indefinidos', async () => {
    const { renderToString } = await import('react-dom/server');
    const { MemoryRouter } = await import('react-router-dom');
    const { AuthProvider } = await import('../src/components/Auth.jsx');

    const { InventoryPage } = await import('../src/pages/InventoryPage.jsx');
    const { Dashboard } = await import('../src/pages/Dashboard.jsx');
    const { NewDrumPage } = await import('../src/pages/NewDrumPage.jsx');
    const { EditDrumPage } = await import('../src/pages/EditDrumPage.jsx');
    const { ScanPage } = await import('../src/pages/ScanPage.jsx');
    const { DrumDetailPage } = await import('../src/pages/DrumDetailPage.jsx');
    const { BatchLabelsPage } = await import('../src/pages/BatchLabelsPage.jsx');
    const { HistoryPage } = await import('../src/pages/HistoryPage.jsx');
    const { ConfigurationPage } = await import('../src/pages/ConfigurationPage.jsx');
    const { HelpPage } = await import('../src/pages/HelpPage.jsx');
    const { InventoryAuditPage } = await import('../src/pages/InventoryAuditPage.jsx');
    const { QualityPage } = await import('../src/pages/QualityPage.jsx');
    const { LoginPage } = await import('../src/pages/LoginPage.jsx');
    const { Layout } = await import('../src/components/Layout.jsx');

    const componentsToTest = [
      { name: 'Dashboard', elem: <Dashboard /> },
      { name: 'InventoryPage', elem: <InventoryPage /> },
      { name: 'QualityPage', elem: <QualityPage /> },
      { name: 'ScanPage', elem: <ScanPage /> },
      { name: 'HistoryPage', elem: <HistoryPage /> },
      { name: 'ConfigurationPage', elem: <ConfigurationPage /> },
      { name: 'HelpPage', elem: <HelpPage /> },
      { name: 'InventoryAuditPage', elem: <InventoryAuditPage /> },
      { name: 'NewDrumPage', elem: <NewDrumPage /> },
      { name: 'EditDrumPage', elem: <EditDrumPage /> },
      { name: 'BatchLabelsPage', elem: <BatchLabelsPage /> },
      { name: 'DrumDetailPage', elem: <DrumDetailPage /> },
      { name: 'LoginPage', elem: <LoginPage /> },
      { name: 'Layout', elem: <Layout /> },
    ];

    for (const { name, elem } of componentsToTest) {
      expect(() => {
        const html = renderToString(
          <MemoryRouter>
            <AuthProvider>
              {elem}
            </AuthProvider>
          </MemoryRouter>
        );
        expect(html).toBeDefined();
        expect(typeof html).toBe('string');
      }, `Error renderizando la página/componente: ${name}`).not.toThrow();
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
    // Sin lote, peso ni ubicación
    expect(jsonStr).not.toContain('Lote:');
    expect(jsonStr).not.toContain('Peso:');
    expect(jsonStr).not.toContain('Ubicación:');
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


