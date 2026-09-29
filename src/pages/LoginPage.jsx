import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  ShieldCheck,
  BadgeAlert,
  Terminal,
  Server,
  Wifi,
} from 'lucide-react';
import { useAuth, ROLES, DEFAULT_ADMIN_KEY } from '../components/Auth.jsx';
import { getNetworkConfig, NETWORK_MODES } from '../api/repository.js';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithCredentials, registerUser } = useAuth();
  const [netConfig] = useState(() => getNetworkConfig());

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);

  // Formulario Login
  const [loginForm, setLoginForm] = useState({
    legajo: '',
    password: '',
  });

  // Formulario Registro
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    legajo: '',
    password: '',
    confirmPassword: '',
    rol: ROLES.OPERARIO,
    cargo: '',
    adminKey: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      loginWithCredentials(loginForm.legajo, loginForm.password);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsSubmitting(true);

    try {
      registerUser({
        nombre: registerForm.nombre,
        legajo: registerForm.legajo,
        password: registerForm.password,
        rol: registerForm.rol,
        cargo: registerForm.cargo,
        adminKey: registerForm.adminKey,
      });

      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bone-50 text-obsidian flex flex-col justify-center items-center p-4 antialiased selection:bg-olive-100 selection:text-olive-900">
      <div className="max-w-md w-full space-y-6">
        {/* Cabecera Institucional */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-olive-900 text-bone-50 flex items-center justify-center mx-auto shadow-soft-md">
            <span className="font-serif text-3xl font-bold italic">O</span>
          </div>
          <h1 className="font-serif text-3xl font-black tracking-tight text-obsidian">
            OLIVÍCOLA LUJÁN
          </h1>
          <p className="text-xs uppercase font-mono tracking-widest text-olive-800 font-semibold">
            Sistema Integral de Trazabilidad de Tambores
          </p>
          <p className="text-[11px] text-bone-500 font-mono">
            Planta Industrial · Luján de Cuyo, Mendoza
          </p>
        </div>

        {/* Tarjeta Principal de Autenticación */}
        <div className="bezel-shell shadow-soft-lg">
          <div className="bezel-core p-6 sm:p-8 bg-white space-y-6">
            {/* Pestañas: Iniciar Sesión / Registro */}
            <div className="flex border-b border-bone-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
                className={`flex-1 pb-3 text-xs font-mono font-bold tracking-wider transition-colors border-b-2 ${
                  activeTab === 'login'
                    ? 'border-olive-800 text-olive-950 font-bold'
                    : 'border-transparent text-bone-500 hover:text-obsidian'
                }`}
              >
                Ingreso con Legajo
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError('');
                }}
                className={`flex-1 pb-3 text-xs font-mono font-bold tracking-wider transition-colors border-b-2 ${
                  activeTab === 'register'
                    ? 'border-olive-800 text-olive-950 font-bold'
                    : 'border-transparent text-bone-500 hover:text-obsidian'
                }`}
              >
                Nuevo Registro
              </button>
            </div>

            {/* Mensajes de Error / Éxito */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* FORMULARIO LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Número de Legajo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
                    <input
                      type="text"
                      required
                      placeholder="ej: OP-01 o L-1045"
                      value={loginForm.legajo}
                      onChange={(e) => setLoginForm({ ...loginForm, legajo: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 text-sm font-mono rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bone-400 hover:text-obsidian p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="hero"
                    disabled={isSubmitting}
                    className="w-full text-xs font-mono font-bold tracking-wider"
                    trailingIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isSubmitting ? 'Verificando Legajo...' : 'Ingresar al Sistema'}
                  </Button>
                </div>

                {/* Ayuda Rápida de Fábrica para Inicio Rápido */}
                <div className="pt-3 border-t border-bone-100 text-[11px] text-bone-500 space-y-1">
                  <span className="font-semibold text-bone-700 block font-mono">
                    Credenciales maestras iniciales de fábrica:
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                    <span
                      onClick={() => setLoginForm({ legajo: 'OP-01', password: '123' })}
                      className="bg-bone-100 hover:bg-bone-200 px-2 py-1 rounded cursor-pointer border border-bone-200 text-bone-800"
                    >
                      Operario: <strong>OP-01</strong> / 123
                    </span>
                    <span
                      onClick={() => setLoginForm({ legajo: 'ADM-01', password: '123' })}
                      className="bg-bone-100 hover:bg-bone-200 px-2 py-1 rounded cursor-pointer border border-bone-200 text-bone-800"
                    >
                      Gerente: <strong>ADM-01</strong> / 123
                    </span>
                  </div>
                </div>
              </form>
            )}

            {/* FORMULARIO REGISTRO */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Marcelo Gómez"
                    value={registerForm.nombre}
                    onChange={(e) => setRegisterForm({ ...registerForm, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-bone-700 block mb-1">
                      Nº de Legajo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej: L-1045"
                      value={registerForm.legajo}
                      onChange={(e) => setRegisterForm({ ...registerForm, legajo: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-bone-700 block mb-1">
                      Rol Solicitado *
                    </label>
                    <select
                      value={registerForm.rol}
                      onChange={(e) => setRegisterForm({ ...registerForm, rol: e.target.value })}
                      className="w-full h-10 px-2 text-xs font-semibold rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                    >
                      <option value={ROLES.OPERARIO}>Operario de Planta</option>
                      <option value={ROLES.CALIDAD}>Responsable Calidad</option>
                      <option value={ROLES.ADMINISTRADOR}>Gerente / Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-bone-700 block mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 3 caracteres"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-bone-700 block mb-1">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repetir clave"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                    />
                  </div>
                </div>

                {/* PROTECCIÓN CONTRA CREACIÓN NO AUTORIZADA DE ADMIN O CALIDAD */}
                {(registerForm.rol === ROLES.ADMINISTRADOR || registerForm.rol === ROLES.CALIDAD) && (
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                      <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Clave de Autorización de Gerencia Requerida</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Para evitar que un operario cree cuentas de administración o calidad, ingresa la clave de autorización establecida por la Gerencia de la empresa.
                    </p>
                    <div className="relative pt-1">
                      <input
                        type={showAdminSecret ? 'text' : 'password'}
                        required
                        placeholder="Clave maestra de autorización"
                        value={registerForm.adminKey}
                        onChange={(e) => setRegisterForm({ ...registerForm, adminKey: e.target.value })}
                        className="w-full pl-3 pr-10 py-2 text-xs font-mono rounded-lg border border-amber-400 bg-white text-obsidian focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminSecret(!showAdminSecret)}
                        className="absolute right-2 top-3 text-bone-400 hover:text-obsidian p-1"
                      >
                        {showAdminSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="hero"
                    disabled={isSubmitting}
                    className="w-full text-xs font-mono font-bold tracking-wider"
                    trailingIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isSubmitting ? 'Registrando Usuario...' : 'Registrar Cuenta e Ingresar'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Barra de Estado y Acceso Directo a Logs */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/90 rounded-xl border border-bone-200 text-[11px] font-mono shadow-soft-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">v1.0.1</span>
            <span className="text-bone-400">·</span>
            <span className="text-bone-600 flex items-center gap-1">
              {netConfig.mode === NETWORK_MODES.HOST ? (
                <>
                  <Server className="w-3 h-3 text-emerald-700" />
                  <span>Modo Servidor Host</span>
                </>
              ) : netConfig.mode === NETWORK_MODES.CLIENT ? (
                <>
                  <Wifi className="w-3 h-3 text-blue-700" />
                  <span>Terminal Cliente</span>
                </>
              ) : (
                <span>Modo Autónomo</span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.electronAPI?.openLogsWindow) {
                window.electronAPI.openLogsWindow();
              } else {
                alert('Diagnóstico: Modo Navegador Web. Los logs del sistema se emiten por consola del explorador (F12) o tras iniciar sesión en Configuración.');
              }
            }}
            className="inline-flex items-center gap-1.5 font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors active:scale-95 cursor-pointer shadow-2xs"
            title="Abrir Ventana Flotante de Logs y Diagnóstico"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-700" />
            <span>Logs y Diagnóstico</span>
          </button>
        </div>

        {/* Pie de pantalla */}
        <p className="text-center text-xs text-bone-500 font-mono">
          Olivícola Luján · Software de Planta 100% Privado y Local
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
