import { motion } from 'framer-motion';
import type { BatchRecord } from '../data/plantillasBeer';

interface FermenterOverlayProps {
  id: string;
  lote: BatchRecord | null;
  position: { top: string; left: string };
  onClick: () => void;
}

export function FermenterOverlay({
  id,
  lote,
  position,
  onClick,
}: FermenterOverlayProps) {
  const isActive = lote !== null;
  const terminado = isActive && lote.stage === 'Finalizado';
  const neonColor = isActive ? '#00e1ff' : '#34d399';
  const glowColor = isActive ? 'rgba(0,225,255,0.6)' : 'rgba(52,211,153,0.6)';
  const ledColor = terminado ? '#34d399' : (isActive ? '#00e1ff' : '#6b7280');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="absolute cursor-pointer select-none"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onClick}
    >
      {/* ── LED de estado — arriba del tanque, discreto ── */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2"
        style={{ zIndex: 2 }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            background: ledColor,
            boxShadow: `0 0 8px ${ledColor}, 0 0 16px ${glowColor}`,
            transition: 'all 0.3s ease',
          }}
        />
      </div>

      {/* ── Cubierta del tanque — invisible pero clickeable ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'transparent',
          border: isActive
            ? `1px solid rgba(0,225,255,0.15)`
            : `1px solid rgba(52,211,153,0.12)`,
          borderRadius: '50% 50% 45% 45%',
          boxShadow: isActive
            ? `inset 0 0 30px rgba(0,225,255,0.08), 0 0 20px rgba(0,225,255,0.05)`
            : `inset 0 0 30px rgba(52,211,153,0.05)`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title={`Tanque ${id}${lote ? ` · ${lote.recipe}` : ' · Disponible'}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {/* Efecto de highlight al hover */}
        <motion.div
          className="absolute inset-0 rounded-[50%_50%_45%_45%]"
          onHoverStart={() => {
            /* no-op, solo para efecto visual */
          }}
          style={{
            background: isActive
              ? 'rgba(0,225,255,0.04)'
              : 'rgba(52,211,153,0.03)',
            border: '1px solid transparent',
            transition: 'all 0.2s ease',
          }}
        />
      </div>

      {/* ── Indicador discreto de lote activo — abajo del tanque ── */}
      {isActive && !terminado && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1"
          style={{ zIndex: 2 }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: neonColor, boxShadow: `0 0 6px ${glowColor}` }}
          />
          <span
            className="text-[9px] font-mono tracking-wider uppercase"
            style={{ color: neonColor, textShadow: `0 0 8px ${glowColor}` }}
          >
            {lote.batch}
          </span>
        </div>
      )}

      {/* ── Badge "Finalizado" — verde discreto ── */}
      {terminado && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2"
          style={{ zIndex: 2 }}
        >
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider"
            style={{
              background: 'rgba(52,211,153,0.15)',
              color: '#34d399',
              border: '1px solid rgba(52,211,153,0.25)',
              textShadow: '0 0 8px rgba(52,211,153,0.3)',
            }}
          >
            Listo
          </span>
        </div>
      )}
    </motion.div>
  );
}
