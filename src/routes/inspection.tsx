import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { analyseInspectionImage } from "@/lib/inspect.functions";
import { Panel, PanelHeader, Chip, Bar, StatusBadge, Advisory } from "@/components/dash/ui";
import { InspectionViewer } from "@/components/dash/InspectionViewer";
import { useSelection } from "@/lib/selection";
import { INSPECTIONS, VERDICT_META, batchById, inspectionById, stationById, RECOMMENDATIONS, type Inspection } from "@/lib/data";
import { cn } from "@/lib/utils";

const TITLE = "Inspection — Veridic Defect Root-Cause Assistant";
const DESC = "Upload or select an inspection image to see the verdict, defect class, confidence, localisation and linked batch evidence.";

export const Route = createFileRoute("/inspection")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: InspectionPage,
});

function InspectionPage() {
  const { inspectionId, setInspectionId, setHighlightRec } = useSelection();
  const [uploaded, setUploaded] = useState<Inspection | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const insp = uploaded && inspectionId === uploaded.id ? uploaded : inspectionById(inspectionId);
  const batch = batchById(insp.batchId);
  const station = stationById(insp.stationId);
  const meta = VERDICT_META[insp.verdict];
  const rec = RECOMMENDATIONS.find((r) => r.inspectionId === insp.id);

  const onFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setAnalysing(true);
    setTimeout(() => {
      const u: Inspection = {
        id: "UPL-" + String(Date.now()).slice(-4),
        unitId: "U-" + String(Date.now()).slice(-5),
        batchId: "B-2291",
        stationId: "press-02",
        product: file.name.replace(/\.[^.]+$/, ""),
        image: url,
        verdict: "review",
        defectClass: "Structural crack",
        confidence: 58,
        uncertainty: 29,
        novelty: 22,
        bbox: { x: 36, y: 32, w: 26, h: 30 },
        sizeMm: "est.",
        capturedAt: new Date().toISOString().slice(11, 19),
        evidence: [
          { kind: "image", text: "Uploaded image scored by demo model; below 70% auto-decision threshold, routed to review" },
          { kind: "batch", text: "Attributed to current batch B-2291 (Press 02) for demonstration" },
          { kind: "history", text: "Ensemble disagreement 2/3 — engineer confirmation required" },
        ],
        process: { cycle: 42, temp: 175, sinceChangeoverMin: 14, utilization: 98 },
      };
      setUploaded(u);
      setInspectionId(u.id);
      setAnalysing(false);
    }, 1400);
  };

  const queue = uploaded ? [uploaded, ...INSPECTIONS] : INSPECTIONS;

  return (
    <div className="grid gap-3 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-3">
        <Panel>
          <PanelHeader title="Upload image" meta="demo model" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
            className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-panel2/40 px-3 py-6 text-center transition-colors hover:border-signal/60 hover:bg-signal/5"
          >
            <span className="font-mono text-[11px] text-ink">{analysing ? "Analysing…" : "Drop inspection image"}</span>
            <span className="font-mono text-[9px] text-faint">{analysing ? "running detector · localiser · uncertainty" : "or click to browse · JPG / PNG"}</span>
            {analysing && <Bar value={100} className="mt-2 h-1" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </Panel>

        <Panel>
          <PanelHeader title="Inspection queue" meta={`${queue.length} items`} />
          <div className="space-y-1">
            {queue.map((i) => {
              const m = VERDICT_META[i.verdict];
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setInspectionId(i.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md p-2 text-left ring-1 transition-colors",
                    i.id === insp.id ? "bg-signal/10 ring-signal/40" : "ring-transparent hover:bg-panel2/60",
                  )}
                >
                  <img src={i.image} alt="" width={64} height={40} loading="lazy" className="h-10 w-16 shrink-0 rounded object-cover ring-1 ring-line" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-ink">#{i.id}</span>
                      <span className={cn("font-mono text-[9px]", `text-${m.tone}`)}>{i.confidence}%</span>
                    </div>
                    <div className="truncate font-mono text-[9px] text-faint">{i.product}</div>
                    <div className={cn("font-mono text-[9px] uppercase tracking-wide", `text-${m.tone}`)}>{m.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="space-y-3 lg:col-span-6">
        <Panel>
          <InspectionViewer insp={insp} />
        </Panel>
        <Panel>
          <PanelHeader title="Evidence" meta={`${insp.evidence.length} items`} />
          <ul className="space-y-2">
            {insp.evidence.map((e, i) => (
              <li key={i} className="flex gap-3 rounded-md bg-panel2/50 p-2.5 ring-1 ring-line/60">
                <Chip tone={e.kind === "image" ? "defect" : e.kind === "process" ? "signal" : e.kind === "batch" ? "warn" : "dim"} className="h-fit uppercase">
                  {e.kind}
                </Chip>
                <p className="text-[12px] leading-relaxed text-dim">{e.text}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="space-y-3 lg:col-span-3">
        <Panel>
          <PanelHeader title="Verdict" />
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          <div className="mt-3 space-y-3 font-mono text-[10px]">
            <Metric label="Confidence" value={insp.confidence} tone={insp.confidence >= 80 ? "signal" : insp.confidence >= 60 ? "warn" : "defect"} />
            <Metric label="Uncertainty (ensemble spread)" value={insp.uncertainty} tone={insp.uncertainty > 20 ? "warn" : "ok"} />
            <Metric label="Novelty distance" value={insp.novelty} tone={insp.novelty > 60 ? "signal" : "ok"} />
          </div>
          <p className="mt-3 font-mono text-[9px] leading-relaxed text-faint">
            {insp.verdict === "review" && "Confidence below 70% auto-decision threshold. Engineer confirmation required before disposition."}
            {insp.verdict === "novel" && "Pattern does not match any known class. Treat as unlabelled until an engineer reviews it."}
            {insp.verdict === "defective" && "Above threshold with low ensemble spread. Disposition: reject / route to rework assessment."}
            {insp.verdict === "accepted" && "No anomaly above threshold. Unit released."}
          </p>
        </Panel>

        <Panel>
          <PanelHeader title="Batch & process context" />
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[10px]">
            <Row k="Batch" v={batch.id} />
            <Row k="Station" v={station.name} />
            <Row k="Batch defect rate" v={`${batch.defectRate}%`} tone={batch.defectRate > 3 ? "defect" : undefined} />
            <Row k="Units in batch" v={batch.units.toLocaleString()} />
            <Row k="Cycle at capture" v={`${insp.process.cycle}s`} tone={insp.process.cycle > station.takt ? "defect" : undefined} />
            <Row k="Takt" v={`${station.takt}s`} />
            <Row k="Process temp" v={`${insp.process.temp} °C`} tone={insp.process.temp < 178 ? "warn" : undefined} />
            <Row k="Since changeover" v={`${insp.process.sinceChangeoverMin} min`} tone={insp.process.sinceChangeoverMin < 25 ? "warn" : undefined} />
            <Row k="Station utilisation" v={`${insp.process.utilization}%`} tone={insp.process.utilization >= 95 ? "defect" : undefined} />
            <Row k="Shift" v={String(batch.shift)} />
          </dl>
        </Panel>

        <Panel>
          <PanelHeader title="Trace forward" />
          <div className="space-y-1.5">
            <Link to="/root-cause" className="flex items-center justify-between rounded-md bg-panel2/60 px-2.5 py-2 font-mono text-[10px] ring-1 ring-line hover:ring-signal">
              <span className="text-dim">Process associations</span><span className="text-signal">→</span>
            </Link>
            <Link to="/bottlenecks" className="flex items-center justify-between rounded-md bg-panel2/60 px-2.5 py-2 font-mono text-[10px] ring-1 ring-line hover:ring-signal">
              <span className="text-dim">{station.name} constraint</span><span className="text-signal">→</span>
            </Link>
            <Link to="/economic" className="flex items-center justify-between rounded-md bg-panel2/60 px-2.5 py-2 font-mono text-[10px] ring-1 ring-line hover:ring-signal">
              <span className="text-dim">Economic impact</span><span className="text-signal">→</span>
            </Link>
            {rec ? (
              <Link
                to="/recommendations"
                onClick={() => setHighlightRec(rec.rank)}
                className="flex items-center justify-between rounded-md bg-signal px-2.5 py-2 font-mono text-[10px] font-semibold text-base hover:bg-signal/85"
              >
                <span>Recommendation #{rec.rank}</span><span>→</span>
              </Link>
            ) : (
              <div className="rounded-md bg-panel2/60 px-2.5 py-2 font-mono text-[10px] text-faint ring-1 ring-line">No open recommendation for this unit</div>
            )}
          </div>
        </Panel>
        <Advisory>Model outputs are from a demonstration detector on sample data. Verdicts are advisory and require engineer disposition.</Advisory>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "signal" | "warn" | "defect" | "ok" }) {
  return (
    <div>
      <div className="mb-1 flex justify-between"><span className="text-dim">{label}</span><span className={`font-semibold text-${tone}`}>{value}%</span></div>
      <Bar value={value} tone={tone} />
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "defect" | "warn" | undefined }) {
  return (
    <div className="contents">
      <dt className="text-faint">{k}</dt>
      <dd className={cn("text-right text-ink", tone === "defect" && "text-defect", tone === "warn" && "text-warn")}>{v}</dd>
    </div>
  );
}
