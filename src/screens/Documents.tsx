import { useState } from 'react';
import { FileText, Download, Share2, Printer } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { GlassCard } from '../components/GlassCard';
import { useRegistros } from '../lib/registrosState';
import { generateProductionPdfHtml, generateFermentationHistoryHtml } from '../lib/pdf';
import { BATCHES } from '../data/mockData';

export function Documents() {
  const { registrosProduccion, registrosFermentacion } = useRegistros();

  const openHtmlDocument = (html: string, title: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.title = title;
    win.document.close();
  };

  // Busca la plantilla técnica (maltas, lúpulos, escalones de maceración...)
  // que corresponde a la receta del lote. Los números de lote de mockData.ts
  // (26001, 23018, 24006) son lotes de referencia históricos, distintos de
  // los lotes reales en curso — por eso se cruza por nombre de receta, no
  // por número de lote. TODO: cuando estos datos técnicos se migren a
  // RegistrosState, este cruce por receta dejará de hacer falta.
  const findRecipeTemplate = (recipe: string) =>
    BATCHES.find((b) => b.recipe.toLowerCase() === recipe.toLowerCase());

  const buildProductionFields = (batch: typeof registrosProduccion[0]) => {
    const template = findRecipeTemplate(batch.recipe);

    return {
      // ── Datos reales y actuales del lote (siempre desde RegistrosState) ──
      batch: batch.batch,
      recipe: batch.recipe,
      brewer: batch.brewer,
      startDate: template?.startDate ?? '—',
      volume: batch.volume,
      alcohol: batch.abv,
      color: template?.color ?? '—',
      ibuObjetivo: template?.ibuObjetivo ?? '—',
      platoFinal: batch.plato,
      litrosTransfReal: String(batch.volume),
      fermentadorNum: batch.fermentadorNum,
      phFinal: batch.ph,
      observations: batch.observations,

      // ── Receta técnica: viene de la plantilla de mockData.ts si existe
      // una para esta receta; si no hay plantilla, se queda en '—' ──
      h2oInicial: template?.h2oInicial ?? '—',
      tempInicial: template?.tempInicial ?? '—',
      acidoFosforico: template?.acidoFosforico ?? '—',
      mixTempReal: template?.mixTempReal ?? '—',
      phMaceracion: template?.phMaceracion ?? '—',
      fosfMaceracion: template?.fosfMaceracion ?? '—',
      escalones: template?.escalones ?? [],
      enjuagueDir: template?.enjuagueDir ?? '—',
      spargeTotal: template?.spargeTotal ?? '—',
      platoPreHervido: template?.platoPreHervido ?? '—',
      phMacerado: template?.phMacerado ?? '—',
      transferencia: template?.transferencia ?? '—',
      tempHervidoReal: template?.tempHervidoReal ?? '—',
      fosfMediaHora: template?.fosfMediaHora ?? '—',
      whirlpoolRemolino: template?.whirlpoolRemolino ?? '—',
      whirlpoolReposo: template?.whirlpoolReposo ?? '—',
      levadura: template?.levadura?.name ?? '—',
      regFermentacion: template?.regFermentacion ?? '—',

      // ── Envasado: no hay dato real todavía, se queda en blanco a propósito ──
      fechaEnvasado: '—',
      totalBotellas: '—',
      numPalets: '—',
      lotesPalets: '—',
      barriles20: '—',
      barriles30: '—',
      barriles50: '—',
    };
  };

  const buildPdfInputs = (batch: typeof registrosProduccion[0]) => {
    const template = findRecipeTemplate(batch.recipe);
    const maltas = template?.maltas ?? [];
    const lupulosFicha = template?.lupulosPlantilla ?? [];
    return { maltas, lupulosFicha };
  };

  const handleOpenProductionDoc = (item: typeof registrosProduccion[0]) => {
    const { maltas, lupulosFicha } = buildPdfInputs(item);
    openHtmlDocument(
      generateProductionPdfHtml(buildProductionFields(item), maltas, lupulosFicha),
      `Ficha de Producción ${item.batch}`
    );
  };

  const handleOpenFermentationDoc = (item: typeof registrosProduccion[0]) => {
    const history = registrosFermentacion[item.id] || { lecturas: [] };
    openHtmlDocument(generateFermentationHistoryHtml(buildProductionFields(item), history), `Hoja de Fermentación ${item.batch}`);
  };

  const handleShareDocument = async (item: typeof registrosProduccion[0]) => {
    const text = `Lote ${item.batch} · ${item.recipe} · Temp ${item.currentTemp}°C · Plato ${item.plato}°P · pH ${item.ph}`;
    if (navigator.share) {
      await navigator.share({ title: `Lote ${item.batch}`, text });
      return;
    }
    await navigator.clipboard.writeText(text);
    alert('Resumen copiado al portapapeles.');
  };

  return (
    <div className="flex min-h-full flex-col pb-32 px-4 space-y-6">
      <ScreenHeader
        title="Documentos Técnicos"
        subtitle="Accede a la ficha de producción y a la hoja de fermentación de cada lote"
      />

      <div className="grid grid-cols-1 gap-4">
        {registrosProduccion.map((item) => (
          <GlassCard key={item.id} className="p-5" corners delay={0.05}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#00e1ff]/10 border border-[#00e1ff]/20 text-[#00e1ff]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">
                    Lote {item.batch} — {item.recipe}
                  </h3>
                  <p className="font-mono text-[10px] text-gray-400 mt-0.5">
                    Etapa: {item.stage} | Fermentador: {item.fermentadorNum}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleOpenProductionDoc(item)}
                  className="flex items-center gap-2 rounded-2xl bg-[#00e1ff]/15 px-4 py-2 text-xs font-semibold text-[#00e1ff] hover:bg-[#00e1ff]/25 transition-all cursor-pointer"
                >
                  <Download size={14} /> Ficha
                </button>
                <button
                  onClick={() => handleOpenFermentationDoc(item)}
                  className="flex items-center gap-2 rounded-2xl bg-[#ffb703]/10 px-4 py-2 text-xs font-semibold text-[#ffb703] hover:bg-[#ffb703]/20 transition-all cursor-pointer"
                >
                  <Printer size={14} /> Fermentación
                </button>
                <button
                  onClick={() => handleShareDocument(item)}
                  className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-xs font-semibold text-gray-100 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Share2 size={14} /> Compartir
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
