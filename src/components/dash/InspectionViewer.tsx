import { useState } from "react";
import { cn } from "@/lib/utils";
import { VERDICT_META, type Inspection } from "@/lib/data";
import { Bar, StatusBadge } from "./ui";

export function InspectionViewer({ insp, compact = false }: { insp: Inspection; compact?: boolean }) {
  const [mode, setMode] = useState<"box" | "heat">("box");
  const [aspect, setAspect] = useState<number | null>(null);
  const meta = VERDICT_META[insp.verdict];
  const boxTone = insp.verdict === "novel" ? "border-signal" : insp.verdict === "review" ? "border-warn" : "border-defect";
  const labelTone = insp.verdict === "novel" ? "bg-signal" : insp.verdict === "review" ? "bg-warn" : "bg-defect";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-mono text-[11px] text-dim">
          INSPECTION <span className="text-ink">#{insp.id}</span>
          {!compact && <span className="ml-2 text-faint">· {insp.product}</span>}
        </div>
        <div className="flex items-center gap-2">
          {insp.bbox && (
            <div className="flex rounded-md bg-panel2 p-0.5 ring-1 ring-line">
              {(["box", "heat"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn("rounded px-2 py-0.5 font-mono text-[9px] uppercase", mode === m ? "bg-signal/20 text-signal" : "text-faint hover:text-ink")}
                >
                  {m === "box" ? "Box" : "Heatmap"}
                </button>
              ))}
            </div>
          )}
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-lg bg-base ring-1 ring-line"
        style={{ aspectRatio: aspect ?? 16 / 10, maxHeight: "60vh", margin: "0 auto" }}
      >
        <img
          key={insp.id}
          src={insp.image}
          alt={insp.product}
          onLoad={(e) => {
            const el = e.currentTarget;
            if (el.naturalWidth && el.naturalHeight) setAspect(el.naturalWidth / el.naturalHeight);
          }}
          className="h-full w-full object-fill"
        />
        {insp.bbox && mode === "box" && (
          <>
            <div
              className={cn("bb-pulse absolute rounded-sm border-2", boxTone)}
              style={{ left: `${insp.bbox.x}%`, top: `${insp.bbox.y}%`, width: `${insp.bbox.w}%`, height: `${insp.bbox.h}%` }}
            />
            <div
              className={cn("absolute rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold text-base", labelTone)}
              style={{ left: `${insp.bbox.x}%`, top: `calc(${insp.bbox.y}% - 18px)` }}
            >
              {(insp.defectClass ?? "UNKNOWN PATTERN").toUpperCase()} {insp.sizeMm && `· ${insp.sizeMm}`}
            </div>
          </>
        )}
        {insp.bbox && mode === "heat" && (
          <div
            className="heat-overlay absolute rounded-full"
            style={{
              left: `${insp.bbox.x - insp.bbox.w * 0.4}%`,
              top: `${insp.bbox.y - insp.bbox.h * 0.4}%`,
              width: `${insp.bbox.w * 1.8}%`,
              height: `${insp.bbox.h * 1.8}%`,
            }}
          />
        )}
        <div className="absolute bottom-2 left-2 rounded bg-base/80 px-2 py-1 font-mono text-[9px] text-dim ring-1 ring-line">
          {insp.bbox
            ? `X ${Math.round(insp.bbox.x * 10.24)} · Y ${Math.round(insp.bbox.y * 6.4)} · ${Math.round(insp.bbox.w * 10.24)}×${Math.round(insp.bbox.h * 6.4)}`
            : "No region flagged"}
        </div>
        <div className="absolute right-2 top-2 rounded bg-base/80 px-2 py-1 font-mono text-[9px] text-dim ring-1 ring-line">
          CAM-04 · {insp.capturedAt}
        </div>
      </div>

      <div className="mt-3 flex items-end gap-4">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-dim">
            <span>CONFIDENCE</span>
            <span className={cn("font-semibold", insp.confidence >= 80 ? "text-signal" : insp.confidence >= 60 ? "text-warn" : "text-defect")}>{insp.confidence}%</span>
          </div>
          <Bar value={insp.confidence} tone={insp.confidence >= 80 ? "signal" : insp.confidence >= 60 ? "warn" : "defect"} />
        </div>
        <div className="text-right font-mono text-[10px]">
          <div className="text-faint">CLASS</div>
          <div className="font-semibold text-ink">{insp.defectClass ?? "Unclassified"}</div>
        </div>
      </div>
    </div>
  );
}
