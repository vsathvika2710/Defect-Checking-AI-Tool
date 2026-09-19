import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Panel, PanelHeader, Chip, Bar, Advisory, Segmented, Kpi } from "@/components/dash/ui";
import { TrendBars, TrendLine, ScatterBatches } from "@/components/dash/charts";
import { useSelection } from "@/lib/selection";
import {
  ASSOCIATIONS,
  BATCHES,
  CHANGEOVER_WINDOW,
  DEFECT_CLASSES,
  DEFECT_MIX,
  RECOMMENDATIONS,
  TREND_14D,
  inspectionById,
  stationById,
} from "@/lib/data";
import { cn } from "@/lib/utils";

const TITLE = "Root Cause — Veridic Defect Root-Cause Assistant";
const DESC =
  "Correlate defect classes with process variables: changeover windows, temperature drift, cycle time and downtime, with explicit association-not-causation framing.";

export const Route = createFileRoute("/root-cause")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: RootCausePage,
});

function strengthTone(s: number) {
  return s >= 0.7 ? "defect" : s >= 0.5 ? "warn" : "signal";
}
function strengthLabel(s: number) {
  return s >= 0.7 ? "Strong" : s >= 0.5 ? "Moderate" : "Weak";
}

function RootCausePage() {
  const { inspectionId, setHighlightRec } = useSelection();
  const insp = inspectionById(inspectionId);
  const [defectClass, setDefectClass] = useState<string>(insp.defectClass ?? DEFECT_CLASSES[0]!);
  const [selected, setSelected] = useState<string | null>("a1");

  const rows = useMemo(
    () => ASSOCIATIONS.filter((a) => a.defectClass === defectClass).sort((a, b) => b.strength - a.strength),
    [defectClass],
  );
  const active = rows.find((r) => r.id === selected) ?? rows[0];
  const station = active ? stationById(active.stationId) : undefined;
  const rec = active ? RECOMMENDATIONS.find((r) => r.associationId === active.id) : undefined;

  const scatter = BATCHES.map((b) => ({
    id: b.id,
    x: b.temp,
    y: b.defectRate,
    z: b.units,
    changeover: b.changeover,
  }));

  const topStrength = rows[0]?.strength ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Defect class" value={defectClass.split(" ")[0]!} sub={defectClass} />
        <Kpi
          label="Strongest association"
          value={topStrength.toFixed(2)}
          sub={rows[0]?.variable ?? "—"}
          subTone="warn"
        />
        <Kpi label="Sample size" value={String(rows[0]?.n ?? 0)} unit="units" />
        <Kpi label="14-day drift" value="+2.1" unit="pts" sub="D1 2.1% → D14 4.2%" subTone="defect" />
      </div>

      <Panel>
        <PanelHeader
          title="Defect class under investigation"
          right={<Chip tone="warn">ASSOCIATION ONLY</Chip>}
        />
        <div className="flex flex-wrap gap-1.5">
          {DEFECT_CLASSES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setDefectClass(c);
                setSelected(null);
              }}
              className={cn(
                "rounded-md px-2.5 py-1.5 font-mono text-[10px] ring-1 transition-colors",
                c === defectClass
                  ? "bg-signal/20 font-semibold text-signal ring-signal/50"
                  : "bg-panel2 text-dim ring-line hover:text-ink",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Advisory>
            Ranked by effect size across logged batches. A high score means the variable co-occurs with the defect —
            it does not prove the variable caused it. Confirm on the line before acting.
          </Advisory>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-5">
        <Panel className="lg:col-span-3" tilt="l">
          <PanelHeader title="Process variable correlations" meta={`${rows.length} variables`} />
          <div className="grid grid-cols-12 gap-2 border-b border-line pb-2 font-mono text-[10px] uppercase tracking-wider text-faint">
            <span className="col-span-4">Variable</span>
            <span className="col-span-1 text-center">Dir</span>
            <span className="col-span-5">Effect size</span>
            <span className="col-span-2 text-right">n</span>
          </div>
          {rows.map((a) => {
            const tone = strengthTone(a.strength) as "defect" | "warn" | "signal";
            const isActive = active?.id === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a.id)}
                className={cn(
                  "grid w-full grid-cols-12 items-center gap-2 border-b border-line/50 py-2.5 text-left font-mono text-[11px] last:border-0 transition-colors hover:bg-panel2/50",
                  isActive && "bg-panel2/70",
                )}
              >
                <span className="col-span-4 truncate text-ink">{a.variable}</span>
                <span className={cn("col-span-1 text-center", a.direction === "+" ? "text-defect" : "text-signal")}>
                  {a.direction}
                </span>
                <span className="col-span-5 flex items-center gap-2">
                  <Bar value={a.strength * 100} tone={tone} />
                  <span className="w-8 text-right font-semibold">{a.strength.toFixed(2)}</span>
                </span>
                <span className="col-span-2 text-right text-dim">{a.n}</span>
              </button>
            );
          })}
          {rows.length === 0 && (
            <p className="py-6 text-center font-mono text-[11px] text-faint">No logged associations for this class.</p>
          )}
        </Panel>

        <Panel className="lg:col-span-2" tilt="r">
          <PanelHeader title="Hypothesis detail" meta={active ? strengthLabel(active.strength) : "—"} />
          {active ? (
            <div className="space-y-3">
              <div className="text-[14px] font-semibold leading-snug tracking-tight">{active.variable}</div>
              <p className="font-mono text-[10px] leading-relaxed text-dim">{active.note}</p>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="defect">DEFECT · {active.defectClass}</Chip>
                <Chip tone="signal">STATION · {station?.name}</Chip>
                <Chip tone={strengthTone(active.strength) as "defect" | "warn" | "signal"}>
                  EFFECT · {active.strength.toFixed(2)} ({strengthLabel(active.strength)})
                </Chip>
                <Chip>n = {active.n}</Chip>
              </div>
              <div className="space-y-2 rounded-lg bg-panel2 p-3 font-mono text-[10px] text-dim ring-1 ring-line">
                <div className="flex justify-between">
                  <span className="text-faint">Direction</span>
                  <span>{active.direction === "+" ? "Higher value → more defects" : "Lower value → more defects"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-faint">Station cycle / takt</span>
                  <span>
                    {station?.cycleTime}s / {station?.takt}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-faint">Defect share of station</span>
                  <span>{station?.defectShare}%</span>
                </div>
              </div>
              {rec ? (
                <Link
                  to="/recommendations"
                  onClick={() => setHighlightRec(rec.rank)}
                  className="inline-block rounded-md bg-signal px-3 py-2 font-mono text-[11px] font-semibold tracking-wide text-base transition-colors hover:bg-signal/85"
                >
                  SEE RECOMMENDATION #{rec.rank}
                </Link>
              ) : (
                <p className="font-mono text-[10px] text-faint">
                  No ranked recommendation yet — evidence below the escalation threshold.
                </p>
              )}
            </div>
          ) : (
            <p className="font-mono text-[11px] text-faint">Select a variable to inspect the hypothesis.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel tilt="l">
          <PanelHeader title="Defect rate by changeover window" meta="minutes since" />
          <p className="-mt-2 mb-2 font-mono text-[10px] text-faint">
            Rate falls as the process stabilises after a die change.
          </p>
          <TrendBars data={CHANGEOVER_WINDOW} x="window" y="rate" threshold={3} />
        </Panel>

        <Panel>
          <PanelHeader title="14-day defect rate drift" meta="line A-04" />
          <p className="-mt-2 mb-2 font-mono text-[10px] text-faint">Slow upward drift, not a single-shift spike.</p>
          <TrendLine data={TREND_14D} x="day" y="rate" unit="%" />
        </Panel>

        <Panel tilt="r">
          <PanelHeader title="Batch temp vs defect rate" meta="bubble = units" />
          <p className="-mt-2 mb-2 font-mono text-[10px] text-faint">
            Orange points are batches flagged with a changeover.
          </p>
          <ScatterBatches data={scatter} />
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Defect mix" meta="share of detections" />
        <div className="space-y-2.5">
          {DEFECT_MIX.map((d) => {
            const isSel = d.name === defectClass;
            return (
              <div key={d.name} className="grid grid-cols-12 items-center gap-3 font-mono text-[11px]">
                <span className={cn("col-span-4 truncate", isSel ? "text-ink" : "text-dim")}>{d.name}</span>
                <span className="col-span-7">
                  <Bar value={d.value * 2} tone={isSel ? "defect" : "signal"} />
                </span>
                <span className="col-span-1 text-right text-dim">{d.value}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3 font-mono text-[10px]">
          <Link to="/inspection" className="text-signal hover:underline">
            ← Back to inspection
          </Link>
          <Link to="/bottlenecks" className="ml-auto text-signal hover:underline">
            Bottleneck analysis →
          </Link>
        </div>
      </Panel>
    </div>
  );
}
