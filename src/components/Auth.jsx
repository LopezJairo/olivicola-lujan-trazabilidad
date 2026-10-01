/**
 * OLIVÍCOLA LUJÁN · Jerarquía de Perfiles, Autenticación y Control de Permisos
 * Gestiona el registro con legajo y contraseña, protección contra creación no autorizada
 * de cuentas de administrador/gerente mediante Clave Maestra de Gerencia, y control de roles.
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
  GESTION_USUARIOS: 'gestion_usuarios',
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

const STORAGE_USERS_KEY = 'olivicola-lujan-users-v2';
const STORAGE_ADMIN_SECRET_KEY = 'olivicola-lujan-admin-secret-v1';
const STORAGE_SESSION_KEY = 'olivicola-lujan-user-session-v2';
export const DEFAULT_ADMIN_KEY = 'LUJAN2026';

export const DEFAULT_USERS = {
  operario: {
    id: 'usr-operario-01',
    legajo: 'OP-01',
    nombre: 'Operador de Planta',
    password: '123',
    rol: ROLES.OPERARIO,
    cargo: 'Operador de Planta · Balanza',
    badge: 'Planta Luján',
    activo: true,
    fecha_creacion: '2026-09-01T00:00:00.000Z',
  },
  calidad: {
    id: 'usr-calidad-01',
    legajo: 'CAL-01',
    nombre: 'Responsable de Calidad',
    password: '123',
    rol: ROLES.CALIDAD,
    cargo: 'Responsable de Calidad',
    badge: 'Laboratorio y Muestreo',
    activo: true,
    fecha_creacion: '2026-09-01T00:00:00.000Z',
  },
  admin: {
    id: 'usr-admin-01',
    legajo: 'ADM-01',
    nombre: 'Gerencia General',
    password: '123',
    rol: ROLES.ADMINISTRADOR,
    cargo: 'Gerente de Operaciones',
    badge: 'Gerencia General',
    activo: true,
    fecha_creacion: '2026-09-01T00:00:00.000Z',
  },
};

/**
 * Carga usuarios persistidos o inicializa con los usuarios estándar de fábrica
 */
export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      const initialList = Object.values(DEFAULT_USERS);
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initialList));
      return initialList;
    }
    return JSON.parse(raw);
  } catch {
    return Object.values(DEFAULT_USERS);
  }
}

export function saveStoredUsers(users) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error al guardar usuarios:', err);
  }
}

export function getAdminSecretKey() {
  try {
    return localStorage.getItem(STORAGE_ADMIN_SECRET_KEY) || DEFAULT_ADMIN_KEY;
  } catch {
    return DEFAULT_ADMIN_KEY;
  }
}

export function setAdminSecretKey(newSecret) {
  if (!newSecret || !newSecret.trim()) {
    throw new Error('La clave de autorización no puede estar vacía.');
  }
  localStorage.setItem(STORAGE_ADMIN_SECRET_KEY, newSecret.trim());
}

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
  const [usersList, setUsersList] = useState(() => getStoredUsers());
  const [adminSecret, setAdminSecretState] = useState(() => getAdminSecretKey());

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
      return DEFAULT_USERS.operario;
    } catch {
      return DEFAULT_USERS.operario;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_SESSION_KEY));
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (isAuthenticated && currentUser) {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser, isAuthenticated]);

  /**
   * Iniciar sesión con Legajo y Contraseña
   */
  const loginWithCredentials = (legajo, password) => {
    const cleanLegajo = String(legajo || '').trim().toUpperCase();
    const cleanPass = String(password || '').trim();

    if (!cleanLegajo) {
      throw new Error('Por favor ingresa tu número de legajo.');
    }
    if (!cleanPass) {
      throw new Error('Por favor ingresa tu contraseña.');
    }

    const currentUsers = getStoredUsers();
    const found = currentUsers.find(
      (u) => String(u.legajo || '').trim().toUpperCase() === cleanLegajo
    );

    if (!found) {
      throw new Error(`No se encontró ningún usuario registrado con el legajo «${legajo}».`);
    }

    if (found.activo === false) {
      throw new Error('Esta cuenta de usuario ha sido desactivada por la Gerencia.');
    }

    if (found.password && String(found.password).trim() !== cleanPass) {
      throw new Error('Contraseña incorrecta. Verifica tu clave o solicita un blanqueo al Administrador.');
    }

    setCurrentUser(found);
    setIsAuthenticated(true);
    return found;
  };

  /**
   * Registro de nuevo usuario (con clave de autorización si es Gerente o Calidad)
   */
  const registerUser = ({ nombre, legajo, password, rol, cargo, adminKey = '' }) => {
    const cleanNombre = String(nombre || '').trim();
    const cleanLegajo = String(legajo || '').trim().toUpperCase();
    const cleanPass = String(password || '').trim();
    const targetRole = rol || ROLES.OPERARIO;

    if (!cleanNombre) throw new Error('El nombre y apellido son obligatorios.');
    if (!cleanLegajo) throw new Error('El número de legajo es obligatorio.');
    if (!cleanPass || cleanPass.length < 3) {
      throw new Error('La contraseña debe tener al menos 3 caracteres.');
    }

    // Comprobar si el legajo ya existe
    const currentUsers = getStoredUsers();
    const exists = currentUsers.find(
      (u) => String(u.legajo || '').trim().toUpperCase() === cleanLegajo
    );
    if (exists) {
      throw new Error(`El número de legajo «${legajo}» ya se encuentra registrado.`);
    }

    // Protección contra auto-creación de cuenta Admin o Calidad
    if (targetRole === ROLES.ADMINISTRADOR || targetRole === ROLES.CALIDAD) {
      const currentSecret = getAdminSecretKey();
      if (!adminKey || String(adminKey).trim() !== currentSecret) {
        throw new Error(
          'Clave de Autorización de Gerencia incorrecta. Solo la Gerencia puede autorizar cuentas de Administrador o Calidad.'
        );
      }
    }

    const newUser = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      legajo: cleanLegajo,
      nombre: cleanNombre,
      password: cleanPass,
      rol: targetRole,
      cargo: cargo || (targetRole === ROLES.ADMINISTRADOR ? 'Gerente / Administrador' : targetRole === ROLES.CALIDAD ? 'Control de Calidad' : 'Operador de Planta'),
      badge: targetRole === ROLES.ADMINISTRADOR ? 'Gerencia General' : targetRole === ROLES.CALIDAD ? 'Laboratorio y Calidad' : 'Planta Luján',
      activo: true,
      fecha_creacion: new Date().toISOString(),
    };

    const updated = [...currentUsers, newUser];
    saveStoredUsers(updated);
    setUsersList(updated);

    // Iniciar sesión con la cuenta recién creada
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  };

  /**
   * Creación de usuario directa por parte de un Administrador (no requiere PIN)
   */
  const adminCreateUser = ({ nombre, legajo, password, rol, cargo }) => {
    if (!checkPermission(currentUser?.rol, PERMISOS.GESTION_USUARIOS)) {
      throw new Error('Permiso denegado: Solo el Administrador puede gestionar personal.');
    }

    const cleanNombre = String(nombre || '').trim();
    const cleanLegajo = String(legajo || '').trim().toUpperCase();
    const cleanPass = String(password || '').trim() || '123';
    const targetRole = rol || ROLES.OPERARIO;

    if (!cleanNombre) throw new Error('El nombre y apellido son obligatorios.');
    if (!cleanLegajo) throw new Error('El número de legajo es obligatorio.');

    const currentUsers = getStoredUsers();
    const exists = currentUsers.find(
      (u) => String(u.legajo || '').trim().toUpperCase() === cleanLegajo
    );
    if (exists) {
      throw new Error(`El número de legajo «${legajo}» ya existe.`);
    }

    const newUser = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      legajo: cleanLegajo,
      nombre: cleanNombre,
      password: cleanPass,
      rol: targetRole,
      cargo: cargo || (targetRole === ROLES.ADMINISTRADOR ? 'Gerencia / Administración' : targetRole === ROLES.CALIDAD ? 'Control de Calidad' : 'Operador de Planta'),
      badge: targetRole === ROLES.ADMINISTRADOR ? 'Gerencia General' : targetRole === ROLES.CALIDAD ? 'Laboratorio y Calidad' : 'Planta Luján',
      activo: true,
      fecha_creacion: new Date().toISOString(),
    };

    const updated = [...currentUsers, newUser];
    saveStoredUsers(updated);
    setUsersList(updated);
    return newUser;
  };

  /**
   * Actualización de usuario por Administrador (rol, estado, contraseña)
   */
  const adminUpdateUser = (userId, updates) => {
    if (!checkPermission(currentUser?.rol, PERMISOS.GESTION_USUARIOS)) {
      throw new Error('Permiso denegado: Solo el Administrador puede gestionar usuarios.');
    }

    const currentUsers = getStoredUsers();
    const updated = currentUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          ...updates,
          legajo: updates.legajo ? String(updates.legajo).trim().toUpperCase() : u.legajo,
          nombre: updates.nombre ? String(updates.nombre).trim() : u.nombre,
          password: updates.newPassword ? String(updates.newPassword).trim() : u.password,
        };
      }
      return u;
    });

    saveStoredUsers(updated);
    setUsersList(updated);

    if (currentUser?.id === userId) {
      const refreshed = updated.find((u) => u.id === userId);
      if (refreshed) setCurrentUser(refreshed);
    }
  };

  /**
   * Eliminar usuario por Administrador
   */
  const adminDeleteUser = (userId) => {
    if (!checkPermission(currentUser?.rol, PERMISOS.GESTION_USUARIOS)) {
      throw new Error('Permiso denegado: Solo el Administrador puede eliminar usuarios.');
    }

    if (currentUser?.id === userId) {
      throw new Error('No puedes eliminar tu propia cuenta en uso.');
    }

    const currentUsers = getStoredUsers();
    const updated = currentUsers.filter((u) => u.id !== userId);
    saveStoredUsers(updated);
    setUsersList(updated);
  };

  /**
   * Actualizar clave de autorización de Gerencia
   */
  const updateAdminSecret = (newSecret) => {
    if (!checkPermission(currentUser?.rol, PERMISOS.GESTION_USUARIOS)) {
      throw new Error('Permiso denegado: Solo el Administrador puede modificar la clave de autorización.');
    }
    setAdminSecretKey(newSecret);
    setAdminSecretState(newSecret.trim());
  };

  const canSwitchRole = useMemo(() => {
    // Un operario NUNCA puede cambiar de rol ni saltar entre usuarios
    if (!currentUser || currentUser?.rol === ROLES.OPERARIO) {
      return false;
    }
    // Solo un Administrador con permiso de gestión de usuarios puede conmutar roles
    return checkPermission(currentUser?.rol, PERMISOS.GESTION_USUARIOS);
  }, [currentUser]);

  const switchRole = (roleKey) => {
    if (!canSwitchRole) {
      throw new Error(
        'Operación no permitida: Los operarios de planta no tienen autorización para alternar o cambiar roles de usuario.'
      );
    }

    const key = roleKey?.toLowerCase();
    const currentUsers = getStoredUsers();

    // Buscar primero un usuario registrado con ese rol
    const match = currentUsers.find((u) => {
      if (key === 'operario' || key === 'operador') return u.rol === ROLES.OPERARIO;
      if (key === 'calidad') return u.rol === ROLES.CALIDAD;
      if (key === 'admin' || key === 'administrador') return u.rol === ROLES.ADMINISTRADOR;
      return false;
    });

    if (match) {
      setCurrentUser(match);
      setIsAuthenticated(true);
    } else if (DEFAULT_USERS[key]) {
      setCurrentUser(DEFAULT_USERS[key]);
      setIsAuthenticated(true);
    }
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
        role: currentUser?.rol || ROLES.OPERARIO,
        isAuthenticated,
        usersList,
        adminSecret,
        can,
        hasPermission: can,
        canSwitchRole,
        loginWithCredentials,
        registerUser,
        adminCreateUser,
        adminUpdateUser,
        adminDeleteUser,
        updateAdminSecret,
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

export function PermissionGate({ permission, children, fallback = null }) {
  const { can } = useAuth();
  if (!can(permission)) {
    return fallback;
  }
  return children;
}
