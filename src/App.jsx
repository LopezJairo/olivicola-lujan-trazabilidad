import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/Auth.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { ScanPage } from './pages/ScanPage.jsx';
import { InventoryPage } from './pages/InventoryPage.jsx';
import { NewDrumPage } from './pages/NewDrumPage.jsx';
import { DrumDetailPage } from './pages/DrumDetailPage.jsx';
import { EditDrumPage } from './pages/EditDrumPage.jsx';
import { IndividualLabelPage } from './pages/IndividualLabelPage.jsx';
import { BatchLabelsPage } from './pages/BatchLabelsPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { InventoryAuditPage } from './pages/InventoryAuditPage.jsx';
import { ConfigurationPage } from './pages/ConfigurationPage.jsx';
import { HelpPage } from './pages/HelpPage.jsx';
import { QualityPage } from './pages/QualityPage.jsx';
import { Button } from './components/ui/button.jsx';

import { LoginPage } from './pages/LoginPage.jsx';

export function App() {
  return (
    <Routes>
      {/* Rutas de autenticación */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />
      <Route path="/forgot-password" element={<LoginPage />} />
      <Route path="/reset-password" element={<LoginPage />} />

      {/* Rutas operativas protegidas con Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/escanear" element={<ScanPage />} />
                <Route path="/inventario" element={<InventoryPage />} />
                <Route path="/inventario/toma" element={<InventoryAuditPage />} />
                <Route path="/tambores/nuevo" element={<NewDrumPage />} />
                <Route path="/calidad" element={<QualityPage />} />
                <Route path="/tambores/:id" element={<DrumDetailPage />} />
                <Route path="/tambores/:id/editar" element={<EditDrumPage />} />
                <Route path="/tambores/:id/etiqueta" element={<IndividualLabelPage />} />
                <Route path="/etiquetas" element={<BatchLabelsPage />} />
                <Route path="/historial" element={<HistoryPage />} />
                <Route path="/configuracion" element={<ConfigurationPage />} />
                <Route path="/ayuda" element={<HelpPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
