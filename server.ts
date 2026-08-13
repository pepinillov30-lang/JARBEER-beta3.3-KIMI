import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Enable CORS for options preflight
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

const MODEL_NAME = "gemini-3.5-flash";

const SYSTEM_PROMPT = `Eres J.A.R.B.E.E.R. (Just A Real Brewing Engineering Expert Reasoner), el sistema operativo inteligente de la microcervecería artesanal de Juanfran.
Tu personalidad emula al actor de doblaje Iván Muelas (voz oficial de Jarvis en España): un timbre elegante, pausado, profesional, sofisticado y con un sutil y fino toque irónico. Hablas con Juanfran de tú a tú, de manera directa, cercana y sin formalismos corporativos vacíos. Eres un colaborador estratégico altamente resolutivo y proactivo.

INFORMACIÓN DEL ENTORNO OPERATIVO REAL:
- Hardware Local: CPU Intel Core i7-3770K, 16 GB de RAM DDR3, GPU NVIDIA GeForce RTX 2060 (6 GB de VRAM dedicados). Aceleración CUDA obligatoria para inferencia local.
- Almacenamiento: Array crítico de 5 discos duros locales con partición compartida formateada en NTFS para librerías de Windows (montados en /mnt/ bajo Linux Bazzite opcional).
- Conectividad y Acceso Remoto: Terminal móvil (Android) en planta. Conexión aislada tipo "búnker" mediante túnel seguro (Tailscale o Ngrok) enrutado directamente al PC de casa, garantizando privacidad absoluta sin salida de datos a internet.
- Stack Técnico Local: Motor LLM Ollama ejecutando modelos locales estrictamente cuantizados (Llama 3 8B o Mistral) para no saturar la VRAM. Gestor Documental (RAG) AnythingLLM para catalogación de recetas (Red Ale, Golden Ale, Blonde Ale). Motor de Automatización Open Interpreter. Personalización de Voz con OpenAI Whisper (local STT) y Piper/Coqui TTS.

REGLAS DE ORO:
1. La Regla del Norte ("Stop Inventing" / Cero Alucinaciones): Queda estrictamente prohibido suponer, rellenar huecos o inventar datos, comandos, recetas o rutas. Si no dispones de la información exacta en el contexto de la fábrica provisto, detén la ejecución y solicita aclaración amablemente a Juanfran.
2. Colaborador Proactivo: Toma la iniciativa técnica en tus respuestas. Sustituye la validación pasiva por propuestas reales y concretas del tipo: "He detectado X, ¿te parece bien si realizamos Y?"
3. Variables de Fabricación: La variable de control principal de azúcares y fermentación es el grado Plato (°Plato, °P), nunca la densidad SG. Los fermentadores activos son F-01 a F-06.
4. Fluidez Oral y TTS: Redacta tus respuestas con un estilo conversacional fluido, pausado y elegante. Evita usar símbolos de markdown pesados (como múltiples asteriscos **, barras, tablas complejas o almohadillas ###) en tus oraciones para que la síntesis de voz (Text-to-Speech) pueda leer el texto en voz alta de manera completamente natural y sin tropiezos.
5. Protocolo Interactivo de Cierre: Si Juanfran indica que se ha completado un trabajo, se despide, agradece o cierra una sesión, debes despedirte elegantemente con tu toque irónico de Jarvis y concluir lanzando EXACTAMENTE esta pregunta al final de tu mensaje: "Socio, hemos cerrado este bloque de tareas. ¿Limpiamos el historial de este chat para prevenir alucinaciones? (Y/N)"`;

function buildFactoryContext(body: any) {
  const ctx = body.context;
  if (!ctx) return "";

  let parts = ["\n\n--- CONTEXTO DE LA FÁBRICA EN TIEMPO REAL ---"];

  if (ctx.mode) {
    parts.push(`Modo IA actual: ${ctx.mode === "online" ? "ONLINE (Gemini)" : "BÚNKER (local, sin internet)"}`);
  }

  if (ctx.batches && ctx.batches.length > 0) {
    parts.push("\nLotes activos en seguimiento:");
    for (const b of ctx.batches) {
      parts.push(`  • Lote ${b.batch} — ${b.recipe} — Etapa: ${b.stage} (${b.stageProgress}%) — Fermentador: F-${b.fermentadorNum} — Temp actual: ${b.currentTemp}°C — Azúcar: ${b.plato}°Plato — pH actual: ${b.ph}`);
    }  }

  if (ctx.fermentadores && ctx.fermentadores.length > 0) {
    parts.push("\nEstado de los Fermentadores:");
    for (const f of ctx.fermentadores) {
      parts.push(`  • ${f.id}: Receta: ${f.recipe ?? "vacío"} — Temp: ${f.temp}°C — Grado: ${f.plato}°P — pH: ${f.ph} — Progreso: ${f.progress}% — Tiempo restante estimado: ${f.timeLeft ?? "—"}`);
    }
  }

  if (ctx.documents && ctx.documents.length > 0) {
    parts.push(`\nDocumentos y archivos indexados en AnythingLLM: ${ctx.documents.length}`);
    for (const d of ctx.documents.slice(0, 6)) {
      parts.push(`  • ${d.title} (Ref: ${d.reference}) — Categoría: ${d.category}`);
    }
  }

  parts.push("--- FIN CONTEXTO OPERATIVO ---\n");
  return parts.join("\n");
}

// Handler mapping both Netlify serverless function path and standard api path
app.post(["/api/gemini", "/.netlify/functions/gemini"], async (req, res) => {
  const customKey = req.headers["x-gemini-api-key"] as string;
  const apiKey = customKey || process.env.GEMINI_API_KEY || process.env.JARBEER_KEY;
  console.log(`[J.A.R.B.E.E.R. OS Backend] POST /api/gemini received. Stream: ${req.body?.stream}. Key configured: ${!!apiKey}`);

  if (!apiKey) {
    console.error("[J.A.R.B.E.E.R. OS Backend] Error: GEMINI_API_KEY / JARBEER_KEY is not configured.");
    return res.status(500).json({ error: "La API Key de Gemini no está configurada en los ajustes del sistema." });
  }

  const { command, history, stream } = req.body ?? {};
  if (!command || typeof command !== "string") {
    console.error("[J.A.R.B.E.E.R. OS Backend] Error: Missing or invalid command parameter.");
    return res.status(400).json({ error: "Missing command" });
  }

  const factoryCtx = buildFactoryContext(req.body);

  // Build the conversation contents array (clean dialog history)
  const rawHistory: any[] = [];
  if (Array.isArray(history)) {
    for (const msg of history.slice(-20)) {
      if (msg.role === "user" && msg.content) {
        rawHistory.push({ role: "user", parts: [{ text: msg.content }] });
      } else if ((msg.role === "assistant" || msg.role === "model") && msg.content) {
        rawHistory.push({ role: "model", parts: [{ text: msg.content }] });
      }
    }
  }

  // Add the user's latest command
  rawHistory.push({ role: "user", parts: [{ text: command }] });

  // Sanitize and strictly alternate roles to prevent Gemini 400 "alternate user and model turns" errors
  const chatHistory: any[] = [];
  for (const turn of rawHistory) {
    if (chatHistory.length === 0) {
      // Ensure the history starts with user for a clean dialog state
      if (turn.role === "user") {
        chatHistory.push(turn);
      }
    } else {
      const lastTurn = chatHistory[chatHistory.length - 1];
      if (lastTurn.role === turn.role) {
        // Merge consecutive same-role turns by concatenating text with a newline
        lastTurn.parts[0].text += "\n" + turn.parts[0].text;
      } else {
        chatHistory.push(turn);
      }
    }
  }

  // If after sanitization we ended up with no turns or it starts with model, fix it
  if (chatHistory.length === 0) {
    chatHistory.push({ role: "user", parts: [{ text: command }] });
  }

  console.log(`[J.A.R.B.E.E.R. OS Backend] Sanitized chat history length: ${chatHistory.length} turns.`);

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    if (stream) {
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      });

      try {
        const resultStream = await ai.models.generateContentStream({
          model: MODEL_NAME,
          contents: chatHistory,
          config: {
            systemInstruction: SYSTEM_PROMPT + factoryCtx,
            temperature: 0.25, // Fixed strictly between 0.2 and 0.3 as requested!
          }
        });

        for await (const chunk of resultStream) {
          const text = chunk.text;
          if (text) {
            res.write(text);
          }
        }
      } catch (streamErr: any) {
        console.error("[J.A.R.B.E.E.R. OS Backend] Stream runtime error:", streamErr);
        res.write(`\n[Error de transmisión: ${streamErr.message ?? "fallo del stream"}]`);
      }
      res.end();
      return;
    }

    // Non-streaming response
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: chatHistory,
      config: {
        systemInstruction: SYSTEM_PROMPT + factoryCtx,
        temperature: 0.25, // Fixed strictly between 0.2 and 0.3 as requested!
      }
    });

    return res.json({ reply: response.text });
  } catch (err: any) {
    console.error("[J.A.R.B.E.E.R. OS Backend] General Gemini API error:", err);
    return res.status(502).json({ error: err.message ?? "Gemini request failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
