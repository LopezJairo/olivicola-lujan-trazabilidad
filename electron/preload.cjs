/**
 * OLIVÍCOLA LUJÁN · Script Preload de Electron
 * Expone de forma segura APIs del sistema operativo al renderer de React mediante contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getNetworkIps: () => ipcRenderer.invoke('get-network-ips'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  startServer: (port) => ipcRenderer.invoke('start-server', port),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  printZebraZPL: (zpl) => ipcRenderer.invoke('print-zebra-zpl', zpl),
  onExportBackup: (callback) => {
    ipcRenderer.on('trigger-export-backup', callback);
    return () => ipcRenderer.removeListener('trigger-export-backup', callback);
  },
  onImportBackup: (callback) => {
    ipcRenderer.on('trigger-import-backup', callback);
    return () => ipcRenderer.removeListener('trigger-import-backup', callback);
  },
  openLogsWindow: () => ipcRenderer.invoke('open-logs-window'),
  onNavigateToLogs: (callback) => {
    ipcRenderer.on('navigate-to-logs', callback);
    return () => ipcRenderer.removeListener('navigate-to-logs', callback);
  },
  logToMain: (entry) => ipcRenderer.invoke('log-to-main', entry),
});

