/**
 * OLIVÍCOLA LUJÁN · Proceso Principal de Electron (Desktop App)
 * Soporte para empaquetado de escritorio en Windows (.exe) y macOS (.dmg).
 * Gestiona ciclo de vida de ventana, hardware de impresión, diálogo de respaldo y servidor embebido.
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

let mainWindow = null;
let httpServerInstance = null;
let serverPort = 4000;
let isServerRunning = false;

// Obtener IPs locales de LAN
function getLocalIps() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push({ iface: name, ip: net.address });
      }
    }
  }
  return results;
}

// Iniciar servidor local embebido directamente en el proceso principal de Electron
async function startEmbeddedServer(port = 4000) {
  if (httpServerInstance) {
    return { isRunning: true, port: serverPort, ips: getLocalIps() };
  }

  try {
    const serverModule = await import('../server/index.js');
    const dbPath = path.join(app.getPath('userData'), 'olivicola-lujan.db.json');
    httpServerInstance = serverModule.createServer({ dbPath });

    const result = await httpServerInstance.listen(port, '0.0.0.0');
    serverPort = result?.port || port;
    isServerRunning = true;
    console.log(`[Host Server] Servidor LAN escuchando en http://0.0.0.0:${serverPort}`);

    return { isRunning: true, port: serverPort, ips: getLocalIps() };
  } catch (err) {
    console.error('[Host Server Exception]', err);
    if (httpServerInstance) {
      try {
        await httpServerInstance.close();
      } catch {}
    }
    httpServerInstance = null;
    isServerRunning = false;
    return { isRunning: false, error: err.message, ips: getLocalIps() };
  }
}

// Detener servidor local
async function stopEmbeddedServer() {
  if (httpServerInstance) {
    try {
      await httpServerInstance.close();
    } catch {}
    httpServerInstance = null;
    isServerRunning = false;
  }
}


let logsWindow = null;
const mainLogsBuffer = [];

function addLogEntry(entry) {
  const item = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: entry.time || new Date().toLocaleTimeString(),
    type: entry.type || 'info',
    source: entry.source || 'Sistema',
    message: String(entry.message || ''),
  };
  mainLogsBuffer.push(item);
  if (mainLogsBuffer.length > 300) {
    mainLogsBuffer.shift();
  }
  if (logsWindow && !logsWindow.isDestroyed()) {
    logsWindow.webContents.send('append-log', item);
  }
}

function openLogsWindow() {
  if (logsWindow && !logsWindow.isDestroyed()) {
    logsWindow.focus();
    return;
  }

  logsWindow = new BrowserWindow({
    width: 720,
    height: 520,
    minWidth: 500,
    minHeight: 350,
    title: 'Consola de Logs y Diagnóstico · Olivícola Luján',
    backgroundColor: '#121417',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Logs y Diagnóstico · Olivícola Luján</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #121417; color: #E5E7EB; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    header { background: #1A1D24; padding: 10px 14px; border-bottom: 1px solid #2D333F; display: flex; justify-content: space-between; align-items: center; }
    h1 { font-size: 13px; font-weight: 700; color: #10B981; letter-spacing: 0.5px; }
    .actions { display: flex; gap: 8px; }
    button { background: #2A303C; border: 1px solid #3F4756; color: #F3F4F6; padding: 5px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 600; }
    button:hover { background: #374151; }
    button.primary { background: #059669; border-color: #10B981; }
    button.primary:hover { background: #047857; }
    #logs-container { flex: 1; overflow-y: auto; padding: 12px; font-size: 11px; line-height: 1.5; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .log-entry { margin-bottom: 6px; word-break: break-all; padding: 2px 4px; border-radius: 4px; display: flex; gap: 8px; }
    .log-entry:hover { background: rgba(255,255,255,0.04); }
    .time { color: #6B7280; flex-shrink: 0; }
    .badge { font-weight: 700; text-transform: uppercase; font-size: 9px; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
    .badge-info { background: #1E3A8A; color: #93C5FD; }
    .badge-success { background: #064E3B; color: #6EE7B7; }
    .badge-warn { background: #78350F; color: #FCD34D; }
    .badge-error { background: #7F1D1D; color: #FCA5A5; }
    .source { color: #9CA3AF; font-weight: 600; flex-shrink: 0; }
    .msg { color: #F3F4F6; flex: 1; }
    footer { background: #1A1D24; padding: 6px 14px; border-top: 1px solid #2D333F; font-size: 10px; color: #6B7280; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <header>
    <h1>OLIVÍCOLA LUJÁN · CONSOLA DE DIAGNÓSTICO EN VIVO</h1>
    <div class="actions">
      <button class="primary" id="btn-copy">Copiar Registros</button>
      <button id="btn-clear">Limpiar</button>
      <button id="btn-reload-main">Recargar App Principal</button>
    </div>
  </header>
  <div id="logs-container"></div>
  <footer>
    <span id="log-count">0 eventos</span>
    <span>Atajo rápido: Cmd+Shift+L</span>
  </footer>
  <script>
    const container = document.getElementById('logs-container');
    const countEl = document.getElementById('log-count');
    const logs = [];

    function renderLog(l) {
      logs.push(l);
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.innerHTML = '<span class="time">[' + l.time + ']</span>' +
        '<span class="badge badge-' + (l.type || 'info') + '">' + (l.type || 'info') + '</span>' +
        '<span class="source">[' + (l.source || 'Sistema') + ']</span>' +
        '<span class="msg">' + escapeHtml(l.message) + '</span>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      countEl.innerText = logs.length + ' eventos registrados';
    }

    function escapeHtml(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    document.getElementById('btn-copy').onclick = () => {
      const text = logs.map(l => '[' + l.time + '] [' + (l.type || '').toUpperCase() + '] [' + l.source + ']: ' + l.message).join('\\n');
      navigator.clipboard.writeText(text);
      alert('Logs copiados al portapapeles');
    };

    document.getElementById('btn-clear').onclick = () => {
      container.innerHTML = '';
      logs.length = 0;
      countEl.innerText = '0 eventos registrados';
    };

    document.getElementById('btn-reload-main').onclick = () => {
      window.location.reload();
    };

    // Recibir logs desde el proceso principal
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'new-log') {
        renderLog(event.data.payload);
      }
    });
  </script>
</body>
</html>`;

  logsWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  logsWindow.webContents.on('did-finish-load', () => {
    mainLogsBuffer.forEach((entry) => {
      logsWindow.webContents.executeJavaScript(`renderLog(${JSON.stringify(entry)})`).catch(() => {});
    });
  });

  logsWindow.on('closed', () => {
    logsWindow = null;
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'Olivícola Luján · Sistema de Trazabilidad de Tambores',
    backgroundColor: '#F7F6F1',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false, // CRÍTICO: Permite cargar módulos ES locales y assets con file:// sin bloqueo de CORS
      allowRunningInsecureContent: true,
    },
  });

  // En desarrollo carga Vite Dev Server, en producción carga dist/index.html con loadFile
  const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(distIndexPath);
  }

  // Depuración activa de consola del renderer hacia terminal y buffer de logs
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const type = level === 3 ? 'error' : level === 2 ? 'warn' : 'info';
    const filename = sourceId ? path.basename(sourceId) : 'app';
    console.log(`[Renderer ${type.toUpperCase()}] ${message} (${filename}:${line})`);
    addLogEntry({
      type,
      source: 'Renderer',
      message: `${message} [${filename}:${line}]`,
      time: new Date().toLocaleTimeString(),
    });
  });

  // Captura de errores al cargar la interfaz de usuario
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] Error al cargar interfaz (${errorCode}): ${errorDescription} en ${validatedURL}`);
    addLogEntry({
      type: 'error',
      source: 'Electron',
      message: `Error al cargar interfaz (${errorCode}): ${errorDescription} (${validatedURL})`,
      time: new Date().toLocaleTimeString(),
    });
  });

  // Evitar navegación externa no deseada
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupMenu();
}


function setupMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Imprimir Pantalla / Etiqueta',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.print(),
        },
        { type: 'separator' },
        {
          label: 'Exportar Copia de Seguridad...',
          click: async () => {
            if (!mainWindow) return;
            mainWindow.webContents.send('trigger-export-backup');
          },
        },
        {
          label: 'Restaurar Copia de Seguridad...',
          click: async () => {
            if (!mainWindow) return;
            mainWindow.webContents.send('trigger-import-backup');
          },
        },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' },
      ],
    },
    {
      label: 'Edición',
      submenu: [
        { label: 'Deshacer', role: 'undo' },
        { label: 'Rehacer', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', role: 'cut' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Pegar', role: 'paste' },
        { label: 'Seleccionar todo', role: 'selectAll' },
      ],
    },
    {
      label: 'Red y Servidor',
      submenu: [
        {
          label: 'Ver IPs de Red Local (LAN)',
          click: () => {
            const ips = getLocalIps();
            const text = ips.length > 0
              ? ips.map(i => `${i.iface}: http://${i.ip}:${serverPort}`).join('\n')
              : 'No se detectaron adaptadores de red activos.';
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Direcciones IP de Red Local (LAN)',
              message: 'Conectividad de Terminales y Balanzas',
              detail: `Los terminales clientes deben conectarse a una de las siguientes IPs:\n\n${text}`,
            });
          },
        },
        {
          label: 'Iniciar Servidor Host LAN (Puerto 4000)',
          click: async () => {
            const res = await startEmbeddedServer(4000);
            dialog.showMessageBox(mainWindow, {
              type: res.isRunning ? 'info' : 'error',
              title: 'Servidor Host LAN',
              message: res.isRunning
                ? 'Servidor iniciado correctamente en el puerto 4000.'
                : `No se pudo iniciar el servidor: ${res.error || 'Error desconocido'}`,
            });
          },
        },
        {
          label: 'Detener Servidor Host LAN',
          click: async () => {
            await stopEmbeddedServer();
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Servidor Host LAN',
              message: 'Servidor detenido.',
            });
          },
        },
      ],
    },

    {
      label: 'Logs y Diagnóstico',
      submenu: [
        {
          label: 'Ver Consola de Logs en Pantalla',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            if (!mainWindow) return;
            mainWindow.webContents.send('navigate-to-logs');
          },
        },
        {
          label: 'Abrir Ventana Flotante de Logs',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => {
            openLogsWindow();
          },
        },
        { type: 'separator' },
        {
          label: 'Herramientas de Desarrollador (DevTools)',
          accelerator: 'Alt+CmdOrCtrl+I',
          click: () => {
            mainWindow?.webContents.toggleDevTools();
          },
        },
        {
          label: 'Copiar Diagnóstico al Portapapeles',
          click: () => {
            const ips = getLocalIps();
            const text = [
              `Plataforma: ${process.platform} (${process.arch})`,
              `Versión App: ${app.getVersion()}`,
              `Servidor Embebido: ${isServerRunning ? `Activo (Puerto ${serverPort})` : 'Detenido'}`,
              `IPs Locales: ${ips.map(i => `${i.iface}: ${i.ip}`).join(', ') || 'Ninguna'}`,
              `Últimos Registros (${mainLogsBuffer.length}):`,
              ...mainLogsBuffer.slice(-25).map(l => `[${l.time}] [${l.type.toUpperCase()}] [${l.source}]: ${l.message}`),
            ].join('\n');
            const { clipboard } = require('electron');
            clipboard.writeText(text);
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Diagnóstico de Sistema Copiado',
              message: 'El diagnóstico completo ha sido copiado al portapapeles.',
            });
          },
        },
      ],
    },
    {
      label: 'Ver',

      submenu: [
        { label: 'Recargar', role: 'reload' },
        { label: 'Forzar recarga', role: 'forceReload' },
        { label: 'Pantalla completa', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Herramientas de Desarrollador', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Manual de Usuario y Hardware',
          click: () => {
            if (process.env.ELECTRON_START_URL) {
              mainWindow?.loadURL(`${process.env.ELECTRON_START_URL}#/ayuda`);
            } else {
              mainWindow?.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), { hash: '/ayuda' });
            }
          },
        },
        {
          label: 'Acerca de Olivícola Luján Trazabilidad',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Olivícola Luján · Trazabilidad',
              message: 'Sistema Integral de Trazabilidad de Tambores',
              detail: 'Versión 1.0.0 (Windows / macOS / LAN Host-Client)\nCompatible con HPRT N130BT y Zebra GC420t.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// -------------------------------------------------------------
// IPC HANDLERS PARA COMUNICACIÓN PRELOAD -> MAIN
// -------------------------------------------------------------
ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    isElectron: true,
  };
});

ipcMain.handle('get-network-ips', () => {
  return getLocalIps();
});

ipcMain.handle('get-server-status', () => {
  return {
    isRunning: isServerRunning,
    port: serverPort,
    ips: getLocalIps(),
  };
});

ipcMain.handle('start-server', async (_event, port = 4000) => {
  return await startEmbeddedServer(port);
});

ipcMain.handle('stop-server', async () => {
  await stopEmbeddedServer();
  return { isRunning: false, port: serverPort, ips: getLocalIps() };
});


ipcMain.handle('open-logs-window', () => {
  openLogsWindow();
  return { success: true };
});

ipcMain.handle('log-to-main', (_event, entry) => {
  addLogEntry(entry);
  return { success: true };
});

app.whenReady().then(() => {

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopEmbeddedServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopEmbeddedServer();
});
