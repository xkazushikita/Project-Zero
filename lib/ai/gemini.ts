import "server-only";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

interface Turn {
  role: "user" | "model";
  text: string;
}

interface CallOpts {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  responseSchema?: unknown;
}

async function callGemini(system: string, turns: Turn[], opts: CallOpts = {}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini not configured");
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url = API_BASE + model + ":generateContent?key=" + key;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000);

  try {
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: {
        maxOutputTokens: opts.maxTokens ?? 700,
        temperature: opts.temperature ?? 0.6,
        ...(opts.responseSchema ? { responseMimeType: "application/json", responseSchema: opts.responseSchema } : {}),
      },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error("Gemini request failed (" + res.status + "): " + errText.slice(0, 300));
    }
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function geminiGenerate(system: string, turns: Turn[], opts?: Omit<CallOpts, "responseSchema">): Promise<string> {
  return callGemini(system, turns, opts);
}

export async function geminiJSON<T>(system: string, turns: Turn[], schema: unknown, opts?: Omit<CallOpts, "responseSchema">): Promise<T> {
  const text = await callGemini(system, turns, { ...opts, responseSchema: schema });
  return JSON.parse(text) as T;
}
