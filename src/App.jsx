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
import { ConfigurationPage } from './pages/ConfigurationPage.jsx';
import { HelpPage } from './pages/HelpPage.jsx';
import { Button } from './components/ui/button.jsx';

// Pantalla de acceso / login gestionado por plataforma
function LoginPage() {
  return (
    <div className="min-h-screen bg-bone-50 flex items-center justify-center p-4">
      <div className="bezel-shell max-w-md w-full">
        <div className="bezel-core p-8 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-olive-900 text-bone-50 flex items-center justify-center mx-auto font-serif text-2xl font-bold">
            O
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-obsidian">
              OLIVÍCOLA LUJÁN
            </h2>
            <p className="text-xs font-mono text-olive-700 uppercase tracking-wider mt-0.5">
              Acceso al Sistema de Trazabilidad
            </p>
          </div>
          <p className="text-xs text-bone-600">
            En entorno conectado, el acceso es gestionado por Base44. En este entorno local de pruebas, puedes ingresar directamente con cualquiera de los roles disponibles.
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="primary" className="w-full">
                Entrar al Sistema
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

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
                <Route path="/tambores/nuevo" element={<NewDrumPage />} />
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
