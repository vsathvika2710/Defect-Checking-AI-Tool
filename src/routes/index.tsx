import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel, PanelHeader, Kpi, Chip, Bar, Segmented } from "@/components/dash/ui";
import { InspectionViewer } from "@/components/dash/InspectionViewer";
import { TrendBars } from "@/components/dash/charts";
import { useSelection } from "@/lib/selection";
import { BATCHES, INSPECTIONS, RANKED_STATIONS, RECOMMENDATIONS, bottleneckScore, inspectionById, stationById } from "@/lib/data";
import { SCENARIO_MULT, fmtUsd, simulate } from "@/lib/econ";

const TITLE = "Overview — Veridic Visual Inspection & Defect Root-Cause Assistant";
const DESC = "Decision-support dashboard linking defect detection to process evidence, bottlenecks, economic impact and ranked investigation recommendations.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { inspectionId, scenario, setScenario, econ, setInspectionId } = useSelection();
  const insp = inspectionById(inspectionId);
  const res = simulate(econ, scenario);
  const top = RECOMMENDATIONS[0]!;
  const topStation = RANKED_STATIONS[0]!;
  const novel = INSPECTIONS.filter((i) => i.verdict === "novel").length;
  const open = INSPECTIONS.filter((i) => i.verdict !== "accepted").length;
  const avgConf = Math.round(INSPECTIONS.reduce((a, i) => a + i.confidence, 0) / INSPECTIONS.length);
  const trend = BATCHES.map((b) => ({ batch: b.id.replace("B-", "B"), rate: b.defectRate }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="First-pass yield" value="94.2" unit="%" sub="▲ 0.8 vs target" subTone="ok" />
        <Kpi label="Open defects (queue)" value={String(open + 14)} sub={`${novel + 2} novel flagged`} subTone="defect" />
        <Kpi label="Avg confidence" value={String(avgConf)} unit="%" bar={avgConf} />
        <Kpi label="Est. scrap loss / day" value={fmtUsd(res.scrapCost, true)} sub={`${SCENARIO_MULT[scenario].label} scenario`} subTone="defect" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <Panel className="lg:col-span-3" tilt="l">
          <InspectionViewer insp={insp} compact />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {INSPECTIONS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setInspectionId(i.id)}
                className={`rounded px-2 py-1 font-mono text-[9px] ring-1 transition-colors ${i.id === inspectionId ? "bg-signal/15 text-signal ring-signal/40" : "text-faint ring-line hover:text-ink"}`}
              >
                #{i.id}
              </button>
            ))}
            <Link to="/inspection" className="ml-auto font-mono text-[10px] text-signal hover:underline">
              Open inspection →
            </Link>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" tilt="r">
          <PanelHeader title="Defect trend" meta="7 batch" />
          <p className="-mt-2 mb-2 font-mono text-[10px] text-faint">Defect rate by batch, line A-04 · threshold 3.0%</p>
          <TrendBars data={trend} x="batch" y="rate" threshold={3} />
          <div className="mt-3 flex items-center gap-3 font-mono text-[9px] text-faint">
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-signal/50" />Nominal</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-defect" />Elevated</span>
            <Link to="/root-cause" className="ml-auto text-signal hover:underline">Root cause →</Link>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Bottleneck ranking" meta="by throughput drag" />
        <div className="grid grid-cols-6 gap-3 border-b border-line pb-2 font-mono text-[10px] uppercase tracking-wider text-faint">
          <span>Station</span><span className="text-right">Cycle</span><span className="text-right">Util</span><span className="text-right">WIP</span><span className="col-span-2 text-right">Constraint score</span>
        </div>
        {RANKED_STATIONS.slice(0, 4).map((s, i) => {
          const score = bottleneckScore(s);
          const tone = i === 0 ? "defect" : i === 1 ? "warn" : i === 2 ? "signal" : "ok";
          return (
            <Link key={s.id} to="/bottlenecks" className="grid grid-cols-6 items-center gap-3 border-b border-line/50 py-2.5 font-mono text-[11px] last:border-0 hover:bg-panel2/50">
              <span className="flex items-center gap-2"><span className={`size-1.5 rounded-full bg-${tone}`} />{s.name}</span>
              <span className={`text-right ${s.cycleTime > s.takt ? "text-defect" : "text-dim"}`}>{s.cycleTime}s</span>
              <span className={`text-right ${s.utilization >= 95 ? "font-semibold text-defect" : "text-dim"}`}>{s.utilization}%</span>
              <span className="text-right text-dim">{s.wip}</span>
              <span className="col-span-2 flex items-center gap-2">
                <Bar value={score} tone={tone} />
                <span className={`w-9 text-right font-semibold text-${tone}`}>{score}</span>
              </span>
            </Link>
          );
        })}
      </Panel>

      <div className="grid gap-3 lg:grid-cols-5">
        <Panel className="lg:col-span-2" tilt="l">
          <PanelHeader title="Economic impact" right={<Chip tone="warn">SIMULATED</Chip>} />
          <Segmented value={scenario} onChange={setScenario} options={[{ value: "low", label: "Low" }, { value: "base", label: "Base" }, { value: "high", label: "High" }]} />
          <div className="mt-3 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between"><span className="text-faint">Scrap cost / day</span><span className="font-semibold text-defect">{fmtUsd(res.scrapCost)}</span></div>
            <div className="flex justify-between"><span className="text-faint">Rework cost / day</span><span className="text-dim">{fmtUsd(res.reworkCost)}</span></div>
            <div className="flex justify-between"><span className="text-faint">Throughput loss</span><span className="text-dim">-{Math.round(res.throughputLossUnits)} u/day</span></div>
            <div className="flex justify-between border-t border-line pt-2"><span className="text-ink">Net margin impact</span><span className="text-[13px] font-semibold text-defect">{fmtUsd(res.marginImpact, true)}</span></div>
          </div>
          <p className="mt-3 font-mono text-[9px] leading-relaxed text-faint">Advisory estimate from Line A-04 model. Not a financial forecast.</p>
          <Link to="/economic" className="mt-2 inline-block font-mono text-[10px] text-signal hover:underline">Open what-if simulator →</Link>
        </Panel>

        <Panel className="lg:col-span-3" tilt="r">
          <PanelHeader title="Investigation recommendation" right={<span className="font-mono text-[10px] text-signal">RANK 1 / {RECOMMENDATIONS.length}</span>} />
          <div className="text-[15px] font-semibold leading-snug tracking-tight">{top.title}</div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Chip tone="defect">DEFECT · {top.defectClass}</Chip><span className="text-faint">→</span>
            <Chip tone="signal">PROCESS · Changeover {inspectionById(top.inspectionId).batchId}</Chip><span className="text-faint">→</span>
            <Chip tone="warn">BOTTLENECK · {stationById(top.stationId).name} util {topStation.utilization}%</Chip><span className="text-faint">→</span>
            <Chip>COST · {fmtUsd(-res.scrapCost, true)} scrap</Chip>
          </div>
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-faint">
            Association, not proven causation. Confidence in link {top.linkConfidence}%. Recommended first due to largest marginal loss.
          </p>
          <Link to="/recommendations" className="mt-3 inline-block rounded-md bg-signal px-3 py-2 font-mono text-[11px] font-semibold tracking-wide text-base transition-colors hover:bg-signal/85">
            OPEN INVESTIGATION LOG
          </Link>
        </Panel>
      </div>
    </div>
  );
}
