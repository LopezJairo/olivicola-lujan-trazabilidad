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
let serverProcess = null;
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

// Iniciar servidor local embebido en segundo plano
function startEmbeddedServer(port = 4000) {
  if (serverProcess) return;

  const serverScript = path.join(__dirname, '..', 'server', 'index.js');
  // ELECTRON_RUN_AS_NODE permite que el ejecutable de Electron ejecute scripts Node.js sin abrir otra ventana GUI
  const env = {
    ...process.env,
    PORT: String(port),
    HOST: '0.0.0.0',
    ELECTRON_RUN_AS_NODE: '1',
  };

  try {
    serverProcess = spawn(process.execPath, [serverScript], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout?.on('data', (data) => {
      console.log(`[Host Server] ${data.toString().trim()}`);
      isServerRunning = true;
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`[Host Server Error] ${data.toString().trim()}`);
    });

    serverProcess.on('error', (err) => {
      console.error(`[Host Server Error de Proceso] ${err.message}`);
      serverProcess = null;
      isServerRunning = false;
    });

    serverProcess.on('close', (code) => {
      console.log(`[Host Server] Finalizado con código ${code}`);
      serverProcess = null;
      isServerRunning = false;
    });

    serverPort = port;
    isServerRunning = true;
  } catch (err) {
    console.error('[Host Server Spawn Exception]', err);
    serverProcess = null;
    isServerRunning = false;
  }
}

// Detener servidor local
function stopEmbeddedServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
    isServerRunning = false;
  }
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
    },
  });

  // En desarrollo carga Vite Dev Server, en producción carga dist/index.html con loadFile
  const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(distIndexPath);
  }

  // Depuración de errores en carga de UI
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Electron] Error al cargar interfaz (${errorCode}): ${errorDescription}`);
  });

  // Evitar navegación externa
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
          click: () => {
            startEmbeddedServer(4000);
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Servidor Host LAN',
              message: 'Servidor iniciado correctamente en el puerto 4000.',
            });
          },
        },
        {
          label: 'Detener Servidor Host LAN',
          click: () => {
            stopEmbeddedServer();
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

ipcMain.handle('start-server', (_event, port = 4000) => {
  startEmbeddedServer(port);
  return { isRunning: isServerRunning, port };
});

ipcMain.handle('stop-server', () => {
  stopEmbeddedServer();
  return { isRunning: false };
});

ipcMain.handle('print-zebra-zpl', async (_event, zplContent) => {
  try {
    const bytes = typeof zplContent === 'string' ? Buffer.byteLength(zplContent, 'utf8') : 0;
    console.log('[Zebra ZPL Print Request]', bytes, 'bytes');
    return { success: true, bytes, timestamp: new Date().toISOString() };
  } catch (err) {
    return { success: false, error: err.message };
  }
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
