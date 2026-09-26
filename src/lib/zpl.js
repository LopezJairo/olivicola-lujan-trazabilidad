/**
 * Generador de Comandos ZPL II (Zebra Programming Language)
 * Calibrado específicamente para la impresora térmica Zebra GC420t:
 * - Resolución: 203 dpi (8 dots/mm)
 * - Tamaño de etiqueta de planta: 100 mm × 50 mm
 * - Píxeles/Dots: 800 dots de ancho × 400 dots de alto
 * - Sensor: Gap (separación entre etiquetas)
 */

/**
 * Limpia y normaliza texto para comandos ZPL, manejando caracteres especiales y acentos.
 */
export function sanitizeZplText(text) {
  if (text == null) return '';
  return String(text)
    .replace(/\^/g, ' ') // Carácter de control ZPL
    .replace(/~/g, ' ')  // Carácter de control ZPL
    .trim();
}

/**
 * Calcula dinámicamente la geometría óptima del código de barras CODE 128
 * para asegurar que nunca exceda el ancho físico de la etiqueta (800 dots @ 203 dpi)
 * y quede centrado horizontalmente con zonas de silencio (quiet zones) simétricas.
 *
 * @param {string} value Valor a codificar
 * @param {number} maxPrintWidth Ancho máximo de la etiqueta en dots (default 800)
 * @param {number} defaultModuleWidth Módulo preferido (default 2 dots)
 * @returns {{ moduleWidth: number, xPos: number, estWidth: number }}
 */
export function calculateBarcodeGeometry(value, maxPrintWidth = 800, defaultModuleWidth = 2) {
  if (!value) return { moduleWidth: defaultModuleWidth, xPos: 40, estWidth: 200 };

  // Estimación de módulos en Code 128 con optimización Subset C para bloques de dígitos
  // Símbolos de control fijos: Start(11), Checksum(11), Stop(13), Quiet zones de seguridad(20) = 55 módulos
  let modules = 55;
  let i = 0;
  while (i < value.length) {
    if (i + 3 < value.length && /^\d{4}/.test(value.slice(i, i + 4))) {
      let digitCount = 0;
      while (i + digitCount < value.length && /\d/.test(value[i + digitCount])) {
        digitCount++;
      }
      modules += 11 + Math.ceil(digitCount / 2) * 11;
      i += digitCount;
    } else {
      modules += 11;
      i++;
    }
  }

  let moduleWidth = defaultModuleWidth;
  let estWidth = modules * moduleWidth;

  // Si excede el ancho útil con margen de seguridad de al menos 20 dots totales
  if (estWidth > maxPrintWidth - 20) {
    if (modules * 2 <= maxPrintWidth - 8) {
      moduleWidth = 2;
      estWidth = modules * moduleWidth;
    } else {
      moduleWidth = 1;
      estWidth = modules * moduleWidth;
    }
  }

  // Centrado horizontal simétrico con margen mínimo garantizado
  const xPos = Math.max(12, Math.floor((maxPrintWidth - estWidth) / 2));
  return { moduleWidth, xPos, estWidth };
}

/**
 * Genera el comando ZPL II para la etiqueta de un tambor individual.
 * Formato apaisado 100mm × 50mm (800 × 400 dots @ 203 dpi)
 *
 * @param {Object} drum Objeto tambor con tambor_id, codigo, codigo_descriptivo, etc.
 * @param {Object} options Opciones adicionales (dpi, ancho, alto)
 * @returns {string} Código ZPL II completo (^XA ... ^XZ)
 */
export function generateDrumZPL(drum, options = {}) {
  if (!drum) return '';

  const widthDots = options.widthDots || 800; // 100 mm @ 203 dpi
  const heightDots = options.heightDots || 400; // 50 mm @ 203 dpi

  const tamborId = sanitizeZplText(drum.tambor_id || 'T000000');
  const codigoDescriptivo = sanitizeZplText(drum.codigo_descriptivo || drum.codigo || '');
  const codigoCompacto = sanitizeZplText(drum.codigo_compacto || '');
  
  // Código único con ID para trazabilidad y deduplicación exacta
  const uniqueCode = sanitizeZplText(
    drum.codigo ||
    (drum.codigo_descriptivo && drum.tambor_id
      ? `${drum.codigo_descriptivo}-${drum.tambor_id}`
      : drum.tambor_id)
  );

  const barcodeValue = uniqueCode || codigoCompacto || tamborId;
  const lote = sanitizeZplText(drum.lote || '—');
  const peso = drum.peso != null ? `${drum.peso} kg` : '—';
  const ubicacion = sanitizeZplText(drum.ubicacion_nombre || drum.ubicacion || '—');

  // Cálculo calibrado de geometría de código de barras
  const barcodeGeo = calculateBarcodeGeometry(barcodeValue, widthDots, 2);
  const barcodeModuleWidth = barcodeGeo.moduleWidth;
  const barcodeX = barcodeGeo.xPos;
  const barcodeHeight = 180; // Altura generosa aprovechando el espacio limpio

  return [
    '^XA',
    `^PW${widthDots}`,
    `^LL${heightDots}`,
    '^LS0',
    '^CI28', // UTF-8 Encoding
    // Cabecera: Código Descriptivo + Badge de Tambor ID
    `^FO40,32^A0N,32,30^FB520,1,0,L,0^FD${codigoDescriptivo}^FS`,
    // Badge invertido negro para Tambor ID
    `^FO580,24^GB180,42,42,B,1^FS`,
    `^FO580,32^A0N,28,26^FR^FB180,1,0,C,0^FDTambor ${tamborId}^FS`,
    // Renglón de Empresa
    `^FO40,82^A0N,28,26^FB720,1,0,C,0^FDOLIVICOLA LUJAN^FS`,
    // Línea divisoria superior
    `^FO40,120^GB720,2,2^FS`,
    // Código de Barras CODE 128 limpio y centrado (sin texto ni pie debajo)
    `^BY${barcodeModuleWidth},3,${barcodeHeight}`,
    `^FO${barcodeX},145^BCN,${barcodeHeight},N,N,N,A^FD${barcodeValue}^FS`,
    '^XZ',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Genera el comando ZPL II para la etiqueta de un Sector de Planta (columna / poste).
 * Formato apaisado 100mm × 50mm (800 × 400 dots @ 203 dpi)
 *
 * @param {Object} sector Objeto sector con id, codigo, nombre
 * @param {Object} options Opciones adicionales
 * @returns {string} Código ZPL II completo (^XA ... ^XZ)
 */
export function generateSectorZPL(sector, options = {}) {
  if (!sector) return '';

  const widthDots = options.widthDots || 800;
  const heightDots = options.heightDots || 400;

  const sectorCode = sanitizeZplText(sector.codigo || sector.id || '');
  const sectorName = sanitizeZplText(sector.nombre || sector.codigo || 'Sector');

  const barcodeGeo = calculateBarcodeGeometry(sectorCode, widthDots, 3);
  const barcodeModuleWidth = barcodeGeo.moduleWidth;
  const barcodeX = barcodeGeo.xPos;
  const barcodeHeight = 115;

  return [
    '^XA',
    `^PW${widthDots}`,
    `^LL${heightDots}`,
    '^LS0',
    '^CI28',
    // Cabecera institucional de sector
    `^FO40,25^A0N,20,18^FB200,1,0,L,0^FDPlanta Lujan de Cuyo^FS`,
    `^FO40,22^A0N,24,22^FB720,1,0,C,0^FDOLIVICOLA LUJAN^FS`,
    `^FO560,25^A0N,20,18^FB200,1,0,R,0^FDControl Sector^FS`,
    `^FO40,55^GB720,2,2^FS`,
    // Subtítulo y Nombre Destacado del Sector
    `^FO40,70^A0N,20,18^FB720,1,0,C,0^FDSector de Almacenamiento^FS`,
    `^FO40,96^A0N,36,34^FB720,1,0,C,0^FD${sectorName}^FS`,
    // Código de barras CODE 128 amplio para lectura a distancia
    `^BY${barcodeModuleWidth},3,${barcodeHeight}`,
    `^FO${barcodeX},148^BCN,${barcodeHeight},N,N,N,A^FD${sectorCode}^FS`,
    // Código del sector legible
    `^FO40,278^A0N,30,28^FB720,1,0,C,0^FD* ${sectorCode} *^FS`,
    `^FO40,318^GB720,2,2^FS`,
    // Pie con instrucción operativa
    `^FO40,335^A0N,20,18^FB720,1,0,C,0^FDEscanear este codigo para registrar inventario en este sector^FS`,
    '^XZ',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Genera el comando ZPL II para una etiqueta de calibración del escáner HPRT N130BT.
 *
 * @param {Object} command Objeto con code, title, description, badge, instructions
 * @param {Object} options Opciones adicionales
 * @returns {string} Código ZPL II completo
 */
export function generateHprtCalibrationZPL(command, options = {}) {
  if (!command) return '';
  const widthDots = options.widthDots || 800;
  const heightDots = options.heightDots || 400;

  const code = sanitizeZplText(command.code || '');
  const title = sanitizeZplText(command.title || 'Calibracion HPRT N130BT');
  const description = sanitizeZplText(command.description || '');
  const badge = sanitizeZplText(command.badge || 'Config');
  const barcodeGeo = calculateBarcodeGeometry(code, widthDots, 2);

  return [
    '^XA',
    `^PW${widthDots}`,
    `^LL${heightDots}`,
    '^LS0',
    '^CI28',
    `^FO40,22^A0N,20,18^FB520,1,0,L,0^FDHPRT N130BT - CODIGO DE CALIBRACION^FS`,
    `^FO580,18^GB180,30,30,B,1^FS`,
    `^FO580,22^A0N,20,18^FR^FB180,1,0,C,0^FD${badge}^FS`,
    `^FO40,52^GB720,2,2^FS`,
    `^FO40,68^A0N,24,22^FB720,1,0,C,0^FD${title}^FS`,
    `^BY${barcodeGeo.moduleWidth},3,105`,
    `^FO${barcodeGeo.xPos},102^BCN,105,N,N,N,A^FD${code}^FS`,
    `^FO40,218^A0N,28,26^FB720,1,0,C,0^FD${code}^FS`,
    `^FO40,252^GB720,2,2^FS`,
    `^FO40,265^A0N,20,18^FB720,2,0,C,0^FD${description}^FS`,
    `^FO40,325^A0N,18,16^FB720,1,0,C,0^FDOlivicola Lujan - Tablero de Mantenimiento de Hardware^FS`,
    '^XZ',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Concatena la generación ZPL para un lote de tambores o sectores en un único stream de impresión.
 * Cada elemento se imprime como una etiqueta individual delimitada por ^XA y ^XZ.
 *
 * @param {Array} items Lista de tambores, sectores o comandos
 * @param {'drum'|'sector'|'calibration'} type Tipo de etiqueta
 * @param {Object} options Opciones de geometría y dpi
 * @returns {string} Stream ZPL concatenado
 */
export function generateBatchZPL(items = [], type = 'drum', options = {}) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return items
    .map((item) => {
      if (type === 'sector') return generateSectorZPL(item, options);
      if (type === 'calibration') return generateHprtCalibrationZPL(item, options);
      return generateDrumZPL(item, options);
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Descarga una cadena ZPL como archivo descargable (.zpl) para envío directo
 * a la Zebra GC420t (Zebra Setup Utilities, Zebra Browser Print o puerto RAW).
 *
 * @param {string} zplContent Contenido ZPL
 * @param {string} filename Nombre del archivo sin o con extensión .zpl
 */
export function downloadZplFile(zplContent, filename = 'etiquetas-zebra-gc420t.zpl') {
  if (!zplContent) return;
  const safeFilename = filename.endsWith('.zpl') ? filename : `${filename}.zpl`;
  const blob = new Blob([zplContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copia el código ZPL al portapapeles del sistema operativo.
 *
 * @param {string} zplContent Contenido ZPL
 * @returns {Promise<boolean>} True si se copió con éxito
 */
export async function copyZplToClipboard(zplContent) {
  if (!zplContent) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(zplContent);
      return true;
    }
  } catch (err) {
    console.warn('Fallo al copiar con navigator.clipboard, usando fallback textarea:', err);
  }

  // Fallback con elemento textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = zplContent;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Error al copiar ZPL al portapapeles:', err);
    return false;
  }
}
