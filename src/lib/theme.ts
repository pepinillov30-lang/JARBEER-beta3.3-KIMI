// ─────────────────────────────────────────────────────────
// Tema visual — aplica clases al root del documento
// ─────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'neon';

export const THEME_CLASSES: Record<ThemeMode, string> = {
  dark: '',
  light: 'theme-light',
  neon: 'theme-neon',
};

const THEME_STYLES: Record<ThemeMode, string> = {
  dark: '',
  light: `
    :root {
      --bg-primary: #f8f4ee;
      --bg-secondary: #ffffff;
      --text-primary: #1a1a1a;
      --text-secondary: #555555;
      --border-color: #e0dcd5;
    }
    body { background: #f8f4ee !important; color: #1a1a1a !important; }
  `,
  neon: `
    :root {
      --bg-primary: #020408;
      --bg-secondary: #0a1525;
      --text-primary: #e8f0f8;
      --text-secondary: #00e1ff;
      --accent-primary: #00e1ff;
      --accent-secondary: #FFAA00;
    }
    body {
      background: #020408 !important;
      color: #e8f0f8 !important;
    }
    .theme-neon .GlassCard {
      background: rgba(2,5,10,0.92) !important;
      border-color: rgba(0,225,255,0.2) !important;
    }
  `,
};

export function applyTheme(theme: string): void {
  if (typeof document === 'undefined') return;

  // Limpiar clases anteriores
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-neon');

  // Aplicar nueva clase
  const mode = theme as ThemeMode;
  if (THEME_CLASSES[mode]) {
    root.classList.add(THEME_CLASSES[mode]);
  }

  // Aplicar estilos inline para light y neon
  let existingStyle = document.getElementById('jarbeer-theme-styles');
  if (THEME_STYLES[mode]) {
    if (!existingStyle) {
      existingStyle = document.createElement('style');
      existingStyle.id = 'jarbeer-theme-styles';
      document.head.appendChild(existingStyle);
    }
    existingStyle.textContent = THEME_STYLES[mode];
  } else {
    if (existingStyle) existingStyle.remove();
  }
}
