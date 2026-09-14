import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Plus, CheckCircle2, Activity, Layers } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { GlassCard } from '../components/GlassCard';
import { useRegistros } from '../lib/registrosState';
import { generateProductionPdfHtml } from '../lib/pdf';
import type { ProductionFields, MaltaItem, LupuloFichaItem } from '../lib/pdf';

export function Production() {
  const { registrosProduccion, actualizarRegistroProduccion } = useRegistros();
  const [selectedId, setSelectedId] = useState(registrosProduccion[0]?.id || '26001');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  const currentBatch = registrosProduccion.find(r => r.id === selectedId) || registrosProduccion[0];

  const handleExportPDF = () => {
    if (!currentBatch) return;
    // Generar HTML de la ficha técnica usando la plantilla profesional de pdf.ts
    const pdfData: ProductionFields = {
      batch: currentBatch.batch,
      recipe: currentBatch.recipe,
      brewer: currentBatch.brewer,
      startDate: currentBatch.fechaInicio || '',
      volume: currentBatch.volume ? Number(currentBatch.volume) : undefined,
      alcohol: currentBatch.abv ? `${currentBatch.abv}%` : undefined,
      color: undefined,
      ibuObjetivo: undefined,
      tempInicial: currentBatch.currentTemp ? `${currentBatch.currentTemp}°C` : undefined,
      phMaceracion: currentBatch.ph ? String(currentBatch.ph) : undefined,
      observations: currentBatch.observations || '',
    };

    // Datos de maltas desde la receta (mockData) — simplificado para demo
    const maltas: MaltaItem[] = [
      { name: 'Malta Pilsner', amount: '4.5 kg', ebc: 3, supplier: 'Briess' },
      { name: 'Malta Munich', amount: '1.2 kg', ebc: 12, supplier: 'Briess' },
    ];

    // Datos de lúpulos desde la receta — simplificado para demo
    const lupulos: LupuloFichaItem[] = [
      { momento: 'Noturno 60min', variedad: 'Saaz', cantidad: '25' },
      { momento: 'Noturno 15min', variedad: 'Saaz', cantidad: '15' },
      { momento: 'Noturno 5min', variedad: 'Saaz', cantidad: '10' },
    ];

    const html = generateProductionPdfHtml(pdfData, maltas, lupulos);

    // Abrir en nueva ventana para imprimir/guardar como PDF
    const win = window.open('', '_blank');
    if (!win) {
      // Fallback: descargar como archivo HTML si popup bloqueado
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ficha_Lote_${currentBatch.batch}.html`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    win.document.write(html);
    win.document.close();
    win.focus();

    // Auto-trigger print después de cargar
    win.onload = () => {
      setTimeout(() => { win.print(); }, 500);
    };
  };

  const handleSaveNotes = () => {
    if (!currentBatch) return;
    actualizarRegistroProduccion(currentBatch.id, { observations: notesText });
    setEditingNotes(false);
  };

  return (
    <div className="flex min-h-full flex-col pb-32 px-4 space-y-6">
      <ScreenHeader
        title="Producción y Fichas Técnicas"
        subtitle="Gestión de lotes integrados desde RegistrosProvider"
      />

      {/* Selector de Lotes */}
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {registrosProduccion.map((batch) => {
          const isSelected = batch.id === selectedId;
          return (
            <button
              key={batch.id}
              onClick={() => {
                setSelectedId(batch.id);
                setNotesText(batch.observations);
                setEditingNotes(false);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#00e1ff]/15 border border-[#00e1ff]/40 text-[#00e1ff]'
                  : 'bg-slate-900/40 border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span className="font-display text-xs font-bold">Lote {batch.batch}</span>
              <span className="font-mono text-[10px] opacity-75">({batch.recipe})</span>
            </button>
          );
        })}
      </div>

      {currentBatch && (
        <GlassCard className="p-6 space-y-6" corners delay={0.05}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#00e1ff] bg-[#00e1ff]/10 px-2.5 py-1 rounded-full border border-[#00e1ff]/20">
                {currentBatch.stage}
              </span>
              <h2 className="font-display text-2xl font-bold text-white mt-2">
                {currentBatch.recipe} <span className="text-[#00e1ff]">({currentBatch.batch})</span>
              </h2>
              <p className="font-mono text-xs text-gray-400 mt-1">Maestro Cervecero: {currentBatch.brewer}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00e1ff]/10 border border-[#00e1ff]/30 text-[#00e1ff] font-display text-xs font-bold hover:bg-[#00e1ff]/20 transition-all cursor-pointer"
              >
                <Download size={14} />
                Exportar PDF
              </button>
            </div>
          </div>

          {/* Parámetros técnicos principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <p className="font-mono text-[10px] text-gray-400 uppercase">Volumen Lote</p>
              <p className="font-display text-xl font-bold text-white mt-1">{currentBatch.volume} L</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <p className="font-mono text-[10px] text-gray-400 uppercase">Temperatura</p>
              <p className="font-display text-xl font-bold text-[#FFAA00] mt-1">{currentBatch.currentTemp} °C</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <p className="font-mono text-[10px] text-gray-400 uppercase">Grados Plato</p>
              <p className="font-display text-xl font-bold text-[#FFD060] mt-1">{currentBatch.plato} °P</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <p className="font-mono text-[10px] text-gray-400 uppercase">pH Actual</p>
              <p className="font-display text-xl font-bold text-[#00e1ff] mt-1">{currentBatch.ph}</p>
            </div>
          </div>

          {/* Sección de Observaciones / Ficha Técnica */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-[#00e1ff]" /> Observaciones y Ficha Técnica
              </h3>
              {!editingNotes && (
                <button
                  onClick={() => {
                    setNotesText(currentBatch.observations);
                    setEditingNotes(true);
                  }}
                  className="font-mono text-xs text-[#00e1ff] hover:underline cursor-pointer"
                >
                  Editar anotaciones
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl bg-slate-950 p-4 font-sans text-xs text-white border border-[#00e1ff]/40 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    className="px-4 py-2 rounded-xl bg-[#00e1ff]/20 border border-[#00e1ff]/40 text-[#00e1ff] font-display text-xs font-bold uppercase cursor-pointer"
                  >
                    Guardar cambios
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-mono text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-sans text-xs text-gray-300 bg-slate-950/40 p-4 rounded-2xl border border-white/5 leading-relaxed">
                {currentBatch.observations || 'Sin anotaciones registradas en el sistema.'}
              </p>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
