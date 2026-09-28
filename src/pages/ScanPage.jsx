import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Building2,
  Zap,
  UploadCloud,
} from 'lucide-react';
import { loadDatabase } from '../api/repository.js';
import { resolveCatalogName, isSectorCode } from '../lib/domain.js';
import { parseScannerStream, HPRT_N130BT_COMMANDS } from '../lib/scannerBurst.js';
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
  const [multipleMatches, setMultipleMatches] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletedTamborId, setDeletedTamborId] = useState(null);
  const [detectedSector, setDetectedSector] = useState(null);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanHistory, setScanHistory] = useState([]);

  // Estado para ráfagas masivas (HPRT N130BT Upload Data) y comandos de hardware
  const [burstResult, setBurstResult] = useState(null);
  const [hprtCommandDetected, setHprtCommandDetected] = useState(null);

  const inputRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const burstQueueRef = useRef([]);
  const burstTimerRef = useRef(null);

  // Mantener foco automático para el lector USB / Bluetooth
  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  // Captura global para escáner inalámbrico HPRT N130BT si el cursor perdió el foco
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        inputRef.current?.focus();
        setScanInput((prev) => prev + e.key);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const executeBurstQuery = (tokens, delimitersDetected = ['Ráfaga HID (HPRT N130BT)']) => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (soundEnabled) playChime(true);
    setErrorMessage('');
    setDeletedTamborId(null);
    setDetectedSector(null);
    setMultipleMatches([]);
    setHprtCommandDetected(null);

    const foundDrums = [];
    const foundSectors = [];
    const unknownTokens = [];

    tokens.forEach((token) => {
      const norm = token.toUpperCase();
      const cleanNorm = norm.replace(/[-/\s]/g, '');

      const drum = tambores.find(
        (t) =>
          t.tambor_id?.toUpperCase() === norm ||
          t.codigo?.toUpperCase() === norm ||
          t.id?.toUpperCase() === norm ||
          (t.codigo_compacto && `${t.codigo_compacto}${t.tambor_id}`.toUpperCase() === norm) ||
          (t.codigo_compacto && `${t.codigo_compacto}-${t.tambor_id}`.toUpperCase() === norm) ||
          t.codigo_compacto?.toUpperCase() === norm ||
          t.codigo_descriptivo?.toUpperCase() === norm ||
          (t.codigo_compacto && t.codigo_compacto.replace(/[-/\s]/g, '').toUpperCase() === cleanNorm) ||
          (t.codigo_descriptivo && t.codigo_descriptivo.replace(/[-/\s]/g, '').toUpperCase() === cleanNorm)
      );

      if (drum) {
        foundDrums.push(drum);
        return;
      }

      const sectorCheck = isSectorCode(token, catalogos);
      if (sectorCheck.isSector) {
        foundSectors.push(sectorCheck.sector);
        return;
      }

      unknownTokens.push(token);
    });

    if (foundDrums.length > 0) {
      setLastScanned(foundDrums[foundDrums.length - 1]);
      setScanHistory((prev) => [
        ...foundDrums.map((drum) => ({ drum, timestamp: new Date(), query: drum.tambor_id })),
        ...prev,
      ].slice(0, 25));
    }

    setBurstResult({
      total: tokens.length,
      foundDrums,
      foundSectors,
      unknownTokens,
      rawTokens: tokens,
      delimitersDetected,
    });

    setScanInput('');
  };

  const executeSingleQuery = (query) => {
    const norm = query.toUpperCase();
    const cleanNorm = norm.replace(/[-/\s]/g, '');

    // Verificar si es un código de configuración del escáner HPRT N130BT
    const hprtCmd = HPRT_N130BT_COMMANDS.find(
      (c) => c.code.toUpperCase() === norm || c.altCode.toUpperCase() === norm
    );
    if (hprtCmd) {
      if (soundEnabled) playChime(true);
      setHprtCommandDetected(hprtCmd);
      setErrorMessage('');
      setBurstResult(null);
      setScanInput('');
      return;
    }
    setHprtCommandDetected(null);
    setBurstResult(null);

    // 1. Coincidencia exacta única por identificador de tambor
    const exactUnique = tambores.find(
      (t) =>
        t.tambor_id?.toUpperCase() === norm ||
        t.codigo?.toUpperCase() === norm ||
        t.id?.toUpperCase() === norm ||
        (t.codigo_compacto && `${t.codigo_compacto}${t.tambor_id}`.toUpperCase() === norm) ||
        (t.codigo_compacto && `${t.codigo_compacto}-${t.tambor_id}`.toUpperCase() === norm)
    );

    if (exactUnique) {
      if (soundEnabled) playChime(true);
      setErrorMessage('');
      setDeletedTamborId(null);
      setDetectedSector(null);
      setMultipleMatches([]);
      setLastScanned(exactUnique);
      setScanHistory((prev) => [
        { drum: exactUnique, timestamp: new Date(), query },
        ...prev.slice(0, 9),
      ]);
      setScanInput('');
      if (autoRedirect) {
        redirectTimerRef.current = setTimeout(() => {
          navigate(`/tambores/${exactUnique.tambor_id}`);
        }, 150);
      }
      return;
    }

    // 2. Coincidencia por código de producto (compacto o descriptivo)
    const matches = tambores.filter(
      (t) =>
        t.codigo_compacto?.toUpperCase() === norm ||
        t.codigo_descriptivo?.toUpperCase() === norm ||
        (t.codigo_compacto && t.codigo_compacto.replace(/[-/\s]/g, '').toUpperCase() === cleanNorm) ||
        (t.codigo_descriptivo && t.codigo_descriptivo.replace(/[-/\s]/g, '').toUpperCase() === cleanNorm)
    );

    if (matches.length === 1) {
      const match = matches[0];
      if (soundEnabled) playChime(true);
      setErrorMessage('');
      setDeletedTamborId(null);
      setDetectedSector(null);
      setMultipleMatches([]);
      setLastScanned(match);
      setScanHistory((prev) => [
        { drum: match, timestamp: new Date(), query },
        ...prev.slice(0, 9),
      ]);
      setScanInput('');
      if (autoRedirect) {
        redirectTimerRef.current = setTimeout(() => {
          navigate(`/tambores/${match.tambor_id}`);
        }, 150);
      }
    } else if (matches.length > 1) {
      if (soundEnabled) playChime(true);
      setErrorMessage('');
      setDeletedTamborId(null);
      setDetectedSector(null);
      setLastScanned(null);
      setMultipleMatches(matches);
      setScanHistory((prev) => [
        { drum: matches[0], timestamp: new Date(), query, count: matches.length },
        ...prev.slice(0, 9),
      ]);
      setScanInput('');
    } else {
      if (soundEnabled) playChime(false);
      setMultipleMatches([]);
      setLastScanned(null);

      // Verificar si es un código de sector de planta
      const sectorDetection = isSectorCode(query, catalogos);
      if (sectorDetection.isSector) {
        setErrorMessage(
          `El código "${query}" corresponde al Sector de Planta "${sectorDetection.sector?.nombre || sectorDetection.sectorCode}". Para realizar el inventario físico de este sector, utiliza la Toma de Inventario por Sectores.`
        );
        setDetectedSector(sectorDetection.sector);
        setDeletedTamborId(null);
      } else {
        setDetectedSector(null);
        // Verificar si corresponde a un tambor dado de baja en el historial
        const deletedEvent = (historial || []).find(
          (h) => h.tambor_id?.toUpperCase() === norm
        );

        if (deletedEvent) {
          setErrorMessage(`El tambor "${query}" existe en el registro pero fue dado de baja del inventario activo.`);
          setDeletedTamborId(deletedEvent.tambor_id);
        } else {
          setErrorMessage(`Código desconocido: "${query}". Verifica la etiqueta o el número.`);
          setDeletedTamborId(null);
        }
      }
      setScanInput('');
    }
  };

  const processQuery = (rawQuery) => {
    if (!rawQuery) return;

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    const { tokens, delimitersDetected } = parseScannerStream(rawQuery);
    if (tokens.length === 0) return;

    // Si ya vienen múltiples tokens (ej: texto pegado de golpe o delimitado por comas)
    if (tokens.length > 1) {
      clearTimeout(burstTimerRef.current);
      burstQueueRef.current = [];
      executeBurstQuery(tokens, delimitersDetected);
      return;
    }

    // Token individual: agregar a la cola de ráfaga y esperar breve ventana (180ms)
    // para detectar si es una ráfaga continua de Upload Data del HPRT N130BT
    burstQueueRef.current.push(tokens[0]);
    clearTimeout(burstTimerRef.current);

    burstTimerRef.current = setTimeout(() => {
      const queue = [...burstQueueRef.current];
      burstQueueRef.current = [];
      if (queue.length > 1) {
        executeBurstQuery(queue, ['Ráfaga HID (HPRT N130BT)']);
      } else if (queue.length === 1) {
        executeSingleQuery(queue[0]);
      }
    }, 180);
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    processQuery(scanInput);
    setScanInput('');
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (scanInput.trim()) {
        processQuery(scanInput);
        setScanInput('');
      }
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    // Si contiene delimitadores de ráfaga (nuevas líneas, comas, punto y coma o tabs del HPRT N130BT)
    if (
      val.includes('\n') ||
      val.includes('\r') ||
      val.includes('\t') ||
      val.includes(',') ||
      val.includes(';')
    ) {
      processQuery(val);
      setScanInput('');
    } else {
      setScanInput(val);
    }
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

          <Link to="/inventario/toma" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-olive-400 bg-olive-50/60 text-olive-900 hover:bg-olive-100 font-semibold"
            >
              <Building2 className="w-4 h-4 mr-1.5 text-olive-800" />
              Toma por Sectores
            </Button>
          </Link>
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
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                className="w-full pl-14 sm:pl-16 pr-32 py-4 text-lg sm:text-xl font-mono tracking-wider rounded-2xl border-2 border-bone-300 focus:border-olive-700 focus:ring-4 focus:ring-olive-700/10 transition-all bg-bone-50/40 text-obsidian placeholder:text-bone-400"
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

            {/* Banner de Ráfaga Masiva detectada (HPRT N130BT Upload Data) */}
            {burstResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Zap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">
                        Ráfaga de Escáner HPRT N130BT Procesada
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Se recibieron <strong className="font-mono">{burstResult.total}</strong> lecturas en memoria.
                        Delimitadores detectados: {burstResult.delimitersDetected.join(', ') || 'Retorno de Carro (Enter)'}.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-900 border-emerald-300 font-mono text-[10px]">
                    Modo Ráfaga HID
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className="bg-white/80 px-2.5 py-1 rounded border border-emerald-200 text-emerald-900">
                    Tambores activos: <strong>{burstResult.foundDrums.length}</strong>
                  </span>
                  {burstResult.foundSectors.length > 0 && (
                    <span className="bg-white/80 px-2.5 py-1 rounded border border-emerald-200 text-olive-900">
                      Sectores: <strong>{burstResult.foundSectors.length}</strong>
                    </span>
                  )}
                  {burstResult.unknownTokens.length > 0 && (
                    <span className="bg-amber-100 px-2.5 py-1 rounded border border-amber-300 text-amber-900">
                      Desconocidos: <strong>{burstResult.unknownTokens.length}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      navigate('/inventario/toma', {
                        state: { initialText: burstResult.rawTokens.join('\n') },
                      })
                    }
                    className="text-xs font-mono bg-emerald-800 hover:bg-emerald-900"
                  >
                    <UploadCloud className="w-4 h-4 mr-1.5" />
                    Enviar este lote ({burstResult.total}) a Toma de Inventario por Sectores →
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBurstResult(null)}
                    className="text-xs text-emerald-800 hover:text-emerald-950"
                  >
                    Descartar aviso
                  </Button>
                </div>
              </div>
            )}

            {/* Aviso si se escaneó un código de configuración HPRT */}
            {hprtCommandDetected && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-300 text-blue-950 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">
                        Comando de Calibración HPRT N130BT Detectado
                      </h4>
                      <p className="text-xs font-mono text-blue-800 font-semibold">
                        {hprtCommandDetected.title} ({hprtCommandDetected.code})
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-900 border-blue-300 font-mono text-[10px]">
                    {hprtCommandDetected.badge}
                  </Badge>
                </div>
                <p className="text-xs text-blue-800">
                  {hprtCommandDetected.description}
                </p>
                <div className="pt-1">
                  <Link to="/ayuda">
                    <Button variant="outline" size="sm" className="text-xs bg-white text-blue-900 border-blue-300">
                      Ver manual completo de calibración del HPRT N130BT →
                    </Button>
                  </Link>
                </div>
              </div>
            )}

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
                  {detectedSector && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/inventario/toma', { state: { initialSector: detectedSector.codigo } })}
                      className="text-xs font-mono"
                    >
                      Abrir Toma de Inventario por Sectores ({detectedSector.codigo}) →
                    </Button>
                  )}
                </div>
              </div>
            )}
          </form>

        </div>
      </div>

      {/* ---------------- MÚLTIPLES TAMBORES ENCONTRADOS (DESAMBIGUACIÓN) ---------------- */}
      {multipleMatches.length > 1 && (
        <div className="bezel-shell animate-in slide-in-from-bottom-4 duration-300">
          <div className="bezel-core p-6 bg-white border border-amber-300 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-bone-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold">
                    Código de Producto
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {multipleMatches.length} tambores activos
                  </Badge>
                </div>
                <h3 className="font-serif text-xl font-bold text-obsidian mt-1">
                  Múltiples tambores coinciden con este código de clasificación
                </h3>
                <p className="text-xs text-bone-600">
                  Selecciona el tambor que estás manipulando según su número visible, lote o ubicación:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {multipleMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-bone-200 hover:border-olive-500 bg-bone-50/50 hover:bg-olive-50/20 transition-all flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-black text-obsidian">
                        {m.tambor_id}
                      </span>
                      <span className="font-mono text-[11px] text-bone-500 font-semibold">
                        Lote: {m.lote}
                      </span>
                    </div>
                    <div className="text-[11px] text-bone-600 space-y-0.5">
                      <div>
                        <span className="font-semibold text-bone-700">Ubicación: </span>
                        <span>{resolveCatalogName(catalogos, m.ubicacion, 'ubicacion')}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-bone-700">Peso: </span>
                        <span>{m.peso} kg</span>
                        <span className="mx-1.5">·</span>
                        <span className="font-semibold text-bone-700">Estado: </span>
                        <span>{resolveCatalogName(catalogos, m.estado, 'estado')}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="olive"
                    size="sm"
                    onClick={() => navigate(`/tambores/${m.tambor_id}`)}
                    className="shrink-0 text-xs"
                  >
                    Seleccionar →
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  value={lastScanned.codigo_compacto || lastScanned.codigo}
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
          widthMm={100}
          heightMm={50}
          showBorder={false}
        />
      </div>
    )}
  </>
  );
}
