import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel, PanelHeader, Chip, Bar, Kpi, Advisory } from "@/components/dash/ui";
import { useSelection } from "@/lib/selection";
import { RECOMMENDATIONS, associationById, bottleneckScore, inspectionById, stationById } from "@/lib/data";
import { fmtUsd } from "@/lib/econ";
import { cn } from "@/lib/utils";

const TITLE = "Recommendations — Veridic Defect Root-Cause Assistant";
const DESC =
  "Ranked investigation log linking each defect to its process association, bottleneck and estimated recoverable value, with link confidence stated.";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { highlightRec, setHighlightRec, setInspectionId } = useSelection();
  const total = RECOMMENDATIONS.reduce((a, r) => a + r.impactUsd, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Open recommendations" value={String(RECOMMENDATIONS.length)} sub="ranked by marginal loss" />
        <Kpi label="Recoverable / day" value={fmtUsd(total, true)} sub="if all actions succeed" subTone="ok" />
        <Kpi label="Top link confidence" value={String(RECOMMENDATIONS[0]!.linkConfidence)} unit="%" bar={RECOMMENDATIONS[0]!.linkConfidence} />
        <Kpi label="Low-effort items" value={String(RECOMMENDATIONS.filter((r) => r.effort === "Low").length)} sub="start here" subTone="signal" />
      </div>

      <Panel>
        <Advisory>
          Every item below is a suggested investigation, not an instruction. Links between defect, process variable and
          cost are statistical associations — an engineer confirms on the line before any change.
        </Advisory>
      </Panel>

      <div className="space-y-3">
        {RECOMMENDATIONS.map((r) => {
          const insp = inspectionById(r.inspectionId);
          const station = stationById(r.stationId);
          const assoc = associationById(r.associationId);
          const hot = highlightRec === r.rank;
          return (
            <Panel key={r.rank} className={cn(hot && "ring-2 ring-signal/60")}>
              <div className="flex flex-wrap items-start gap-3">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-md font-mono text-[12px] font-bold ring-1",
                    r.rank === 1 ? "bg-defect/15 text-defect ring-defect/40" : "bg-panel2 text-dim ring-line",
                  )}
                >
                  {r.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold leading-snug tracking-tight">{r.title}</div>
                  <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-dim">{r.detail}</p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[13px] font-semibold text-ok">{fmtUsd(r.impactUsd, true)}</div>
                  <div className="text-[9px] text-faint">recoverable / day</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Chip tone="defect">DEFECT · {r.defectClass}</Chip>
                <span className="text-faint">→</span>
                <Chip tone="signal">PROCESS · {assoc.variable}</Chip>
                <span className="text-faint">→</span>
                <Chip tone="warn">BOTTLENECK · {station.name} score {bottleneckScore(station)}</Chip>
                <span className="text-faint">→</span>
                <Chip>EFFORT · {r.effort}</Chip>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <div className="label-mono mb-1.5">Suggested next steps</div>
                  <ul className="space-y-1.5">
                    {r.actions.map((a) => (
                      <li key={a} className="flex items-start gap-2 font-mono text-[10px] text-dim">
                        <span className="mt-1 size-1 shrink-0 rounded-full bg-signal" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lg:col-span-2">
                  <div className="label-mono mb-1.5">Confidence in defect → cause link</div>
                  <div className="flex items-center gap-2">
                    <Bar value={r.linkConfidence} tone={r.linkConfidence >= 60 ? "warn" : "signal"} />
                    <span className="font-mono text-[11px] font-semibold">{r.linkConfidence}%</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px]">
                    <Link
                      to="/inspection"
                      onClick={() => {
                        setInspectionId(insp.id);
                        setHighlightRec(r.rank);
                      }}
                      className="text-signal hover:underline"
                    >
                      Unit {insp.unitId} →
                    </Link>
                    <Link to="/root-cause" className="text-signal hover:underline">
                      Association →
                    </Link>
                    <Link to="/bottlenecks" className="text-signal hover:underline">
                      {station.name} →
                    </Link>
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel>
        <PanelHeader title="Chain complete" meta="detection → recommendation" />
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <Link to="/economic" className="text-signal hover:underline">← Economic impact</Link>
          <Link to="/" className="ml-auto text-signal hover:underline">Back to overview →</Link>
        </div>
      </Panel>
    </div>
  );
}
