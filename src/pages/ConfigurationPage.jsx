import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Plus,
  Edit2,
  Check,
  X,
  Power,
  Download,
  Upload,
  RotateCcw,
  Database,
  Layers,
  Sparkles,
  AlertCircle,
  Printer,
  QrCode,
  Zap,
  Server,
  Wifi,
  WifiOff,
  Users,
  ShieldCheck,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import {
  loadDatabase,
  saveCatalogItem,
  toggleCatalogActive,
  exportDatabaseJSON,
  importDatabaseJSON,
  resetDemoDatabase,
  getCurrentWorkspaceMode,
  setCurrentWorkspaceMode,
  getNetworkConfig,
  setNetworkConfig,
  testHostConnection,
  syncWithHostServer,
  NETWORK_MODES,
} from '../api/repository.js';
import { useAuth, ROLES, ROLE_PERMISSIONS, PERMISOS } from '../components/Auth.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog.jsx';

const CATALOG_TYPES = [
  { key: 'producto', label: 'Productos', desc: 'Entera, Descarozada, Rodajas, Griegas, Rellenas, Rotas' },
  { key: 'presentacion', label: 'Presentaciones', desc: 'Verde, Negra, Base, Californiana, Clara, Para Griega, Sin Carozo, Con Pasta, Aceite' },
  { key: 'variedad', label: 'Variedades', desc: 'Aloreña, Arauco, Manzanilla Fina, Picual, Empeltre' },
  { key: 'calibre', label: 'Calibres', desc: '121/140, 141/160, 161/180, 181/200, 201/240, 241/280, Sin Calibre, etc.' },
  { key: 'calidad', label: 'Calidades', desc: 'Primera (PRI), Segunda (SDA), Tercera (TRA)' },
  { key: 'ubicacion', label: 'Ubicaciones', desc: 'Naves, Filas, Patios de fermentación, Despacho' },
  { key: 'estado', label: 'Estados de Proceso', desc: 'En fermentación, En reposo, Salmuera, Calibrado, etc.' },
  { key: 'tipo_movimiento', label: 'Tipos de Movimiento', desc: 'Traslados, Reubicación, Muestreo, Ingreso, Despacho' },
];

export function ConfigurationPage() {
  const [db, setDb] = useState(loadDatabase());
  const { catalogos } = db;
  const currentMode = getCurrentWorkspaceMode();

  const [activeTab, setActiveTab] = useState('variedad');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    nombre: '',
    codigo: '',
    orden: 1,
    activo: true,
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Perfiles y permisos
  const { user, role, switchRole, can } = useAuth();
  const canManageCatalogs = can(PERMISOS.GESTION_CATALOGOS);
  const canManageBackups = can(PERMISOS.GESTION_BACKUPS);
  const canConfigRed = can(PERMISOS.CONFIG_RED);

  // Arquitectura de Red y Modos
  const [netConfig, setNetConfigState] = useState(getNetworkConfig());
  const [hostUrlInput, setHostUrlInput] = useState(netConfig.hostUrl || 'http://localhost:4000');
  const [testResult, setTestResult] = useState(null);
  const [isTestingNet, setIsTestingNet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Detección y control de entorno de escritorio Electron
  const [electronState, setElectronState] = useState({
    isElectron: false,
    serverRunning: false,
    serverPort: 4000,
    ips: [],
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getServerStatus?.().then((st) => {
        setElectronState({
          isElectron: true,
          serverRunning: Boolean(st?.isRunning),
          serverPort: st?.port || 4000,
          ips: st?.ips || [],
        });
      }).catch(() => {});
    } else {
      // En navegador, consulta información de red del host si está en localhost
      fetch('http://localhost:4000/api/network-info').then(r => r.json()).then(data => {
        if (data?.interfaces) {
          setElectronState(prev => ({
            ...prev,
            ips: data.interfaces,
            serverRunning: true,
          }));
        }
      }).catch(() => {});
    }
  }, []);

  const handleStartElectronServer = async () => {
    if (window.electronAPI?.startServer) {
      const res = await window.electronAPI.startServer(4000);
      setElectronState(prev => ({ ...prev, serverRunning: true, serverPort: res?.port || 4000 }));
      setSuccessMessage('Servidor embebido iniciado correctamente en el puerto 4000.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const handleStopElectronServer = async () => {
    if (window.electronAPI?.stopServer) {
      await window.electronAPI.stopServer();
      setElectronState(prev => ({ ...prev, serverRunning: false }));
      setSuccessMessage('Servidor embebido detenido.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const handleSwitchNetworkMode = (newMode) => {
    if (!canConfigRed) {
      alert('Permiso denegado: Se requiere perfil de Administrador para modificar el modo de red');
      return;
    }
    const updated = setNetworkConfig({ mode: newMode });
    setNetConfigState(updated);
    setSuccessMessage(`Modo cambiado a: ${newMode === 'host' ? 'Servidor Host LAN' : newMode === 'client' ? 'Terminal Cliente LAN' : 'Modo Autónomo Local'}`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleTestConnection = async () => {
    setIsTestingNet(true);
    setTestResult(null);
    const res = await testHostConnection(hostUrlInput);
    setIsTestingNet(false);
    setTestResult(res);
    if (res.success) {
      setNetworkConfig({ hostUrl: hostUrlInput, status: 'connected' });
      setNetConfigState(getNetworkConfig());
    }
  };

  const handleSyncWithHost = async () => {
    setIsSyncing(true);
    const success = await syncWithHostServer();
    setIsSyncing(false);
    if (success) {
      setDb(loadDatabase());
      setSuccessMessage('Base de datos sincronizada con éxito desde el Servidor Host.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      alert('No se pudo establecer sincronización con el Servidor Host.');
    }
  };

  const currentTypeMeta = CATALOG_TYPES.find((t) => t.key === activeTab);

  const currentItems = useMemo(() => {
    return catalogos
      .filter((c) => c.tipo === activeTab)
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
  }, [catalogos, activeTab]);

  const handleOpenNew = () => {
    if (!canManageCatalogs) {
      alert('Permiso denegado: Se requiere perfil de Administrador para agregar opciones de catálogo.');
      return;
    }
    setEditingItem(null);
    setItemForm({
      nombre: '',
      codigo: '',
      orden: currentItems.length + 1,
      activo: true,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!canManageCatalogs) {
      alert('Permiso denegado: Se requiere perfil de Administrador para editar opciones de catálogo.');
      return;
    }
    setEditingItem(item);
    setItemForm({
      nombre: item.nombre,
      codigo: item.codigo,
      orden: item.orden,
      activo: item.activo,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!canManageCatalogs) {
      setFormError('Permiso denegado: Se requiere perfil de Administrador para guardar opciones de catálogo.');
      return;
    }

    try {
      await saveCatalogItem({
        id: editingItem?.id,
        tipo: activeTab,
        ...itemForm,
      }, user);
      setDb(loadDatabase());
      setModalOpen(false);
      setSuccessMessage('Opción de catálogo guardada con éxito.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleToggleActive = async (id) => {
    if (!canManageCatalogs) {
      alert('Permiso denegado: Se requiere perfil de Administrador para modificar catálogos.');
      return;
    }
    try {
      await toggleCatalogActive(id, user);
      setDb(loadDatabase());
    } catch (err) {
      alert(err.message);
    }
  };

  // Exportar Copia de Seguridad JSON
  const handleExportJSON = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trazabilidad-olivicola-lujan-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Importar Copia de Seguridad JSON
  const handleImportJSON = (e) => {
    if (!canManageBackups) {
      alert('Permiso denegado: Se requiere perfil de Administrador para restaurar copias de seguridad.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        importDatabaseJSON(text);
        setDb(loadDatabase());
        alert('Copia de seguridad restaurada correctamente.');
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    };
    reader.readAsText(file);
  };

  // Cambiar modo de espacio de trabajo
  const handleSwitchWorkspace = (newMode) => {
    if (newMode === currentMode) return;
    if (
      confirm(
        `¿Deseas cambiar al ${
          newMode === 'demo' ? 'Modo Demostración' : 'Espacio Empresa (Limpio para datos reales)'
        }?`
      )
    ) {
      setCurrentWorkspaceMode(newMode);
      window.location.reload();
    }
  };

  // Resetear demostración
  const handleResetDemo = () => {
    if (!canManageBackups) {
      alert('Permiso denegado: Se requiere perfil de Administrador para restablecer la base de datos.');
      return;
    }
    if (confirm('¿Restablecer el inventario de demostración a sus 12 tambores originales?')) {
      resetDemoDatabase();
      setDb(loadDatabase());
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* ---------------- CABECERA ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Administración Central
            </span>
            <span className="text-bone-400 text-xs font-mono">· Catálogos Dinámicos</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Configuración y Catálogos
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Administra las opciones seleccionables en planta y respalda la base de datos local.
          </p>
        </div>

        <Button variant="primary" size="default" onClick={handleOpenNew} className="text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Agregar Opción a {currentTypeMeta?.label}
        </Button>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium">
          {successMessage}
        </div>
      )}

      {/* ---------------- PESTAÑAS DE CATÁLOGOS ---------------- */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-bone-200">
        {CATALOG_TYPES.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => setActiveTab(type.key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === type.key
                ? 'bg-obsidian text-bone-50 shadow-soft-sm font-semibold'
                : 'bg-white text-bone-700 hover:bg-bone-100 border border-bone-300'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* ---------------- TABLA DE OPCIONES DEL CATÁLOGO ---------------- */}
      <div className="bezel-shell">
        <div className="bezel-core p-0 overflow-x-auto bg-white">
          <div className="p-4 bg-bone-50/70 border-b border-bone-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-obsidian text-sm">{currentTypeMeta?.label}</span>
              <p className="text-bone-500 text-[11px]">{currentTypeMeta?.desc}</p>
            </div>
            <span className="font-mono text-bone-500">
              {currentItems.length} opciones configuradas
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-bone-200 bg-bone-50/40 font-mono text-[11px] text-bone-600 uppercase tracking-wider">
                <th className="p-3 w-16 text-center">Orden</th>
                <th className="p-3 font-semibold">Nombre Visible</th>
                <th className="p-3 font-semibold">Código en Tambor</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-100">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-bone-50/60 transition-colors">
                  <td className="p-3 text-center font-mono font-bold text-bone-600">
                    {item.orden}
                  </td>
                  <td className="p-3 font-semibold text-obsidian">
                    {item.nombre}
                  </td>
                  <td className="p-3">
                    <span className="font-mono font-bold text-xs bg-bone-100 text-obsidian px-2 py-0.5 rounded">
                      {item.codigo}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge variant={item.activo ? 'paleGreen' : 'default'} dot={item.activo}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(item.id)}
                        className="text-[11px] h-7 px-2.5"
                      >
                        <Power className="w-3 h-3 mr-1" />
                        {item.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="text-[11px] h-7 px-2.5"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- HARDWARE OFICIAL DE PLANTA ---------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-olive-800" />
              <CardTitle className="text-base font-bold">
                Hardware Oficial de Planta (Zebra GC420t & HPRT N130BT)
              </CardTitle>
            </div>
            <Link to="/ayuda">
              <Button variant="outline" size="sm" className="text-xs">
                Ver Guía y Códigos de Calibración →
              </Button>
            </Link>
          </div>
          <p className="text-xs text-bone-600">
            Parámetros de calibración y compatibilidad verificada para la operación en Luján de Cuyo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-bone-200 bg-bone-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-obsidian flex items-center gap-2">
                  <Printer className="w-4 h-4 text-olive-800" />
                  Impresora Térmica Zebra GC420t
                </span>
                <Badge variant="paleGreen" className="text-[10px] font-mono">
                  203 DPI / 8 dots/mm
                </Badge>
              </div>
              <ul className="text-bone-600 space-y-1 font-mono text-[11px]">
                <li>• Formato de etiqueta: <strong>100 mm × 50 mm</strong> (800 × 400 dots)</li>
                <li>• Sensor de separación: <strong>Gap transductor</strong></li>
                <li>• Lenguaje de comandos: <strong>ZPL II nativo (^XA ... ^XZ)</strong></li>
                <li>• Driver Web: <strong>CSS @page &#123; size: 100mm 50mm; margin: 0; &#125;</strong></li>
              </ul>
              <div className="pt-1">
                <Link to="/etiquetas">
                  <Button variant="secondary" size="sm" className="w-full text-xs font-mono">
                    Ir al Centro de Impresión ZPL
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-bone-200 bg-bone-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-obsidian flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-olive-800" />
                  Lector Inalámbrico HPRT N130BT
                </span>
                <Badge variant="paleGreen" className="text-[10px] font-mono">
                  Memoria Flash HID
                </Badge>
              </div>
              <ul className="text-bone-600 space-y-1 font-mono text-[11px]">
                <li>• Modos soportados: <strong>Normal (Directo) & Almacenamiento</strong></li>
                <li>• Transmisión: <strong>Ráfaga HID rápida por comando Upload Data</strong></li>
                <li>• Delimitadores tolerados: <strong>Enter (\r\n, \n, \r), Tab (\t), Coma</strong></li>
                <li>• Deduplicación: <strong>ID único de tambor para evitar doble conteo</strong></li>
              </ul>
              <div className="pt-1">
                <Link to="/ayuda">
                  <Button variant="secondary" size="sm" className="w-full text-xs font-mono">
                    Abrir Códigos de Calibración
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- GESTIÓN DE DATOS Y COPIAS DE SEGURIDAD ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-olive-800" />
            <span>Gestión de Datos y Copias de Seguridad</span>
          </CardTitle>
          <p className="text-xs text-bone-600">
            Control de entornos, exportación de inventario e importación para evitar pérdida de datos en planta.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 text-xs">
          {/* Alternar Entornos */}
          <div className="p-4 rounded-xl border border-bone-200 bg-bone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold text-obsidian block text-sm">
                Espacio de Trabajo Activo
              </span>
              <p className="text-bone-600 text-xs mt-0.5">
                {currentMode === 'demo'
                  ? 'Modo Demostración (contiene los 12 tambores de prueba).'
                  : 'Espacio Empresa (espacio limpio listo para registrar lotes reales sin mezclar ejemplos).'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={currentMode === 'demo' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSwitchWorkspace('demo')}
                className="text-xs"
              >
                Espacio Demo
              </Button>
              <Button
                variant={currentMode === 'empresa' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSwitchWorkspace('empresa')}
                className="text-xs"
              >
                Espacio Empresa
              </Button>
            </div>
          </div>

          {/* Exportar / Importar / Resetear */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Exportar JSON */}
            <div className="p-4 rounded-xl border border-bone-200 bg-white space-y-2">
              <span className="font-bold text-obsidian block">Exportar Copia JSON</span>
              <p className="text-bone-600 text-[11px]">
                Descarga un archivo completo con tambores, movimientos, historial y catálogos.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                className="w-full text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Descargar Respaldo
              </Button>
            </div>

            {/* Importar JSON */}
            <div className="p-4 rounded-xl border border-bone-200 bg-white space-y-2">
              <span className="font-bold text-obsidian block">Restaurar Copia JSON</span>
              <p className="text-bone-600 text-[11px]">
                Restaura un inventario respaldado previamente desde tu computadora.
              </p>
              <label className="cursor-pointer block">
                <span className="inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] bg-white text-obsidian hover:bg-bone-100 border border-bone-300 h-8 px-3 text-xs rounded-md w-full">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Cargar Archivo JSON
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>

            {/* Restablecer Demo */}
            <div className="p-4 rounded-xl border border-bone-200 bg-white space-y-2">
              <span className="font-bold text-obsidian block">Restablecer Ejemplos</span>
              <p className="text-bone-600 text-[11px]">
                Vuelve a cargar los 12 tambores iniciales de demostración de Olivícola Luján.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetDemo}
                className="w-full text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Restablecer Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- ARQUITECTURA DE RED Y SERVIDOR EMBEBIDO ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Server className="w-4 h-4 text-olive-800" />
            <span>Arquitectura de Red y Servidor Local Embebido</span>
          </CardTitle>
          <p className="text-xs text-bone-600">
            Configura el modo de operación para trabajar en red local (LAN) o de forma autónoma.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 text-xs">
          {/* Selector de Modos de Red */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Modo Autónomo */}
            <div
              onClick={() => handleSwitchNetworkMode(NETWORK_MODES.OFFLINE)}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                netConfig.mode === NETWORK_MODES.OFFLINE
                  ? 'border-obsidian bg-bone-100 shadow-soft-sm ring-1 ring-obsidian'
                  : 'border-bone-200 bg-white hover:border-bone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-obsidian flex items-center gap-1.5">
                  <WifiOff className="w-4 h-4 text-bone-600" />
                  Modo Autónomo
                </span>
                {netConfig.mode === NETWORK_MODES.OFFLINE && <Badge variant="default">Activo</Badge>}
              </div>
              <p className="text-bone-600 text-[11px] leading-relaxed">
                Opera de forma 100% local en este equipo sin requerir red Wi-Fi ni servidor central. Ideal para contingencias.
              </p>
            </div>

            {/* 2. Modo Servidor Host */}
            <div
              onClick={() => handleSwitchNetworkMode(NETWORK_MODES.HOST)}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                netConfig.mode === NETWORK_MODES.HOST
                  ? 'border-emerald-600 bg-emerald-50 shadow-soft-sm ring-1 ring-emerald-600'
                  : 'border-bone-200 bg-white hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-obsidian flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-700" />
                  Servidor Host (LAN)
                </span>
                {netConfig.mode === NETWORK_MODES.HOST && <Badge variant="paleGreen">Activo</Badge>}
              </div>
              <p className="text-bone-600 text-[11px] leading-relaxed">
                Este equipo aloja la base de datos centralizada SQLite y expone la API en el puerto 4000 para toda la planta.
              </p>
            </div>

            {/* 3. Modo Terminal Cliente */}
            <div
              onClick={() => handleSwitchNetworkMode(NETWORK_MODES.CLIENT)}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                netConfig.mode === NETWORK_MODES.CLIENT
                  ? 'border-blue-600 bg-blue-50 shadow-soft-sm ring-1 ring-blue-600'
                  : 'border-bone-200 bg-white hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-obsidian flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-blue-700" />
                  Terminal Cliente (LAN)
                </span>
                {netConfig.mode === NETWORK_MODES.CLIENT && <Badge variant="paleBlue">Activo</Badge>}
              </div>
              <p className="text-bone-600 text-[11px] leading-relaxed">
                Se conecta a través de la red Wi-Fi/LAN al equipo Servidor Host mediante su dirección IP local.
              </p>
            </div>
          </div>

          {/* Configuración específica según el modo activo */}
          {netConfig.mode === NETWORK_MODES.HOST && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-950 block text-xs">
                Información de Conectividad para Terminales y Balanzas
              </span>
              <p className="text-emerald-800 text-[11px]">
                Para conectar otros puestos de trabajo, ingresa en cada terminal cliente la dirección de este Host:
              </p>
              <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                <code className="bg-white px-3 py-1.5 rounded-lg border border-emerald-300 font-bold text-emerald-950">
                  http://[IP-LOCAL-DE-ESTE-EQUIPO]:4000
                </code>
                <span className="text-bone-500 text-[10px]">
                  (Ejecutar <code>npm run server</code> o iniciar desde la app de escritorio)
                </span>
              </div>
            </div>
          )}

          {netConfig.mode === NETWORK_MODES.CLIENT && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
              <span className="font-bold text-blue-950 block text-xs">
                Conexión con el Servidor Host de Planta
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Input
                  value={hostUrlInput}
                  onChange={(e) => setHostUrlInput(e.target.value)}
                  placeholder="ej: http://192.168.1.50:4000"
                  className="font-mono text-xs"
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={isTestingNet}
                    className="text-xs whitespace-nowrap"
                  >
                    {isTestingNet ? 'Probando...' : 'Probar Enlace'}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSyncWithHost}
                    disabled={isSyncing}
                    className="text-xs whitespace-nowrap bg-blue-800 hover:bg-blue-900"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sincronizar
                  </Button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-mono ${
                    testResult.success
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}
                >
                  {testResult.success
                    ? `✓ Servidor Host en línea · Conexión establecida con éxito (${testResult.data?.stats?.tambores || 0} tambores sincronizados).`
                    : `✗ No se pudo conectar: ${testResult.error}`}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- JERARQUÍA DE PERFILES Y MATRIZ DE PERMISOS ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-olive-800" />
            <span>Jerarquía de Perfiles y Control de Permisos</span>
          </CardTitle>
          <p className="text-xs text-bone-600">
            Niveles de seguridad operacional configurados para el personal de Olivícola Luján.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Operario de Planta */}
            <div
              onClick={() => switchRole('operario')}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                role === ROLES.OPERARIO
                  ? 'border-olive-800 bg-olive-50 ring-1 ring-olive-800'
                  : 'border-bone-200 bg-white hover:border-bone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-obsidian text-sm">Operador de Planta</span>
                {role === ROLES.OPERARIO && <Badge variant="paleGreen">Sesión Activa</Badge>}
              </div>
              <ul className="text-bone-600 text-[11px] space-y-1 list-disc list-inside">
                <li>Pesaje y registro de tambores</li>
                <li>Escaneo continuo con HPRT N130BT</li>
                <li>Toma física de inventario por sectores</li>
                <li>Impresión térmica Zebra GC420t</li>
              </ul>
            </div>

            {/* Responsable de Calidad */}
            <div
              onClick={() => switchRole('calidad')}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                role === ROLES.CALIDAD
                  ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700'
                  : 'border-bone-200 bg-white hover:border-bone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-obsidian text-sm">Responsable de Calidad</span>
                {role === ROLES.CALIDAD && <Badge variant="paleGreen">Sesión Activa</Badge>}
              </div>
              <ul className="text-bone-600 text-[11px] space-y-1 list-disc list-inside">
                <li>Autorización y liberación de lotes</li>
                <li>Muestreos de laboratorio (pH, salinidad)</li>
                <li>Retención de lotes observados</li>
                <li>Consulta de trazabilidad e historial</li>
              </ul>
            </div>

            {/* Gerente / Administrador */}
            <div
              onClick={() => switchRole('admin')}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                role === ROLES.ADMINISTRADOR
                  ? 'border-obsidian bg-bone-100 ring-1 ring-obsidian'
                  : 'border-bone-200 bg-white hover:border-bone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-obsidian text-sm">Gerente / Administrador</span>
                {role === ROLES.ADMINISTRADOR && <Badge variant="default">Sesión Activa</Badge>}
              </div>
              <ul className="text-bone-600 text-[11px] space-y-1 list-disc list-inside">
                <li>Auditoría en tiempo real por operador</li>
                <li>Gestión de catálogos oficiales</li>
                <li>Copias de seguridad y restauración</li>
                <li>Configuración de red y eliminación</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- MODAL CREAR / EDITAR OPCIÓN DE CATÁLOGO ---------------- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Opción de Catálogo' : `Nueva Opción para ${currentTypeMeta?.label}`}
            </DialogTitle>
            <DialogDescription>
              El código se utilizará en la construcción del identificador del código de barras en planta.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs mb-3">
              {formError}
            </div>
          )}

          <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Nombre Visible *
              </label>
              <Input
                placeholder="ej: Arauco, Salmuera 12%, Nave A..."
                value={itemForm.nombre}
                onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Código para el Tambor (Mayúsculas) *
              </label>
              <Input
                placeholder="ej: ALOR, VDE, 161/200, NAV-A1..."
                value={itemForm.codigo}
                onChange={(e) => setItemForm({ ...itemForm, codigo: e.target.value.toUpperCase() })}
                mono
                required
              />
              <span className="text-[10px] text-bone-500 mt-1 block">
                Solo letras mayúsculas, números, / y guiones. Se usará en el código de barras CODE 128.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-bone-800 block mb-1">
                  Orden de Visualización
                </label>
                <Input
                  type="number"
                  min="1"
                  value={itemForm.orden}
                  onChange={(e) => setItemForm({ ...itemForm, orden: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="font-semibold text-bone-800 block mb-1">
                  Estado
                </label>
                <select
                  value={itemForm.activo ? 'true' : 'false'}
                  onChange={(e) => setItemForm({ ...itemForm, activo: e.target.value === 'true' })}
                  className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                >
                  <option value="true">Activo (Disponible en formularios)</option>
                  <option value="false">Inactivo (Oculto en nuevas cargas)</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Guardar Opción
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
