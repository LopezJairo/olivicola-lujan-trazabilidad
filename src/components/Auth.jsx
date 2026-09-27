/**
 * OLIVÍCOLA LUJÁN · Jerarquía de Perfiles, Autenticación y Control de Permisos
 * Gestiona los roles de Operador de Planta, Calidad y Gerente / Administrador,
 * verificando los permisos específicos requeridos para cada operación.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export const ROLES = {
  OPERARIO: 'Operario',
  CALIDAD: 'Calidad',
  ADMINISTRADOR: 'Administrador',
};

export const PERMISOS = {
  // Operador de Planta
  PESAJE_REGISTRO: 'pesaje_registro',
  ESCANEO_BURST: 'escaneo_burst',
  TOMA_INVENTARIO: 'toma_inventario',
  IMPRESION_ETIQUETAS: 'impresion_etiquetas',
  MOVIMIENTO_FISICO: 'movimiento_fisico',

  // Calidad
  AUTORIZAR_CALIDAD: 'autorizar_calidad',
  MUESTREO_LOTES: 'muestreo_lotes',

  // Gerente / Administrador
  AUDITORIA_REALTIME: 'auditoria_realtime',
  GESTION_CATALOGOS: 'gestion_catalogos',
  GESTION_BACKUPS: 'gestion_backups',
  ELIMINAR_TAMBORES: 'eliminar_tambores',
  CONFIG_RED: 'config_red',
};

export const ROLE_PERMISSIONS = {
  [ROLES.OPERARIO]: [
    PERMISOS.PESAJE_REGISTRO,
    PERMISOS.ESCANEO_BURST,
    PERMISOS.TOMA_INVENTARIO,
    PERMISOS.IMPRESION_ETIQUETAS,
    PERMISOS.MOVIMIENTO_FISICO,
  ],
  [ROLES.CALIDAD]: [
    PERMISOS.AUTORIZAR_CALIDAD,
    PERMISOS.MUESTREO_LOTES,
    PERMISOS.ESCANEO_BURST,
    PERMISOS.IMPRESION_ETIQUETAS,
    PERMISOS.MOVIMIENTO_FISICO,
    PERMISOS.AUDITORIA_REALTIME,
  ],
  [ROLES.ADMINISTRADOR]: Object.values(PERMISOS),
};

export const DEFAULT_USERS = {
  operario: {
    id: 'usr-operario-01',
    nombre: 'Javier Domínguez',
    email: 'operador@olivicolalujan.com.ar',
    rol: ROLES.OPERARIO,
    cargo: 'Operador de Planta',
    badge: 'Planta Luján · Balanza',
  },
  calidad: {
    id: 'usr-calidad-01',
    nombre: 'Ing. Marcela Benítez',
    email: 'calidad@olivicolalujan.com.ar',
    rol: ROLES.CALIDAD,
    cargo: 'Responsable de Calidad',
    badge: 'Laboratorio y Muestreo',
  },
  admin: {
    id: 'usr-admin-01',
    nombre: 'Valeria Rivas',
    email: 'administracion@olivicolalujan.com.ar',
    rol: ROLES.ADMINISTRADOR,
    cargo: 'Gerente de Operaciones',
    badge: 'Gerencia General',
  },
};

/**
 * Comprueba si un rol o usuario posee un permiso determinado
 */
export function checkPermission(userOrRole, permission) {
  if (!userOrRole || !permission) return false;
  const roleName = typeof userOrRole === 'string' ? userOrRole : userOrRole.rol;
  const perms = ROLE_PERMISSIONS[roleName] || [];
  return perms.includes(permission);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('olivicola-lujan-user-session');
      return saved ? JSON.parse(saved) : DEFAULT_USERS.operario;
    } catch {
      return DEFAULT_USERS.operario;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem('olivicola-lujan-user-session', JSON.stringify(currentUser));
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser]);

  const switchRole = (roleKey) => {
    const key = roleKey?.toLowerCase();
    if (DEFAULT_USERS[key]) {
      setCurrentUser(DEFAULT_USERS[key]);
      setIsAuthenticated(true);
    } else if (DEFAULT_USERS[roleKey]) {
      setCurrentUser(DEFAULT_USERS[roleKey]);
      setIsAuthenticated(true);
    }
  };

  const login = (roleKey = 'operario') => {
    switchRole(roleKey);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const setCustomOperatorName = (newName) => {
    if (!newName || !newName.trim()) return;
    setCurrentUser((prev) => ({
      ...prev,
      nombre: newName.trim(),
    }));
  };

  const can = useMemo(() => {
    return (perm) => checkPermission(currentUser?.rol, perm);
  }, [currentUser?.rol]);

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        role: currentUser.rol,
        isAuthenticated,
        can,
        hasPermission: can,
        login,
        logout,
        switchRole,
        setCustomOperatorName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children, requiredPermission = null }) {
  const { isAuthenticated, can } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-obsidian">Acceso Restringido por Perfil</h2>
        <p className="text-sm text-bone-600">
          Tu usuario actual no posee el permiso requerido (<code>{requiredPermission}</code>) para acceder a este módulo.
        </p>
      </div>
    );
  }

  return children;
}

/**
 * Renderiza condicionalmente sus hijos según los permisos del usuario activo
 */
export function PermissionGate({ permission, children, fallback = null }) {
  const { can } = useAuth();
  if (!can(permission)) {
    return fallback;
  }
  return children;
}
