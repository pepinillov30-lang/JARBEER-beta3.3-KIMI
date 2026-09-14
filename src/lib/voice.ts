// ─────────────────────────────────────────────────────────
// Voz — reconocimiento real (Web Speech API) y síntesis
// Optimizado para sonar natural, femenino, cercano.
// ─────────────────────────────────────────────────────────

export type SpeechRecognitionResultHandler = (transcript: string, isFinal: boolean) => void;
export type SpeechRecognitionErrorHandler = (error: string) => void;

interface MinimalSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => MinimalSpeechRecognition) | null {
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceRecognitionAvailable(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

let activeRecognition: MinimalSpeechRecognition | null = null;
let starting = false;

function hardReset(): void {
  if (activeRecognition) {
    try { activeRecognition.onresult = null; activeRecognition.onerror = null; activeRecognition.onend = null; activeRecognition.onstart = null; } catch { /* noop */ }
    try { activeRecognition.abort(); } catch { /* noop */ }
  }
  activeRecognition = null;
  starting = false;
}

export function startListening(
  onResult: SpeechRecognitionResultHandler,
  onError: SpeechRecognitionErrorHandler,
  onEnd: () => void
): boolean {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    onError('not-supported');
    return false;
  }

  hardReset();
  starting = true;

  const create = () => {
    try {
      const rec = new Ctor();
      rec.lang = 'es-ES';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinal = true;
        }
        onResult(transcript, isFinal);
      };
      rec.onerror = (event: any) => {
        starting = false;
        activeRecognition = null;
        try { rec.abort(); } catch { /* noop */ }
        onError(event?.error ?? 'unknown');
      };
      rec.onend = () => {
        starting = false;
        activeRecognition = null;
        onEnd();
      };

      rec.start();
      activeRecognition = rec;
      starting = false;
    } catch {
      starting = false;
      onError('start-failed');
    }
  };

  setTimeout(create, 60);
  return true;
}

export function stopListening(): void {
  hardReset();
}

// ─────────────────────────────────────────────────────────
// SINTESIS DE VOZ — Asistente personal de fábrica
// Voz femenina natural, pausada, cercana, tipo JARVIS.
// ─────────────────────────────────────────────────────────

let preferredVoice: SpeechSynthesisVoice | null = null;
let audioUnlocked = false;
let voiceRefreshScheduled = false;

// === SCORING DE VOCES ===
// Priorizamos voces naturales y femeninas. Orden:
// premium Google/Apple/Microsoft > nativas del SO > resto.

const VOZ_PREMIUM_FEMENINA = /google español|samsung|microsoft.*español.*female|microsoft.*elena|microsoft.*laura|microsoft.*helena|samantha|monica|paulina|camila|valentina|isabella|female.*es/i;
const VOZ_NATIVA_FEMENINA = /elvira|lucia|helena|monica|paulina|sabina|maria|carmen|ana|female|mujer|female.*es/i;
const VOZ_MASCULINA_O_MALA = /compact|novelty|whisper|jorge|diego|juan|pablo|carlos|male|hombre/i;

function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  let score = 0;

  // Idioma exacto es-ES es oro
  if (v.lang?.toLowerCase() === 'es-es') score += 30;
  else if (v.lang?.toLowerCase().startsWith('es')) score += 15;

  // Premium femenina (Google, Microsoft, Samsung...)
  if (VOZ_PREMIUM_FEMENINA.test(name)) score += 50;
  // Nativa femenina del SO
  else if (VOZ_NATIVA_FEMENINA.test(name)) score += 25;

  // Penalizar masculinas o de baja calidad
  if (VOZ_MASCULINA_O_MALA.test(name)) score -= 100;
  if (/compact|low|legacy|old/.test(name)) score -= 50;

  // Bonus por proveedores conocidos
  if (/google|microsoft|apple|samsung/.test(name)) score += 10;

  return score;
}

function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const esVoices = voices.filter(v => v.lang?.toLowerCase().startsWith('es'));
  if (esVoices.length === 0) return null;

  const ranked = esVoices
    .map(v => ({ voice: v, score: scoreVoice(v) }))
    .sort((a, b) => b.score - a.score);

  // Si la mejor tiene score negativo, todas son masculinas/malas.
  // Fallback: primera es-ES encontrada.
  if (ranked[0].score < 0) {
    const esES = voices.find(v => v.lang?.toLowerCase() === 'es-es');
    return esES ?? esVoices[0];
  }

  return ranked[0].voice;
}

function refreshVoice() {
  preferredVoice = pickSpanishVoice();
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    refreshVoice();
    voiceRefreshScheduled = false;
  };
  refreshVoice();
}

export function unlockSpeechSynthesis(): void {
  if (audioUnlocked || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const silent = new SpeechSynthesisUtterance('');
    silent.volume = 0;
    window.speechSynthesis.speak(silent);
    audioUnlocked = true;
    refreshVoice();
  } catch { /* noop */ }
}

/**
 * Reproduce texto con la voz del asistente.
 * Configuración optimizada para sonar natural y femenino.
 */
export function speak(text: string, enabled: boolean = true, voiceName?: string): void {
  if (!enabled) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (!text || text.trim().length === 0) return;

  window.speechSynthesis.cancel();

  let voiceToUse = preferredVoice;
  if (voiceName) {
    const voices = window.speechSynthesis.getVoices();
    const found = voices.find(v => v.name === voiceName);
    if (found) voiceToUse = found;
  } else if (!preferredVoice) {
    // Forzar recarga de voces si no hay preferred
    if (!voiceRefreshScheduled) {
      voiceRefreshScheduled = true;
      setTimeout(() => {
        refreshVoice();
        voiceRefreshScheduled = false;
      }, 100);
    }
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';

  // === PARÁMETROS "JARVIS FEMENINA" ===
  // Pitch natural femenino (no artificial)
  utterance.pitch = 1.06;
  // Rate pausado pero natural
  utterance.rate = 0.94;
  utterance.volume = 1;

  if (voiceToUse) utterance.voice = voiceToUse;

  // Pequeña pausa antes de hablar para evitar cortes
  setTimeout(() => window.speechSynthesis.speak(utterance), 50);
}

export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function listAvailableSpanishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith('es'));
}
