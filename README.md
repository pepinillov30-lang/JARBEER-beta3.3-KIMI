# J.A.R.B.E.E.R. OS — Beta 3.3

Intelligent Brewery OS — Interfaz de gestión de producción cervecera artesanal.

Intelligent Brewery OS — Prototipo de interfaz para gestión de producción cervecera.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación y arranque

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en el navegador.

## Build de producción

```bash
npm run build
npm run preview
```

## Estructura

```
src/
  App.tsx                  # Raíz de la aplicación
  main.tsx                 # Punto de entrada
  index.css                # Estilos globales + clases HUD
  lib/
    config.ts              # Constantes (nombre usuario, versión)
    sound.ts               # Motor de sonido Web Audio API
  data/
    mockData.ts            # Datos de demo (lote, documentos, comandos)
  components/
    Avatar.tsx             # Reactor holográfico con imagen
    BackgroundFX.tsx       # Fondo animado
    BottomNav.tsx          # Navegación inferior
    GlassCard.tsx          # Tarjeta glassmorphism
    MicButton.tsx          # Botón de micrófono con estados
    ScreenHeader.tsx       # Cabecera de pantalla
  screens/
    BootScreen.tsx         # Pantalla de arranque
    Home.tsx               # Dashboard principal
    Production.tsx         # Ficha de producción editable
    Documents.tsx          # Biblioteca de documentos
    Assistant.tsx          # Chat + comandos de voz
public/
  avatar.png               # Imagen del avatar (núcleo del reactor)
```

## Personalización

- Cambia el nombre en `src/lib/config.ts` → `USER_NAME`
- Actualiza datos del lote en `src/data/mockData.ts` → `productionData`
- Sustituye `public/avatar.png` por cualquier imagen cuadrada

## Tecnologías

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Framer Motion 11
- Lucide React
- Web Audio API (sonidos sintetizados, sin archivos externos)
