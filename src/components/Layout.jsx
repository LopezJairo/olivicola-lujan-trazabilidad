import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  QrCode,
  Layers,
  PlusCircle,
  Clock,
  Settings,
  HelpCircle,
  Menu,
  X,
  Printer,
  User,
  Shield,
  RotateCcw,
  Sparkles,
  Database,
  Building2,
  FlaskConical,
  Server,
  Wifi,
  WifiOff,
  ChevronDown,
} from 'lucide-react';
import { useAuth, ROLES, PERMISOS } from './Auth.jsx';
import {
  getCurrentWorkspaceMode,
  setCurrentWorkspaceMode,
  resetDemoDatabase,
  getNetworkConfig,
  NETWORK_MODES,
} from '../api/repository.js';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { cn } from '../lib/utils.js';

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, switchRole, can } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState(getCurrentWorkspaceMode());
  const [networkConfig, setNetworkConfig] = useState(getNetworkConfig());

  // Atajos de teclado del 1 al 7 para acceso ultrarrápido
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === '1') navigate('/');
      else if (e.key === '2') navigate('/escanear');
      else if (e.key === '3') navigate('/inventario');
      else if (e.key === '4') navigate('/tambores/nuevo');
      else if (e.key === '5') navigate('/calidad');
      else if (e.key === '6') navigate('/historial');
      else if (e.key === '7') navigate('/configuracion');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setRoleMenuOpen(false);
  }, [location.pathname]);

  const handleToggleWorkspace = () => {
    const newMode = workspaceMode === 'demo' ? 'empresa' : 'demo';
    setCurrentWorkspaceMode(newMode);
    setWorkspaceMode(newMode);
    window.location.reload();
  };

  const navItems = [
    { label: 'Inicio', path: '/', icon: Home, kbd: '1' },
    { label: 'Escanear Tambor', path: '/escanear', icon: QrCode, kbd: '2', highlight: true },
    { label: 'Inventario', path: '/inventario', icon: Layers, kbd: '3' },
    { label: 'Toma por Sectores', path: '/inventario/toma', icon: Building2 },
    { label: 'Registrar Tambor', path: '/tambores/nuevo', icon: PlusCircle, kbd: '4', primary: true },
    { label: 'Control de Calidad', path: '/calidad', icon: FlaskConical, kbd: '5', quality: true },
    { label: 'Etiquetas Térmicas', path: '/etiquetas', icon: Printer },
    { label: 'Historial y Auditoría', path: '/historial', icon: Clock, kbd: '6' },
    { label: 'Configuración', path: '/configuracion', icon: Settings, kbd: '7' },
    { label: 'Ayuda y Manual', path: '/ayuda', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-bone-50 text-obsidian flex flex-col md:flex-row antialiased">
      {/* ---------------- BARRA LATERAL ESCRITORIO ---------------- */}
      <aside className="no-print hidden md:flex flex-col w-72 border-r border-bone-200 bg-white/70 backdrop-blur-md sticky top-0 h-screen select-none z-30">
        {/* Cabecera & Logo */}
        <div className="p-5 border-b border-bone-200 flex flex-col gap-1">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-olive-900 text-bone-50 flex items-center justify-center shadow-soft-sm group-hover:scale-105 transition-transform duration-300">
              <span className="font-serif text-2xl font-bold italic leading-none">O</span>
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold tracking-tight text-obsidian leading-tight">
                OLIVÍCOLA LUJÁN
              </h1>
              <p className="text-[10px] uppercase font-mono tracking-widest text-olive-700 font-semibold">
                Trazabilidad de Tambores
              </p>
            </div>
          </Link>

          {/* Selector de Entorno (Demo vs Empresa) & Red */}
          <div className="mt-3 pt-2.5 border-t border-bone-100 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span
                    className={cn(
                      'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                      workspaceMode === 'demo' ? 'bg-amber-400' : 'bg-emerald-400'
                    )}
                  />
                  <span
                    className={cn(
                      'relative inline-flex rounded-full h-2 w-2',
                      workspaceMode === 'demo' ? 'bg-amber-500' : 'bg-emerald-600'
                    )}
                  />
                </span>
                <span className="font-medium text-bone-700">
                  {workspaceMode === 'demo' ? 'Demostración' : 'Espacio Empresa'}
                </span>
              </div>
              <button
                onClick={handleToggleWorkspace}
                title="Cambiar entre espacio demo y espacio limpio de empresa"
                className="text-[10px] font-mono text-olive-800 hover:text-olive-950 underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Indicador de Red (Host / Cliente / Offline) */}
            <div className="flex items-center justify-between text-[10px] font-mono bg-bone-100/60 px-2 py-1 rounded-lg text-bone-600">
              <div className="flex items-center gap-1.5">
                {networkConfig.mode === NETWORK_MODES.HOST ? (
                  <>
                    <Server className="w-3 h-3 text-emerald-700" />
                    <span className="text-emerald-900 font-semibold">Servidor Host (LAN)</span>
                  </>
                ) : networkConfig.mode === NETWORK_MODES.CLIENT ? (
                  <>
                    <Wifi className="w-3 h-3 text-blue-700" />
                    <span className="text-blue-900 font-semibold">Terminal Cliente</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-bone-500" />
                    <span>Modo Autónomo</span>
                  </>
                )}
              </div>
              <Link to="/configuracion" className="text-olive-800 hover:underline">
                Red
              </Link>
            </div>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            // Si es Calidad y el usuario es Calidad, destacar
            const isQualityHighlight = item.quality && role === ROLES.CALIDAD;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200',
                  isActive
                    ? 'bg-obsidian text-bone-50 shadow-soft-sm font-semibold'
                    : 'text-bone-700 hover:text-obsidian hover:bg-bone-100/80',
                  item.highlight && !isActive && 'text-olive-900 bg-olive-50/60 hover:bg-olive-100/70',
                  item.primary && !isActive && 'border border-dashed border-olive-400/60',
                  isQualityHighlight && !isActive && 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-bone-50' : 'text-bone-500 group-hover:text-obsidian',
                      item.highlight && !isActive && 'text-olive-800',
                      isQualityHighlight && !isActive && 'text-emerald-700'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.kbd && (
                  <kbd className={cn('text-[10px] px-1.5 py-0.5', isActive && 'bg-white/20 text-white border-white/30')}>
                    {item.kbd}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer del Sidebar: Selector de Roles & Usuario */}
        <div className="p-3.5 border-t border-bone-200 bg-bone-100/40 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={cn(
                  'w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold text-bone-50',
                  role === ROLES.OPERARIO && 'bg-olive-800 border-olive-900',
                  role === ROLES.CALIDAD && 'bg-emerald-700 border-emerald-800',
                  role === ROLES.ADMINISTRADOR && 'bg-obsidian border-bone-700'
                )}
              >
                {user?.nombre?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-obsidian truncate">
                  {user?.nombre || 'Usuario'}
                </p>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={
                      role === ROLES.ADMINISTRADOR
                        ? 'paleBlue'
                        : role === ROLES.CALIDAD
                        ? 'paleGreen'
                        : 'default'
                    }
                    className="text-[9px] px-1.5 py-0"
                  >
                    {role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Botón selector de roles */}
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              title="Cambiar perfil de usuario"
              className="p-1.5 text-bone-500 hover:text-obsidian hover:bg-bone-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Menú flotante de selección de perfiles */}
          {roleMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 bg-white rounded-xl shadow-soft-lg border border-bone-300 p-2 z-50 text-xs space-y-1">
              <span className="text-[10px] font-mono text-bone-500 uppercase px-2 py-1 block">
                Seleccionar Perfil Activo:
              </span>
              <button
                onClick={() => {
                  switchRole('operario');
                  setRoleMenuOpen(false);
                }}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between',
                  role === ROLES.OPERARIO ? 'bg-olive-100 font-bold text-olive-950' : 'hover:bg-bone-100'
                )}
              >
                <span>Operador de Planta</span>
                {role === ROLES.OPERARIO && <span className="text-olive-700">✓</span>}
              </button>
              <button
                onClick={() => {
                  switchRole('calidad');
                  setRoleMenuOpen(false);
                }}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between',
                  role === ROLES.CALIDAD ? 'bg-emerald-100 font-bold text-emerald-950' : 'hover:bg-bone-100'
                )}
              >
                <span>Responsable de Calidad</span>
                {role === ROLES.CALIDAD && <span className="text-emerald-700">✓</span>}
              </button>
              <button
                onClick={() => {
                  switchRole('admin');
                  setRoleMenuOpen(false);
                }}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between',
                  role === ROLES.ADMINISTRADOR ? 'bg-bone-200 font-bold text-obsidian' : 'hover:bg-bone-100'
                )}
              >
                <span>Gerente / Administrador</span>
                {role === ROLES.ADMINISTRADOR && <span className="text-obsidian">✓</span>}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ---------------- BARRA SUPERIOR MÓVIL ---------------- */}
      <header className="no-print md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-bone-200 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-olive-900 text-bone-50 flex items-center justify-center font-serif text-lg font-bold">
            O
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-obsidian leading-none">
              OLIVÍCOLA LUJÁN
            </h1>
            <span className="text-[9px] font-mono uppercase tracking-wider text-olive-700">
              Trazabilidad · {role}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/escanear"
            className="p-2 rounded-lg bg-olive-100 text-olive-900 flex items-center justify-center"
            title="Escanear"
          >
            <QrCode className="w-5 h-5" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-bone-100 text-obsidian"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="no-print md:hidden fixed inset-0 top-[57px] z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-white border-b border-bone-300 p-4 space-y-2 shadow-soft-lg">
            <div className="flex items-center justify-between pb-3 border-b border-bone-200">
              <span className="text-xs font-semibold text-bone-700">
                {workspaceMode === 'demo' ? 'Modo Demostración' : 'Espacio Empresa'}
              </span>
              <button
                onClick={handleToggleWorkspace}
                className="text-xs text-olive-800 underline font-mono"
              >
                Cambiar espacio
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium',
                    isActive ? 'bg-obsidian text-bone-50' : 'text-obsidian hover:bg-bone-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-bone-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-bone-600">
                <span>{user?.nombre} ({role})</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => switchRole('operario')}
                  className={cn('px-2 py-1 rounded text-[11px]', role === ROLES.OPERARIO ? 'bg-obsidian text-white' : 'bg-bone-100')}
                >
                  Operario
                </button>
                <button
                  onClick={() => switchRole('calidad')}
                  className={cn('px-2 py-1 rounded text-[11px]', role === ROLES.CALIDAD ? 'bg-obsidian text-white' : 'bg-bone-100')}
                >
                  Calidad
                </button>
                <button
                  onClick={() => switchRole('admin')}
                  className={cn('px-2 py-1 rounded text-[11px]', role === ROLES.ADMINISTRADOR ? 'bg-obsidian text-white' : 'bg-bone-100')}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- CONTENIDO PRINCIPAL ---------------- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Banner de Aviso de Modo Demo si está activo */}
        {workspaceMode === 'demo' && (
          <div className="no-print bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full font-mono">
                Demostración
              </span>
              <span>
                Datos locales de prueba en navegador. No constituyen el inventario oficial.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirm('¿Restablecer los 12 tambores de demostración iniciales?')) {
                    resetDemoDatabase();
                    window.location.reload();
                  }
                }}
                className="underline hover:text-amber-950 cursor-pointer font-medium"
              >
                Restablecer demo
              </button>
              <button
                onClick={handleToggleWorkspace}
                className="font-semibold text-amber-950 hover:underline cursor-pointer"
              >
                Ir a Espacio Empresa
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
