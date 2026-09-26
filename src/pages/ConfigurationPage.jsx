import React, { useState, useMemo } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  Check,
  X,
  Power,
  Download,
  Upload,
  RotateCcw,
  Database,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  loadDatabase,
  saveCatalogItem,
  toggleCatalogActive,
  exportDatabaseJSON,
  importDatabaseJSON,
  resetDemoDatabase,
  getCurrentWorkspaceMode,
  setCurrentWorkspaceMode,
} from '../api/repository.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog.jsx';

const CATALOG_TYPES = [
  { key: 'producto', label: 'Productos', desc: 'Entera, Descarozada, Rodajas, Griegas, Rellenas, Rotas' },
  { key: 'presentacion', label: 'Presentaciones', desc: 'Verde, Negra, Base, Californiana, Clara, Para Griega, Sin Carozo, Con Pasta, Aceite' },
  { key: 'variedad', label: 'Variedades', desc: 'Aloreña, Arauco, Manzanilla Fina, Picual, Empeltre' },
  { key: 'calibre', label: 'Calibres', desc: '121/140, 141/160, 161/180, 181/200, 201/240, 241/280, Sin Calibre, etc.' },
  { key: 'calidad', label: 'Calidades', desc: 'Primera (PRI), Segunda (SDA), Tercera (TRA)' },
  { key: 'ubicacion', label: 'Ubicaciones', desc: 'Naves, Filas, Patios de fermentación, Despacho' },
  { key: 'estado', label: 'Estados de Proceso', desc: 'En fermentación, En reposo, Salmuera, Calibrado, etc.' },
  { key: 'tipo_movimiento', label: 'Tipos de Movimiento', desc: 'Traslados, Reubicación, Muestreo, Ingreso, Despacho' },
];

export function ConfigurationPage() {
  const [db, setDb] = useState(loadDatabase());
  const { catalogos } = db;
  const currentMode = getCurrentWorkspaceMode();

  const [activeTab, setActiveTab] = useState('variedad');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    nombre: '',
    codigo: '',
    orden: 1,
    activo: true,
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const currentTypeMeta = CATALOG_TYPES.find((t) => t.key === activeTab);

  const currentItems = useMemo(() => {
    return catalogos
      .filter((c) => c.tipo === activeTab)
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
  }, [catalogos, activeTab]);

  const handleOpenNew = () => {
    setEditingItem(null);
    setItemForm({
      nombre: '',
      codigo: '',
      orden: currentItems.length + 1,
      activo: true,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setItemForm({
      nombre: item.nombre,
      codigo: item.codigo,
      orden: item.orden,
      activo: item.activo,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      await saveCatalogItem({
        id: editingItem?.id,
        tipo: activeTab,
        ...itemForm,
      });
      setDb(loadDatabase());
      setModalOpen(false);
      setSuccessMessage('Opción de catálogo guardada con éxito.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await toggleCatalogActive(id);
      setDb(loadDatabase());
    } catch (err) {
      alert(err.message);
    }
  };

  // Exportar Copia de Seguridad JSON
  const handleExportJSON = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trazabilidad-olivicola-lujan-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Importar Copia de Seguridad JSON
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        importDatabaseJSON(text);
        setDb(loadDatabase());
        alert('Copia de seguridad restaurada correctamente.');
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    };
    reader.readAsText(file);
  };

  // Cambiar modo de espacio de trabajo
  const handleSwitchWorkspace = (newMode) => {
    if (newMode === currentMode) return;
    if (
      confirm(
        `¿Deseas cambiar al ${
          newMode === 'demo' ? 'Modo Demostración' : 'Espacio Empresa (Limpio para datos reales)'
        }?`
      )
    ) {
      setCurrentWorkspaceMode(newMode);
      window.location.reload();
    }
  };

  // Resetear demostración
  const handleResetDemo = () => {
    if (confirm('¿Restablecer el inventario de demostración a sus 12 tambores originales?')) {
      resetDemoDatabase();
      setDb(loadDatabase());
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* ---------------- CABECERA ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Administración Central
            </span>
            <span className="text-bone-400 text-xs font-mono">· Catálogos Dinámicos</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Configuración y Catálogos
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Administra las opciones seleccionables en planta y respalda la base de datos local.
          </p>
        </div>

        <Button variant="primary" size="default" onClick={handleOpenNew} className="text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Agregar Opción a {currentTypeMeta?.label}
        </Button>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium">
          {successMessage}
        </div>
      )}

      {/* ---------------- PESTAÑAS DE CATÁLOGOS ---------------- */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-bone-200">
        {CATALOG_TYPES.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => setActiveTab(type.key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === type.key
                ? 'bg-obsidian text-bone-50 shadow-soft-sm font-semibold'
                : 'bg-white text-bone-700 hover:bg-bone-100 border border-bone-300'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* ---------------- TABLA DE OPCIONES DEL CATÁLOGO ---------------- */}
      <div className="bezel-shell">
        <div className="bezel-core p-0 overflow-x-auto bg-white">
          <div className="p-4 bg-bone-50/70 border-b border-bone-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-obsidian text-sm">{currentTypeMeta?.label}</span>
              <p className="text-bone-500 text-[11px]">{currentTypeMeta?.desc}</p>
            </div>
            <span className="font-mono text-bone-500">
              {currentItems.length} opciones configuradas
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-bone-200 bg-bone-50/40 font-mono text-[11px] text-bone-600 uppercase tracking-wider">
                <th className="p-3 w-16 text-center">Orden</th>
                <th className="p-3 font-semibold">Nombre Visible</th>
                <th className="p-3 font-semibold">Código en Tambor</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-100">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-bone-50/60 transition-colors">
                  <td className="p-3 text-center font-mono font-bold text-bone-600">
                    {item.orden}
                  </td>
                  <td className="p-3 font-semibold text-obsidian">
                    {item.nombre}
                  </td>
                  <td className="p-3">
                    <span className="font-mono font-bold text-xs bg-bone-100 text-obsidian px-2 py-0.5 rounded">
                      {item.codigo}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge variant={item.activo ? 'paleGreen' : 'default'} dot={item.activo}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(item.id)}
                        className="text-[11px] h-7 px-2.5"
                      >
                        <Power className="w-3 h-3 mr-1" />
                        {item.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="text-[11px] h-7 px-2.5"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- GESTIÓN DE DATOS Y COPIAS DE SEGURIDAD ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-olive-800" />
            <span>Gestión de Datos y Copias de Seguridad</span>
          </CardTitle>
          <p className="text-xs text-bone-600">
            Control de entornos, exportación de inventario e importación para evitar pérdida de datos en planta.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 text-xs">
          {/* Alternar Entornos */}
          <div className="p-4 rounded-xl border border-bone-200 bg-bone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold text-obsidian block text-sm">
                Espacio de Trabajo Activo
              </span>
              <p className="text-bone-600 text-xs mt-0.5">
                {currentMode === 'demo'
                  ? 'Modo Demostración (contiene los 12 tambores de prueba).'
                  : 'Espacio Empresa (espacio limpio listo para registrar lotes reales sin mezclar ejemplos).'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={currentMode === 'demo' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSwitchWorkspace('demo')}
                className="text-xs"
              >
                Espacio Demo
              </Button>
              <Button
                variant={currentMode === 'empresa' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSwitchWorkspace('empresa')}
                className="text-xs"
              >
                Espacio Empresa
              </Button>
            </div>
          </div>

          {/* Exportar / Importar / Resetear */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Exportar JSON */}
            <div className="p-4 rounded-xl border border-bone-200 bg-white space-y-2">
              <span className="font-bold text-obsidian block">Exportar Copia JSON</span>
              <p className="text-bone-600 text-[11px]">
                Descarga un archivo completo con tambores, movimientos, historial y catálogos.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                className="w-full text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Descargar Respaldo
              </Button>
            </div>

            {/* Importar JSON */}
            <div className="p-4 rounded-xl border border-bone-200 bg-white space-y-2">
              <span className="font-bold text-obsidian block">Restaurar Copia JSON</span>
              <p className="text-bone-600 text-[11px]">
                Restaura un inventario respaldado previamente desde tu computadora.
              </p>
              <label className="cursor-pointer block">
                <span className="inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] bg-white text-obsidian hover:bg-bone-100 border border-bone-300 h-8 px-3 text-xs rounded-md w-full">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Cargar Archivo JSON
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>

            {/* Restablecer Demo */}
            <div className="p-4 rounded-xl border border-bone-200 bg-white space-y-2">
              <span className="font-bold text-obsidian block">Restablecer Ejemplos</span>
              <p className="text-bone-600 text-[11px]">
                Vuelve a cargar los 12 tambores iniciales de demostración de Olivícola Luján.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetDemo}
                className="w-full text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Restablecer Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- MODAL CREAR / EDITAR OPCIÓN DE CATÁLOGO ---------------- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Opción de Catálogo' : `Nueva Opción para ${currentTypeMeta?.label}`}
            </DialogTitle>
            <DialogDescription>
              El código se utilizará en la construcción del identificador del código de barras en planta.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs mb-3">
              {formError}
            </div>
          )}

          <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Nombre Visible *
              </label>
              <Input
                placeholder="ej: Arauco, Salmuera 12%, Nave A..."
                value={itemForm.nombre}
                onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="font-semibold text-bone-800 block mb-1">
                Código para el Tambor (Mayúsculas) *
              </label>
              <Input
                placeholder="ej: ALOR, VDE, 161/200, NAV-A1..."
                value={itemForm.codigo}
                onChange={(e) => setItemForm({ ...itemForm, codigo: e.target.value.toUpperCase() })}
                mono
                required
              />
              <span className="text-[10px] text-bone-500 mt-1 block">
                Solo letras mayúsculas, números, / y guiones. Se usará en el código de barras CODE 128.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-bone-800 block mb-1">
                  Orden de Visualización
                </label>
                <Input
                  type="number"
                  min="1"
                  value={itemForm.orden}
                  onChange={(e) => setItemForm({ ...itemForm, orden: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="font-semibold text-bone-800 block mb-1">
                  Estado
                </label>
                <select
                  value={itemForm.activo ? 'true' : 'false'}
                  onChange={(e) => setItemForm({ ...itemForm, activo: e.target.value === 'true' })}
                  className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                >
                  <option value="true">Activo (Disponible en formularios)</option>
                  <option value="false">Inactivo (Oculto en nuevas cargas)</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Guardar Opción
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
