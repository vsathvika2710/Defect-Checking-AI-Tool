import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSelection } from "@/lib/selection";
import { inspectionById, batchById } from "@/lib/data";

const NAV = [
  { to: "/", label: "Overview", n: "01" },
  { to: "/inspection", label: "Inspection", n: "02" },
  { to: "/root-cause", label: "Root Cause", n: "03" },
  { to: "/bottlenecks", label: "Bottlenecks", n: "04" },
  { to: "/economic", label: "Economic", n: "05" },
  { to: "/recommendations", label: "Recommend", n: "06" },
] as const;

const CHAIN = [
  { k: "DETECT", to: "/inspection" },
  { k: "LOCALIZE", to: "/inspection" },
  { k: "CONFID", to: "/inspection" },
  { k: "PROCESS", to: "/root-cause" },
  { k: "BOTTLE", to: "/bottlenecks" },
  { k: "LOSS", to: "/economic" },
  { k: "ECON", to: "/economic" },
  { k: "RECO", to: "/recommendations" },
] as const;

const CHAIN_STAGE: Record<string, number> = {
  "/": 8,
  "/inspection": 3,
  "/root-cause": 4,
  "/bottlenecks": 5,
  "/economic": 7,
  "/recommendations": 8,
};

function Clock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setT(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{t} UTC</span>;
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { inspectionId } = useSelection();
  const insp = inspectionById(inspectionId);
  const batch = batchById(insp.batchId);
  const stage = CHAIN_STAGE[pathname] ?? 8;

  return (
    <div className="min-h-screen bg-base text-ink selection:bg-signal/30">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-4 px-4 py-4">
        <aside className="hidden w-[212px] shrink-0 lg:block">
          <Link to="/" className="mb-6 flex items-center gap-2 px-1">
            <div className="grid size-7 place-items-center rounded-md bg-signal/15 font-mono text-sm font-bold text-signal">V</div>
            <div>
              <div className="text-[13px] font-extrabold leading-none tracking-tight">VERIDIC</div>
              <div className="label-mono mt-1">QA Assistant</div>
            </div>
          </Link>
          <div className="label-mono mb-2 px-2">Navigate</div>
          <nav className="space-y-0.5">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: true }}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 font-mono text-[12px] text-dim transition-colors hover:bg-panel/60 hover:text-ink data-[status=active]:bg-panel data-[status=active]:text-ink data-[status=active]:ring-1 data-[status=active]:ring-line"
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="pulse-dot size-1.5 rounded-full bg-signal" />}
                    {n.label}
                    <span className={cn("ml-auto", isActive ? "text-signal" : "text-faint")}>{n.n}</span>
                  </>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-6 rounded-lg bg-panel p-3 ring-1 ring-line">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-warn">
              <span className="pulse-dot size-1.5 rounded-full bg-warn" />
              Advisory mode
            </div>
            <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-faint">Simulated estimates. Not a control signal.</p>
          </div>
          <div className="mt-3 rounded-lg bg-panel p-3 ring-1 ring-line">
            <div className="label-mono">Selected unit</div>
            <div className="mt-1 font-mono text-[12px] text-ink">{insp.unitId}</div>
            <div className="font-mono text-[10px] text-dim">{insp.product}</div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-md bg-panel px-2.5 py-1.5 font-mono text-[11px] ring-1 ring-line">
              <span className="pulse-dot size-1.5 rounded-full bg-ok" />
              LINE A-04
            </div>
            <div className="rounded-md bg-panel px-2.5 py-1.5 font-mono text-[11px] text-dim ring-1 ring-line">SHIFT {batch.shift}</div>
            <div className="rounded-md bg-panel px-2.5 py-1.5 font-mono text-[11px] text-dim ring-1 ring-line">
              BATCH <span className="text-ink">{batch.id}</span>
            </div>
            <div className="ml-auto flex items-center gap-3 font-mono text-[10px] text-faint">
              <Clock />
              <span className="text-signal">● LIVE (simulated feed)</span>
            </div>
          </div>

          <nav className="mb-3 flex gap-1 overflow-x-auto lg:hidden">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="rounded-md px-2.5 py-1.5 font-mono text-[11px] text-dim ring-1 ring-line data-[status=active]:bg-panel data-[status=active]:text-ink">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="mb-4 overflow-hidden rounded-lg bg-panel p-3 ring-1 ring-line">
            <div className="label-mono mb-2.5">Defect → Recommendation chain</div>
            <div className="flex items-center gap-1">
              {CHAIN.map((c, i) => {
                const done = i + 1 <= stage;
                return (
                  <div key={c.k} className="contents">
                    {i > 0 && <div className="h-px w-3 shrink-0 bg-line" />}
                    <Link to={c.to} className="flex flex-1 flex-col items-center gap-1.5 group">
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full font-mono text-[10px] ring-1 transition-colors group-hover:ring-signal",
                          done ? "bg-signal/20 text-signal ring-signal/40" : "bg-panel2 text-faint ring-line",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className={cn("font-mono text-[9px]", done ? "text-dim" : "text-faint")}>{c.k}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
