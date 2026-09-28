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
} from '../src/components/Auth.jsx';
import { clearAllCompanyData, loadDatabase, getCurrentWorkspaceMode } from '../src/api/repository.js';

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
});
