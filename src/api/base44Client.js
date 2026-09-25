/**
 * Cliente de conexión con Base44
 * Si VITE_BASE44_APP_ID está configurado, intenta inicializar el SDK de Base44.
 * Si no está configurado, la aplicación opera en modo local con almacenamiento del navegador.
 */

const APP_ID = import.meta.env.VITE_BASE44_APP_ID;

let base44Client = null;

if (APP_ID && APP_ID.trim().length > 0) {
  try {
    // Si la librería Base44 estuviese instalada en un entorno conectado:
    // const { createClient } = await import('@base44/sdk');
    // base44Client = createClient({ appId: APP_ID });
    console.info(`[Base44] Configurado con App ID: ${APP_ID}`);
  } catch (err) {
    console.warn('[Base44] Error al inicializar cliente Base44:', err);
  }
}

export const isBase44Configured = Boolean(APP_ID && APP_ID.trim().length > 0 && base44Client);
export const base44AppId = APP_ID || null;
export const base44 = base44Client;
