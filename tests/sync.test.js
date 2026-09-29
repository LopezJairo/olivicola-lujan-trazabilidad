import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveDatabase,
  loadDatabase,
  getNetworkConfig,
  setNetworkConfig,
  NETWORK_MODES,
  checkAndSyncFromHost,
} from '../src/api/repository.js';

// Mock localStorage para Node test environment
const mockStorage = {};
globalThis.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

// Mock window y EventTarget para Node
class MockWindow extends EventTarget {}
const mockWin = new MockWindow();
globalThis.window = mockWin;
globalThis.CustomEvent = class CustomEvent extends Event {
  constructor(name, options = {}) {
    super(name);
    this.detail = options.detail;
  }
};

describe('Sincronización en Tiempo Real Host <-> Cliente', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('1. saveDatabase emite el evento personalizado olivicola-db-updated en window', () => {
    let eventFired = false;
    let eventDetail = null;

    const listener = (e) => {
      eventFired = true;
      eventDetail = e.detail;
    };

    window.addEventListener('olivicola-db-updated', listener);

    saveDatabase({ catalogos: [], tambores: [{ tambor_id: 'T000001' }], historial: [], movimientos: [] });

    expect(eventFired).toBe(true);
    expect(eventDetail).toBeDefined();

    window.removeEventListener('olivicola-db-updated', listener);
  });

  it('2. checkAndSyncFromHost no ejecuta llamadas si el modo es OFFLINE', async () => {
    setNetworkConfig({ mode: NETWORK_MODES.OFFLINE });
    const result = await checkAndSyncFromHost();
    expect(result).toBe(false);
  });

  it('3. checkAndSyncFromHost sincroniza cuando el Host tiene novedades', async () => {
    setNetworkConfig({ mode: NETWORK_MODES.CLIENT, hostUrl: 'http://localhost:4000' });

    // Mock fetch para simular respuesta de status con 1 tambor en el Host
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn((url) => {
      if (String(url).includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'ok',
            stats: { tambores: 1 },
          }),
        });
      }
      if (String(url).includes('/api/database')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            catalogos: [],
            tambores: [{ id: 'tb-1', tambor_id: 'T000001', peso: 180 }],
            historial: [],
            movimientos: [],
          }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const synced = await checkAndSyncFromHost();
    expect(Boolean(synced)).toBe(true);

    const updatedDb = loadDatabase();
    expect(updatedDb.tambores.length).toBe(1);
    expect(updatedDb.tambores[0].tambor_id).toBe('T000001');

    globalThis.fetch = originalFetch;
  });
});
