import React, { useState, useMemo, useEffect } from 'react';
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
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  UserPlus,
  AlertTriangle,
  Copy,
  Terminal,
  Activity,
} from 'lucide-react';
import { logger } from '../lib/logger.js';
import {
  loadDatabase,
  saveCatalogItem,
  toggleCatalogActive,
  exportDatabaseJSON,
  importDatabaseJSON,
  clearAllCompanyData,
  resetDemoDatabase,
  loadTestDataset,
  getCurrentWorkspaceMode,
  setCurrentWorkspaceMode,
  getNetworkConfig,
  setNetworkConfig,
  testHostConnection,
  syncWithHostServer,
  NETWORK_MODES,
} from '../api/repository.js';
import { useAuth, ROLES, ROLE_PERMISSIONS, PERMISOS, DEFAULT_ADMIN_KEY } from '../components/Auth.jsx';
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

  // Perfiles, personal y permisos
  const {
    user,
    role,
    switchRole,
    can,
    usersList = [],
    adminSecret,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
    updateAdminSecret,
  } = useAuth();
  const canManageCatalogs = can(PERMISOS.GESTION_CATALOGOS);
  const canManageBackups = can(PERMISOS.GESTION_BACKUPS);
  const canConfigRed = can(PERMISOS.CONFIG_RED);
  const canManageUsers = can(PERMISOS.GESTION_USUARIOS);

  // Estado para gestión de personal y clave de autorización
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    nombre: '',
    legajo: '',
    password: '',
    rol: ROLES.OPERARIO,
    cargo: '',
  });
  const [userFormError, setUserFormError] = useState('');

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [userForPassword, setUserForPassword] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  const [adminSecretInput, setAdminSecretInput] = useState(adminSecret || DEFAULT_ADMIN_KEY);
  const [showAdminSecret, setShowAdminSecret] = useState(false);

  React.useEffect(() => {
    if (adminSecret) setAdminSecretInput(adminSecret);
  }, [adminSecret]);

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

  // Consola de Registros y Diagnóstico en Tiempo Real
  const [systemLogs, setSystemLogs] = useState(() => logger.getLogs());
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  React.useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setSystemLogs(newLogs);
    });

    if (window.location.hash === '#consola-logs' || window.location.search.includes('tab=logs') || window.location.hash.includes('logs')) {
      setTimeout(() => {
        document.getElementById('consola-logs')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }

    return unsubscribe;
  }, []);


  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    logger.info('Diagnóstico', '=== INICIANDO AUTODIAGNÓSTICO DE RED Y SERVIDOR ===');

    if (typeof window !== 'undefined' && window.electronAPI) {
      logger.info('Diagnóstico', 'Plataforma: Aplicación de Escritorio Electron detectada');
      try {
        const status = await window.electronAPI.getServerStatus?.();
        if (status?.isRunning) {
          logger.success('Diagnóstico', `Servidor local embebido en este equipo: ACTIVO (Puerto ${status.port})`);
        } else {
          logger.warn('Diagnóstico', 'Servidor local embebido en este equipo: DETENIDO');
        }
      } catch (err) {
        logger.error('Diagnóstico', `Error al consultar estado del servidor: ${err.message}`);
      }
    } else {
      logger.info('Diagnóstico', 'Plataforma: Ejecución en Navegador Web');
    }

    // Probar enlace con el host configurado
    const target = hostUrlInput || netConfig.hostUrl || 'http://localhost:4000';
    logger.info('Diagnóstico', `Probando conexión con Servidor: ${target}`);
    const res = await testHostConnection(target);
    if (res.success) {
      logger.success('Diagnóstico', `✓ SERVIDOR EN LÍNEA: Respuesta recibida en ${res.elapsed || 0}ms`, {
        url: res.normalizedUrl,
        tambores: res.data?.stats?.tambores,
      });
    } else {
      logger.error('Diagnóstico', `✗ NO RESPONDE: ${res.error}`);
    }

    logger.info('Diagnóstico', '=== AUTODIAGNÓSTICO FINALIZADO ===');
    setIsRunningDiag(false);
  };

  const handleStartElectronServer = async () => {
    if (window.electronAPI?.startServer) {
      const res = await window.electronAPI.startServer(4000);
      if (res?.isRunning) {
        setElectronState(prev => ({
          ...prev,
          serverRunning: true,
          serverPort: res?.port || 4000,
          ips: res?.ips || prev.ips,
        }));
        setSuccessMessage('Servidor embebido iniciado correctamente en el puerto 4000.');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        const errorMsg = res?.error || 'No se pudo iniciar el servidor.';
        logger.error('Servidor Host', `Error al arrancar servidor: ${errorMsg}`);
        alert(`Error al iniciar el servidor host: ${errorMsg}`);
      }
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

  const handleSwitchNetworkMode = async (newMode) => {
    // Permitir cambiar a Terminal Cliente sin requerir permiso de Administrador
    if (newMode !== NETWORK_MODES.CLIENT && !canConfigRed) {
      alert('Permiso denegado: Se requiere perfil de Administrador para modificar la configuración de red del Servidor');
      return;
    }
    const updated = setNetworkConfig({ mode: newMode });
    setNetConfigState(updated);

    if (newMode === NETWORK_MODES.HOST && window.electronAPI?.startServer) {
      try {
        const res = await window.electronAPI.startServer(4000);
        setElectronState(prev => ({
          ...prev,
          serverRunning: res?.isRunning ?? true,
          serverPort: res?.port || 4000,
          ips: res?.ips || prev.ips,
        }));
      } catch (err) {
        console.warn('Error al auto-iniciar servidor:', err);
      }
    }

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
      const normalized = res.normalizedUrl || hostUrlInput;
      setHostUrlInput(normalized);
      setNetworkConfig({ hostUrl: normalized, status: 'connected' });
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

  // Vaciar datos operativos (0 tambores para iniciar producción limpia)
  const handleClearAllData = () => {
    if (!canManageBackups) {
      alert('Permiso denegado: Se requiere perfil de Administrador para vaciar la base de datos.');
      return;
    }
    if (
      confirm(
        '¿ATENCIÓN: Deseas vaciar todos los tambores e historial de planta para iniciar en limpio?\n\nLos catálogos oficiales (productos, variedades, calibres, etc.) se conservarán intactos.'
      )
    ) {
      clearAllCompanyData(user);
      setDb(loadDatabase());
      setSuccessMessage('Base de datos vaciada: 0 tambores. Lista para operación oficial en planta.');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  // Cargar datos de prueba (15 tambores para evaluación completa)
  const handleLoadTestData = () => {
    if (!canManageBackups) {
      alert('Permiso denegado: Se requiere perfil de Administrador para cargar datos.');
      return;
    }
    if (
      confirm(
        '¿Deseas cargar el conjunto de prueba con 15 tambores reales, movimientos y sectores para evaluar el software?'
      )
    ) {
      loadTestDataset();
      setDb(loadDatabase());
      setSuccessMessage('¡15 tambores de prueba cargados con éxito! Puedes ver el inventario, sectores y trazabilidad.');
      setTimeout(() => window.location.reload(), 1200);
    }
  };

  // Handlers para administración de personal
  const handleCreateUser = (e) => {
    e.preventDefault();
    setUserFormError('');
    try {
      adminCreateUser(newUserForm);
      setSuccessMessage(`Personal registrado: ${newUserForm.nombre} (Legajo: ${newUserForm.legajo}).`);
      setUserModalOpen(false);
      setNewUserForm({
        nombre: '',
        legajo: '',
        password: '',
        rol: ROLES.OPERARIO,
        cargo: '',
      });
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setUserFormError(err.message || 'Error al crear usuario.');
    }
  };

  const handleToggleUserActive = (targetUser) => {
    try {
      adminUpdateUser(targetUser.id, { activo: !targetUser.activo });
      setSuccessMessage(`Cuenta de ${targetUser.nombre} ${targetUser.activo ? 'desactivada' : 'activada'}.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeUserRole = (targetUser, newRole) => {
    try {
      adminUpdateUser(targetUser.id, { rol: newRole });
      setSuccessMessage(`Rol de ${targetUser.nombre} actualizado a ${newRole}.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenPasswordModal = (targetUser) => {
    setUserForPassword(targetUser);
    setNewPasswordVal('');
    setPasswordModalOpen(true);
  };

  const handleSaveNewPassword = (e) => {
    e.preventDefault();
    if (!newPasswordVal || newPasswordVal.length < 3) {
      alert('La contraseña debe tener al menos 3 caracteres.');
      return;
    }
    try {
      adminUpdateUser(userForPassword.id, { newPassword: newPasswordVal });
      setPasswordModalOpen(false);
      setSuccessMessage(`Contraseña actualizada con éxito para ${userForPassword.nombre}.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = (targetUser) => {
    if (confirm(`¿Estás seguro de eliminar permanentemente a ${targetUser.nombre} (Legajo: ${targetUser.legajo})?`)) {
      try {
        adminDeleteUser(targetUser.id);
        setSuccessMessage(`Usuario ${targetUser.nombre} eliminado.`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleUpdateAdminSecret = (e) => {
    e.preventDefault();
    try {
      updateAdminSecret(adminSecretInput);
      setSuccessMessage('Clave de Autorización de Gerencia actualizada con éxito.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.message);
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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => document.getElementById('consola-logs')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian text-bone-100 hover:bg-black text-xs font-semibold shadow-soft-sm transition-all active:scale-95"
            title="Ir a la terminal de logs en tiempo real"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver Logs y Diagnóstico</span>
          </button>

          <Button variant="primary" size="default" onClick={handleOpenNew} className="text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Agregar Opción a {currentTypeMeta?.label}
          </Button>
        </div>
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
          {/* Estado de Base de Datos de Planta */}
          <div className="p-4 rounded-xl border border-bone-200 bg-bone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold text-obsidian block text-sm">
                Base de Datos Operativa de Planta
              </span>
              <p className="text-bone-600 text-xs mt-0.5">
                Olivícola Luján · Catálogos oficiales activos para variedades, calibres, productos y calidades.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold px-2.5 py-1 rounded-lg">
                Producción Oficial
              </span>
            </div>
          </div>

          {/* Exportar / Importar / Cargar Demo / Vaciar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Cargar Datos de Prueba */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Datos de Prueba (15)
                </span>
                <p className="text-emerald-800 text-[11px] mt-1">
                  Carga 15 tambores reales con variedades, calibres, pesos y movimientos de ejemplo.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleLoadTestData}
                className="w-full text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Cargar 15 Tambores
              </Button>
            </div>

            {/* Exportar JSON */}
            <div className="p-4 rounded-xl border border-bone-200 bg-white space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-obsidian block">Exportar Copia JSON</span>
                <p className="text-bone-600 text-[11px] mt-1">
                  Descarga un archivo completo con tambores, movimientos, historial y catálogos.
                </p>
              </div>
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
            <div className="p-4 rounded-xl border border-bone-200 bg-white space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-obsidian block">Restaurar Copia JSON</span>
                <p className="text-bone-600 text-[11px] mt-1">
                  Restaura un inventario respaldado previamente desde tu computadora.
                </p>
              </div>
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

            {/* Vaciar Datos de Planta */}
            <div className="p-4 rounded-xl border border-bone-200 bg-white space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-obsidian block">Vaciar Datos de Planta</span>
                <p className="text-bone-600 text-[11px] mt-1">
                  Deja el inventario en 0 tambores para iniciar producción limpia, conservando catálogos.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllData}
                className="w-full text-xs text-rose-800 border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                Vaciar Tambores (0)
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
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${electronState.serverRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="font-bold text-emerald-950 text-sm">
                      {electronState.serverRunning ? 'Servidor Host LAN Activo' : 'Servidor Detenido'}
                    </span>
                    <span className="font-mono text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
                      Puerto {electronState.serverPort || 4000}
                    </span>
                  </div>
                  <p className="text-emerald-800 text-xs mt-1">
                    {electronState.serverRunning
                      ? 'El servidor central está escuchando en la red local. Los puestos clientes pueden conectarse.'
                      : 'Presiona "Iniciar Servidor" para habilitar la conexión desde los demás equipos (Mac o Windows).'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {electronState.serverRunning ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleStopElectronServer}
                      className="text-xs text-red-700 border-red-300 hover:bg-red-50"
                    >
                      Detener Servidor
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleStartElectronServer}
                      className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      Iniciar Servidor Embebido
                    </Button>
                  )}
                </div>
              </div>

              {/* Lista de Direcciones IP Detectadas */}
              <div className="pt-3 border-t border-emerald-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block font-mono">
                  Direcciones para conectar los puestos clientes (Mac o Windows):
                </span>
                
                {electronState.ips && electronState.ips.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {electronState.ips.map((net) => {
                      const hostUrl = `http://${net.ip}:${electronState.serverPort || 4000}`;
                      return (
                        <div
                          key={net.ip}
                          className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-emerald-300 font-mono text-xs shadow-soft-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] text-bone-600 uppercase px-1.5 py-0.5 rounded bg-bone-100 font-semibold shrink-0">
                              {net.iface}
                            </span>
                            <span className="font-bold text-emerald-950 truncate">{hostUrl}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(hostUrl);
                              setSuccessMessage(`URL copiada al portapapeles: ${hostUrl}`);
                              setTimeout(() => setSuccessMessage(''), 3000);
                            }}
                            className="text-xs text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 cursor-pointer shrink-0 font-sans font-medium"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copiar URL
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-300 font-mono text-xs flex items-center justify-between">
                    <span className="font-bold text-emerald-950">http://localhost:4000</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('http://localhost:4000');
                        setSuccessMessage('URL copiada');
                        setTimeout(() => setSuccessMessage(''), 3000);
                      }}
                      className="text-xs text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer font-sans font-medium"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </button>
                  </div>
                )}
                
                <p className="text-[11px] text-bone-600 mt-1">
                  💡 <strong>Instrucciones:</strong> En el otro equipo (Mac o Windows), abre la app, ve a <em>Configuración → Red Local</em>, selecciona <strong>"Terminal Cliente"</strong> y pega exactamente esta URL.
                </p>
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

      {/* ---------------- CONSOLA DE REGISTROS Y DIAGNÓSTICO EN VIVO ---------------- */}
      <Card id="consola-logs" className="scroll-mt-6 border-olive-300">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Terminal className="w-5 h-5 text-olive-800" />
                <span>Consola de Registros y Diagnóstico en Vivo (Logs)</span>
              </CardTitle>
              <p className="text-xs text-bone-600 mt-0.5">
                Monitoriza en tiempo real peticiones HTTP de red, intentos de conexión, respuestas del servidor y posibles errores.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRunDiagnostics}
                disabled={isRunningDiag}
                className="text-xs"
              >
                <Activity className={`w-3.5 h-3.5 mr-1.5 text-blue-600 ${isRunningDiag ? 'animate-spin' : ''}`} />
                {isRunningDiag ? 'Diagnosticando...' : 'Autodiagnóstico de Red'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  logger.copyToClipboard();
                  setSuccessMessage('Registros copiados al portapapeles');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
                className="text-xs"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copiar Logs
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => logger.clear()}
                className="text-xs text-bone-500 hover:text-red-700"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 text-xs">
          {/* Terminal Box */}
          <div className="bg-obsidian text-bone-100 p-4 rounded-xl font-mono text-xs max-h-72 overflow-y-auto space-y-1.5 border border-bone-700 shadow-inner select-text">
            {systemLogs.length === 0 ? (
              <p className="text-bone-500 italic">No hay eventos registrados en esta sesión. Los eventos de red aparecerán aquí.</p>
            ) : (
              systemLogs.map((log) => {
                const badgeColor =
                  log.type === 'error'
                    ? 'bg-red-900/80 text-red-200 border-red-700'
                    : log.type === 'success'
                    ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700'
                    : log.type === 'warn'
                    ? 'bg-amber-900/80 text-amber-200 border-amber-700'
                    : 'bg-blue-900/80 text-blue-200 border-blue-700';

                return (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed hover:bg-white/5 p-1 rounded transition-colors">
                    <span className="text-bone-500 shrink-0 select-none">[{log.time}]</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase shrink-0 ${badgeColor}`}>
                      {log.type}
                    </span>
                    <span className="text-bone-400 shrink-0 font-semibold">[{log.source}]:</span>
                    <span className={log.type === 'error' ? 'text-red-300 font-semibold' : log.type === 'success' ? 'text-emerald-300' : 'text-bone-200'}>
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-bone-500 pt-1">
            <span>
              💡 <strong>Acceso rápido a consola completa:</strong> Presiona <kbd className="px-1.5 py-0.5 rounded bg-bone-200 text-obsidian font-mono text-[10px]">Cmd + Opt + I</kbd> (Mac) o <kbd className="px-1.5 py-0.5 rounded bg-bone-200 text-obsidian font-mono text-[10px]">Ctrl + Shift + I / F12</kbd> (Windows) para ver la consola de desarrollo Chrome DevTools.
            </span>
            <span className="shrink-0 font-mono text-[10px]">{systemLogs.length} eventos en memoria</span>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- GESTIÓN DE PERSONAL Y CUENTAS DE USUARIO ---------------- */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-olive-800" />
                <span>Gestión de Personal y Cuentas de Acceso</span>
              </CardTitle>
              <p className="text-xs text-bone-600 mt-0.5">
                Cuentas de operarios, supervisores de calidad y administradores autorizados para operar en la planta.
              </p>
            </div>
            {canManageUsers && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setUserFormError('');
                  setUserModalOpen(true);
                }}
                className="text-xs shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Registrar Personal
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-xs">
          {/* Subsección: Clave de Autorización de Gerencia */}
          {canManageUsers && (
            <div className="p-4 rounded-xl bg-bone-100/70 border border-bone-300 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-olive-800 shrink-0" />
                    <span className="font-bold text-obsidian text-sm">
                      Clave Maestra de Autorización para Gerencia / Calidad
                    </span>
                  </div>
                  <p className="text-bone-600 text-[11px] max-w-2xl leading-relaxed">
                    Esta clave secreta impide que un operario de balanza se auto-asigne el rango de Administrador o Calidad al registrarse. Solo quien conozca esta clave podrá habilitar cuentas con privilegios jerárquicos.
                  </p>
                </div>

                <form onSubmit={handleUpdateAdminSecret} className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <input
                      type={showAdminSecret ? 'text' : 'password'}
                      value={adminSecretInput}
                      onChange={(e) => setAdminSecretInput(e.target.value)}
                      className="px-3 py-1.5 pr-8 font-mono text-xs rounded-lg border border-bone-300 bg-white focus:outline-none focus:ring-1 focus:ring-olive-700"
                      placeholder="Clave de Gerencia"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminSecret(!showAdminSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-bone-500 hover:text-obsidian"
                      title={showAdminSecret ? 'Ocultar' : 'Mostrar'}
                    >
                      {showAdminSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <Button type="submit" variant="secondary" size="sm" className="text-xs">
                    Actualizar Clave
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Tabla de Usuarios Registrados */}
          <div className="bezel-shell">
            <div className="bezel-core p-0 overflow-x-auto bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-bone-200 bg-bone-50/70 font-mono text-[11px] text-bone-600 uppercase tracking-wider">
                    <th className="p-3 font-semibold">Legajo</th>
                    <th className="p-3 font-semibold">Nombre y Apellido</th>
                    <th className="p-3 font-semibold">Rol Asignado</th>
                    <th className="p-3 font-semibold">Estado</th>
                    <th className="p-3 text-right">Acciones de Cuenta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bone-100 font-sans">
                  {usersList.map((u) => {
                    const isSelf = u.id === user?.id;
                    return (
                      <tr key={u.id} className="hover:bg-bone-50/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-obsidian whitespace-nowrap">
                          {u.legajo || '—'}
                        </td>
                        <td className="p-3 font-semibold text-obsidian">
                          <div className="flex items-center gap-1.5">
                            <span>{u.nombre}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-bone-200 text-bone-700 font-mono px-1.5 py-0.2 rounded">
                                Tú
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-bone-500 block font-normal">{u.cargo || 'Personal de Planta'}</span>
                        </td>
                        <td className="p-3">
                          {canManageUsers && !isSelf ? (
                            <select
                              value={u.rol}
                              onChange={(e) => handleChangeUserRole(u, e.target.value)}
                              className="text-xs font-medium py-1 px-2 rounded-lg border border-bone-300 bg-white"
                            >
                              <option value={ROLES.OPERARIO}>Operario</option>
                              <option value={ROLES.CALIDAD}>Calidad</option>
                              <option value={ROLES.ADMINISTRADOR}>Administrador</option>
                            </select>
                          ) : (
                            <Badge
                              variant={
                                u.rol === ROLES.ADMINISTRADOR
                                  ? 'default'
                                  : u.rol === ROLES.CALIDAD
                                  ? 'paleGreen'
                                  : 'outline'
                              }
                            >
                              {u.rol}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant={u.activo !== false ? 'paleGreen' : 'default'} dot={u.activo !== false}>
                            {u.activo !== false ? 'Activo' : 'Desactivado'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canManageUsers && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenPasswordModal(u)}
                                  className="text-[11px] h-7 px-2.5"
                                  title="Blanquear o cambiar contraseña"
                                >
                                  <Lock className="w-3 h-3 mr-1" />
                                  Clave
                                </Button>
                                {!isSelf && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleToggleUserActive(u)}
                                      className="text-[11px] h-7 px-2.5"
                                    >
                                      <Power className="w-3 h-3 mr-1" />
                                      {u.activo !== false ? 'Desactivar' : 'Activar'}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteUser(u)}
                                      className="text-[11px] h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                      title="Eliminar usuario"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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

      {/* ---------------- MODAL ALTA DE PERSONAL ---------------- */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Personal en Planta</DialogTitle>
            <DialogDescription>
              Crea una cuenta autorizada para que el operario o supervisor inicie sesión con su número de legajo y contraseña.
            </DialogDescription>
          </DialogHeader>

          {userFormError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs mb-3">
              {userFormError}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Nombre y Apellido *
              </label>
              <Input
                placeholder="ej: Juan Pérez"
                value={newUserForm.nombre}
                onChange={(e) => setNewUserForm({ ...newUserForm, nombre: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-bone-800 block mb-1">
                  Número de Legajo *
                </label>
                <Input
                  placeholder="ej: OP-05 o 1042"
                  value={newUserForm.legajo}
                  onChange={(e) => setNewUserForm({ ...newUserForm, legajo: e.target.value.toUpperCase() })}
                  mono
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-bone-800 block mb-1">
                  Contraseña Inicial *
                </label>
                <Input
                  type="password"
                  placeholder="Mínimo 3 caracteres"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-bone-800 block mb-1">
                  Rol y Jerarquía *
                </label>
                <select
                  value={newUserForm.rol}
                  onChange={(e) => setNewUserForm({ ...newUserForm, rol: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                >
                  <option value={ROLES.OPERARIO}>Operario (Pesaje, escáner, inventario)</option>
                  <option value={ROLES.CALIDAD}>Calidad (Liberación de lotes, muestreos)</option>
                  <option value={ROLES.ADMINISTRADOR}>Administrador (Control total)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-bone-800 block mb-1">
                  Puesto o Sector (Opcional)
                </label>
                <Input
                  placeholder="ej: Balanza Entrada, Nave A"
                  value={newUserForm.cargo}
                  onChange={(e) => setNewUserForm({ ...newUserForm, cargo: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUserModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Dar de Alta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------- MODAL BLANQUEO / CAMBIO DE CONTRASEÑA ---------------- */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña de Usuario</DialogTitle>
            <DialogDescription>
              Establece una nueva clave de acceso para {userForPassword?.nombre} (Legajo: {userForPassword?.legajo}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewPassword} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Nueva Contraseña *
              </label>
              <Input
                type="password"
                placeholder="Ingresa la nueva clave (mín. 3 caracteres)"
                value={newPasswordVal}
                onChange={(e) => setNewPasswordVal(e.target.value)}
                autoFocus
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasswordModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Guardar Contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
