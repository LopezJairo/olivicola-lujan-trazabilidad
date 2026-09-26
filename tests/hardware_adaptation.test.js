import { describe, it, expect, vi } from 'vitest';
import {
  generateDrumZPL,
  generateSectorZPL,
  generateBatchZPL,
  generateHprtCalibrationZPL,
  calculateBarcodeGeometry,
  downloadZplFile,
  copyZplToClipboard,
} from '../src/lib/zpl.js';
import {
  parseScannerStream,
  HPRT_N130BT_COMMANDS,
  FastScannerBuffer,
  isHprtCommand,
} from '../src/lib/scannerBurst.js';
import fs from 'fs';
import path from 'path';

describe('Adaptación de Hardware: Impresora Zebra GC420t (203 dpi) y Escáner HPRT N130BT', () => {
  // -------------------------------------------------------------
  // 1. GENERACIÓN ZPL II PARA ZEBRA GC420t
  // -------------------------------------------------------------
  describe('Generador de Comandos Nativos ZPL II para Zebra GC420t', () => {
    const mockDrum = {
      id: 'tb-001',
      tambor_id: 'T000001',
      codigo_descriptivo: 'ENT-VDE-ALOR-161/200-PRI',
      codigo_compacto: 'ENTVDEALOR161200PRI',
      codigo: 'ENT-VDE-ALOR-161/200-PRI-T000001',
      lote: 'LOTE-2026-LUJ01',
      peso: 220.5,
      ubicacion_nombre: 'Nave A - Fila 1',
    };

    it('1.1 generateDrumZPL produce encabezado y cierre ZPL estándar con dimensiones 800x400 dots', () => {
      const zpl = generateDrumZPL(mockDrum);

      expect(zpl.startsWith('^XA')).toBe(true);
      expect(zpl.endsWith('^XZ')).toBe(true);
      // 100 mm @ 203 dpi = 800 dots
      expect(zpl).toContain('^PW800');
      // 50 mm @ 203 dpi = 400 dots
      expect(zpl).toContain('^LL400');
      // UTF-8 encoding
      expect(zpl).toContain('^CI28');
    });

    it('1.2 generateDrumZPL incluye los datos esenciales del tambor y código CODE 128', () => {
      const zpl = generateDrumZPL(mockDrum);

      expect(zpl).toContain('OLIVICOLA LUJAN');
      expect(zpl).toContain('ENT-VDE-ALOR-161/200-PRI');
      expect(zpl).toContain('Tambor T000001');
      expect(zpl).toContain('ENT-VDE-ALOR-161/200-PRI-T000001');
      expect(zpl).toContain('ENTVDEALOR161200PRI');
      expect(zpl).toContain('Lote: LOTE-2026-LUJ01');
      expect(zpl).toContain('Peso: 220.5 kg');
      expect(zpl).toContain('Ubic: Nave A - Fila 1');
      // Barcode CODE 128 command (^BCN)
      expect(zpl).toContain('^BCN');
    });

    it('1.3 calculateBarcodeGeometry centra el código y evita desborde fuera de los 800 dots de la etiqueta', () => {
      // Código estándar de tambor de 32 caracteres
      const drumCode = 'ENT-VDE-ALOR-161/200-PRI-T000001';
      const geo = calculateBarcodeGeometry(drumCode, 800, 2);

      // El código no debe terminar más allá del borde de la etiqueta (800 dots)
      expect(geo.xPos + geo.estWidth).toBeLessThanOrEqual(800);
      // Debe dejar margen de zona de silencio a la izquierda
      expect(geo.xPos).toBeGreaterThanOrEqual(10);
      // Debe dejar margen de zona de silencio a la derecha
      expect(800 - (geo.xPos + geo.estWidth)).toBeGreaterThanOrEqual(10);

      const zpl = generateDrumZPL(mockDrum);
      // En ZPL debe coincidir con la posición calculada
      expect(zpl).toContain(`^FO${geo.xPos},105^BCN`);
    });

    it('1.4 calculateBarcodeGeometry degrada a módulo 1 ante códigos excesivamente largos para no desbordar', () => {
      const veryLongCode = 'ENT-VDE-ALOR-161/200-PRI-EXTRA-ESPECIAL-RESERVA-FAMILIAR-T000099';
      const geo = calculateBarcodeGeometry(veryLongCode, 800, 2);

      expect(geo.moduleWidth).toBe(1);
      expect(geo.xPos + geo.estWidth).toBeLessThanOrEqual(800);
      expect(geo.xPos).toBeGreaterThanOrEqual(10);
    });

    it('1.5 generateDrumZPL sanitiza caracteres de control ZPL (^ y ~)', () => {
      const dirtyDrum = {
        tambor_id: 'T000099^TEST',
        codigo_descriptivo: 'DES~NEG^ARAU',
        codigo: 'DES~NEG^ARAU-T000099',
        lote: 'LOT^01',
        peso: 150,
      };

      const zpl = generateDrumZPL(dirtyDrum);
      expect(zpl).not.toContain('^FDLOT^01^FS');
      expect(zpl).toContain('LOT 01');
    });

    it('1.6 generateDrumZPL maneja campos nulos o incompletos con elegancia', () => {
      const minimalDrum = {
        tambor_id: 'T000005',
      };

      const zpl = generateDrumZPL(minimalDrum);
      expect(zpl).toContain('Tambor T000005');
      expect(zpl).toContain('Lote: —');
      expect(zpl).toContain('Peso: —');
      expect(zpl).toContain('Ubic: —');
    });

    it('1.7 generateSectorZPL genera etiqueta de sector física calibrada para poste/columna', () => {
      const mockSector = {
        id: 'cat-ubi-1',
        codigo: 'NAV-A1',
        nombre: 'Nave A - Fila 1',
      };

      const zpl = generateSectorZPL(mockSector);

      expect(zpl).toContain('^PW800');
      expect(zpl).toContain('^LL400');
      expect(zpl).toContain('OLIVICOLA LUJAN');
      expect(zpl).toContain('Sector de Almacenamiento');
      expect(zpl).toContain('Nave A - Fila 1');
      expect(zpl).toContain('^FDNAV-A1^FS');
      expect(zpl).toContain('* NAV-A1 *');
      expect(zpl).toContain('Escanear este codigo para registrar inventario en este sector');
    });

    it('1.8 generateHprtCalibrationZPL genera etiqueta de configuración para el escáner HPRT N130BT', () => {
      const cmd = HPRT_N130BT_COMMANDS.find((c) => c.id === 'upload_data');
      const zpl = generateHprtCalibrationZPL(cmd);

      expect(zpl).toContain('^PW800');
      expect(zpl).toContain('^LL400');
      expect(zpl).toContain('HPRT N130BT - CODIGO DE CALIBRACION');
      expect(zpl).toContain('^FD%0101D02%^FS');
      expect(zpl).toContain('Subir Datos de Memoria a la App (Upload Data)');
    });

    it('1.9 generateBatchZPL concatena streams y propaga opciones de geometría', () => {
      const drums = [
        { tambor_id: 'T000001', codigo: 'COD1' },
        { tambor_id: 'T000002', codigo: 'COD2' },
        { tambor_id: 'T000003', codigo: 'COD3' },
      ];

      const customOptions = { widthDots: 832, heightDots: 416 };
      const batchZpl = generateBatchZPL(drums, 'drum', customOptions);
      const startCount = (batchZpl.match(/\^XA/g) || []).length;
      const endCount = (batchZpl.match(/\^XZ/g) || []).length;

      expect(startCount).toBe(3);
      expect(endCount).toBe(3);
      expect(batchZpl).toContain('^PW832');
      expect(batchZpl).toContain('^LL416');
    });

    it('1.10 generateBatchZPL retorna cadena vacía ante listas vacías', () => {
      expect(generateBatchZPL([])).toBe('');
      expect(generateBatchZPL(null)).toBe('');
    });
  });

  // -------------------------------------------------------------
  // 2. PARSING DE RÁFAGAS DEL ESCÁNER HPRT N130BT
  // -------------------------------------------------------------
  describe('Manejo de Ráfagas HID y Delimitadores del Escáner HPRT N130BT', () => {
    it('2.1 parseScannerStream procesa volcado de memoria estándar con saltos de línea (CR/LF)', () => {
      const rawDump = 'NAV-A1\r\nT000001\r\nT000002\r\nT000003\r\n';
      const result = parseScannerStream(rawDump);

      expect(result.count).toBe(4);
      expect(result.tokens).toEqual(['NAV-A1', 'T000001', 'T000002', 'T000003']);
      expect(result.delimitersDetected).toContain('Salto de línea (Enter)');
    });

    it('2.2 parseScannerStream tolera delimitación por tabulaciones (Tab HID)', () => {
      const tabDump = 'NAV-A1\tENT-VDE-ALOR-121/140-PRI-T000001\tENT-VDE-ALOR-121/140-PRI-T000002';
      const result = parseScannerStream(tabDump);

      expect(result.count).toBe(3);
      expect(result.tokens[0]).toBe('NAV-A1');
      expect(result.tokens[1]).toBe('ENT-VDE-ALOR-121/140-PRI-T000001');
      expect(result.tokens[2]).toBe('ENT-VDE-ALOR-121/140-PRI-T000002');
      expect(result.delimitersDetected).toContain('Tabulación (Tab)');
    });

    it('2.3 parseScannerStream tolera delimitación por comas y puntos y comas', () => {
      const commaDump = 'NAV-B1,T000010;T000011,T000012;NAV-B2';
      const result = parseScannerStream(commaDump);

      expect(result.count).toBe(5);
      expect(result.tokens).toEqual(['NAV-B1', 'T000010', 'T000011', 'T000012', 'NAV-B2']);
      expect(result.delimitersDetected).toContain('Coma (,)');
      expect(result.delimitersDetected).toContain('Punto y coma (;)');
    });

    it('2.4 parseScannerStream descarta líneas de comentarios (# o //) y espacios vacíos', () => {
      const textWithComments = `
        // Inicio de toma de inventario
        NAV-A1
        # Tambores del sector
        T000001
        
        T000002
      `;

      const result = parseScannerStream(textWithComments);
      expect(result.count).toBe(3);
      expect(result.tokens).toEqual(['NAV-A1', 'T000001', 'T000002']);
    });

    it('2.5 HPRT_N130BT_COMMANDS incluye todos los códigos de calibración del manual', () => {
      const requiredCommandIds = [
        'storage_mode',
        'upload_data',
        'show_total',
        'clear_data',
        'suffix_cr',
        'suffix_crlf',
        'normal_mode',
        'restore_factory',
      ];

      for (const id of requiredCommandIds) {
        const found = HPRT_N130BT_COMMANDS.find((cmd) => cmd.id === id);
        expect(found).toBeDefined();
        expect(found.code).toBeDefined();
        expect(found.title).toBeDefined();
        expect(found.description).toBeDefined();
      }
    });

    it('2.6 isHprtCommand identifica comandos de hardware y descarta códigos de tambores', () => {
      expect(isHprtCommand('%0101D01%')).toBeDefined();
      expect(isHprtCommand('%0101D02%')?.id).toBe('upload_data');
      expect(isHprtCommand('UPLOAD-STORED-DATA')?.id).toBe('upload_data');
      expect(isHprtCommand('T000001')).toBeNull();
      expect(isHprtCommand('NAV-A1')).toBeNull();
      expect(isHprtCommand(null)).toBeNull();
    });

    it('2.7 FastScannerBuffer previene la pérdida de foco en Tab mediante preventDefault', () => {
      const tokensReceived = [];
      const preventDefaultMock = vi.fn();

      const buffer = new FastScannerBuffer({
        onToken: (t) => tokensReceived.push(t),
      });

      'NAV-A1'.split('').forEach((char) => {
        buffer.handleKeyDown({ key: char });
      });
      buffer.handleKeyDown({ key: 'Tab', preventDefault: preventDefaultMock });

      expect(preventDefaultMock).toHaveBeenCalled();
      expect(tokensReceived).toContain('NAV-A1');
    });

    it('2.8 FastScannerBuffer agrupa ráfagas masivas (Upload Data) y emite evento onBurst con el lote completo', async () => {
      vi.useFakeTimers();

      const tokensReceived = [];
      let burstResult = null;

      const buffer = new FastScannerBuffer({
        onToken: (t) => tokensReceived.push(t),
        onBurst: (burst) => {
          burstResult = burst;
        },
        burstWindowMs: 150,
      });

      // Simular volcado de 3 códigos consecutivos con intervalo rápido (20ms)
      const codes = ['T000001', 'T000002', 'T000003'];

      codes.forEach((code) => {
        code.split('').forEach((char) => buffer.handleKeyDown({ key: char }));
        buffer.handleKeyDown({ key: 'Enter' });
      });

      expect(tokensReceived).toEqual(['T000001', 'T000002', 'T000003']);
      expect(burstResult).toBeNull(); // Aún dentro de la ventana de espera

      // Avanzar el reloj para completar la ventana de ráfaga
      vi.advanceTimersByTime(200);

      expect(burstResult).toEqual(['T000001', 'T000002', 'T000003']);

      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------
  // 3. CALIBRACIÓN CSS DE IMPRESIÓN (ZEBRA GC420t 100mm x 50mm)
  // -------------------------------------------------------------
  describe('Calibración de Hoja de Impresión CSS @page y @media print', () => {
    it('3.1 src/index.css define @page { size: 100mm 50mm; margin: 0; }', () => {
      const cssPath = path.resolve(__dirname, '../src/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain('@page');
      expect(cssContent).toMatch(/size:\s*100mm\s+50mm/);
      expect(cssContent).toMatch(/margin:\s*0/);
    });

    it('3.2 src/index.css previene expulsión de páginas en blanco con overflow hidden y dimensiones estrictas', () => {
      const cssPath = path.resolve(__dirname, '../src/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain('.printable-label-page');
      expect(cssContent).toMatch(/width:\s*100mm\s*!important/);
      expect(cssContent).toMatch(/height:\s*50mm\s*!important/);
      expect(cssContent).toMatch(/overflow:\s*hidden\s*!important/);
      expect(cssContent).toMatch(/page-break-after:\s*always\s*!important/);
      expect(cssContent).toContain('.printable-label-page:last-child');
      expect(cssContent).toMatch(/page-break-after:\s*auto\s*!important/);
    });
  });
});
