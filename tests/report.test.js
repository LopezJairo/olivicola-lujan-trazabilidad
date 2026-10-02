import { describe, it, expect } from 'vitest';
import { generateExecutiveReportData, buildReportHtml } from '../src/lib/reportGenerator.js';

const mockCatalogs = [
  // Productos
  { id: 'prod-1', tipo: 'producto', nombre: 'Entera', codigo: 'ENT', activo: true },
  { id: 'prod-2', tipo: 'producto', nombre: 'Descarozada', codigo: 'DES', activo: true },
  { id: 'prod-3', tipo: 'producto', nombre: 'Rodajas', codigo: 'FET', activo: true },
  { id: 'prod-4', tipo: 'producto', nombre: 'Griegas', codigo: 'GRI', activo: true },
  { id: 'prod-5', tipo: 'producto', nombre: 'Rellenas', codigo: 'RELL', activo: true },
  { id: 'prod-6', tipo: 'producto', nombre: 'Rotas', codigo: 'ROTA', activo: true },

  // Variedades
  { id: 'var-1', tipo: 'variedad', nombre: 'Aloreña', codigo: 'ALOR', activo: true },
  { id: 'var-2', tipo: 'variedad', nombre: 'Arauco', codigo: 'ARA', activo: true },
  { id: 'var-3', tipo: 'variedad', nombre: 'Manzanilla Fina', codigo: 'MF', activo: true },
  { id: 'var-4', tipo: 'variedad', nombre: 'Picual', codigo: 'PIC', activo: true },
  { id: 'var-5', tipo: 'variedad', nombre: 'Empeltre', codigo: 'EMP', activo: true },

  // Calibres
  { id: 'cal-1', tipo: 'calibre', nombre: '121/140', codigo: '121/140', activo: true },
  { id: 'cal-2', tipo: 'calibre', nombre: '161/200', codigo: '161/200', activo: true },
  { id: 'cal-3', tipo: 'calibre', nombre: 'Sin Calibre', codigo: 'SIN CAL', activo: true },

  // Calidades
  { id: 'qual-1', tipo: 'calidad', nombre: 'Primera', codigo: 'PRI', activo: true },
  { id: 'qual-2', tipo: 'calidad', nombre: 'Segunda', codigo: 'SDA', activo: true },

  // Ubicaciones
  { id: 'ubi-1', tipo: 'ubicacion', nombre: 'Nave A - Fila 1', codigo: 'NAV-A1', activo: true },
  { id: 'ubi-2', tipo: 'ubicacion', nombre: 'Nave B - Fila 2', codigo: 'NAV-B2', activo: true },

  // Estados
  { id: 'est-1', tipo: 'estado', nombre: 'Liberado', codigo: 'LIB', activo: true },
  { id: 'est-2', tipo: 'estado', nombre: 'En fermentación', codigo: 'FERM', activo: true },
  { id: 'est-3', tipo: 'estado', nombre: 'En observación', codigo: 'OBS', activo: true },
];

const mockDrums = [
  {
    id: 'd-1',
    tambor_id: 'T000001',
    producto: 'prod-1',
    variedad: 'var-2',
    calibre: 'cal-1',
    calidad: 'qual-1',
    ubicacion: 'ubi-1',
    estado: 'est-1',
    peso: 180,
    lote: 'L-01',
  },
  {
    id: 'd-2',
    tambor_id: 'T000002',
    producto: 'prod-2',
    variedad: 'var-1',
    calibre: 'cal-2',
    calidad: 'qual-1',
    ubicacion: 'ubi-1',
    estado: 'est-1',
    peso: 140,
    lote: 'L-01',
  },
  {
    id: 'd-3',
    tambor_id: 'T000003',
    producto: 'prod-3',
    variedad: 'var-3',
    calibre: 'cal-2',
    calidad: 'qual-2',
    ubicacion: 'ubi-2',
    estado: 'est-2',
    peso: 160,
    lote: 'L-02',
  },
];

describe('Generador de Informe Ejecutivo en Tiempo Real', () => {
  it('1. Calcula correctamente totales de kilos, tambores y promedios con datos reales', () => {
    const reportData = generateExecutiveReportData({
      tambores: mockDrums,
      catalogos: mockCatalogs,
      user: { nombre: 'Operador Test', legajo: 'OP-01' },
    });

    expect(reportData.kpis.totalDrums).toBe(3);
    expect(reportData.kpis.totalKg).toBe(480);
    expect(reportData.kpis.totalTonnes).toBe('0.5'); // 480 kg = 0.5 Tn
    expect(reportData.kpis.primeraPercent).toBe('66.7'); // 2 de 3 tambores
    expect(reportData.kpis.liberadosPercent).toBe('66.7'); // 2 de 3 tambores
    expect(reportData.kpis.activeLocationsCount).toBe(2);
  });

  it('2. Maneja bases de datos vacías sin arrojar errores ni NaN', () => {
    const emptyReport = generateExecutiveReportData({
      tambores: [],
      catalogos: mockCatalogs,
    });

    expect(emptyReport.kpis.totalDrums).toBe(0);
    expect(emptyReport.kpis.totalKg).toBe(0);
    expect(emptyReport.kpis.totalTonnes).toBe('0.0');
    expect(emptyReport.kpis.primeraPercent).toBe('0.0');
    expect(emptyReport.kpis.liberadosPercent).toBe('0.0');
    expect(emptyReport.kpis.activeLocationsCount).toBe(0);
  });

  it('3. Desglosa productos, variedades, calibres y sectores de forma exhaustiva', () => {
    const reportData = generateExecutiveReportData({
      tambores: mockDrums,
      catalogos: mockCatalogs,
    });

    // Productos
    const entera = reportData.productBreakdown.find((p) => p.codigo === 'ENT');
    expect(entera).toBeDefined();
    expect(entera.drums).toBe(1);
    expect(entera.kg).toBe(180);
    expect(entera.percent).toBe('37.5');

    // Variedades
    const arauco = reportData.varietyBreakdown.find((v) => v.codigo === 'ARA');
    expect(arauco).toBeDefined();
    expect(arauco.drums).toBe(1);
    expect(arauco.kg).toBe(180);

    // Calibres
    expect(reportData.caliberBreakdown.grandes.drums).toBe(1); // 121/140
    expect(reportData.caliberBreakdown.medios.drums).toBe(2); // 161/200 (x2)

    // Sectores
    const naveA1 = reportData.locationBreakdown.find((l) => l.codigo === 'NAV-A1');
    expect(naveA1).toBeDefined();
    expect(naveA1.drums).toBe(2);
    expect(naveA1.kg).toBe(320);
  });

  it('4. REQUERIMIENTO CLAVE: La firma JAIRO LOPEZ NO debe aparecer en los datos ni en el HTML del informe ejecutivo', () => {
    const reportData = generateExecutiveReportData({
      tambores: mockDrums,
      catalogos: mockCatalogs,
      user: { nombre: 'Carlos Admin', legajo: 'ADM-01' },
    });

    const jsonString = JSON.stringify(reportData);
    expect(jsonString.toLowerCase()).not.toContain('jairo lopez');
    expect(jsonString.toLowerCase()).not.toContain('jairo lópez');

    const html = buildReportHtml(reportData);
    expect(html.toLowerCase()).not.toContain('jairo lopez');
    expect(html.toLowerCase()).not.toContain('jairo lópez');

    // Debe contener las firmas institucionales de la empresa
    expect(html).toContain('GERENCIA GENERAL');
    expect(html).toContain('JEFATURA DE PLANTA');
    expect(html).toContain('CONTROL DE CALIDAD');
  });

  it('5. Genera HTML con estilos específicos A4 y cabecera de Olivícola Luján', () => {
    const reportData = generateExecutiveReportData({
      tambores: mockDrums,
      catalogos: mockCatalogs,
    });

    const html = buildReportHtml(reportData);
    expect(html).toContain('OLIVÍCOLA LUJÁN S.A.');
    expect(html).toContain('size: A4 portrait');
    expect(html).toContain('INFORME DE GESTIÓN OPERATIVA, STOCK Y TRAZABILIDAD');
    expect(html).toContain('480 kg');
    expect(html).toContain('T000001');
  });
});
