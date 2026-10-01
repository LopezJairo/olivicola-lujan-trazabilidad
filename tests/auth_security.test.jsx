import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import {
  ROLES,
  PERMISOS,
  DEFAULT_ADMIN_KEY,
  DEFAULT_USERS,
  getStoredUsers,
  saveStoredUsers,
  getAdminSecretKey,
  setAdminSecretKey,
  AuthProvider,
  useAuth,
} from '../src/components/Auth.jsx';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { clearAllCompanyData, loadDatabase, getCurrentWorkspaceMode } from '../src/api/repository.js';
import { ConfigurationPage } from '../src/pages/ConfigurationPage.jsx';

// Mock localStorage para Vitest en entorno Node
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Pruebas de Seguridad, Autenticación y Modo Empresa Limpio', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Carga inicial de usuarios incluye legajos predeterminados con contraseñas seguras', () => {
    const users = getStoredUsers();
    expect(users.length).toBeGreaterThanOrEqual(3);

    const operario = users.find((u) => u.rol === ROLES.OPERARIO);
    expect(operario).toBeDefined();
    expect(operario.legajo).toBe('OP-01');
    expect(operario.password).toBeDefined();

    const admin = users.find((u) => u.rol === ROLES.ADMINISTRADOR);
    expect(admin).toBeDefined();
    expect(admin.legajo).toBe('ADM-01');
  });

  it('2. Clave de Autorización de Gerencia por defecto es LUJAN2026 y puede actualizarse', () => {
    expect(getAdminSecretKey()).toBe(DEFAULT_ADMIN_KEY);

    setAdminSecretKey('NUEVA_CLAVE_2026');
    expect(getAdminSecretKey()).toBe('NUEVA_CLAVE_2026');

    expect(() => setAdminSecretKey('')).toThrow('La clave de autorización no puede estar vacía');
  });

  it('3. clearAllCompanyData inicializa la base de datos de planta con 0 tambores y conserva catálogos oficiales', () => {
    const cleared = clearAllCompanyData({ nombre: 'Gerente General' });
    expect(cleared.tambores).toHaveLength(0);
    expect(cleared.movimientos).toHaveLength(0);
    expect(cleared.catalogos.length).toBeGreaterThanOrEqual(50);

    // Verificar que existen los catálogos del Excel oficial
    const productos = cleared.catalogos.filter((c) => c.tipo === 'producto');
    expect(productos.some((p) => p.codigo === 'ENT')).toBe(true);
    expect(productos.some((p) => p.codigo === 'DES')).toBe(true);

    const variedades = cleared.catalogos.filter((c) => c.tipo === 'variedad');
    expect(variedades.some((v) => v.codigo === 'ALOR')).toBe(true);
    expect(variedades.some((v) => v.codigo === 'ARA')).toBe(true);

    const calibres = cleared.catalogos.filter((c) => c.tipo === 'calibre');
    expect(calibres.some((c) => c.codigo === '121/140')).toBe(true);
  });

  it('4. Modo predeterminado del sistema es empresa (no demo)', () => {
    const mode = getCurrentWorkspaceMode();
    expect(mode).toBe('empresa');
  });

  it('5. Usuario activo Operario tiene canSwitchRole en false y switchRole lanza error de permiso', () => {
    let authContextVal = null;
    function Consumer() {
      authContextVal = useAuth();
      return <div>Operario Test</div>;
    }

    renderToString(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(authContextVal).toBeDefined();
    expect(authContextVal.role).toBe(ROLES.OPERARIO);
    expect(authContextVal.canSwitchRole).toBe(false);

    // Intentar saltar a Administrador o Calidad desde cuenta operario debe ser rechazado
    expect(() => authContextVal.switchRole('admin')).toThrow(
      'Operación no permitida: Los operarios de planta no tienen autorización para alternar o cambiar roles de usuario.'
    );
    expect(() => authContextVal.switchRole('calidad')).toThrow(
      'Operación no permitida: Los operarios de planta no tienen autorización para alternar o cambiar roles de usuario.'
    );
  });

  it('6. Operario no puede ejecutar operaciones de gestión de usuarios (cambiar claves, roles, eliminar)', () => {
    let authContextVal = null;
    function Consumer() {
      authContextVal = useAuth();
      return <div>Operario Security Test</div>;
    }

    renderToString(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(authContextVal.role).toBe(ROLES.OPERARIO);
    expect(authContextVal.can(PERMISOS.GESTION_USUARIOS)).toBe(false);

    // Intentar modificar contraseña o rol de un usuario
    expect(() =>
      authContextVal.adminUpdateUser('usr-operario-01', { newPassword: 'hack' })
    ).toThrow('Permiso denegado: Solo el Administrador puede gestionar usuarios.');

    expect(() =>
      authContextVal.adminUpdateUser('usr-operario-01', { rol: ROLES.ADMINISTRADOR })
    ).toThrow('Permiso denegado: Solo el Administrador puede gestionar usuarios.');

    // Intentar registrar usuario vía adminCreateUser
    expect(() =>
      authContextVal.adminCreateUser({
        nombre: 'Falso Admin',
        legajo: 'HACK-01',
        password: '123',
        rol: ROLES.ADMINISTRADOR,
      })
    ).toThrow('Permiso denegado: Solo el Administrador puede gestionar personal.');

    // Intentar cambiar clave maestra de autorización de gerencia
    expect(() => authContextVal.updateAdminSecret('NUEVA_CLAVE')).toThrow(
      'Permiso denegado: Solo el Administrador puede modificar la clave de autorización.'
    );
  });

  it('7. Administrador tiene canSwitchRole en true y puede conmutar roles para auditoría y pruebas', () => {
    let authContextVal = null;
    function Consumer() {
      authContextVal = useAuth();
      return <div>Admin Test</div>;
    }

    // Inicializar sesión simulada como Administrador
    localStorage.setItem(
      'olivicola-lujan-user-session-v2',
      JSON.stringify(DEFAULT_USERS.admin)
    );

    renderToString(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(authContextVal).toBeDefined();
    expect(authContextVal.role).toBe(ROLES.ADMINISTRADOR);
    expect(authContextVal.canSwitchRole).toBe(true);

    // Administrador puede conmutar a Calidad
    expect(() => authContextVal.switchRole('calidad')).not.toThrow();
  });

  it('8. Jerarquía de Perfiles y Gestión de Personal no se visualizan al operario, pero sí al administrador', () => {
    // 1) Caso Operario: la sesión por defecto es OP-01 (Operario)
    localStorage.clear();
    const htmlOperario = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <ConfigurationPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // No debe contener ni la Jerarquía de Perfiles ni la Gestión de Personal ni banners de advertencia de operario
    expect(htmlOperario).not.toContain('Jerarquía de Perfiles y Control de Permisos');
    expect(htmlOperario).not.toContain('Gestión de Personal y Cuentas de Acceso');
    expect(htmlOperario).not.toContain('Cambio de rol inhabilitado para Operarios');
    expect(htmlOperario).not.toContain('Modo Operario Protegido');
    expect(htmlOperario).not.toContain('Acceso Restringido para Operarios');
    expect(htmlOperario).not.toContain('Clave Maestra de Autorización para Gerencia');

    // 2) Caso Administrador: sesión de Administrador
    localStorage.setItem(
      'olivicola-lujan-user-session-v2',
      JSON.stringify(DEFAULT_USERS.admin)
    );
    const htmlAdmin = renderToString(
      <MemoryRouter>
        <AuthProvider>
          <ConfigurationPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Debe contener ambas secciones completas y operacionales
    expect(htmlAdmin).toContain('Jerarquía de Perfiles y Control de Permisos');
    expect(htmlAdmin).toContain('Gestión de Personal y Cuentas de Acceso');
    expect(htmlAdmin).toContain('Clave Maestra de Autorización para Gerencia / Calidad');
    expect(htmlAdmin).toContain('Registrar Personal');
  });
});
