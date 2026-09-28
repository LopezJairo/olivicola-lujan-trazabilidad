import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Network, Layers } from 'lucide-react';

export default function HeroSection({ latestRelease }) {
  return (
    <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 px-4 max-w-5xl mx-auto text-center">
      {/* Eyebrow Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-6 animate-fade-in shadow-inner">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Versión Oficial {latestRelease?.version} · {latestRelease?.tag || 'Producción'}</span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
        Software de Trazabilidad <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-emerald-400 via-emerald-200 to-zinc-400 bg-clip-text text-transparent">
          Olivícola Luján
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
        Descarga directa y centralizada de ejecutables e instaladores para <strong className="text-zinc-200">Windows</strong> y <strong className="text-zinc-200">macOS</strong>. Servidor local LAN autónomo, sincronización en tiempo real e integración directa con Zebra y escáneres HPRT.
      </p>

      {/* Feature Highlights Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-300">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <Network className="w-3.5 h-3.5 text-emerald-400" />
          <span>Servidor Host LAN Embebido</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multiplataforma (PC + Laptops)</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Offline & Base de Datos Local</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Impresión ZPL II & Escaneo de Memoria</span>
        </div>
      </div>
    </section>
  );
}
