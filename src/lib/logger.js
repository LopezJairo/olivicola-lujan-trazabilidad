/**
 * OLIVÍCOLA LUJÁN · Sistema de Registro de Eventos y Diagnóstico de Red (Logger)
 * Captura en tiempo real peticiones de red, errores del servidor, sincronizaciones
 * y estados de conexión para facilitar el soporte técnico y la auditoría.
 */

const MAX_LOGS = 150;
const subscribers = new Set();
let logs = [];

function emitChange() {
  subscribers.forEach((cb) => {
    try {
      cb([...logs]);
    } catch {}
  });
}

export const logger = {
  getLogs() {
    return [...logs];
  },

  subscribe(callback) {
    subscribers.add(callback);
    callback([...logs]);
    return () => subscribers.delete(callback);
  },

  clear() {
    logs = [];
    emitChange();
  },

  add(type, source, message, details = null) {
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString(),
      type: type || 'info', // 'info' | 'success' | 'warn' | 'error'
      source: source || 'Sistema', // 'Red' | 'Servidor' | 'Cliente' | 'Auth'
      message: String(message),
      details: details ? (typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details)) : null,
    };

    logs = [entry, ...logs.slice(0, MAX_LOGS - 1)];

    // También registrar en la consola estándar del navegador/Electron
    const prefix = `[${entry.time}] [${entry.source}]`;
    if (type === 'error') {
      console.error(prefix, entry.message, details || '');
    } else if (type === 'warn') {
      console.warn(prefix, entry.message, details || '');
    } else {
      console.log(prefix, entry.message, details || '');
    }

    // Sincronizar con el proceso principal de Electron
    if (typeof window !== 'undefined' && window.electronAPI?.logToMain) {
      window.electronAPI.logToMain({
        type: entry.type,
        source: entry.source,
        message: entry.message + (details ? ` | ${entry.details}` : ''),
        time: entry.time,
      }).catch(() => {});
    }

    emitChange();
    return entry;
  },


  info(source, message, details) {
    return this.add('info', source, message, details);
  },

  success(source, message, details) {
    return this.add('success', source, message, details);
  },

  warn(source, message, details) {
    return this.add('warn', source, message, details);
  },

  error(source, message, details) {
    return this.add('error', source, message, details);
  },

  copyToClipboard() {
    const text = logs
      .map((l) => `[${l.time}] [${l.type.toUpperCase()}] [${l.source}]: ${l.message}${l.details ? `\n  Detalles: ${l.details}` : ''}`)
      .join('\n');
    return navigator.clipboard.writeText(text);
  },
};
