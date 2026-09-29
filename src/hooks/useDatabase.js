import { useState, useEffect } from 'react';
import { loadDatabase, syncWithHostServer, getNetworkConfig, NETWORK_MODES } from '../api/repository.js';

/**
 * Hook reactivo para consumir la base de datos de trazabilidad.
 * Se actualiza automáticamente cuando la base de datos cambia
 * (tanto por mutaciones locales como por sincronizaciones automáticas en segundo plano con el Servidor Host).
 */
export function useDatabase(autoSyncOnMount = true) {
  const [db, setDb] = useState(() => loadDatabase());

  useEffect(() => {
    const handleDbUpdated = () => {
      setDb(loadDatabase());
    };

    window.addEventListener('olivicola-db-updated', handleDbUpdated);

    // Si autoSyncOnMount es true y estamos conectados a la red LAN (Host o Cliente), solicitar datos frescos
    if (autoSyncOnMount) {
      const config = getNetworkConfig();
      if (config.mode !== NETWORK_MODES.OFFLINE) {
        syncWithHostServer()
          .then((res) => {
            if (res) {
              setDb(loadDatabase());
            }
          })
          .catch(() => {});
      }
    }

    return () => {
      window.removeEventListener('olivicola-db-updated', handleDbUpdated);
    };
  }, [autoSyncOnMount]);

  return db;
}

export default useDatabase;
