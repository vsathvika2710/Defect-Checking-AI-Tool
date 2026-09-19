import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  dataUrl: z.string().min(32).startsWith("data:image/"),
  fileName: z.string().default("upload"),
});

const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "defectClass", "confidence", "uncertainty", "novelty", "hasRegion", "bbox", "sizeMm", "evidence"],
  properties: {
    verdict: { type: "string", enum: ["accepted", "defective", "review", "novel"] },
    defectClass: { type: ["string", "null"] },
    confidence: { type: "number" },
    uncertainty: { type: "number" },
    novelty: { type: "number" },
    hasRegion: { type: "boolean" },
    bbox: {
      type: "object",
      additionalProperties: false,
      required: ["x", "y", "w", "h"],
      properties: { x: { type: "number" }, y: { type: "number" }, w: { type: "number" }, h: { type: "number" } },
    },
    sizeMm: { type: ["string", "null"] },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "text"],
        properties: {
          kind: { type: "string", enum: ["image", "process", "batch", "history"] },
          text: { type: "string" },
        },
      },
    },
  },
} as const;

const SYSTEM = `You are an industrial visual-inspection model. Look at the supplied photo of a manufactured part and judge ONLY what is visible.

Rules:
- If the part shows no visible anomaly (no crack, chip, scratch, porosity, solder defect, contamination, deformation), the verdict MUST be "accepted", defectClass MUST be null, hasRegion MUST be false, and confidence should be high (85-98).
- Use "defective" only when a defect is clearly visible; name the class (e.g. "Structural crack", "Edge chip", "Surface scratch", "Weld porosity", "Solder bridge", "Contamination").
- Use "review" when something may be wrong but you are unsure (confidence 45-69).
- Use "novel" when an anomaly is present that matches no common class.
- Never invent a defect that is not visible in the image. A clean, unbroken glass or part is "accepted".
- bbox is a percentage region of the image (x, y, w, h, 0-100) around the defect. When hasRegion is false, return zeros.
- confidence/uncertainty/novelty are 0-100 integers. evidence is 2-4 short factual observations about the image; kind "image" for visual observations.`;

export const analyseInspectionImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this project.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        store: false,
        instructions: SYSTEM,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: `Inspect this part (file: ${data.fileName}) and return the inspection result.` },
              { type: "input_image", image_url: data.dataUrl },
            ],
          },
        ],
        text: { format: { type: "json_schema", name: "inspection_result", strict: true, schema: RESULT_SCHEMA } },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      if (res.status === 402 || res.status === 429) throw new Error("AI usage limit reached. Please try again later.");
      throw new Error(`Image analysis failed (${res.status}). ${detail.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") text += evt.delta;
          else if (evt.type === "response.completed" && typeof evt.response?.output_text === "string" && !text) text = evt.response.output_text;
        } catch {
          // ignore keep-alive / non-JSON frames
        }
      }
    }

    if (!text.trim()) throw new Error("The model returned no result for this image.");

    try {
      return JSON.parse(text) as {
        verdict: "accepted" | "defective" | "review" | "novel";
        defectClass: string | null;
        confidence: number;
        uncertainty: number;
        novelty: number;
        hasRegion: boolean;
        bbox: { x: number; y: number; w: number; h: number };
        sizeMm: string | null;
        evidence: { kind: "image" | "process" | "batch" | "history"; text: string }[];
      };
    } catch {
      throw new Error("The model result could not be read.");
    }
  });
