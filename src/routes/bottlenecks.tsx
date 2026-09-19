import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, PanelHeader, Chip, Bar, Kpi, Advisory } from "@/components/dash/ui";
import { GroupedBars, TrendBars } from "@/components/dash/charts";
import { useSelection } from "@/lib/selection";
import { BATCHES, RANKED_STATIONS, RECOMMENDATIONS, bottleneckScore } from "@/lib/data";
import { fmtUsd, simulate } from "@/lib/econ";
import { cn } from "@/lib/utils";

const TITLE = "Bottlenecks — Veridic Defect Root-Cause Assistant";
const DESC =
  "Rank stations by constraint score from cycle time vs takt, utilisation, WIP, downtime and changeover losses, and see how defects load the line's constraint.";

export const Route = createFileRoute("/bottlenecks")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: BottlenecksPage,
});

const toneFor = (i: number) => (i === 0 ? "defect" : i === 1 ? "warn" : i === 2 ? "signal" : "ok") as
  | "defect"
  | "warn"
  | "signal"
  | "ok";

function BottlenecksPage() {
  const { scenario, econ, setHighlightRec } = useSelection();
  const res = simulate(econ, scenario);
  const [stationId, setStationId] = useState(RANKED_STATIONS[0]!.id);
  const station = RANKED_STATIONS.find((s) => s.id === stationId)!;
  const rank = RANKED_STATIONS.findIndex((s) => s.id === stationId);
  const score = bottleneckScore(station);
  const rec = RECOMMENDATIONS.find((r) => r.stationId === station.id);

  const overTakt = station.cycleTime - station.takt;
  const shiftSeconds = 8 * 3600;
  const lostUnits = Math.max(0, Math.round(shiftSeconds / station.takt - shiftSeconds / station.cycleTime));
  const lossPerShift = lostUnits * econ.marginPerUnit;

  const cycleData = RANKED_STATIONS.map((s) => ({
    station: s.name.replace("Assembly", "Asm").replace("Inspect", "Insp"),
    cycle: s.cycleTime,
    takt: s.takt,
  }));
  const wipData = RANKED_STATIONS.map((s) => ({ station: s.name.split(" ")[0]!, wip: s.wip }));
  const lossData = RANKED_STATIONS.map((s) => ({
    station: s.name.split(" ")[0]!,
    downtime: s.downtimeMin,
    changeover: s.changeoverMin,
  }));
  const stationBatches = BATCHES.filter((b) => b.stationId === station.id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Primary constraint" value={RANKED_STATIONS[0]!.name} sub={`Score ${bottleneckScore(RANKED_STATIONS[0]!)}/100`} subTone="defect" />
        <Kpi label="Takt time" value={String(station.takt)} unit="s" sub={`${station.name} target`} />
        <Kpi
          label="Cycle over takt"
          value={`${overTakt > 0 ? "+" : ""}${overTakt}`}
          unit="s"
          sub={overTakt > 0 ? "Above takt — constrains line" : "Within takt"}
          subTone={overTakt > 0 ? "defect" : "ok"}
        />
        <Kpi label="Est. lost margin / shift" value={fmtUsd(lossPerShift, true)} sub={`${lostUnits} units not built`} subTone="defect" />
      </div>

      <Panel>
        <PanelHeader title="Station constraint ranking" meta="cycle · util · WIP · downtime · changeover" />
        <div className="grid grid-cols-12 gap-2 border-b border-line pb-2 font-mono text-[10px] uppercase tracking-wider text-faint">
          <span className="col-span-3">Station</span>
          <span className="col-span-1 text-right">Cycle</span>
          <span className="col-span-1 text-right">Util</span>
          <span className="col-span-1 text-right">WIP</span>
          <span className="col-span-1 text-right">Down</span>
          <span className="col-span-1 text-right">C/O</span>
          <span className="col-span-4 text-right">Constraint score</span>
        </div>
        {RANKED_STATIONS.map((s, i) => {
          const tone = toneFor(i);
          const sc = bottleneckScore(s);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStationId(s.id)}
              className={cn(
                "grid w-full grid-cols-12 items-center gap-2 border-b border-line/50 py-2.5 text-left font-mono text-[11px] last:border-0 transition-colors hover:bg-panel2/50",
                s.id === stationId && "bg-panel2/70",
              )}
            >
              <span className="col-span-3 flex items-center gap-2 truncate text-ink">
                <span className={cn("size-1.5 shrink-0 rounded-full", `bg-${tone}`)} />
                {s.name}
              </span>
              <span className={cn("col-span-1 text-right", s.cycleTime > s.takt ? "text-defect" : "text-dim")}>{s.cycleTime}s</span>
              <span className={cn("col-span-1 text-right", s.utilization >= 95 ? "font-semibold text-defect" : "text-dim")}>{s.utilization}%</span>
              <span className="col-span-1 text-right text-dim">{s.wip}</span>
              <span className="col-span-1 text-right text-dim">{s.downtimeMin}m</span>
              <span className="col-span-1 text-right text-dim">{s.changeoverMin}m</span>
              <span className="col-span-4 flex items-center gap-2">
                <Bar value={sc} tone={tone} />
                <span className={cn("w-8 text-right font-semibold", `text-${tone}`)}>{sc}</span>
              </span>
            </button>
          );
        })}
        <p className="mt-3 font-mono text-[9px] leading-relaxed text-faint">
          Score weights: cycle over takt 35% · utilisation 25% · WIP queue 20% · downtime 12% · changeover 8%.
        </p>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-5">
        <Panel className="lg:col-span-2" tilt="l">
          <PanelHeader title="Station detail" right={<Chip tone={toneFor(rank)}>RANK {rank + 1} / {RANKED_STATIONS.length}</Chip>} />
          <div className="text-[15px] font-semibold leading-snug tracking-tight">{station.name}</div>
          <div className="mt-2 flex items-center gap-2">
            <Bar value={score} tone={toneFor(rank)} />
            <span className={cn("font-mono text-[12px] font-semibold", `text-${toneFor(rank)}`)}>{score}</span>
          </div>
          <div className="mt-3 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between"><span className="text-faint">Cycle / takt</span><span className={overTakt > 0 ? "text-defect" : "text-dim"}>{station.cycleTime}s / {station.takt}s</span></div>
            <div className="flex justify-between"><span className="text-faint">Utilisation</span><span className="text-dim">{station.utilization}%</span></div>
            <div className="flex justify-between"><span className="text-faint">WIP queued</span><span className="text-dim">{station.wip} units</span></div>
            <div className="flex justify-between"><span className="text-faint">Downtime / shift</span><span className="text-dim">{station.downtimeMin} min</span></div>
            <div className="flex justify-between"><span className="text-faint">Changeover / shift</span><span className="text-dim">{station.changeoverMin} min</span></div>
            <div className="flex justify-between border-t border-line pt-2"><span className="text-ink">Defect share</span><span className="font-semibold text-defect">{station.defectShare}%</span></div>
          </div>
          <div className="mt-3">
            <Advisory>
              Throughput figures are modelled from logged cycle and downtime data for one 8-hour shift. Treat as an
              estimate for prioritising, not a production commitment.
            </Advisory>
          </div>
        </Panel>

        <Panel className="lg:col-span-3" tilt="r">
          <PanelHeader title="Cycle time vs takt" meta="seconds per unit" />
          <p className="-mt-2 mb-2 font-mono text-[10px] text-faint">
            Any bar above takt sets the pace of the whole line.
          </p>
          <GroupedBars
            data={cycleData}
            x="station"
            series={[
              { key: "cycle", color: "var(--defect)" },
              { key: "takt", color: "var(--signal)" },
            ]}
            unit="s"
          />
          <div className="mt-2 flex items-center gap-3 font-mono text-[9px] text-faint">
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-defect" />Actual cycle</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-signal" />Takt target</span>
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel tilt="l">
          <PanelHeader title="WIP queue by station" meta="units waiting" />
          <TrendBars data={wipData} x="station" y="wip" threshold={30} unit=" u" />
        </Panel>

        <Panel>
          <PanelHeader title="Time losses per shift" meta="downtime vs changeover" />
          <GroupedBars
            data={lossData}
            x="station"
            series={[
              { key: "downtime", color: "var(--warn)" },
              { key: "changeover", color: "var(--signal)" },
            ]}
            unit="m"
          />
          <div className="mt-2 flex items-center gap-3 font-mono text-[9px] text-faint">
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-warn" />Downtime</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-signal" />Changeover</span>
          </div>
        </Panel>

        <Panel tilt="r">
          <PanelHeader title="Defect load on constraint" meta={station.name} />
          <div className="space-y-2.5">
            {stationBatches.length > 0 ? (
              stationBatches.map((b) => (
                <div key={b.id} className="grid grid-cols-12 items-center gap-2 font-mono text-[11px]">
                  <span className="col-span-3 text-dim">{b.id}</span>
                  <span className="col-span-6">
                    <Bar value={b.defectRate * 20} tone={b.defectRate >= 3 ? "defect" : "signal"} />
                  </span>
                  <span className={cn("col-span-2 text-right", b.defectRate >= 3 ? "text-defect" : "text-dim")}>{b.defectRate}%</span>
                  <span className="col-span-1 text-right text-faint">{b.changeover ? "C/O" : ""}</span>
                </div>
              ))
            ) : (
              <p className="font-mono text-[11px] text-faint">No batches logged for this station.</p>
            )}
          </div>
          <div className="mt-3 space-y-2 border-t border-line pt-3 font-mono text-[11px]">
            <div className="flex justify-between"><span className="text-faint">Throughput loss (model)</span><span className="text-dim">-{Math.round(res.throughputLossUnits)} u/day</span></div>
            <div className="flex justify-between"><span className="text-faint">Value of that loss</span><span className="font-semibold text-defect">{fmtUsd(res.throughputLossValue, true)}</span></div>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Where this leads" meta="chain continues" />
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone="defect">DEFECT · {station.defectShare}% share</Chip>
          <span className="text-faint">→</span>
          <Chip tone="warn">BOTTLENECK · {station.name} score {score}</Chip>
          <span className="text-faint">→</span>
          <Chip>LOSS · {lostUnits} u/shift</Chip>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px]">
          <Link to="/root-cause" className="text-signal hover:underline">← Root cause</Link>
          <Link to="/economic" className="text-signal hover:underline">Economic impact →</Link>
          {rec && (
            <Link
              to="/recommendations"
              onClick={() => setHighlightRec(rec.rank)}
              className="ml-auto rounded-md bg-signal px-3 py-2 font-mono text-[11px] font-semibold tracking-wide text-base transition-colors hover:bg-signal/85"
            >
              RECOMMENDATION #{rec.rank} FOR {station.name.toUpperCase()}
            </Link>
          )}
        </div>
      </Panel>
    </div>
  );
}
