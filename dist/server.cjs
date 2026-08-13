"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
app.use(import_express.default.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
var MODEL_NAME = "gemini-3.5-flash";
var SYSTEM_PROMPT = `Eres J.A.R.B.E.E.R. (Just A Real Brewing Engineering Expert Reasoner), el sistema operativo inteligente de la microcervecer\xEDa artesanal de Juanfran.
Tu personalidad emula al actor de doblaje Iv\xE1n Muelas (voz oficial de Jarvis en Espa\xF1a): un timbre elegante, pausado, profesional, sofisticado y con un sutil y fino toque ir\xF3nico. Hablas con Juanfran de t\xFA a t\xFA, de manera directa, cercana y sin formalismos corporativos vac\xEDos. Eres un colaborador estrat\xE9gico altamente resolutivo y proactivo.

INFORMACI\xD3N DEL ENTORNO OPERATIVO REAL:
- Hardware Local: CPU Intel Core i7-3770K, 16 GB de RAM DDR3, GPU NVIDIA GeForce RTX 2060 (6 GB de VRAM dedicados). Aceleraci\xF3n CUDA obligatoria para inferencia local.
- Almacenamiento: Array cr\xEDtico de 5 discos duros locales con partici\xF3n compartida formateada en NTFS para librer\xEDas de Windows (montados en /mnt/ bajo Linux Bazzite opcional).
- Conectividad y Acceso Remoto: Terminal m\xF3vil (Android) en planta. Conexi\xF3n aislada tipo "b\xFAnker" mediante t\xFAnel seguro (Tailscale o Ngrok) enrutado directamente al PC de casa, garantizando privacidad absoluta sin salida de datos a internet.
- Stack T\xE9cnico Local: Motor LLM Ollama ejecutando modelos locales estrictamente cuantizados (Llama 3 8B o Mistral) para no saturar la VRAM. Gestor Documental (RAG) AnythingLLM para catalogaci\xF3n de recetas (Red Ale, Golden Ale, Blonde Ale). Motor de Automatizaci\xF3n Open Interpreter. Personalizaci\xF3n de Voz con OpenAI Whisper (local STT) y Piper/Coqui TTS.

REGLAS DE ORO:
1. La Regla del Norte ("Stop Inventing" / Cero Alucinaciones): Queda estrictamente prohibido suponer, rellenar huecos o inventar datos, comandos, recetas o rutas. Si no dispones de la informaci\xF3n exacta en el contexto de la f\xE1brica provisto, det\xE9n la ejecuci\xF3n y solicita aclaraci\xF3n amablemente a Juanfran.
2. Colaborador Proactivo: Toma la iniciativa t\xE9cnica en tus respuestas. Sustituye la validaci\xF3n pasiva por propuestas reales y concretas del tipo: "He detectado X, \xBFte parece bien si realizamos Y?"
3. Variables de Fabricaci\xF3n: La variable de control principal de az\xFAcares y fermentaci\xF3n es el grado Plato (\xB0Plato, \xB0P), nunca la densidad SG. Los fermentadores activos son F-01 a F-06.
4. Fluidez Oral y TTS: Redacta tus respuestas con un estilo conversacional fluido, pausado y elegante. Evita usar s\xEDmbolos de markdown pesados (como m\xFAltiples asteriscos **, barras, tablas complejas o almohadillas ###) en tus oraciones para que la s\xEDntesis de voz (Text-to-Speech) pueda leer el texto en voz alta de manera completamente natural y sin tropiezos.
5. Protocolo Interactivo de Cierre: Si Juanfran indica que se ha completado un trabajo, se despide, agradece o cierra una sesi\xF3n, debes despedirte elegantemente con tu toque ir\xF3nico de Jarvis y concluir lanzando EXACTAMENTE esta pregunta al final de tu mensaje: "Socio, hemos cerrado este bloque de tareas. \xBFLimpiamos el historial de este chat para prevenir alucinaciones? (Y/N)"`;
function buildFactoryContext(body) {
  const ctx = body.context;
  if (!ctx) return "";
  let parts = ["\n\n--- CONTEXTO DE LA F\xC1BRICA EN TIEMPO REAL ---"];
  if (ctx.mode) {
    parts.push(`Modo IA actual: ${ctx.mode === "online" ? "ONLINE (Gemini)" : "B\xDANKER (local, sin internet)"}`);
  }
  if (ctx.batches && ctx.batches.length > 0) {
    parts.push("\nLotes activos en seguimiento:");
    for (const b of ctx.batches) {
      parts.push(`  \u2022 Lote ${b.batch} \u2014 ${b.recipe} \u2014 Etapa: ${b.stage} (${b.stageProgress}%) \u2014 Fermentador: F-${b.fermentadorNum} \u2014 Temp actual: ${b.currentTemp}\xB0C \u2014 Az\xFAcar: ${b.plato}\xB0Plato \u2014 pH actual: ${b.ph}`);
    }
  }
  if (ctx.fermentadores && ctx.fermentadores.length > 0) {
    parts.push("\nEstado de los Fermentadores:");
    for (const f of ctx.fermentadores) {
      parts.push(`  \u2022 ${f.id}: Receta: ${f.recipe ?? "vac\xEDo"} \u2014 Temp: ${f.temp}\xB0C \u2014 Grado: ${f.plato}\xB0P \u2014 pH: ${f.ph} \u2014 Progreso: ${f.progress}% \u2014 Tiempo restante estimado: ${f.timeLeft ?? "\u2014"}`);
    }
  }
  if (ctx.documents && ctx.documents.length > 0) {
    parts.push(`
Documentos y archivos indexados en AnythingLLM: ${ctx.documents.length}`);
    for (const d of ctx.documents.slice(0, 6)) {
      parts.push(`  \u2022 ${d.title} (Ref: ${d.reference}) \u2014 Categor\xEDa: ${d.category}`);
    }
  }
  parts.push("--- FIN CONTEXTO OPERATIVO ---\n");
  return parts.join("\n");
}
app.post(["/api/gemini", "/.netlify/functions/gemini"], async (req, res) => {
  const customKey = req.headers["x-gemini-api-key"];
  const apiKey = customKey || process.env.GEMINI_API_KEY || process.env.JARBEER_KEY;
  console.log(`[J.A.R.B.E.E.R. OS Backend] POST /api/gemini received. Stream: ${req.body?.stream}. Key configured: ${!!apiKey}`);
  if (!apiKey) {
    console.error("[J.A.R.B.E.E.R. OS Backend] Error: GEMINI_API_KEY / JARBEER_KEY is not configured.");
    return res.status(500).json({ error: "La API Key de Gemini no est\xE1 configurada en los ajustes del sistema." });
  }
  const { command, history, stream } = req.body ?? {};
  if (!command || typeof command !== "string") {
    console.error("[J.A.R.B.E.E.R. OS Backend] Error: Missing or invalid command parameter.");
    return res.status(400).json({ error: "Missing command" });
  }
  const factoryCtx = buildFactoryContext(req.body);
  const rawHistory = [];
  if (Array.isArray(history)) {
    for (const msg of history.slice(-20)) {
      if (msg.role === "user" && msg.content) {
        rawHistory.push({ role: "user", parts: [{ text: msg.content }] });
      } else if ((msg.role === "assistant" || msg.role === "model") && msg.content) {
        rawHistory.push({ role: "model", parts: [{ text: msg.content }] });
      }
    }
  }
  rawHistory.push({ role: "user", parts: [{ text: command }] });
  const chatHistory = [];
  for (const turn of rawHistory) {
    if (chatHistory.length === 0) {
      if (turn.role === "user") {
        chatHistory.push(turn);
      }
    } else {
      const lastTurn = chatHistory[chatHistory.length - 1];
      if (lastTurn.role === turn.role) {
        lastTurn.parts[0].text += "\n" + turn.parts[0].text;
      } else {
        chatHistory.push(turn);
      }
    }
  }
  if (chatHistory.length === 0) {
    chatHistory.push({ role: "user", parts: [{ text: command }] });
  }
  console.log(`[J.A.R.B.E.E.R. OS Backend] Sanitized chat history length: ${chatHistory.length} turns.`);
  try {
    const ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    if (stream) {
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked"
      });
      try {
        const resultStream = await ai.models.generateContentStream({
          model: MODEL_NAME,
          contents: chatHistory,
          config: {
            systemInstruction: SYSTEM_PROMPT + factoryCtx,
            temperature: 0.25
            // Fixed strictly between 0.2 and 0.3 as requested!
          }
        });
        for await (const chunk of resultStream) {
          const text = chunk.text;
          if (text) {
            res.write(text);
          }
        }
      } catch (streamErr) {
        console.error("[J.A.R.B.E.E.R. OS Backend] Stream runtime error:", streamErr);
        res.write(`
[Error de transmisi\xF3n: ${streamErr.message ?? "fallo del stream"}]`);
      }
      res.end();
      return;
    }
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: chatHistory,
      config: {
        systemInstruction: SYSTEM_PROMPT + factoryCtx,
        temperature: 0.25
        // Fixed strictly between 0.2 and 0.3 as requested!
      }
    });
    return res.json({ reply: response.text });
  } catch (err) {
    console.error("[J.A.R.B.E.E.R. OS Backend] General Gemini API error:", err);
    return res.status(502).json({ error: err.message ?? "Gemini request failed" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
