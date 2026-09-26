/**
 * Utilidades para el Escáner HPRT N130BT y procesamiento de ráfagas HID de teclado.
 *
 * El escáner HPRT N130BT cuenta con memoria interna de inventario (Storage / Batch Mode).
 * Al escanear el código "Upload Data", vuelca toda la memoria en una ráfaga continua
 * emulando un teclado HID a alta velocidad (< 15-30ms por tecla).
 * Esta librería provee sanitización de delimitadores, detección de ráfagas y
 * definiciones de códigos de barras de configuración de hardware.
 */

/**
 * Códigos de configuración oficiales para el escáner inalámbrico HPRT N130BT.
 * Permiten calibrar el lector apuntando directamente a la pantalla o a una hoja impresa.
 */
export const HPRT_N130BT_COMMANDS = [
  {
    id: 'storage_mode',
    code: '%0101D01%',
    altCode: 'SET-STORAGE-MODE',
    title: '1. Activar Modo Almacenamiento (Inventario)',
    category: 'Modo de Operación',
    badge: 'Memoria Interna',
    description:
      'Guarda los códigos leídos en la memoria flash interna del escáner (hasta 100.000 códigos) sin transmitirlos inmediatamente.',
    instructions:
      'Escanear al iniciar la ronda de inventario en planta para trabajar sin alcance Bluetooth/2.4G.',
  },
  {
    id: 'upload_data',
    code: '%0101D02%',
    altCode: 'UPLOAD-STORED-DATA',
    title: '2. Subir Datos de Memoria a la App (Upload Data)',
    category: 'Transmisión',
    badge: 'Volcado Rápido',
    description:
      'Transmite todos los códigos almacenados en ráfaga hacia la computadora o tablet conectada.',
    instructions:
      'Abrir la pantalla de "Toma de Inventario" y escanear este código frente a la pantalla para volcar el lote.',
  },
  {
    id: 'show_total',
    code: '%0101D03%',
    altCode: 'SHOW-TOTAL-DATA',
    title: '3. Mostrar Cantidad de Tambores en Memoria',
    category: 'Diagnóstico',
    badge: 'Conteo',
    description:
      'Informa la cantidad total de códigos guardados en la memoria antes de descargarlos.',
    instructions:
      'Escanear para comprobar cuántos tambores han sido leídos en la recorrida de planta.',
  },
  {
    id: 'clear_data',
    code: '%0101D04%',
    altCode: 'CLEAR-ALL-DATA',
    title: '4. Limpiar Memoria Interna (Borrar Datos)',
    category: 'Mantenimiento',
    badge: 'Precaución',
    description:
      'Borra permanentemente todos los códigos guardados en la memoria interna del escáner.',
    instructions:
      'Escanear ÚNICAMENTE después de haber verificado y aplicado el inventario en el sistema.',
  },
  {
    id: 'suffix_cr',
    code: '%0501D01%',
    altCode: 'SUFFIX-CR-ENTER',
    title: '5. Activar Sufijo Enter / Retorno de Carro (CR)',
    category: 'Configuración Teclado',
    badge: 'Recomendado',
    description:
      'Agrega un salto de línea (Enter) automático al finalizar cada código escaneado.',
    instructions:
      'Imprescindible para que el sistema procese automáticamente cada tambor sin pulsar Enter.',
  },
  {
    id: 'suffix_crlf',
    code: '%0501D02%',
    altCode: 'SUFFIX-CRLF',
    title: '6. Activar Sufijo Enter + Nueva Línea (CR + LF)',
    category: 'Configuración Teclado',
    badge: 'Alternativo',
    description:
      'Agrega Retorno de Carro y Salto de Línea (CR+LF) tras cada lectura en modo ráfaga.',
    instructions:
      'Utilizar si el modo de un solo Enter no salta de renglón en navegadores específicos.',
  },
  {
    id: 'normal_mode',
    code: '%0101D00%',
    altCode: 'SET-NORMAL-MODE',
    title: '7. Modo Normal / Transmisión Inmediata (Directo)',
    category: 'Modo de Operación',
    badge: 'Puesto Fijo',
    description:
      'Cada lectura se envía inmediatamente por USB o Bluetooth sin acumularse en memoria.',
    instructions:
      'Escanear para devolver el lector a su funcionamiento estándar en puestos de consulta rápida.',
  },
  {
    id: 'restore_factory',
    code: '%0000D00%',
    altCode: 'RESTORE-FACTORY',
    title: '8. Restablecer Configuración de Fábrica',
    category: 'Recuperación',
    badge: 'Reset Total',
    description:
      'Restaura todos los parámetros del HPRT N130BT a sus valores originales de fábrica.',
    instructions:
      'Utilizar si el escáner no responde o envía caracteres desordenados por mala configuración.',
  },
];

/**
 * Comprueba si un código escaneado corresponde a un comando de configuración oficial de HPRT.
 *
 * @param {string} code Código crudo
 * @returns {Object|null} Definición del comando o null
 */
export function isHprtCommand(code) {
  if (!code || typeof code !== 'string') return null;
  const norm = code.trim().toUpperCase();
  return (
    HPRT_N130BT_COMMANDS.find(
      (cmd) => cmd.code.toUpperCase() === norm || cmd.altCode.toUpperCase() === norm
    ) || null
  );
}

/**
 * Parsea y sanitiza una entrada de texto o stream proveniente de la ráfaga de un escáner.
 * Tolera múltiples delimitadores: \r\n, \n, \r, \t, comas, puntos y comas.
 * Descarta líneas vacías y comentarios de texto (iniciados con // o #).
 *
 * @param {string|Array<string>} rawInput Cadena cruda o arreglo de lecturas
 * @returns {{ tokens: string[], count: number, delimitersDetected: string[] }}
 */
export function parseScannerStream(rawInput) {
  if (!rawInput) {
    return { tokens: [], count: 0, delimitersDetected: [] };
  }

  let text = '';
  if (Array.isArray(rawInput)) {
    text = rawInput.join('\n');
  } else {
    text = String(rawInput);
  }

  const delimitersDetected = [];
  if (text.includes('\r\n') || text.includes('\n') || text.includes('\r')) {
    delimitersDetected.push('Salto de línea (Enter)');
  }
  if (text.includes('\t')) {
    delimitersDetected.push('Tabulación (Tab)');
  }
  if (text.includes(',')) {
    delimitersDetected.push('Coma (,)');
  }
  if (text.includes(';')) {
    delimitersDetected.push('Punto y coma (;)');
  }

  // Normalizar todos los separadores a saltos de línea uniformes
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '\n')
    .replace(/[,;]/g, '\n');

  const tokens = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'));

  return {
    tokens,
    count: tokens.length,
    delimitersDetected,
  };
}

/**
 * Buffer acumulador para pulsaciones rápidas y ráfagas procedentes de un lector HID de código de barras.
 * Provee agregación automática de ráfagas masivas (Upload Data), manejo de delimitadores (Enter, Tab, comas)
 * y prevención de pérdida de foco en navegadores web.
 */
export class FastScannerBuffer {
  constructor({ onToken, onBurst, thresholdMs = 50, burstWindowMs = 220 } = {}) {
    this.buffer = '';
    this.lastTime = 0;
    this.thresholdMs = thresholdMs;
    this.burstWindowMs = burstWindowMs;
    this.onToken = onToken || (() => {});
    this.onBurst = onBurst || (() => {});
    this.burstQueue = [];
    this.burstTimeout = null;
  }

  handleKeyDown(event) {
    const now = Date.now();
    this.lastTime = now;

    // Tecla de confirmación / delimitador de escáner
    if (event.key === 'Enter' || event.key === 'Tab') {
      if (event.key === 'Tab') {
        event.preventDefault?.();
      }
      const token = this.buffer.trim();
      this.buffer = '';
      if (token) {
        this.processToken(token);
      }
      return;
    }

    // Delimitador por comas o punto y coma en ráfagas configuradas
    if (event.key === ',' || event.key === ';') {
      const token = this.buffer.trim();
      this.buffer = '';
      if (token) {
        this.processToken(token);
      }
      return;
    }

    // Caracteres imprimibles estándar
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      this.buffer += event.key;
    }
  }

  processToken(rawToken) {
    const { tokens } = parseScannerStream(rawToken);
    if (tokens.length === 0) return;

    tokens.forEach((t) => {
      this.burstQueue.push(t);
      this.onToken(t);
    });

    // Mantener la ventana de tiempo abierta mientras continúen llegando lecturas en ráfaga
    clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(() => {
      if (this.burstQueue.length > 1) {
        this.onBurst([...this.burstQueue]);
      }
      this.burstQueue = [];
    }, this.burstWindowMs);
  }

  flush() {
    const token = this.buffer.trim();
    this.buffer = '';
    if (token) {
      this.processToken(token);
    }
  }

  clear() {
    this.buffer = '';
    this.burstQueue = [];
    clearTimeout(this.burstTimeout);
  }
}
