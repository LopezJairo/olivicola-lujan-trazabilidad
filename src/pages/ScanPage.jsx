import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Printer,
  Truck,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { loadDatabase } from '../api/repository.js';
import { resolveCatalogName } from '../lib/domain.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { BarcodeSvg, PhysicalLabel } from '../components/Barcode.jsx';

// Web Audio API para feedback sonoro en planta
function playChime(success = true) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.12); // E3
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // audio context might be blocked if no user interaction
  }
}

export function ScanPage() {
  const navigate = useNavigate();
  const db = loadDatabase();
  const { tambores, catalogos, historial } = db;

  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletedTamborId, setDeletedTamborId] = useState(null);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanHistory, setScanHistory] = useState([]);

  const inputRef = useRef(null);

  // Mantener foco automático para el lector USB
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const query = scanInput.trim();
    if (!query) return;

    // Buscar coincidencia exacta (insensible a mayúsculas) por tambor_id o código completo
    const match = tambores.find(
      (t) =>
        t.tambor_id?.toUpperCase() === query.toUpperCase() ||
        t.codigo?.toUpperCase() === query.toUpperCase() ||
        t.id?.toUpperCase() === query.toUpperCase()
    );

    if (match) {
      if (soundEnabled) playChime(true);
      setErrorMessage('');
      setDeletedTamborId(null);
      setLastScanned(match);
      setScanHistory((prev) => [
        { drum: match, timestamp: new Date(), query },
        ...prev.slice(0, 9),
      ]);
      setScanInput('');

      if (autoRedirect) {
        navigate(`/tambores/${match.tambor_id}`);
      }
    } else {
      if (soundEnabled) playChime(false);
      // Verificar si corresponde a un tambor dado de baja en el historial
      const deletedEvent = (historial || []).find(
        (h) => h.tambor_id?.toUpperCase() === query.toUpperCase()
      );

      if (deletedEvent) {
        setErrorMessage(`El tambor "${query}" existe en el registro pero fue dado de baja del inventario activo.`);
        setDeletedTamborId(deletedEvent.tambor_id);
      } else {
        setErrorMessage(`Código desconocido: "${query}". Verifica la etiqueta o el número.`);
        setDeletedTamborId(null);
      }
      setScanInput('');
      setLastScanned(null);
    }

    // Regresar foco inmediatamente
    inputRef.current?.focus();
  };

  // Ayudante para probar escaneo rápido con un clic
  const handleQuickTestScan = (targetCode) => {
    setScanInput(targetCode);
    setTimeout(() => {
      const match = tambores.find(
        (t) =>
          t.tambor_id?.toUpperCase() === targetCode.toUpperCase() ||
          t.codigo?.toUpperCase() === targetCode.toUpperCase()
      );
      if (match) {
        if (soundEnabled) playChime(true);
        setErrorMessage('');
        setLastScanned(match);
        setScanHistory((prev) => [
          { drum: match, timestamp: new Date(), query: targetCode },
          ...prev.slice(0, 9),
        ]);
        setScanInput('');
        if (autoRedirect) navigate(`/tambores/${match.tambor_id}`);
      }
      inputRef.current?.focus();
    }, 50);
  };

  const handleDirectPrintLastScanned = () => {
    window.print();
  };

  return (
    <>
      <div
        onClick={handleContainerClick}
        className="no-print space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto"
      >
      {/* Cabecera de Escaneo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Puesto de Escaneo
            </span>
            <span className="text-bone-400 text-xs font-mono">· Lector USB</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Escanear Código de Tambor
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Apunta la pistola lectora a la etiqueta. Al leer enviará la consulta automáticamente.
          </p>
        </div>

        {/* Opciones de sonido y redirección */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            className="p-2 rounded-xl border border-bone-300 bg-white hover:bg-bone-100 text-bone-700 text-xs flex items-center gap-1.5 transition-colors"
            title="Activar o desactivar sonido de confirmación"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-olive-700" />
                <span className="hidden sm:inline">Sonido activado</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-bone-400" />
                <span className="hidden sm:inline text-bone-400">Sonido silenciado</span>
              </>
            )}
          </button>

          <label
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-xs font-medium text-bone-700 cursor-pointer select-none bg-white border border-bone-300 px-3 py-2 rounded-xl"
          >
            <input
              type="checkbox"
              checked={autoRedirect}
              onChange={(e) => setAutoRedirect(e.target.checked)}
              className="rounded text-olive-700 focus:ring-olive-700"
            />
            <span>Abrir ficha directo al escanear</span>
          </label>
        </div>
      </div>

      {/* ---------------- ENTRADA PRINCIPAL PARA LECTOR USB ---------------- */}
      <div className="bezel-shell">
        <div className="bezel-core p-6 sm:p-8 bg-white">
          <form onSubmit={handleScanSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="scanner-input"
                className="text-xs font-mono uppercase tracking-wider text-olive-900 font-bold flex items-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Lector USB Listo (Foco Automático)
              </label>
              <kbd className="text-xs">Presiona Enter al finalizar</kbd>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-bone-400">
                <QrCode className="w-6 h-6 text-olive-800" />
              </div>
              <input
                id="scanner-input"
                ref={inputRef}
                type="text"
                autoFocus
                autoComplete="off"
                placeholder="Escanea o tipea el número (ej: T000001)..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full pl-13 pr-32 py-4 text-lg sm:text-xl font-mono tracking-wider rounded-2xl border-2 border-bone-300 focus:border-olive-700 focus:ring-4 focus:ring-olive-700/10 transition-all bg-bone-50/40 text-obsidian placeholder:text-bone-400"
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  className="rounded-xl px-5 text-xs font-mono"
                >
                  Buscar
                </Button>
              </div>
            </div>

            {/* Mensaje de Error si el código no existe o fue eliminado */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold">{errorMessage}</p>
                  <p className="text-red-700 text-xs">
                    El escáner limpió el campo para tu próximo intento.
                  </p>
                  {deletedTamborId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/tambores/${deletedTamborId}`)}
                      className="text-xs bg-white text-red-900 border-red-300 hover:bg-red-100"
                    >
                      Consultar historial de auditoría de {deletedTamborId} →
                    </Button>
                  )}
                </div>
              </div>
            )}
          </form>

          {/* Accesos rápidos para probar en entorno de desarrollo */}
          <div className="mt-6 pt-5 border-t border-bone-100">
            <span className="text-[11px] font-mono uppercase tracking-wider text-bone-500 block mb-2 font-semibold">
              Tambores de prueba para simular lectura con un clic:
            </span>
            <div className="flex flex-wrap gap-2">
              {tambores.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleQuickTestScan(t.tambor_id)}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-bone-100 hover:bg-bone-200 text-bone-800 border border-bone-300 transition-colors"
                >
                  {t.tambor_id} ({t.codigo_descriptivo?.split('-')[0] || 'Tambor'})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- FICHA RESUMEN DEL TAMBOR ENCONTRADO ---------------- */}
      {lastScanned && (
        <div className="bezel-shell animate-in slide-in-from-bottom-4 duration-300">
          <div className="bezel-core p-6 bg-white border border-olive-200/80">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-bone-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-serif text-2xl sm:text-3xl font-black text-obsidian tracking-tight">
                    {lastScanned.tambor_id}
                  </span>
                  <Badge variant="paleGreen" dot>
                    Tambor Verificado
                  </Badge>
                  <Badge variant="default" className="font-mono text-xs">
                    {resolveCatalogName(catalogos, lastScanned.estado, 'estado')}
                  </Badge>
                </div>
                <p className="font-mono text-xs text-bone-600 break-all">
                  {lastScanned.codigo}
                </p>
              </div>

              {/* Botón Acción Rápida: Abrir Ficha */}
              <Button
                variant="olive"
                size="default"
                onClick={() => navigate(`/tambores/${lastScanned.tambor_id}`)}
                trailingIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Abrir Ficha Completa
              </Button>
            </div>

            {/* Grilla con detalles inmediatos para el operario */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-bone-100 text-xs">
              <div>
                <span className="text-bone-500 font-mono block">Producto:</span>
                <span className="font-semibold text-obsidian">
                  {resolveCatalogName(catalogos, lastScanned.producto, 'producto')}
                </span>
              </div>
              <div>
                <span className="text-bone-500 font-mono block">Variedad:</span>
                <span className="font-semibold text-obsidian">
                  {resolveCatalogName(catalogos, lastScanned.variedad, 'variedad')}
                </span>
              </div>
              <div>
                <span className="text-bone-500 font-mono block">Ubicación Actual:</span>
                <span className="font-semibold text-olive-900 bg-olive-100/60 px-1.5 py-0.5 rounded">
                  {resolveCatalogName(catalogos, lastScanned.ubicacion, 'ubicacion')}
                </span>
              </div>
              <div>
                <span className="text-bone-500 font-mono block">Peso Neto:</span>
                <span className="font-serif text-base font-bold text-obsidian">
                  {lastScanned.peso} kg
                </span>
              </div>
            </div>

            {/* Mini código de barras y accesos directos */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="bg-bone-50 p-2 rounded-xl border border-bone-200">
                <BarcodeSvg
                  value={lastScanned.codigo}
                  width={1.2}
                  height={36}
                  displayValue={false}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDirectPrintLastScanned}
                  className="text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Imprimir Etiqueta
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/tambores/${lastScanned.tambor_id}`)}
                  className="text-xs"
                >
                  <Truck className="w-3.5 h-3.5 mr-1.5" />
                  Mover Tambor
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- HISTORIAL DE ESCANEOS EN ESTA SESIÓN ---------------- */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-bone-600">
              Escaneos recientes en esta terminal ({scanHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-bone-100 text-xs">
              {scanHistory.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/tambores/${item.drum.tambor_id}`)}
                  className="py-2.5 flex items-center justify-between hover:bg-bone-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-obsidian bg-bone-100 px-2 py-0.5 rounded">
                      {item.drum.tambor_id}
                    </span>
                    <span className="text-bone-700">
                      {resolveCatalogName(catalogos, item.drum.variedad, 'variedad')} ·{' '}
                      {item.drum.peso} kg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-bone-400 font-mono text-[11px]">
                      {item.timestamp.toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <ArrowRight className="w-3 h-3 text-bone-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Impresión directa de etiqueta escaneada (oculto en pantalla, activo al imprimir) */}
    {lastScanned && (
      <div className="print-only">
        <PhysicalLabel
          drum={{
            ...lastScanned,
            ubicacion_nombre: resolveCatalogName(catalogos, lastScanned.ubicacion, 'ubicacion'),
          }}
          widthMm={50}
          heightMm={100}
          showBorder={false}
        />
      </div>
    )}
  </>
  );
}
