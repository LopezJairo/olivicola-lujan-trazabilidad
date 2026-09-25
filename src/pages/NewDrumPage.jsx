import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  Scale,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { loadDatabase, createDrum } from '../api/repository.js';
import {
  nextTamborId,
  buildDescriptiveCode,
  buildFullCode,
  validateDrum,
  normalizeDrumInput,
  resolveCatalogName,
} from '../lib/domain.js';
import { getTodayDateString } from '../lib/utils.js';
import { useAuth } from '../components/Auth.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input, Textarea } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { BarcodeSvg } from '../components/Barcode.jsx';

export function NewDrumPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const db = loadDatabase();
  const { tambores, historial, catalogos } = db;

  // Próximo ID calculado
  const nextId = useMemo(() => nextTamborId(tambores, historial), [tambores, historial]);

  // Solo opciones activas para nuevos tambores
  const activeCatalogs = useMemo(
    () => catalogos.filter((c) => c.activo).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre)),
    [catalogos]
  );

  const productOptions = useMemo(() => activeCatalogs.filter((c) => c.tipo === 'producto'), [activeCatalogs]);
  const presentationOptions = useMemo(() => activeCatalogs.filter((c) => c.tipo === 'presentacion'), [activeCatalogs]);
  const varietyOptions = useMemo(() => activeCatalogs.filter((c) => c.tipo === 'variedad'), [activeCatalogs]);
  const caliberOptions = useMemo(() => activeCatalogs.filter((c) => c.tipo === 'calibre'), [activeCatalogs]);
  const qualityOptions = useMemo(() => activeCatalogs.filter((c) => c.tipo === 'calidad'), [activeCatalogs]);
  const locationOptions = useMemo(() => activeCatalogs.filter((c) => c.tipo === 'ubicacion'), [activeCatalogs]);
  const statusOptions = useMemo(() => activeCatalogs.filter((c) => c.tipo === 'estado'), [activeCatalogs]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    producto: productOptions[0]?.id || '',
    presentacion: presentationOptions[0]?.id || '',
    variedad: varietyOptions[0]?.id || '',
    calibre: caliberOptions[0]?.id || '',
    calidad: qualityOptions[0]?.id || '',
    lote: '',
    peso: '',
    fecha_ingreso: getTodayDateString(),
    fecha_elaboracion: '',
    ubicacion: locationOptions[0]?.id || '',
    estado: statusOptions[0]?.id || '',
    observaciones: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Previsualización dinámica de códigos
  const liveDescriptiveCode = useMemo(() => {
    return buildDescriptiveCode(formData, catalogos);
  }, [formData, catalogos]);

  const liveFullCode = useMemo(() => {
    return buildFullCode(liveDescriptiveCode, nextId);
  }, [liveDescriptiveCode, nextId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const normalized = normalizeDrumInput(formData);
    const validation = validateDrum(normalized, catalogos, { isEdit: false });

    if (!validation.valid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const created = await createDrum(normalized, user);
      navigate(`/tambores/${created.tambor_id}`, {
        state: { message: `Tambor ${created.tambor_id} registrado con éxito.` },
      });
    } catch (err) {
      setErrors({ form: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* ---------------- CABECERA ---------------- */}
      <div className="flex items-center justify-between pb-4 border-b border-bone-200">
        <div className="flex items-center gap-3">
          <Link
            to="/inventario"
            className="p-2 rounded-xl text-bone-600 hover:text-obsidian hover:bg-bone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-olive-800 bg-olive-100 px-2 py-0.5 rounded font-semibold">
                Ingreso de Planta
              </span>
              <span className="text-xs font-mono text-bone-400">· Alta de Lote</span>
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
              Registrar Nuevo Tambor
            </h2>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-bone-500 block">Identificador asignado</span>
          <span className="font-mono text-2xl font-black text-obsidian bg-bone-100 px-3 py-1 rounded-xl inline-block mt-0.5">
            {nextId}
          </span>
        </div>
      </div>

      {errors.form && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* ---------------- CUERPO DEL FORMULARIO & PREVIEW ---------------- */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Formulario (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECCIÓN 1: Características del Producto */}
          <div className="bezel-shell">
            <div className="bezel-core p-6 bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-bone-100">
                <Layers className="w-4 h-4 text-olive-800" />
                <h3 className="font-serif text-lg font-bold text-obsidian">
                  1. Clasificación del Producto
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Producto */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Producto *
                  </label>
                  <select
                    value={formData.producto}
                    onChange={(e) => handleChange('producto', e.target.value)}
                    className="w-full h-11 px-3 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                  >
                    {productOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.codigo})
                      </option>
                    ))}
                  </select>
                  {errors.producto && <p className="text-xs text-red-600 mt-1">{errors.producto}</p>}
                </div>

                {/* Presentación */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Presentación *
                  </label>
                  <select
                    value={formData.presentacion}
                    onChange={(e) => handleChange('presentacion', e.target.value)}
                    className="w-full h-11 px-3 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                  >
                    {presentationOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.codigo})
                      </option>
                    ))}
                  </select>
                  {errors.presentacion && <p className="text-xs text-red-600 mt-1">{errors.presentacion}</p>}
                </div>

                {/* Variedad */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Variedad *
                  </label>
                  <select
                    value={formData.variedad}
                    onChange={(e) => handleChange('variedad', e.target.value)}
                    className="w-full h-11 px-3 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                  >
                    {varietyOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.codigo})
                      </option>
                    ))}
                  </select>
                  {errors.variedad && <p className="text-xs text-red-600 mt-1">{errors.variedad}</p>}
                </div>

                {/* Calibre */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Calibre *
                  </label>
                  <select
                    value={formData.calibre}
                    onChange={(e) => handleChange('calibre', e.target.value)}
                    className="w-full h-11 px-3 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                  >
                    {caliberOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.codigo})
                      </option>
                    ))}
                  </select>
                  {errors.calibre && <p className="text-xs text-red-600 mt-1">{errors.calibre}</p>}
                </div>

                {/* Calidad */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Calidad *
                  </label>
                  <select
                    value={formData.calidad}
                    onChange={(e) => handleChange('calidad', e.target.value)}
                    className="w-full h-11 px-3 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                  >
                    {qualityOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.codigo})
                      </option>
                    ))}
                  </select>
                  {errors.calidad && <p className="text-xs text-red-600 mt-1">{errors.calidad}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Lote, Fechas y Pesaje */}
          <div className="bezel-shell">
            <div className="bezel-core p-6 bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-bone-100">
                <Scale className="w-4 h-4 text-olive-800" />
                <h3 className="font-serif text-lg font-bold text-obsidian">
                  2. Lote, Pesaje e Ingreso
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lote */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Identificación de Lote *
                  </label>
                  <Input
                    placeholder="ej: LOTE-2026-AR01"
                    value={formData.lote}
                    onChange={(e) => handleChange('lote', e.target.value)}
                    error={errors.lote}
                    mono
                  />
                </div>

                {/* Peso Neto */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Peso Neto (Kilogramos) *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="ej: 220.5"
                    value={formData.peso}
                    onChange={(e) => handleChange('peso', e.target.value)}
                    error={errors.peso}
                    mono
                  />
                </div>

                {/* Fecha de Ingreso */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Fecha de Ingreso a Planta *
                  </label>
                  <Input
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
                    error={errors.fecha_ingreso}
                  />
                </div>

                {/* Fecha de Elaboración (Opcional) */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Fecha de Elaboración (Opcional)
                  </label>
                  <Input
                    type="date"
                    value={formData.fecha_elaboracion}
                    onChange={(e) => handleChange('fecha_elaboracion', e.target.value)}
                    error={errors.fecha_elaboracion}
                  />
                  <span className="text-[10px] text-bone-500 mt-1 block">
                    No puede ser posterior al ingreso
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Almacenamiento y Estado */}
          <div className="bezel-shell">
            <div className="bezel-core p-6 bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-bone-100">
                <Calendar className="w-4 h-4 text-olive-800" />
                <h3 className="font-serif text-lg font-bold text-obsidian">
                  3. Ubicación y Estado Inicial
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ubicación */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Ubicación en Planta *
                  </label>
                  <select
                    value={formData.ubicacion}
                    onChange={(e) => handleChange('ubicacion', e.target.value)}
                    className="w-full h-11 px-3 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                  >
                    {locationOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.ubicacion && <p className="text-xs text-red-600 mt-1">{errors.ubicacion}</p>}
                </div>

                {/* Estado */}
                <div>
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Estado de Proceso *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    className="w-full h-11 px-3 text-sm rounded-xl border border-bone-300 bg-white text-obsidian focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
                  >
                    {statusOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.estado && <p className="text-xs text-red-600 mt-1">{errors.estado}</p>}
                </div>

                {/* Observaciones */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-bone-700 block mb-1">
                    Observaciones (Opcional)
                  </label>
                  <Textarea
                    placeholder="Notas de cata, pH, grado salino, condiciones de estiba..."
                    value={formData.observaciones}
                    onChange={(e) => handleChange('observaciones', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Previsualización en Vivo de la Etiqueta */}
        <div className="space-y-6">
          <div className="bezel-shell sticky top-6">
            <div className="bezel-core p-6 bg-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-bone-200">
                <span className="text-xs font-mono uppercase tracking-wider text-olive-900 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-olive-700" />
                  Previsualización
                </span>
                <Badge variant="paleGreen" className="text-[10px]">
                  En tiempo real
                </Badge>
              </div>

              {/* Ficha de Etiqueta Simulada */}
              <div className="border border-bone-300 bg-bone-50/50 p-4 rounded-xl text-center space-y-3">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-bone-500 block">
                    OLIVÍCOLA LUJÁN
                  </span>
                  <span className="font-mono text-xs font-bold text-obsidian block truncate">
                    {liveDescriptiveCode || 'COMPLETANDO DATOS'}
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-bone-200 flex flex-col items-center">
                  <BarcodeSvg
                    value={liveFullCode}
                    width={1.1}
                    height={40}
                    displayValue={false}
                  />
                  <span className="font-mono text-[9px] text-bone-600 mt-1 break-all">
                    {liveFullCode}
                  </span>
                </div>

                <div className="border-t border-bone-200 pt-2">
                  <span className="text-[10px] uppercase font-mono text-bone-500 block">
                    Número Asignado
                  </span>
                  <span className="font-mono text-2xl font-black text-obsidian">
                    {nextId}
                  </span>
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="hero"
                  disabled={isSubmitting}
                  className="w-full text-sm font-semibold"
                  trailingIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Guardando en Planta...' : 'Registrar Tambor'}
                </Button>
                <p className="text-[11px] text-center text-bone-500 mt-2">
                  Al guardar, se abrirá la ficha y podrás imprimir la etiqueta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
