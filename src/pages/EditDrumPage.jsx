import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Layers,
  Scale,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { loadDatabase, updateDrum } from '../api/repository.js';
import {
  buildDescriptiveCode,
  buildCompactCode,
  buildFullCode,
  getSuggestedWeightForProduct,
  validateDrum,
  normalizeDrumInput,
} from '../lib/domain.js';
import { useAuth } from '../components/Auth.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input, Textarea } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';

export function EditDrumPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const db = loadDatabase();
  const { tambores, catalogos } = db;

  const drum = tambores.find((d) => d.id === id || d.tambor_id?.toUpperCase() === id?.toUpperCase());

  if (!drum) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">Tambor no encontrado</h2>
        <Link to="/inventario">
          <Button variant="primary">Volver al Inventario</Button>
        </Link>
      </div>
    );
  }

  // Filtrar catálogos: opciones activas + la opción actual asignada al tambor (aunque esté inactiva)
  const getOptionsForField = (tipo, currentVal) => {
    return catalogos.filter(
      (c) => c.tipo === tipo && (c.activo || c.id === currentVal || c.codigo === currentVal)
    );
  };

  const productOptions = useMemo(() => getOptionsForField('producto', drum.producto), [catalogos, drum.producto]);
  const presentationOptions = useMemo(() => getOptionsForField('presentacion', drum.presentacion), [catalogos, drum.presentacion]);
  const varietyOptions = useMemo(() => getOptionsForField('variedad', drum.variedad), [catalogos, drum.variedad]);
  const caliberOptions = useMemo(() => getOptionsForField('calibre', drum.calibre), [catalogos, drum.calibre]);
  const qualityOptions = useMemo(() => getOptionsForField('calidad', drum.calidad), [catalogos, drum.calidad]);
  const locationOptions = useMemo(() => getOptionsForField('ubicacion', drum.ubicacion), [catalogos, drum.ubicacion]);
  const statusOptions = useMemo(() => getOptionsForField('estado', drum.estado), [catalogos, drum.estado]);

  const [formData, setFormData] = useState({
    producto: drum.producto || '',
    presentacion: drum.presentacion || '',
    variedad: drum.variedad || '',
    calibre: drum.calibre || '',
    calidad: drum.calidad || '',
    lote: drum.lote || '',
    peso: drum.peso !== undefined ? String(drum.peso) : '',
    fecha_ingreso: drum.fecha_ingreso || '',
    fecha_elaboracion: drum.fecha_elaboracion || '',
    ubicacion: drum.ubicacion || '',
    estado: drum.estado || '',
    observaciones: drum.observaciones || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recálculo dinámico de códigos
  const liveDescriptiveCode = useMemo(() => {
    return buildDescriptiveCode(formData, catalogos);
  }, [formData, catalogos]);

  const liveCompactCode = useMemo(() => {
    return buildCompactCode(liveDescriptiveCode);
  }, [liveDescriptiveCode]);

  const liveFullCode = useMemo(() => {
    return buildFullCode(liveDescriptiveCode, drum.tambor_id);
  }, [liveDescriptiveCode, drum.tambor_id]);

  const currentSuggestedWeight = useMemo(() => {
    return getSuggestedWeightForProduct(formData.producto, catalogos);
  }, [formData.producto, catalogos]);

  const handleChange = (field, value) => {
    if (field === 'producto') {
      const prevSuggested = getSuggestedWeightForProduct(formData.producto, catalogos);
      const newSuggested = getSuggestedWeightForProduct(value, catalogos);
      setFormData((prev) => {
        const shouldUpdateWeight = !prev.peso || (prevSuggested && Number(prev.peso) === prevSuggested);
        return {
          ...prev,
          producto: value,
          peso: shouldUpdateWeight && newSuggested ? String(newSuggested) : prev.peso,
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const normalized = normalizeDrumInput(formData);
    const validation = validateDrum(normalized, catalogos, {
      isEdit: true,
      currentDrum: drum,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await updateDrum(drum.id, normalized, user);
      navigate(`/tambores/${drum.tambor_id}`, {
        state: { message: `Cambios guardados e historial actualizado para el tambor ${drum.tambor_id}.` },
      });
    } catch (err) {
      setErrors({ form: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-4 border-b border-bone-200">
        <div className="flex items-center gap-3">
          <Link
            to={`/tambores/${drum.tambor_id}`}
            className="p-2 rounded-xl text-bone-600 hover:text-obsidian hover:bg-bone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-olive-800 bg-olive-100 px-2 py-0.5 rounded font-semibold">
                Modificación de Ficha
              </span>
              <span className="text-xs font-mono text-bone-400">· Preserva ID</span>
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
              Editar Tambor {drum.tambor_id}
            </h2>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-bone-500 block">Número de Tambor</span>
          <span className="font-mono text-xl font-bold text-obsidian bg-bone-100 px-2.5 py-0.5 rounded-lg inline-block">
            {drum.tambor_id}
          </span>
        </div>
      </div>

      {errors.form && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Clasificación */}
          <div className="bezel-shell">
            <div className="bezel-core p-6 bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-bone-100">
                <Layers className="w-4 h-4 text-olive-800" />
                <h3 className="font-serif text-lg font-bold text-obsidian">
                  1. Clasificación del Producto
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-bone-700 block mb-1">Producto *</label>
                  <select
                    value={formData.producto}
                    onChange={(e) => handleChange('producto', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                  >
                    {productOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {!c.activo ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.producto && <p className="text-red-600 mt-1">{errors.producto}</p>}
                </div>

                <div>
                  <label className="font-semibold text-bone-700 block mb-1">Presentación *</label>
                  <select
                    value={formData.presentacion}
                    onChange={(e) => handleChange('presentacion', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                  >
                    {presentationOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {!c.activo ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.presentacion && <p className="text-red-600 mt-1">{errors.presentacion}</p>}
                </div>

                <div>
                  <label className="font-semibold text-bone-700 block mb-1">Variedad *</label>
                  <select
                    value={formData.variedad}
                    onChange={(e) => handleChange('variedad', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                  >
                    {varietyOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {!c.activo ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.variedad && <p className="text-red-600 mt-1">{errors.variedad}</p>}
                </div>

                <div>
                  <label className="font-semibold text-bone-700 block mb-1">Calibre *</label>
                  <select
                    value={formData.calibre}
                    onChange={(e) => handleChange('calibre', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                  >
                    {caliberOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {!c.activo ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.calibre && <p className="text-red-600 mt-1">{errors.calibre}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-bone-700 block mb-1">Calidad *</label>
                  <select
                    value={formData.calidad}
                    onChange={(e) => handleChange('calidad', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                  >
                    {qualityOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {!c.activo ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.calidad && <p className="text-red-600 mt-1">{errors.calidad}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Lote y Pesaje */}
          <div className="bezel-shell">
            <div className="bezel-core p-6 bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-bone-100">
                <Scale className="w-4 h-4 text-olive-800" />
                <h3 className="font-serif text-lg font-bold text-obsidian">
                  2. Lote, Pesaje y Fechas
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-bone-700 block mb-1">Lote *</label>
                  <Input
                    value={formData.lote}
                    onChange={(e) => handleChange('lote', e.target.value)}
                    error={errors.lote}
                    mono
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-bone-700 block">Peso Neto (kg) *</label>
                    {currentSuggestedWeight && (
                      <button
                        type="button"
                        onClick={() => handleChange('peso', String(currentSuggestedWeight))}
                        className="text-[10px] font-mono text-olive-800 hover:text-olive-950 bg-olive-50 hover:bg-olive-100 px-2 py-0.5 rounded border border-olive-200 transition-colors"
                        title="Aplicar peso sugerido oficial"
                      >
                        Sugerido: {currentSuggestedWeight} kg
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.peso}
                    onChange={(e) => handleChange('peso', e.target.value)}
                    error={errors.peso}
                    mono
                  />
                  {currentSuggestedWeight && (
                    <span className="text-[10px] text-bone-500 mt-1 block">
                      Estándar oficial de planta: {currentSuggestedWeight} kg/tambor
                    </span>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-bone-700 block mb-1">Fecha de Ingreso *</label>
                  <Input
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
                    error={errors.fecha_ingreso}
                  />
                </div>

                <div>
                  <label className="font-semibold text-bone-700 block mb-1">Fecha de Elaboración</label>
                  <Input
                    type="date"
                    value={formData.fecha_elaboracion}
                    onChange={(e) => handleChange('fecha_elaboracion', e.target.value)}
                    error={errors.fecha_elaboracion}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ubicación y Observaciones */}
          <div className="bezel-shell">
            <div className="bezel-core p-6 bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-bone-100">
                <Calendar className="w-4 h-4 text-olive-800" />
                <h3 className="font-serif text-lg font-bold text-obsidian">
                  3. Ubicación, Estado y Notas
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-bone-700 block mb-1">Ubicación *</label>
                  <select
                    value={formData.ubicacion}
                    onChange={(e) => handleChange('ubicacion', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                  >
                    {locationOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {!c.activo ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.ubicacion && <p className="text-red-600 mt-1">{errors.ubicacion}</p>}
                </div>

                <div>
                  <label className="font-semibold text-bone-700 block mb-1">Estado *</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-bone-300 bg-white"
                  >
                    {statusOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {!c.activo ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.estado && <p className="text-red-600 mt-1">{errors.estado}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-bone-700 block mb-1">Observaciones</label>
                  <Textarea
                    value={formData.observaciones}
                    onChange={(e) => handleChange('observaciones', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lateral de Acciones y Guardado */}
        <div className="space-y-6">
          <div className="bezel-shell sticky top-6">
            <div className="bezel-core p-6 bg-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-bone-200">
                <span className="text-xs font-mono uppercase tracking-wider text-olive-900 font-bold">
                  Acciones de Edición
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {drum.tambor_id}
                </Badge>
              </div>

              <div className="border border-bone-300 bg-bone-50/50 p-4 rounded-xl space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-bone-500 block">
                    Código Descriptivo
                  </span>
                  <span className="font-mono text-xs font-bold text-obsidian block truncate mt-0.5">
                    {liveDescriptiveCode}
                  </span>
                </div>
                <div className="border-t border-bone-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-bone-500 block">
                      Código Compacto (Base CODE 128)
                    </span>
                    <span className="text-[9px] font-mono text-olive-800 bg-olive-100 px-1.5 py-0.2 rounded font-semibold">
                      Sin guiones / barra
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-olive-900 block truncate mt-0.5">
                    {liveCompactCode}
                  </span>
                </div>
                <div className="border-t border-bone-200 pt-2">
                  <span className="text-[10px] uppercase font-mono text-bone-500 block">
                    Código de Trazabilidad
                  </span>
                  <span className="font-mono text-[11px] text-bone-700 font-semibold block break-all mt-0.5">
                    {liveFullCode}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="hero"
                  disabled={isSubmitting}
                  className="w-full text-sm font-semibold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Guardando...' : 'Guardar Modificaciones'}
                </Button>

                <Link to={`/tambores/${drum.tambor_id}`} className="block">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-bone-600">
                    Cancelar y Volver
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
